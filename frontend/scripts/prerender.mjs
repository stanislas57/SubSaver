// Prérendu statique post-build des pages publiques (SEO/GEO).
//
// L'app est un SPA Vite/React sans SSR : les crawlers qui n'exécutent pas
// JavaScript (GPTBot, ClaudeBot, PerplexityBot...) ne voient normalement
// qu'un <div id="root"></div> vide. Ce script sert le contenu de dist/ via
// `vite preview`, visite chaque route publique dans un vrai navigateur
// headless, attend le rendu React, puis écrase le HTML de sortie avec le
// DOM déjà rendu. Le bundle JS reste chargé normalement ensuite (pas de
// hydrateRoot côté client -> pas de mismatch, juste un remount qui rejoue
// l'app par-dessus le HTML prérendu).
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Routes publiques uniquement -- tout ce qui vit derrière ProtectedRoute
// (overview, subscriptions, admin...) ne doit jamais être prérendu : ce
// contenu est propre à chaque utilisateur et n'a rien à faire dans un
// export statique servi anonymement.
const ROUTES = ["/", "/guide-abonnements", "/privacy"];

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // serveur pas encore prêt, on retente
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`vite preview n'a pas démarré dans les ${timeoutMs}ms impartis`);
}

async function outputPathFor(route) {
  if (route === "/") return path.join(distDir, "index.html");
  return path.join(distDir, route.replace(/^\//, ""), "index.html");
}

async function main() {
  const server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: rootDir, stdio: "inherit" }
  );

  const browser = await puppeteer.launch({ headless: true });

  try {
    await waitForServer(BASE_URL);
    const page = await browser.newPage();

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle0", timeout: 30_000 });
      // Laisse le temps aux animations d'intro (RevealText, etc.) de poser
      // le contenu final dans le DOM avant capture.
      await new Promise((r) => setTimeout(r, 500));

      const html = await page.content();
      const outPath = await outputPathFor(route);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, "utf-8");
      console.log(`[prerender] ${route} -> ${path.relative(distDir, outPath)}`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("[prerender] échec :", err);
  process.exit(1);
});
