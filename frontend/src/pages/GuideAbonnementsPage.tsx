import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CTALink } from "@/components/shared/CTALink";
import { useSeo } from "@/hooks/useSeo";

const SOURCES = [
  { label: "Résiliation infra-annuelle mutuelle", href: "https://mutuelle.fr/actualites/resiliation-infra-annuelle-de-sa-mutuelle-la-marche-a-suivre/" },
  { label: "Résiliation mutuelle Allianz", href: "https://www.lettre-resiliation.com/guides/sante/resiliation-mutuelle-allianz.html" },
  { label: "Résilier le contrat Orange en cas de décès", href: "https://assistance.orange.fr/article/resilier-le-contrat-en-cas-de-deces_821408" },
  { label: "Résiliation abonnement OCS", href: "https://www.monpetitforfait.com/comparateur-box-internet/aides/resiliation-ocs" },
  { label: "Contact Spotify", href: "https://www.spotify.com/fr/about-us/contact/" },
  { label: "Fermeture Orange Bank et Hello bank!", href: "https://www.detective-banque.fr/banque/hello-bank/fermeture-orange-bank-hello-bank/" },
  { label: "Orange Bank — Wikipédia", href: "https://fr.wikipedia.org/wiki/Orange_Bank" },
  { label: "Max Jeune (ex-TGVmax)", href: "https://www.sncf-voyageurs.com/fr/voyagez-avec-nous/en-france/tarifs-grandes-lignes/abonnements-max/max-jeune/" },
  { label: "Réglo Mobile forfaits", href: "https://www.jechange.fr/telecom/reglo-mobile" },
  { label: "Webmail Free", href: "https://www.echosdunet.net/free/aide/boite-mail" },
  { label: "Fitness Park tarifs", href: "https://www.fitnesspark.fr/nos-offres/" },
  { label: "Basic-Fit France sur X", href: "https://x.com/BasicFitFr" },
  { label: "ADL Partner", href: "https://www.leserviceabo.fr/ADLPartner" },
  { label: "Astuces Asos", href: "https://www.ebuyclub.com/reduction-asos-3419" },
  { label: "GeForce Now offres", href: "https://www.dlcompare.fr/actualites-gaming/geforce-now-soldes-d-ete-abonnements-a-prix-reduit-et-8-jeux-78714" },
  { label: "Gleeden fonctionnement", href: "https://chambresdesdesirs.fr/rencontres-en-ligne/gleeden-avis-le-site-pour-infidele-marche-t-il-vraiment/" },
];

const TOC = [
  { id: "presse", label: "Presse et magazines" },
  { id: "telephonie", label: "Téléphonie, banque et mobilité" },
  { id: "sport", label: "Sport et bien-être" },
  { id: "numerique", label: "Streaming, gaming et shopping" },
  { id: "mutuelles", label: "Mutuelles et démarches sensibles" },
  { id: "rencontres", label: "Rencontres et vie privée" },
];

function InlineCta({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-luxury-gold/20 bg-luxury-gold-soft/60 p-5 text-sm text-luxury-text">
      <p>{text}</p>
      <CTALink to="/register" variant="ghost" className="mt-3 text-luxury-sapphire hover:text-luxury-gold-deep">
        Découvrir SubSaver gratuitement
      </CTALink>
    </div>
  );
}

/** Article pilier SEO (content marketing) : accessible publiquement, sans
 * authentification, pour capter du trafic organique Google et convertir vers
 * /register. Contrairement à /privacy, cette page n'est volontairement pas
 * dans AppLayout/ProtectedRoute -- cf. App.tsx, route top-level comme "/". */
export function GuideAbonnementsPage() {
  const navigate = useNavigate();

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Le guide ultime pour gérer, réduire et résilier vos abonnements en ligne",
      description:
        "Presse, mutuelle, sport, streaming, banque, mobile... le guide complet 2026 pour gérer, réduire et résilier tous vos abonnements.",
      author: { "@type": "Organization", name: "SubSaver" },
      publisher: { "@type": "Organization", name: "SubSaver" },
      datePublished: "2026-07-10",
      dateModified: "2026-07-10",
      mainEntityOfPage: "https://subsaver.fr/guide-abonnements",
    }),
    []
  );

  useSeo({
    title: "Résilier ses abonnements en 2026 : le guide complet",
    description:
      "Presse, mutuelle, sport, streaming, banque, mobile... le guide complet 2026 pour gérer, réduire et résilier tous vos abonnements. Astuces et modèles inclus.",
    path: "/guide-abonnements",
    jsonLd,
  });

  return (
    <div className="w-full bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-luxury-sapphire hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-luxury-gold-deep">Guide complet 2026</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-luxury-text sm:text-4xl">
            Le guide ultime pour gérer, réduire et résilier vos abonnements en ligne
          </h1>
          <p className="mt-4 text-base leading-relaxed text-luxury-text-light">
            Entre la presse, la salle de sport, la mutuelle, le forfait mobile et les services de streaming, la
            plupart des foyers français jonglent aujourd'hui avec une quinzaine de prélèvements récurrents, parfois
            plus. Le problème, ce n'est pas tant le nombre que la dispersion&nbsp;: chaque abonnement a sa propre
            procédure de résiliation, sa propre adresse postale, son propre délai de préavis, et il suffit d'un mois
            chargé pour laisser filer un renouvellement qu'on aurait voulu arrêter. Ce guide rassemble, catégorie par
            catégorie, les démarches concrètes pour gérer, réduire ou résilier les contrats les plus courants du
            quotidien, avec à chaque fois l'information pratique plutôt qu'un vague conseil général. Et parce que la
            vraie difficulté n'est pas de résilier un abonnement mais de se souvenir qu'il existe, on verra aussi
            comment une application comme SubSaver change concrètement la donne.
          </p>
        </header>

        <nav aria-label="Sommaire" className="mt-8 rounded-2xl border border-slate-900/10 bg-luxury-bg p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-luxury-text-light">Sommaire</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {TOC.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-luxury-sapphire hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="mt-10 space-y-14 text-luxury-text">
          <section id="presse" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">
              Presse et magazines&nbsp;: où lire moins cher sans se ruiner
            </h2>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              La presse française regorge d'offres découverte qui rendent la lecture régulière bien plus abordable
              qu'un achat au numéro, à condition de savoir où chercher et surtout de penser à surveiller la date de
              fin d'engagement.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Vocable anglais et espagnol pas cher&nbsp;: apprendre une langue en lisant
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Vocable, avec ses deux éditions anglais et espagnol, reste l'un des supports les plus utilisés par les
              lycéens, étudiants et salariés qui veulent entretenir une langue sans repasser par des cours formels :
              chaque article y est présenté en version originale avec traduction et lexique en vis-à-vis. Les tarifs
              découverte les plus intéressants passent presque toujours par des offres promotionnelles saisonnières,
              souvent relayées par des intermédiaires d'abonnement plutôt que par le prix kiosque affiché sur le site
              de l'éditeur, donc le réflexe à avoir est de comparer l'offre du moment avant de souscrire au tarif
              plein.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Auto Journal, Le Point et Challenges&nbsp;: suivre l'actu sans exploser son budget
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Pour L'Auto Journal, les formules d'abonnement pas cher tournent généralement autour d'un tarif
              dégressif sur les six ou douze premiers numéros, ce qui en fait une bonne option pour les passionnés
              d'essais et de comparatifs qui achètent sinon le magazine au numéro à un prix nettement plus élevé sur
              la durée. Le Point et Challenges suivent la même logique commerciale&nbsp;: un prix d'appel attractif
              les premiers mois, puis un tarif de reconduction plus élevé qu'il vaut mieux noter quelque part pour ne
              pas être surpris au moment du renouvellement automatique.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Paris Match, Voici et Charlie Hebdo&nbsp;: information, people et satire
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Paris Match et Voici jouent sur le même terrain de l'actualité people et du reportage, avec des offres
              d'abonnement numérique souvent plus avantageuses que la version papier, livraison comprise. Charlie
              Hebdo, de son côté, propose un abonnement papier et numérique distinct de la distribution en kiosque
              classique, avec l'avantage de recevoir l'hebdomadaire avant sa mise en vente physique dans certaines
              formules.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Sciences Humaines&nbsp;: approfondir sans se ruiner
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Pour ceux qui cherchent un contenu plus exigeant que la presse généraliste, Sciences Humaines propose
              des abonnements à tarif réduit pour les étudiants et enseignants, ainsi que des formules découverte
              régulières sur la version numérique, qui reviennent souvent moins cher que l'abonnement papier
              classique tout en donnant accès aux archives.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Télé 7 Jours, Télé 2 Semaines et la question de la distribution
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Un point qui revient souvent avec Télé 7 Jours et Télé 2 Semaines concerne la distribution postale :
              contrairement à un achat en kiosque, l'abonnement garantit une réception avant le début de la semaine
              concernée, ce qui a un sens réel pour un magazine de programmes télé. En cas de retard de distribution
              répété, le service client de l'éditeur accepte en général de prolonger l'abonnement de quelques numéros
              à titre de compensation, sur simple demande.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              ADL Partner&nbsp;: à quoi correspond ce prélèvement mystérieux&nbsp;?
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Si un prélèvement au nom d'ADL Partner apparaît sur votre relevé bancaire sans que le nom vous parle, il
              s'agit très probablement d'un abonnement presse souscrit via cet intermédiaire, qui commercialise des
              abonnements magazine pour le compte de nombreux éditeurs et partenaires. ADL Partner gère à la fois la
              facturation et la résiliation de ces contrats, donc c'est bien à eux, et non à l'éditeur du magazine,
              qu'il faut s'adresser pour arrêter le prélèvement.
            </p>

            <InlineCta text="C'est justement ce genre de ligne de prélèvement, discrète et facilement oubliée, que SubSaver est conçu pour repérer automatiquement : l'application connecte votre compte bancaire, identifie chaque abonnement presse récurrent, y compris ceux facturés par un intermédiaire comme ADL Partner, et vous alerte avant chaque reconduction pour que vous décidiez en connaissance de cause." />
          </section>

          <section id="telephonie" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">
              Téléphonie, banque et mobilité&nbsp;: les démarches à connaître
            </h2>

            <h3 className="text-lg font-bold text-luxury-text">
              Ouvrir un compte Orange Bank en 2026&nbsp;: ce qui a réellement changé
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Si vous cherchez encore comment ouvrir un compte Orange Bank, il faut le dire clairement : ce n'est plus
              possible. Orange a annoncé fin 2023 son retrait du marché bancaire, et l'ACPR a définitivement mis fin
              à l'agrément bancaire d'Orange Bank le 16 décembre 2025. Les clients qui avaient un compte ont été
              invités à basculer vers Hello bank!, la banque en ligne du groupe BNP Paribas, dans le cadre d'un accord
              de reprise signé entre les deux groupes. Si vous aviez un compte Orange Bank non migré et que vous
              n'avez pas retrouvé votre solde, les fonds non réclamés sont transférés à la Caisse des Dépôts et
              Consignations : la démarche de récupération se fait via le site Ciclade
              (ciclade.caissedesdepots.fr), avec une pièce d'identité.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Réglo Mobile et Red by SFR&nbsp;: le match des forfaits sans engagement
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Réglo Mobile, la marque mobile d'E.Leclerc, s'appuie sur le réseau SFR et mise sur des forfaits très
              agressifs sur le prix au Go, souvent en dessous de 6 euros par mois pour un forfait de plusieurs
              dizaines de gigaoctets, sans engagement et résiliables à tout moment. Red by SFR, la marque digitale de
              SFR, joue sur le même terrain du sans-engagement mais avec un réseau propre plutôt qu'un accès en MVNO,
              ce qui peut faire une différence en zone rurale. Dans les deux cas, l'argument commercial est
              identique : aucun engagement, donc aucune pénalité de sortie.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              TGV Max&nbsp;: le forfait illimité de la SNCF, comment ça marche vraiment
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Le TGV Max, rebaptisé Max Jeune, permet pour un abonnement mensuel de réserver des trajets en TGV INOUI,
              Intercités et OUIGO grande vitesse à 0 euro, dans la limite des places disponibles, avec en complément
              une réduction automatique de 30 % si le train choisi n'a plus de place à 0 euro. Le point de vigilance
              à connaître : chaque réservation doit être confirmée deux jours avant le départ, faute de quoi elle est
              automatiquement annulée.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">Retrouver l'accès à sa boîte mail Free</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Pour se connecter à sa messagerie Free, l'identifiant à utiliser est bien l'adresse complète en
              @free.fr, jamais le numéro de téléphone ou d'abonné, et le mot de passe est celui défini à la création
              du compte. L'accès se fait via webmail.free.fr, qui redirige selon les cas vers l'interface Zimbra ou
              Roundcube. En cas d'oubli, la procédure de réinitialisation est accessible directement depuis la page
              de connexion du webmail.
            </p>

            <InlineCta text="Entre le forfait mobile, l'ancien compte bancaire à surveiller et l'abonnement SNCF mensuel, ce sont autant de prélèvements dont le montant varie d'un mois sur l'autre. SubSaver centralise ces flux bancaires liés à la mobilité et à la téléphonie dans un tableau de bord unique, avec une alerte dès qu'un montant s'écarte de la normale." />
          </section>

          <section id="sport" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">Sport et bien-être&nbsp;: gérer son abonnement en salle</h2>

            <h3 className="text-lg font-bold text-luxury-text">
              Basic Fit&nbsp;: contacter la marque sur X (ex-Twitter) et gérer son abonnement
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Basic Fit, premier réseau de salles de sport en Europe, dispose d'un compte officiel actif sur X sous
              le nom @BasicFitFr, utilisé principalement pour la communication et les annonces, mais aussi pour
              orienter les demandes de service client vers les bons canaux. Pour une démarche liée à votre abonnement
              (gel, résiliation, changement de club), le canal le plus fiable reste l'espace client
              (my.basic-fit.com) ou l'adresse service.clientele@basic-fit.fr, les réseaux sociaux étant surtout
              utiles pour une question rapide ou en cas de blocage sur les autres canaux.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">Fitness Park&nbsp;: comprendre les formules avant de signer</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Fitness Park propose trois niveaux de formule, Classic, Access+ et Ultimate, avec des tarifs échelonnés
              selon les services inclus (accès multi-clubs, cours collectifs, espace cardio premium). Une formule
              sans engagement existe systématiquement en parallèle de la version avec engagement annuel, à un tarif
              mensuel plus élevé mais avec un préavis de résiliation réduit à quatre semaines. Avant de signer, il
              faut aussi anticiper les frais d'adhésion initiaux, généralement entre 30 et 50 euros, ainsi que les
              frais annuels de renouvellement de matériel.
            </p>

            <InlineCta text="Un abonnement de salle de sport avec engagement est justement le genre de contrat qu'on a tendance à oublier une fois les bonnes résolutions passées : SubSaver signale les abonnements sport dont l'usage a visiblement cessé, en croisant la régularité du prélèvement avec l'ancienneté du contrat." />
          </section>

          <section id="numerique" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">
              Streaming, gaming, outils numériques et shopping en ligne
            </h2>

            <h3 className="text-lg font-bold text-luxury-text">Résilier OCS&nbsp;: la marche à suivre selon votre fournisseur</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              La résiliation d'OCS dépend entièrement de la façon dont vous y avez souscrit. Si vous êtes abonné
              directement, tout se passe depuis votre espace client sur go.ocs.fr/account. Si OCS a été souscrit
              comme option chez Orange, il faut passer par l'espace client Orange, rubrique « offre et options »,
              puis « vos options souscrites », et cliquer sur résilier. Chez SFR, la démarche est comparable via la
              rubrique « faire évoluer mon offre et mes options ». Dans tous les cas, aucun frais d'annulation ne
              s'applique, et vous conservez l'accès jusqu'à la fin de la période déjà payée. Par courrier, la
              résiliation peut aussi être envoyée en recommandé à OCS/CANAL+, Service résiliation, TSA 86712, 95905
              Cergy-Pontoise Cedex 9.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">Contacter Spotify par mail&nbsp;: les bonnes adresses</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Spotify ne propose pas de support téléphonique et privilégie un système de ticket via chatbot, avec
              prise de relais par un conseiller humain pour les abonnés Premium. Pour autant, plusieurs adresses
              email existent selon la nature de la demande : cs-help@spotify.com pour le service client,
              privacy@spotify.com pour les questions liées aux données personnelles, et legal@spotify.com pour les
              sujets juridiques. La méthode la plus fiable reste toutefois de passer par le formulaire de la page
              d'assistance officielle, qui redirige ensuite la demande par email selon la catégorie sélectionnée.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              GeForce Now pas cher&nbsp;: profiter du cloud gaming sans casser sa tirelire
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              GeForce Now, la solution de cloud gaming de Nvidia, propose plusieurs paliers d'abonnement, du gratuit
              avec file d'attente jusqu'à la formule Ultimate qui donne accès à une puissance comparable à une carte
              graphique haut de gamme. Le bon réflexe pour payer moins cher consiste à surveiller les périodes de
              remise sur les formules annuelles, régulièrement proposées avec des réductions significatives par
              rapport au tarif mensuel classique.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Viki, Freepik et Flickr&nbsp;: les abonnements créatifs qui s'accumulent
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Viki, la plateforme spécialisée dans les dramas asiatiques sous-titrés, Freepik, la banque d'images très
              utilisée par les créateurs de contenu, et Flickr, l'hébergeur de photos historique repassé en modèle
              freemium, ont un point commun : ce sont des abonnements souvent souscrits pour un besoin ponctuel puis
              jamais résiliés une fois le besoin passé. Chacun propose sa propre procédure de résiliation depuis les
              paramètres de compte, mais la difficulté n'est pas de résilier, c'est de se souvenir que l'abonnement
              existe encore huit mois plus tard.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Payer moins cher sur Asos&nbsp;: les vraies astuces qui fonctionnent
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Plutôt que de chercher un hypothétique code promo générique, les leviers qui font réellement baisser la
              facture sur Asos sont au nombre de trois : l'Outlet permanent du site, qui affiche des réductions
              allant jusqu'à 70 % toute l'année sans code à saisir, le programme de parrainage qui offre 20 % sur la
              première commande d'un nouveau client, et le cumul avec une plateforme de cashback comme Poulpeo ou
              iGraal. Pour un gros consommateur de la marque, l'abonnement Asos Premier, facturé à l'année, se
              rentabilise dès la quatrième commande grâce à la livraison et aux retours gratuits qu'il inclut.
            </p>

            <InlineCta text="Entre le cloud gaming, les banques d'images et les plateformes de streaming de niche, c'est justement le genre d'abonnement numérique dispersé que personne ne prend le temps de lister soi-même. SubSaver détecte ces prélèvements automatiquement dans votre historique bancaire et propose un comparateur pour voir si une offre plus avantageuse existe sur les services équivalents." />
          </section>

          <section id="mutuelles" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">Mutuelles et démarches sensibles&nbsp;: résilier sans stress</h2>

            <h3 className="text-lg font-bold text-luxury-text">
              Quitter la MGEN&nbsp;: la résiliation infra-annuelle expliquée simplement
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Depuis le 1er décembre 2020, la loi de résiliation infra-annuelle permet de résilier sa mutuelle santé,
              MGEN comme n'importe quelle autre, à tout moment après un an d'engagement, sans justificatif ni frais.
              Concrètement, il suffit d'envoyer une lettre recommandée avec accusé de réception à la MGEN pour
              signifier votre volonté de résilier ; la résiliation prend effet un mois après réception du courrier
              par l'organisme. Si vous changez pour une nouvelle mutuelle, la plupart des nouveaux assureurs
              proposent de gérer eux-mêmes les démarches de résiliation auprès de votre ancien contrat.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Résilier sa mutuelle Allianz&nbsp;: lettre type et adresse à connaître
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Pour résilier un contrat de mutuelle Allianz, la lettre recommandée avec accusé de réception doit être
              envoyée à l'adresse suivante : Mutuelle Allianz, Service résiliation, 1 cours Michelet, CS 30051, 92076
              Paris La Défense Cedex. La résiliation prend effet un mois après réception du courrier. Si le motif
              invoqué est un motif légitime (changement de situation professionnelle, déménagement, mutuelle
              d'entreprise devenue obligatoire), il faut joindre un justificatif à la lettre ; en dehors de ces cas,
              la résiliation infra-annuelle après un an de contrat ne demande aucune justification particulière.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">
              Lettre de résiliation Orange en cas de décès du titulaire&nbsp;: la procédure à suivre
            </h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              C'est une démarche difficile à effectuer au moment où on s'y attend le moins, donc autant savoir
              précisément quoi faire : seuls le conjoint ou les héritiers du titulaire décédé peuvent demander la
              résiliation ou la reprise du contrat Orange. Les justificatifs à fournir sont l'acte de décès, une
              pièce d'identité du demandeur et un extrait de livret de famille attestant du lien avec la personne
              décédée. La demande peut être envoyée par lettre recommandée avec accusé de réception, ou directement
              en ligne via l'espace dédié d'Orange. La résiliation est gratuite sur présentation des justificatifs,
              et le délai de traitement est de 10 jours pour un forfait mobile et de 7 jours pour une ligne fixe. Un
              point à garder en tête avant de vous lancer : une fois la résiliation actée, le numéro de ligne et
              l'adresse email associée au compte ne peuvent plus être récupérés.
            </p>

            <InlineCta text="Face à une mutuelle qui a peut-être augmenté sans qu'on l'ait vraiment remarqué, ou à des contrats qu'il faut gérer dans un moment déjà éprouvant, avoir une vue claire et datée de chaque prélèvement change beaucoup de choses. SubSaver garde un historique complet de vos cotisations et de leur évolution mois après mois." />
          </section>

          <section id="rencontres" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold text-luxury-text">
              Rencontres et vie privée&nbsp;: les abonnements qu'on préfère garder discrets
            </h2>

            <h3 className="text-lg font-bold text-luxury-text">Gleeden&nbsp;: fonctionnement, coût et discrétion</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Gleeden est un site de rencontre extraconjugale français lancé en 2009, avec un modèle économique
              particulier : l'inscription et l'utilisation sont gratuites pour les femmes, tandis que les hommes
              achètent des crédits pour engager la conversation. Le site met en avant plusieurs outils de discrétion,
              dont un bouton de déconnexion immédiate. Sur le plan bancaire, ce type de plateforme a l'habitude de
              facturer sous un intitulé neutre sur le relevé de compte plutôt que sous le nom du site, précisément
              pour préserver la confidentialité de l'abonné.
            </p>

            <h3 className="text-lg font-bold text-luxury-text">Wyylde&nbsp;: l'alternative orientée rencontres libertines</h3>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Wyylde se positionne sur un segment voisin, celui des rencontres libertines et coquines, avec un
              fonctionnement d'abonnement classique par palier de durée. Comme pour Gleeden, la discrétion de la
              facturation fait partie des arguments mis en avant par la plateforme.
            </p>

            <InlineCta text="Qu'elle soit recherchée pour des raisons de confidentialité personnelle ou simplement parce qu'on a oublié de résilier un essai gratuit devenu payant, une facturation sous un nom neutre reste malgré tout visible sur votre relevé bancaire, encore faut-il savoir le repérer. C'est exactement le type de ligne que l'algorithme de SubSaver isole automatiquement, sans jamais afficher publiquement le détail de la nature du service : l'app reste un outil personnel de suivi." />
          </section>

          <section className="space-y-4 border-t border-slate-900/10 pt-10">
            <h2 className="text-2xl font-bold text-luxury-text">En résumé&nbsp;: centraliser plutôt que jongler</h2>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              Ce guide couvre une quinzaine de démarches très concrètes, mais la réalité, c'est que la plupart des
              foyers cumulent bien plus de contrats que ceux listés ici : presse, mutuelle, sport, mobile, streaming,
              banque, rencontres, chacun avec sa propre date de renouvellement et sa propre procédure. Retenir
              individuellement chaque échéance, chaque adresse de résiliation et chaque tarif de reconduction est une
              charge mentale qui, à un moment donné, cesse d'être raisonnable à gérer à la main ou sur un tableur.
            </p>
            <p className="text-sm leading-relaxed text-luxury-text-light">
              C'est précisément le problème que SubSaver a été conçu pour résoudre. L'application se connecte à votre
              compte bancaire de façon sécurisée, détecte automatiquement l'ensemble de vos abonnements récurrents à
              partir de votre historique de transactions, et vous alerte dès qu'un montant augmente sans que vous en
              ayez été informé ailleurs que sur votre relevé. Elle permet aussi de comparer vos dépenses par catégorie
              pour identifier où renégocier en priorité, et, si vous partagez certains frais avec un colocataire, un
              partenaire ou des amis, de répartir et suivre ces coûts partagés sans avoir à tenir de compte à part.
              Plutôt que de courir après chaque prélèvement dispersé dans une trentaine d'applications et de relevés
              différents, l'idée est simple : un seul endroit pour tout voir, tout comparer, et décider en
              connaissance de cause ce qui mérite d'être gardé, renégocié ou résilié.
            </p>
            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <CTALink variant="solid" onClick={() => navigate("/register")} className="px-8 py-3.5 text-base">
                Essayer SubSaver gratuitement
              </CTALink>
              <span className="text-xs text-luxury-text-light">Sans carte bancaire · Résultats en 30 secondes</span>
            </div>
          </section>

          <section className="border-t border-slate-900/10 pt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-luxury-text-light">Sources</h2>
            <ul className="mt-3 space-y-1 text-xs text-luxury-text-light">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="hover:text-luxury-sapphire hover:underline"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
