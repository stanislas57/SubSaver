import ExcelJS from "exceljs";
import type { Currency, Importance, Settlement, SharedSubscriptionBalance, Subscription, User } from "@/types";

const NAVY = "FF0A1128";
const GOLD = "FFD4AF37";
const MUTED = "FF64748B";
const WHITE = "FFFFFFFF";

const CURRENCY_FORMAT: Record<Currency, string> = {
  EUR: '#,##0.00 "€"',
  USD: '"$"#,##0.00',
  GBP: '"£"#,##0.00',
  SEK: '#,##0.00 "kr"',
};

const IMPORTANCE_LABEL: Record<Importance, string> = { 1: "Faible", 2: "Moyenne", 3: "Élevée" };

/** Reprend exactement la règle du backend (cf. export_subscriptions côté
 * FastAPI) pour que le statut affiché dans l'Excel corresponde à celui vu
 * ailleurs dans l'app -- pas de logique "un peu différente" qui déroute. */
function isInTrial(trialEndDate: string | null): boolean {
  if (!trialEndDate) return false;
  const end = new Date(`${trialEndDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: GOLD } } };
  });
  row.height = 22;
}

function emptyStateRow(sheet: ExcelJS.Worksheet, lastColumn: string, message: string) {
  sheet.mergeCells(`A2:${lastColumn}2`);
  const cell = sheet.getCell("A2");
  cell.value = message;
  cell.font = { italic: true, color: { argb: MUTED } };
}

export interface SubscriptionsExportData {
  user: User;
  subscriptions: Subscription[];
  balances: SharedSubscriptionBalance[];
  settlements: Settlement[];
}

/** Construit un classeur Excel multi-onglets (Résumé / Abonnements / Partage
 * / Règlements) entièrement côté client, à partir des données déjà exposées
 * par les endpoints existants -- aucune modification backend nécessaire.
 * Remplace l'ancien export CSV plat d'une seule table. */
export async function buildSubscriptionsWorkbook(data: SubscriptionsExportData): Promise<Blob> {
  const { user, subscriptions, balances, settlements } = data;
  const currencyFormat = CURRENCY_FORMAT[user.currency] ?? CURRENCY_FORMAT.EUR;
  const now = new Date();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SubSaver";
  workbook.created = now;

  // --- Onglet 1 : Résumé -----------------------------------------------
  const summary = workbook.addWorksheet("Résumé", { properties: { tabColor: { argb: GOLD } } });
  summary.getColumn(1).width = 34;
  summary.getColumn(2).width = 18;
  summary.getColumn(3).width = 18;
  summary.getColumn(4).width = 14;

  summary.mergeCells("A1:D1");
  summary.getCell("A1").value = "SubSaver - Rapport d'abonnements";
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: NAVY } };
  summary.getCell("A2").value = `Compte : ${user.first_name} (${user.email})`;
  summary.getCell("A2").font = { color: { argb: MUTED } };
  summary.getCell("A3").value = `Généré le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  summary.getCell("A3").font = { color: { argb: MUTED } };

  const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.price, 0);
  const annualTotal = Math.round(monthlyTotal * 12 * 100) / 100;
  const trialCount = subscriptions.filter((s) => isInTrial(s.trial_end_date)).length;
  const sharedCount = subscriptions.filter((s) => s.is_shared).length;

  let r = 5;
  summary.getCell(`A${r}`).value = "Indicateurs clés";
  summary.getCell(`A${r}`).font = { bold: true, size: 12, color: { argb: NAVY } };
  r++;
  const kpis: [string, number][] = [
    ["Nombre d'abonnements", subscriptions.length],
    ["Dont en période d'essai", trialCount],
    ["Dont partagés", sharedCount],
    ["Coût mensuel total", monthlyTotal],
    ["Coût annuel total", annualTotal],
  ];
  for (const [label, value] of kpis) {
    summary.getCell(`A${r}`).value = label;
    const cell = summary.getCell(`B${r}`);
    cell.value = value;
    if (label.startsWith("Coût")) cell.numFmt = currencyFormat;
    r++;
  }

  r += 1;
  summary.getCell(`A${r}`).value = "Répartition par catégorie";
  summary.getCell(`A${r}`).font = { bold: true, size: 12, color: { argb: NAVY } };
  r++;
  styleHeaderRow(summary.getRow(r));
  summary.getRow(r).values = ["Catégorie", "Nb abonnements", "Coût mensuel", "% du budget"];
  r++;

  const byCategory = new Map<string, { count: number; total: number }>();
  for (const s of subscriptions) {
    const entry = byCategory.get(s.category) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += s.price;
    byCategory.set(s.category, entry);
  }
  for (const [category, { count, total }] of [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total)) {
    summary.getCell(`A${r}`).value = category;
    summary.getCell(`B${r}`).value = count;
    const totalCell = summary.getCell(`C${r}`);
    totalCell.value = total;
    totalCell.numFmt = currencyFormat;
    const pctCell = summary.getCell(`D${r}`);
    pctCell.value = monthlyTotal > 0 ? total / monthlyTotal : 0;
    pctCell.numFmt = "0.0%";
    r++;
  }

  // --- Onglet 2 : Abonnements --------------------------------------------
  const subsSheet = workbook.addWorksheet("Abonnements", {
    properties: { tabColor: { argb: GOLD } },
    views: [{ state: "frozen", ySplit: 1 }],
  });
  subsSheet.columns = [
    { header: "Nom", key: "name", width: 26 },
    { header: "Catégorie", key: "category", width: 16 },
    { header: "Statut", key: "status", width: 12 },
    { header: "Prix mensuel", key: "price", width: 15 },
    { header: "Coût annuel", key: "annual", width: 15 },
    { header: "Jour de prélèvement", key: "billing_day", width: 20 },
    { header: "Importance", key: "importance", width: 13 },
    { header: "Partagé", key: "shared", width: 11 },
    { header: "Date de début", key: "start_date", width: 16 },
    { header: "Fin d'essai", key: "trial_end", width: 16 },
  ];
  styleHeaderRow(subsSheet.getRow(1));

  const sortedSubs = [...subscriptions].sort((a, b) => b.price - a.price);
  for (const s of sortedSubs) {
    const row = subsSheet.addRow({
      name: s.display_name || s.name,
      category: s.category,
      status: isInTrial(s.trial_end_date) ? "En essai" : "Actif",
      price: s.price,
      annual: Math.round(s.price * 12 * 100) / 100,
      billing_day: `Le ${s.billing_day}`,
      importance: IMPORTANCE_LABEL[s.importance],
      shared: s.is_shared ? "Oui" : "Non",
      start_date: s.start_date ? new Date(`${s.start_date}T00:00:00`) : null,
      trial_end: s.trial_end_date ? new Date(`${s.trial_end_date.slice(0, 10)}T00:00:00`) : null,
    });
    row.getCell("price").numFmt = currencyFormat;
    row.getCell("annual").numFmt = currencyFormat;
    if (row.getCell("start_date").value) row.getCell("start_date").numFmt = "dd/mm/yyyy";
    if (row.getCell("trial_end").value) row.getCell("trial_end").numFmt = "dd/mm/yyyy";
  }

  if (sortedSubs.length > 0) {
    subsSheet.autoFilter = { from: "A1", to: `J${sortedSubs.length + 1}` };
  }

  const totalRow = subsSheet.addRow({ name: "TOTAL", price: monthlyTotal, annual: annualTotal });
  totalRow.font = { bold: true };
  totalRow.getCell("price").numFmt = currencyFormat;
  totalRow.getCell("annual").numFmt = currencyFormat;
  totalRow.eachCell((cell) => {
    cell.border = { top: { style: "thin", color: { argb: GOLD } } };
  });

  // --- Onglet 3 : Partage --------------------------------------------------
  const shareSheet = workbook.addWorksheet("Partage", { views: [{ state: "frozen", ySplit: 1 }] });
  shareSheet.columns = [
    { header: "Membre", key: "member", width: 24 },
    { header: "Part", key: "percent", width: 14 },
    { header: "Montant dû", key: "amount", width: 16 },
  ];
  styleHeaderRow(shareSheet.getRow(1));
  if (balances.length === 0) {
    emptyStateRow(shareSheet, "C", "Aucun abonnement partagé actif.");
  } else {
    for (const b of balances) {
      const row = shareSheet.addRow({ member: b.member_name, percent: b.share_percent / 100, amount: b.amount_owed });
      row.getCell("percent").numFmt = "0.0%";
      row.getCell("amount").numFmt = currencyFormat;
    }
  }

  // --- Onglet 4 : Règlements -------------------------------------------
  const settlementsSheet = workbook.addWorksheet("Règlements", { views: [{ state: "frozen", ySplit: 1 }] });
  settlementsSheet.columns = [
    { header: "De", key: "from", width: 20 },
    { header: "Vers", key: "to", width: 20 },
    { header: "Montant", key: "amount", width: 15 },
    { header: "Période", key: "period", width: 16 },
    { header: "Date", key: "date", width: 18 },
  ];
  styleHeaderRow(settlementsSheet.getRow(1));
  if (settlements.length === 0) {
    emptyStateRow(settlementsSheet, "E", "Aucun règlement enregistré.");
  } else {
    const sortedSettlements = [...settlements].sort((a, b) => b.created_at.localeCompare(a.created_at));
    for (const s of sortedSettlements) {
      const row = settlementsSheet.addRow({
        from: s.from_member_name,
        to: s.to_member_name,
        amount: s.amount,
        period: s.period,
        date: new Date(s.created_at),
      });
      row.getCell("amount").numFmt = currencyFormat;
      row.getCell("date").numFmt = "dd/mm/yyyy hh:mm";
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
