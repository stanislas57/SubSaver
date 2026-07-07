import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";

/** Page de Charte de Confidentialité : texte juridique complet (RGPD, DSP2,
 * Loi Informatique et Libertés) fourni tel quel par la direction juridique --
 * ne pas reformuler le contenu sans validation légale préalable. */
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
          <RevealText as="h1" className="text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Politique de Confidentialité et de Protection des Données à Caractère Personnel
          </RevealText>
          <RevealText className="mt-2 text-sm text-luxury-text-light">
            Dernière mise à jour : 7 juillet 2026
          </RevealText>
        </div>

        {/* Contenu */}
        <article className="prose prose-sm max-w-none space-y-8 text-luxury-text">
          {/* Préambule */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Préambule et Identité du Responsable de Traitement</h2>
            <p className="text-sm text-luxury-text-light">
              La présente Politique de Confidentialité a pour objectif de définir de manière transparente, claire et
              exhaustive la manière dont <strong>SubServer</strong>, agissant en qualité de{" "}
              <strong>Responsable de Traitement</strong>, collecte, utilise, protège et partage les données à
              caractère personnel de ses utilisateurs.
            </p>
            <p className="text-sm text-luxury-text-light">
              Cette Politique s'inscrit dans le strict respect du Règlement (UE) 2016/679 du Parlement européen et du
              Conseil du 27 avril 2016 (RGPD), de la Loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux
              fichiers et aux libertés modifiée, ainsi que de la Directive (UE) 2015/2366 concernant les services de
              paiement dans le marché intérieur (DSP2).
            </p>
            <p className="text-xs italic text-luxury-text-light">
              En créant un compte et en utilisant les services de SubServer, vous reconnaissez avoir pris
              connaissance de la présente Politique.
            </p>
          </section>

          {/* Article 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">
              Article 1 : Finalités, Données Collectées et Bases Légales
            </h2>
            <p className="text-sm text-luxury-text-light">
              SubServer s'engage au respect du principe de minimisation des données (Article 5.1.c du RGPD). Nous ne
              collectons que les données strictement nécessaires aux finalités poursuivies.
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-luxury-text">1.1 Gestion de l'Identité et Authentification</h3>
                <p className="text-sm text-luxury-text-light">
                  <strong>Données collectées :</strong> Prénom, adresse e-mail, mot de passe (sécurisé par hachage
                  cryptographique et salage cryptographique unidirectionnel), codes de vérification à usage unique
                  (OTP) valides 10 minutes, empreinte de sécurité de l'appareil.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Finalités :</strong> Création et gestion du compte Utilisateur, authentification sécurisée,
                  prévention des fraudes, envoi d'alertes de sécurité ou de notifications de service (non
                  commerciales).
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Base légale :</strong> Exécution du contrat (Article 6.1.b du RGPD) et Intérêt légitime pour
                  la sécurisation de la plateforme (Article 6.1.f du RGPD).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-luxury-text">
                  1.2 Agrégation Bancaire et Analyse Transactionnelle (Open Banking / DSP2)
                </h3>
                <p className="text-sm text-luxury-text-light">
                  <strong>Données collectées via API Powens :</strong> Libellés des relevés bancaires, montants, dates
                  des transactions, devise, typologie de compte.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Ce que nous ne collectons JAMAIS :</strong> Vos identifiants de connexion bancaire
                  (identifiant, mot de passe, code secret). Ces éléments sont traités exclusivement par notre
                  partenaire agréé.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Traitement spécifique :</strong> Les transactions brutes sont interrogées en mémoire vive
                  (RAM) de manière transitoire. Elles sont analysées algorithmiquement à la volée pour détecter les
                  récurrences (abonnements) et sont <strong>immédiatement purgées de nos serveurs</strong> après le
                  calcul.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Données dérivées conservées (Abonnements) :</strong> Nom de l'enseigne normalisé, montant
                  périodique, catégorie de dépense, périodicité algorithmiquement estimée, date de dernier
                  prélèvement.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Finalités :</strong> Fourniture du service de détection et de gestion d'abonnements, alertes
                  de prélèvement, génération de tableaux de bord financiers.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Base légale :</strong> Consentement explicite de l'Utilisateur (Article 6.1.a du RGPD et
                  Article 94 de la DSP2) renouvelable tous les 180 jours.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-luxury-text">1.3 Gestion des Paiements et Abonnements Premium</h3>
                <p className="text-sm text-luxury-text-light">
                  <strong>Données collectées :</strong> Statut de l'abonnement Premium, historique de facturation
                  (montant, date, devise), derniers chiffres de la carte bancaire (via Stripe).
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Finalités :</strong> Facturation des services Premium, traitement des paiements, gestion de
                  la comptabilité, gestion des litiges éventuels.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Base légale :</strong> Exécution du contrat (Article 6.1.b du RGPD) et Respect d'une
                  obligation légale comptable (Article 6.1.c du RGPD).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-luxury-text">1.4 Données de Navigation, de Trafic et Analytique</h3>
                <p className="text-sm text-luxury-text-light">
                  <strong>Données collectées :</strong> Adresses IP anonymisées, logs de connexion, agent utilisateur
                  (navigateur, OS), pages consultées, actions réalisées, timestamps.
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Finalités :</strong> Analyse de la performance du Service, détection des anomalies
                  techniques (débogage), statistiques d'utilisation (sans traçage individuel croisé).
                </p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  <strong>Base légale :</strong> Intérêt légitime de SubServer pour l'amélioration continue de son
                  Service et le maintien de la sécurité informatique (Article 6.1.f du RGPD).
                </p>
              </div>
            </div>
          </section>

          {/* Article 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">
              Article 2 : Destinataires des Données et Sous-Traitance (Article 28 RGPD)
            </h2>
            <p className="text-sm text-luxury-text-light">
              SubServer ne commercialise, ne loue, ni ne cède <strong>aucune</strong> de vos données personnelles à
              des tiers à des fins de prospection commerciale ou de profilage publicitaire.
            </p>
            <p className="text-sm text-luxury-text-light">
              Dans le cadre exclusif de la fourniture du Service, vos données peuvent être partagées avec des
              prestataires techniques de confiance (Sous-traitants), contractuellement tenus de respecter la
              confidentialité et la sécurité de vos données via un Accord de Traitement des Données (DPA) :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-luxury-text-light">
              <li>
                <strong>Powens (Budget Insight SAS) :</strong> Prestataire de Service d'Information sur les Comptes
                (PSIC) régulé par l'ACPR (Autorité de Contrôle Prudentiel et de Résolution) sous le numéro 16918.
                Powens opère la synchronisation bancaire sous la directive DSP2.
              </li>
              <li>
                <strong>Stripe Payments Europe, Ltd. :</strong> Prestataire de services de paiement (PSP) certifié
                PCI-DSS de niveau 1. Les données de carte bancaire sont collectées directement par Stripe ; SubServer
                n'a accès qu'à des jetons de paiement (tokens) et à des informations de facturation limitées.
              </li>
            </ul>
          </section>

          {/* Article 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 3 : Transferts de Données hors de l'EEE</h2>
            <p className="text-sm text-luxury-text-light">
              En principe, SubServer stocke et traite vos données au sein de l'Espace Économique Européen (EEE).
            </p>
            <p className="text-sm text-luxury-text-light">
              Toutefois, dans le cadre de l'utilisation de prestataires internationaux (notamment Stripe), certaines
              données techniques peuvent être transférées vers les États-Unis. Dans de tels cas, SubServer s'assure
              que ces transferts sont encadrés par des garanties appropriées au titre de l'Article 46 du RGPD,
              notamment par la signature de <strong>Clauses Contractuelles Types (CCT)</strong> de la Commission
              Européenne ou en s'assurant que le prestataire adhère au cadre d'adéquation en vigueur (Data Privacy
              Framework).
            </p>
          </section>

          {/* Article 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">
              Article 4 : Mesures Techniques et Organisationnelles (Sécurité)
            </h2>
            <p className="text-sm text-luxury-text-light">
              Conformément à l'Article 32 du RGPD, SubServer met en œuvre des mesures de sécurité physiques, logiques
              et organisationnelles de pointe pour prévenir toute violation de données (accès non autorisé,
              altération, divulgation, destruction) :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-luxury-text-light">
              <li>
                <strong>Chiffrement en transit :</strong> L'intégralité des flux réseau est sécurisée par le protocole
                TLS 1.3 ou supérieur.
              </li>
              <li>
                <strong>Chiffrement au repos :</strong> Les bases de données sont chiffrées (AES-256). Les jetons
                d'accès API (tokens Powens) font l'objet d'un chiffrement symétrique fort avec rotation régulière des
                clés maîtresses.
              </li>
              <li>
                <strong>Gestion des Mots de Passe :</strong> Hachage via l'algorithme <code>bcrypt</code> avec facteur
                de coût élevé. SubServer ignore techniquement votre mot de passe en clair.
              </li>
              <li>
                <strong>Architecture Zéro Trust et Isolation :</strong> Les transactions brutes issues de l'Open
                Banking sont isolées dans des environnements d'exécution éphémères et ne sont jamais persistées en
                base de données.
              </li>
              <li>
                <strong>Contrôle d'accès interne :</strong> Accès aux infrastructures backend restreint aux personnels
                habilités via VPN, clés SSH et Authentification à Double Facteur (2FA), couplé à un audit trail
                (traçabilité de toutes les actions internes).
              </li>
            </ul>
          </section>

          {/* Article 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 5 : Durées de Conservation des Données</h2>
            <p className="text-sm text-luxury-text-light">
              SubServer conserve vos données uniquement pour la durée strictement nécessaire aux finalités
              déclarées :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-luxury-text-light">
              <li>
                <strong>Données de Compte et de Profil :</strong> Conservées pendant toute la durée de vie du compte
                actif. En cas d'inactivité prolongée (absence de connexion pendant 36 mois consécutifs), le compte et
                ses données sont automatiquement supprimés, après préavis envoyé à l'Utilisateur.
              </li>
              <li>
                <strong>Données d'Abonnements (détectées) :</strong> Conservées tant que le compte est actif.
                Détruites instantanément en cas de suppression du compte.
              </li>
              <li>
                <strong>Transactions brutes :</strong> Jamais stockées. Analyse effectuée à la volée.
              </li>
              <li>
                <strong>Logs techniques et d'audit :</strong> Conservés pour une durée légale maximale de douze (12)
                mois à des fins de sécurité et d'obligations légales de traçabilité.
              </li>
              <li>
                <strong>Données de facturation :</strong> Conservées pendant dix (10) ans conformément aux
                obligations légales et fiscales françaises (Code de commerce).
              </li>
            </ul>
          </section>

          {/* Article 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 6 : Vos Droits (Articles 15 à 22 du RGPD)</h2>
            <p className="text-sm text-luxury-text-light">
              Vous disposez d'un contrôle total sur vos données personnelles. À tout moment, vous pouvez exercer les
              droits suivants :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-luxury-text-light">
              <li>
                <strong>Droit d'accès (Art. 15) :</strong> Obtenir la confirmation que vos données sont traitées et en
                recevoir une copie claire.
              </li>
              <li>
                <strong>Droit de rectification (Art. 16) :</strong> Exiger la correction de données inexactes ou
                incomplètes.
              </li>
              <li>
                <strong>Droit à l'effacement / Droit à l'oubli (Art. 17) :</strong> Demander la suppression de votre
                compte et de vos données personnelles (réalisable en un clic depuis les paramètres de votre compte
                SubServer).
              </li>
              <li>
                <strong>Droit à la limitation du traitement (Art. 18) :</strong> Geler temporairement l'utilisation de
                vos données en cas de contestation.
              </li>
              <li>
                <strong>Droit à la portabilité (Art. 20) :</strong> Récupérer vos données d'abonnements dans un format
                structuré, couramment utilisé et lisible par machine (export CSV/JSON disponible dans l'application).
              </li>
              <li>
                <strong>Droit d'opposition (Art. 21) :</strong> Vous opposer à un traitement fondé sur l'intérêt
                légitime pour des raisons tenant à votre situation particulière.
              </li>
              <li>
                <strong>Droit de retrait du consentement (Art. 7) :</strong> Révocable à tout moment, entraînant la
                déconnexion immédiate de vos banques liées via Powens.
              </li>
            </ul>

            <p className="text-sm font-semibold text-luxury-text">Pour exercer ces droits :</p>
            <p className="text-sm text-luxury-text-light">
              Vous pouvez adresser votre demande (accompagnée si nécessaire d'un justificatif d'identité en cas de
              doute raisonnable) à notre Délégué à la Protection des Données (DPO) ou service conformité :
            </p>
            <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4">
              <p className="text-sm font-mono text-luxury-text">📧 contact.subserver@proton.me</p>
            </div>
            <p className="text-xs italic text-luxury-text-light">
              Une réponse vous sera apportée dans un délai maximum de 30 jours calendaires.
            </p>

            <p className="text-sm font-semibold text-luxury-text pt-2">Droit d'introduire une réclamation :</p>
            <p className="text-sm text-luxury-text-light">
              Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez le droit
              d'introduire une réclamation auprès de l'autorité de contrôle compétente, à savoir la <strong>CNIL</strong>{" "}
              en France (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-luxury-sapphire hover:underline"
              >
                www.cnil.fr
              </a>
              ).
            </p>
          </section>

          {/* Article 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 7 : Violation de Données (Data Breach)</h2>
            <p className="text-sm text-luxury-text-light">
              En cas de faille de sécurité entraînant un risque pour vos droits et libertés, SubServer s'engage à :
            </p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-luxury-text-light">
              <li>Notifier la violation à la CNIL dans les 72 heures suivant sa découverte (Article 33 du RGPD).</li>
              <li>
                Vous informer dans les meilleurs délais (Article 34 du RGPD), en précisant la nature de la violation,
                les conséquences probables et les mesures prises pour y remédier.
              </li>
            </ol>
          </section>

          {/* Article 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">
              Article 8 : Évolution de la Politique de Confidentialité
            </h2>
            <p className="text-sm text-luxury-text-light">
              SubServer se réserve le droit de modifier la présente Politique à tout moment pour refléter les
              évolutions légales, jurisprudentielles ou techniques.
            </p>
            <p className="text-sm text-luxury-text-light">
              En cas de modification substantielle (ex: ajout d'une nouvelle finalité de traitement, changement de
              prestataire majeur), les Utilisateurs seront informés au minimum quinze (15) jours avant l'entrée en
              vigueur de la nouvelle Politique par notification e-mail ou via une alerte bloquante au sein du Service
              nécessitant un nouveau recueil du consentement.
            </p>
          </section>

          {/* Article 9 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 9 : Contact Légal</h2>
            <p className="text-sm text-luxury-text-light">
              Pour toute question relative à cette Charte, à l'Open Banking ou à la conformité RGPD de SubServer,
              veuillez contacter notre équipe dédiée :
            </p>
            <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4">
              <p className="text-sm font-mono text-luxury-text">📧 contact.subserver@proton.me</p>
            </div>
            <p className="text-xs italic text-luxury-text-light">
              (Les messages transitant par cette adresse font l'objet d'un chiffrement garantissant la confidentialité
              de nos échanges).
            </p>
          </section>

          {/* Séparateur et signature */}
          <div className="border-t border-slate-900/10 pt-8">
            <p className="text-xs text-luxury-text-light">SubServer. Confidentiel. Sécurisé. RGPD-conforme.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
