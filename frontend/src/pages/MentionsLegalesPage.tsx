import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { useSeo } from "@/hooks/useSeo";

/** Page de Mentions Légales : identification de l'éditeur (LCEN Art. 6-III),
 * exigée sur toute plateforme accessible au public en France.
 *
 * Route publique (hors ProtectedRoute) : la LCEN impose que ces mentions
 * soient accessibles "de manière directe et permanente" à tout visiteur,
 * sans compte ni connexion -- cf. App.tsx. */
export function MentionsLegalesPage() {
  useSeo({
    title: "Mentions légales - SubSaver",
    description:
      "Identité de l'éditeur, de l'hébergeur et informations légales de la plateforme SubSaver, conformément à la LCEN.",
    path: "/mentions-legales",
  });

  return (
    <div className="w-full bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-luxury-sapphire hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        {/* En-tête */}
        <div>
          <RevealText as="h1" className="text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Mentions Légales
          </RevealText>
          <RevealText className="mt-2 text-sm text-luxury-text-light">
            Dernière mise à jour : 14 juillet 2026
          </RevealText>
        </div>

        {/* Contenu */}
        <article className="prose prose-sm max-w-none space-y-8 text-luxury-text">
          {/* Article 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 1 : Éditeur du Site</h2>
            <p className="text-sm text-luxury-text-light">
              Conformément aux dispositions de l'article 6-III de la Loi n° 2004-575 du 21 juin 2004 pour la
              Confiance dans l'Économie Numérique (LCEN), il est précisé aux utilisateurs du site{" "}
              <strong>SubSaver</strong> (ci-après « le Site ») l'identité des différents intervenants dans le cadre
              de sa réalisation et de son suivi.
            </p>
            <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4 space-y-1">
              <p className="text-sm text-luxury-text">
                <strong>Nom commercial :</strong> SubSaver
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Exploitant :</strong> Stanislas Humbert
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Statut juridique :</strong> Entrepreneur Individuel (EI)
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Numéro SIREN :</strong> 107 475 535
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Numéro SIRET (siège) :</strong> 107 475 535 00012
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Code APE / NAF :</strong> 6201Z - Programmation informatique
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Adresse du siège :</strong> 48 Rue Sainte Anne, 54000 Nancy, France
              </p>
              <p className="text-sm text-luxury-text">
                <strong>TVA :</strong> TVA non applicable, article 293 B du Code Général des Impôts (franchise en
                base de TVA)
              </p>
              <p className="text-sm text-luxury-text">
                <strong>Contact :</strong> contact.subsaver@proton.me
              </p>
            </div>
            <p className="text-sm text-luxury-text-light">
              <strong>Directeur de la publication :</strong> Stanislas Humbert, en sa qualité d'exploitant de
              l'entreprise individuelle SubSaver.
            </p>
          </section>

          {/* Article 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 2 : Hébergement</h2>
            <p className="text-sm text-luxury-text-light">
              Le Site est hébergé par :
            </p>
            <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 space-y-1">
              <p className="text-sm font-semibold text-amber-900">
                [ À COMPLÉTER - Coordonnées de l'hébergeur ]
              </p>
              <p className="text-sm text-amber-900">
                [ Raison sociale de l'hébergeur, ex. Render Services, Inc. / Vercel Inc. / OVH SAS / Amazon Web
                Services EMEA SARL ]
              </p>
              <p className="text-sm text-amber-900">[ Forme juridique ]</p>
              <p className="text-sm text-amber-900">[ Adresse complète du siège social ]</p>
              <p className="text-sm text-amber-900">[ Numéro de téléphone ou contact ]</p>
              <p className="text-xs italic text-amber-800">
                Le domaine de secours <code>subserver-frontend.onrender.com</code> référencé dans le code (cf.
                redirections de <code>index.html</code>) indique un hébergement sur Render - vérifie les mentions
                légales officielles de Render (raison sociale, adresse) avant de publier cet encart.
              </p>
            </div>
          </section>

          {/* Article 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 3 : Propriété Intellectuelle</h2>
            <p className="text-sm text-luxury-text-light">
              L'ensemble des éléments composant le Site (structure, textes, logos, graphismes, images, icônes,
              charte graphique, code source) est la propriété exclusive de SubSaver, sauf mention contraire, et est
              protégé par le Code de la propriété intellectuelle.
            </p>
            <p className="text-sm text-luxury-text-light">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des
              éléments du Site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite
              préalable de SubSaver.
            </p>
          </section>

          {/* Article 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 4 : Données Personnelles</h2>
            <p className="text-sm text-luxury-text-light">
              Le traitement des données à caractère personnel des utilisateurs du Site est décrit en détail dans la{" "}
              <Link to="/privacy" className="text-luxury-sapphire hover:underline">
                Politique de Confidentialité
              </Link>
              , conformément au Règlement (UE) 2016/679 (RGPD) et à la Loi Informatique et Libertés du 6 janvier
              1978 modifiée.
            </p>
          </section>

          {/* Article 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 5 : Cookies</h2>
            <p className="text-sm text-luxury-text-light">
              Le Site est susceptible d'utiliser des cookies strictement nécessaires à son fonctionnement
              (authentification, préférences de session) ainsi que, le cas échéant, des cookies de mesure
              d'audience soumis au consentement de l'utilisateur, conformément aux recommandations de la CNIL.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">
              Article 6 : Limitation de Responsabilité
            </h2>
            <p className="text-sm text-luxury-text-light">
              SubSaver s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des
              informations diffusées sur le Site, mais ne saurait être tenu responsable des erreurs, d'une absence
              de disponibilité des fonctionnalités ou de la présence de virus sur le Site.
            </p>
          </section>

          {/* Article 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 7 : Droit Applicable et Médiation</h2>
            <p className="text-sm text-luxury-text-light">
              Les présentes mentions légales sont soumises au droit français. En cas de litige, et après démarche
              préalable auprès de SubSaver, le consommateur a la possibilité de recourir gratuitement à un
              médiateur de la consommation en vue de la résolution amiable du litige, conformément aux articles
              L.611-1 et suivants du Code de la consommation.
            </p>
            <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                [ À COMPLÉTER - Nom et coordonnées du médiateur de la consommation retenu ]
              </p>
            </div>
          </section>

          {/* Article 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-luxury-text">Article 8 : Contact</h2>
            <p className="text-sm text-luxury-text-light">
              Pour toute question relative aux présentes mentions légales, vous pouvez contacter SubSaver à
              l'adresse suivante :
            </p>
            <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4">
              <p className="text-sm font-mono text-luxury-text">📧 contact.subsaver@proton.me</p>
            </div>
          </section>

          {/* Séparateur et signature */}
          <div className="border-t border-slate-900/10 pt-8">
            <p className="text-xs text-luxury-text-light">
              SubSaver - Stanislas Humbert, Entrepreneur Individuel - SIREN 107 475 535.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
