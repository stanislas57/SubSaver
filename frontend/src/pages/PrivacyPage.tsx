import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";

/** Page de Charte de Confidentialité : RGPD stricte, spécificités banking/Open
 * Banking, traitement données bancaires, chiffrement, partenaires externes. */
export function PrivacyPage() {
  return (
    <div className="w-full bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Retour */}
        <Link
          to="/overview"
          className="inline-flex items-center gap-2 text-sm text-luxury-sapphire hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* En-tête */}
        <div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Charte de Confidentialité
          </RevealText>
          <RevealText className="mt-2 text-sm text-luxury-text-light">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
          </RevealText>
        </div>

        {/* Contenu */}
        <article className="prose prose-sm max-w-none space-y-8 text-luxury-text">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">1. Introduction</h2>
            <p>
              SubServer ("nous", "notre", "le Service") s'engage à protéger la vie privée et les données personnelles
              de nos utilisateurs ("vous", "votre"). Cette Charte de Confidentialité détaille la manière dont nous
              collectons, utilisons, stockons et partageons vos informations, en particulier vos données bancaires
              sensibles, conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> et aux
              lois applicables.
            </p>
            <p className="text-xs italic text-luxury-text-light">
              En utilisant SubServer, vous acceptez les conditions de cette Charte. Si vous n'êtes pas d'accord,
              veuillez ne pas utiliser le Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">2. Données Collectées</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-luxury-text">2.1 Données d'Authentification</h3>
                <p className="text-sm text-luxury-text-light">
                  Prénom, adresse e-mail, mot de passe hashé et sécurisé, code de vérification temporaire (valide 10
                  minutes).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">2.2 Données Bancaires (Open Banking)</h3>
                <p className="text-sm text-luxury-text-light">
                  Via l'intégration Powens (agrégateur de données bancaires certifié), nous accédons aux
                  <strong> transactions et libellés de relevés</strong> uniquement, jamais aux identifiants ou mots de passe
                  bancaires. Vos connexions bancaires sont <strong>chiffrées de bout en bout</strong> et{" "}
                  <strong>jamais conservées en clair</strong>. Les transactions brutes sont analysées localement
                  (détection d'abonnements), puis supprimées après traitement.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">2.3 Abonnements Détectés</h3>
                <p className="text-sm text-luxury-text-light">
                  Nom de l'enseigne (normalisé), montant, catégorie, périodicité estimée, date de dernier prélèvement.
                  Ces données sont dérivées de l'analyse transactionnelle et stockées dans votre profil SubServer.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">2.4 Données de Profil</h3>
                <p className="text-sm text-luxury-text-light">
                  Devise, langue, préférences de notification, statut Premium, historique de connexion, empreinte de
                  sécurité.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">2.5 Données d'Usage (Analytique)</h3>
                <p className="text-sm text-luxury-text-light">
                  Pages visitées, actions effectuées (détection d'abonnements, export CSV, etc.), durée de session,
                  appareil et navigateur. Collectées de manière anonymisée via nos serveurs (pas de traçage
                  tiers/cookies de tracking).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">3. Utilisation des Données</h2>
            <p className="text-sm">Vos données sont utilisées uniquement pour :</p>
            <ul className="list-inside space-y-2 text-sm text-luxury-text-light">
              <li>✓ Fournir et améliorer le Service (détection d'abonnements, alertes, simulations).</li>
              <li>✓ Authentifier votre compte et sécuriser l'accès.</li>
              <li>✓ Respecter les obligations légales et réglementaires (RGPD, AML, fraude).</li>
              <li>✓ Vous envoyer des notifications (mise à jour, code de vérification) — non marketing.</li>
              <li>✓ Améliorer la sécurité et prévenir les abus.</li>
              <li>✗ <strong>Jamais</strong> partagées avec des tiers marketing, publicité, ou vente de données.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">4. Partenaires Externes et Sous-Traitants</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-luxury-text">4.1 Powens (Agrégateur de Données Bancaires)</h3>
                <p className="text-sm text-luxury-text-light">
                  SubServer utilise l'API Powens pour accéder aux transactions de vos comptes bancaires. Powens opère
                  sous licence PSD2 (Directive Services de Paiement) et s'engage à la confidentialité stricte. Vos
                  identifiants bancaires ne transitent <strong>jamais</strong> par nos serveurs — Powens les traite
                  directement avec votre banque, chiffrés.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">4.2 Stripe (Paiements)</h3>
                <p className="text-sm text-luxury-text-light">
                  Les transactions de paiement Premium sont traitées par Stripe, conformément à leurs conditions de
                  confidentialité. SubServer ne stocke jamais vos informations de carte bancaire — Stripe s'en charge.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">4.3 Serveurs d'Hébergement</h3>
                <p className="text-sm text-luxury-text-light">
                  Les serveurs SubServer sont hébergés en France/UE (conformité RGPD renforcée). Les sauvegardes et
                  logs de sécurité sont conservés selon les obligations légales.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-luxury-text">4.4 Communications</h3>
                <p className="text-sm text-luxury-text-light">
                  Les e-mails de vérification sont envoyés via nos serveurs SMTP sécurisés (jamais d'envoi hors UE).
                  Les messages de contact vous remontent par mail chiffré.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">5. Sécurité et Chiffrement</h2>
            <p className="text-sm text-luxury-text-light space-y-2">
              <div>
                • <strong>Mots de passe :</strong> Hashés (bcrypt) et jamais stockés en clair.
              </div>
              <div>
                • <strong>Tokens Powens :</strong> Chiffrés avec une clé maître (AES-256), rotation régulière.
              </div>
              <div>
                • <strong>Connexion HTTPS :</strong> Tout transit de données est protégé par TLS 1.3+.
              </div>
              <div>
                • <strong>Accès backend :</strong> Limité, authentification 2FA, logs d'audit complets.
              </div>
              <div>
                • <strong>Anonymat transactionnel :</strong> Les transactions brutes Powens ne sont jamais persistées —
                seuls les abonnements détectés sont conservés.
              </div>
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">6. Droits RGPD</h2>
            <p className="text-sm text-luxury-text-light">
              Vous avez le droit de :
            </p>
            <ul className="list-inside space-y-2 text-sm text-luxury-text-light">
              <li>📋 <strong>Accès :</strong> Demander une copie de vos données.</li>
              <li>✏️ <strong>Rectification :</strong> Corriger des informations inexactes.</li>
              <li>🗑️ <strong>Suppression :</strong> Demander l'effacement de vos données ("droit à l'oubli").</li>
              <li>⏸️ <strong>Limitation :</strong> Restreindre le traitement.</li>
              <li>🔄 <strong>Portabilité :</strong> Récupérer vos données dans un format standard.</li>
              <li>🚫 <strong>Opposition :</strong> Vous opposer au traitement.</li>
            </ul>
            <p className="text-xs italic text-luxury-text-light pt-2">
              Pour exercer ces droits, contactez contact.subserver@proton.me avec preuve d'identité.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">7. Rétention des Données</h2>
            <p className="text-sm text-luxury-text-light">
              • <strong>Compte actif :</strong> Données conservées aussi longtemps que vous utilisez SubServer.
            </p>
            <p className="text-sm text-luxury-text-light">
              • <strong>Compte supprimé :</strong> Données personnelles effacées immédiatement. Logs d'audit retenus 1
              an (obligation légale).
            </p>
            <p className="text-sm text-luxury-text-light">
              • <strong>Données bancaires (transactions) :</strong> Jamais stockées après détection. Seuls les
              abonnements normalisés persistent.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">8. Modifications de cette Charte</h2>
            <p className="text-sm text-luxury-text-light">
              Nous pouvons mettre à jour cette Charte. En cas de changement significatif (notamment un partage de
              données nouveau), vous recevrez une notification et/ou demande d'acceptation explicite. La date de
              dernière mise à jour figure en haut de cette page.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">9. Nous Contacter</h2>
            <p className="text-sm text-luxury-text-light">
              Pour toute question, demande RGPD, ou signaler une violation de confidentialité :
            </p>
            <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4">
              <p className="text-sm font-mono text-luxury-text">
                📧 contact.subserver@proton.me
              </p>
            </div>
          </section>

          {/* Séparateur et signature */}
          <div className="border-t border-slate-900/10 pt-8">
            <p className="text-xs text-luxury-text-light">
              SubServer. Confidentiel. Sécurisé. RGPD-conforme.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
