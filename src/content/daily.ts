import type { Question, SourceRef } from './types';

/**
 * « Le fait du jour » : une fiche courte et deux questions par jour, environ 5 minutes.
 * Contenus rédigés pour l'app. Les faits susceptibles de changer portent `volatile`
 * et la date de vérification `asOf` ; ceux qui ne bougent pas (histoire, sciences établies)
 * n'ont pas de source en ligne : ce sont des connaissances de référence.
 * La première proposition de chaque question est la bonne ; l'ordre est mélangé à l'affichage.
 */

export type DailyTheme = 'aero' | 'histoire' | 'geopolitique' | 'sciences' | 'arts' | 'religions' | 'geographie';

export const DAILY_THEMES: Record<DailyTheme, string> = {
  aero: 'Aéronautique et Air France',
  histoire: 'Histoire',
  geopolitique: 'Géopolitique',
  sciences: 'Sciences',
  arts: 'Arts et littérature',
  religions: 'Religions et philosophie',
  geographie: 'Géographie',
};

export interface DailyFact {
  id: string;
  theme: DailyTheme;
  title: string;
  points: string[];
  /** L'idée à garder en tête. */
  retenir: string;
  /** Date de vérification (AAAA-MM-JJ). */
  asOf: string;
  /** Contient des données qui peuvent changer : la date est rappelée. */
  volatile?: boolean;
  sources?: SourceRef[];
  questions: [Question, Question];
}

/** Lot en cours : 60 jours, dont 2 jours par semaine d'aéronautique. */
export const DAILY_BATCH = { id: 'lot-1', title: 'Lot 1', asOf: '2026-11-17', days: 60 };

const V = '2026-11-17';
const FICHE_AF = { title: 'Fiche de la bibliothèque « Air France : repères et gouvernance » (sources vérifiées le 16/11/2026)' };
const FICHE_FLOTTE = { title: 'Fiche de la bibliothèque « La flotte d’Air France » (sources vérifiées le 16/11/2026)' };
const LIVRET = { title: 'Manuel du BIA, CIRAS Toulouse, édition 2021' };

const q = (id: string, text: string, choices: [string, string, string, string], explain: string, volatile?: boolean): Question =>
  ({ id, q: text, choices, explain, ...(volatile ? { volatile } : {}) });

// ---------------------------------------------------------------------------
// Aéronautique et Air France (17)
// ---------------------------------------------------------------------------
const AERO: DailyFact[] = [
  {
    id: 'dj-aero-naissance-af', theme: 'aero', title: 'La naissance d’Air France', asOf: V,
    points: [
      'Air France est inaugurée le 7 octobre 1933, au Bourget.',
      'Elle naît du regroupement de cinq compagnies : l’Aéropostale, Air Union, Farman, la CIDNA et Air Orient.',
      'Pierre Cot, ministre de l’Air, est à l’origine de ce regroupement.',
      'L’emblème de la compagnie, l’hippocampe ailé, vient d’Air Orient.',
      'L’Aéropostale apporte la légende de ses pilotes : Mermoz, Saint-Exupéry, Guillaumet.',
    ],
    retenir: '1933, cinq compagnies, l’hippocampe d’Air Orient.',
    sources: [FICHE_AF, LIVRET],
    questions: [
      q('dj-aero-naissance-af-1', 'En quelle année Air France est-elle créée ?', ['1933', '1919', '1946', '1927'], 'Inaugurée le 7 octobre 1933 au Bourget.'),
      q('dj-aero-naissance-af-2', 'De quelle compagnie vient l’hippocampe ailé, emblème d’Air France ?', ['Air Orient', 'L’Aéropostale', 'Air Union', 'Farman'], 'L’hippocampe était l’emblème d’Air Orient, l’une des cinq compagnies fondatrices.'),
    ],
  },
  {
    id: 'dj-aero-identite-af', theme: 'aero', title: 'Les codes d’Air France', asOf: V,
    points: [
      'Code IATA (deux caractères, sur les billets) : AF. Code OACI (trois lettres, utilisé par le contrôle aérien) : AFR.',
      'À la radio, l’indicatif d’appel des vols Air France est « AIRFRANS ».',
      'Siège : Roissypôle, sur l’aéroport Paris-Charles de Gaulle.',
      'Programme de fidélité : Flying Blue, commun avec KLM.',
      'Air France est membre fondateur de l’alliance SkyTeam, créée en 2000.',
    ],
    retenir: 'AF pour les passagers, AFR pour le contrôle aérien.',
    sources: [FICHE_AF],
    questions: [
      q('dj-aero-identite-af-1', 'Quel est le code OACI d’Air France ?', ['AFR', 'AF', 'AIF', 'FRA'], 'AFR est le code OACI à trois lettres ; AF est le code IATA.'),
      q('dj-aero-identite-af-2', 'Quel programme de fidélité Air France partage-t-elle avec KLM ?', ['Flying Blue', 'Miles & More', 'Executive Club', 'SkyMiles'], 'Flying Blue. Miles & More est celui de Lufthansa, Executive Club celui de British Airways.'),
    ],
  },
  {
    id: 'dj-aero-groupe-afkl', theme: 'aero', title: 'Le groupe Air France-KLM', asOf: '2026-11-16', volatile: true,
    points: [
      'Air France et KLM se rapprochent en 2004 : le groupe Air France-KLM détient les deux compagnies.',
      'Autres compagnies du groupe : Transavia (vols à bas coûts) et Air France Hop (réseau régional).',
      'Directeur général du groupe : Benjamin Smith, depuis 2018.',
      'Directrice générale d’Air France : Anne Rigail, depuis décembre 2018, première femme à ce poste.',
      'Présidente du conseil d’administration du groupe : Florence Parly, depuis le 4 juin 2025.',
    ],
    retenir: '2004, deux compagnies, un groupe ; dirigeants relevés le 16/11/2026.',
    sources: [FICHE_AF],
    questions: [
      q('dj-aero-groupe-afkl-1', 'Depuis quelle année Air France et KLM forment-elles un même groupe ?', ['2004', '1999', '2009', '2014'], 'Le groupe Air France-KLM existe depuis 2004.'),
      q('dj-aero-groupe-afkl-2', 'Qui dirige Air France (directrice générale) ?', ['Anne Rigail', 'Florence Parly', 'Marjan Rintel', 'Anne-Marie Couderc'], 'Anne Rigail, depuis décembre 2018. Marjan Rintel dirige KLM.', true),
    ],
  },
  {
    id: 'dj-aero-flotte-lc', theme: 'aero', title: 'La flotte long-courrier', asOf: '2026-11-16', volatile: true,
    points: [
      'Quatre familles d’avions long-courriers : Boeing 777, Boeing 787-9, Airbus A350-900 et Airbus A330.',
      'Le Boeing 777-300ER est le plus nombreux : 43 exemplaires.',
      'L’A380 a volé chez Air France de 2009 à 2020 ; il ne fait plus partie de la flotte.',
      'L’A350 remplace progressivement les avions les plus anciens.',
      'Ces chiffres changent au fil des livraisons et des retraits.',
    ],
    retenir: '777, 787, A350, A330 ; plus d’A380 ni de 747.',
    sources: [FICHE_FLOTTE],
    questions: [
      q('dj-aero-flotte-lc-1', 'Lequel de ces avions fait partie de la flotte long-courrier d’Air France ?', ['Le Boeing 787-9', 'L’Airbus A380', 'Le Boeing 747-400', 'L’Airbus A340-300'], 'A380, 747 et A340 sont retirés.', true),
      q('dj-aero-flotte-lc-2', 'Combien de Boeing 777-300ER Air France exploite-t-elle ?', ['43', '18', '70', '25'], '43 exemplaires, chiffre identique fin 2025 et en novembre 2026.', true),
    ],
  },
  {
    id: 'dj-aero-moteurs', theme: 'aero', title: 'Quel moteur sur quel avion ?', asOf: '2026-11-16',
    points: [
      'Airbus A320 d’Air France : deux CFM56 (CFM International, coentreprise de Safran et GE).',
      'Boeing 777 : GE90, l’un des plus gros réacteurs jamais construits.',
      'Airbus A350 : Rolls-Royce Trent XWB, seul moteur proposé pour cet avion.',
      'Boeing 787-9 d’Air France : GEnx.',
      'Ce sont des turboréacteurs à double flux à fort taux de dilution : le flux froid fournit l’essentiel de la poussée.',
    ],
    retenir: 'A320 CFM56, 777 GE90, A350 Trent XWB, 787 GEnx.',
    sources: [FICHE_FLOTTE],
    questions: [
      q('dj-aero-moteurs-1', 'Quel moteur équipe les Airbus A350 d’Air France ?', ['Le Rolls-Royce Trent XWB', 'Le General Electric GE90', 'Le CFM International CFM56', 'Le GEnx'], 'Le Trent XWB est le seul moteur de l’A350.'),
      q('dj-aero-moteurs-2', 'Quel moteur équipe les Boeing 777 d’Air France ?', ['Le GE90', 'Le Trent XWB', 'Le GEnx', 'Le CF6'], 'Les 777-200ER et 777-300ER d’Air France volent avec des GE90.'),
    ],
  },
  {
    id: 'dj-aero-concorde', theme: 'aero', title: 'Concorde', asOf: V,
    points: [
      'Avion de ligne supersonique franco-britannique, conçu par Sud-Aviation et la British Aircraft Corporation.',
      'Premier vol le 2 mars 1969 à Toulouse, avec André Turcat aux commandes.',
      'Vitesse de croisière : environ Mach 2, vers 18 000 m d’altitude. Paris-New York en environ 3 h 30.',
      'Exploité par Air France et British Airways de 1976 à 2003.',
      'Le 25 juillet 2000, l’accident de Gonesse fait 113 morts.',
    ],
    retenir: '1969, Mach 2, vols commerciaux de 1976 à 2003.',
    sources: [LIVRET, FICHE_FLOTTE],
    questions: [
      q('dj-aero-concorde-1', 'Pendant quelle période Concorde a-t-il assuré des vols commerciaux ?', ['De 1976 à 2003', 'De 1969 à 2000', 'De 1980 à 2010', 'De 1972 à 1996'], 'Mise en service en 1976, retrait en 2003.'),
      q('dj-aero-concorde-2', 'Quelle était la vitesse de croisière de Concorde ?', ['Environ Mach 2', 'Environ Mach 0,85', 'Environ Mach 1,2', 'Environ Mach 3'], 'Environ Mach 2, soit deux fois la vitesse du son.'),
    ],
  },
  {
    id: 'dj-aero-aeroports-paris', theme: 'aero', title: 'Les aéroports de Paris', asOf: V,
    points: [
      'Paris-Charles de Gaulle (CDG, code OACI LFPG) : hub d’Air France, ouvert en 1974, à Roissy.',
      'CDG a quatre pistes, parallèles deux à deux, orientées est-ouest.',
      'Paris-Orly (ORY, LFPO) : trois pistes, au sud de Paris.',
      'Paris-Le Bourget (LBG, LFPB) : aviation d’affaires et salon international de l’aéronautique, les années impaires.',
      'Un hub est un aéroport où une compagnie concentre ses correspondances.',
    ],
    retenir: 'CDG = LFPG, le hub ; Orly = LFPO.',
    sources: [{ title: 'Pilotest, relevé du test de culture aéronautique psy0 (mars 2018)', url: 'https://www.pilotest.com/documents/test_culture_aeronautique_cadets_air_france_mars_2018.pdf' }],
    questions: [
      q('dj-aero-aeroports-paris-1', 'Quel est le code OACI de Paris-Charles de Gaulle ?', ['LFPG', 'LFPO', 'CDG', 'LFPB'], 'CDG est le code IATA ; LFPG le code OACI. LFPO désigne Orly.'),
      q('dj-aero-aeroports-paris-2', 'Combien de pistes l’aéroport Paris-Charles de Gaulle compte-t-il ?', ['Quatre', 'Deux', 'Trois', 'Six'], 'Quatre pistes, parallèles deux à deux. Orly en a trois.'),
    ],
  },
  {
    id: 'dj-aero-codes-aeroports', theme: 'aero', title: 'Codes IATA et OACI des aéroports', asOf: V,
    points: [
      'Code IATA : trois lettres, utilisé par les compagnies et sur les billets (MRS, NCE, TLS).',
      'Code OACI : quatre lettres, utilisé par les pilotes et le contrôle aérien.',
      'Le code OACI commence par une lettre de région : L pour l’Europe du Sud, puis F pour la France : LF.',
      'Exemples : Marseille LFML, Nice LFMN, Toulouse LFBO, Lyon LFLL.',
      'Les codes OACI des États-Unis commencent par K (KJFK à New York), ceux du Royaume-Uni par EG (EGLL à Londres-Heathrow).',
    ],
    retenir: 'Trois lettres pour les passagers, quatre pour l’aviation ; LF = France.',
    questions: [
      q('dj-aero-codes-aeroports-1', 'Par quelles lettres commencent les codes OACI des aéroports français ?', ['LF', 'FR', 'EF', 'KF'], 'L désigne une région d’Europe, F la France.'),
      q('dj-aero-codes-aeroports-2', 'Combien de lettres compte un code OACI d’aéroport ?', ['Quatre', 'Trois', 'Deux', 'Cinq'], 'Quatre lettres pour l’OACI, trois pour l’IATA.'),
    ],
  },
  {
    id: 'dj-aero-airbus', theme: 'aero', title: 'L’aventure Airbus', asOf: V,
    points: [
      'Airbus naît en 1970 d’une coopération européenne, d’abord franco-allemande, pour concurrencer les constructeurs américains.',
      'Assemblage final historique à Toulouse-Blagnac.',
      '1972 : premier vol de l’A300, premier biréacteur gros-porteur.',
      '1987 : l’A320 est le premier avion de ligne à commandes de vol électriques.',
      '2005 : premier vol de l’A380, le plus gros avion de ligne. 2013 : premier vol de l’A350, en grande partie en composites.',
    ],
    retenir: 'A300 en 1972, A320 et ses commandes électriques en 1987.',
    sources: [LIVRET],
    questions: [
      q('dj-aero-airbus-1', 'Quel avion Airbus a introduit les commandes de vol électriques sur les avions de ligne ?', ['L’A320', 'L’A300', 'L’A380', 'L’A350'], 'L’A320, en 1987.'),
      q('dj-aero-airbus-2', 'Quel est le premier avion d’Airbus ?', ['L’A300', 'L’A310', 'L’A320', 'La Caravelle'], 'L’A300 vole en 1972. La Caravelle est un avion de Sud-Aviation.'),
    ],
  },
  {
    id: 'dj-aero-institutions', theme: 'aero', title: 'Qui fait quoi dans l’aviation civile ?', asOf: V,
    points: [
      'OACI : agence de l’ONU, née de la convention de Chicago (1944), siège à Montréal. Elle fixe les normes mondiales.',
      'EASA : agence européenne de la sécurité aérienne, à Cologne. Elle certifie les avions et fixe les règles en Europe.',
      'DGAC : direction générale de l’aviation civile, en France. Contrôle aérien, licences, surveillance.',
      'BEA : bureau d’enquêtes et d’analyses, au Bourget. Il enquête sur les accidents pour en tirer des leçons, sans chercher de coupable.',
      'IATA : association des compagnies aériennes, pas une autorité.',
    ],
    retenir: 'OACI monde, EASA Europe, DGAC France, BEA enquêtes.',
    sources: [LIVRET, { title: 'OACI, liste des États membres', url: 'https://www.icao.int/fr/about-icao/member-states' }],
    questions: [
      q('dj-aero-institutions-1', 'Quel organisme enquête sur les accidents d’avion en France ?', ['Le BEA', 'L’EASA', 'L’IATA', 'L’OACI'], 'Le Bureau d’enquêtes et d’analyses pour la sécurité de l’aviation civile.'),
      q('dj-aero-institutions-2', 'Où l’OACI a-t-elle son siège ?', ['À Montréal', 'À Chicago', 'À Genève', 'À Cologne'], 'L’OACI est née à Chicago en 1944, mais siège à Montréal. Cologne accueille l’EASA.'),
    ],
  },
  {
    id: 'dj-aero-controle', theme: 'aero', title: 'Le contrôle aérien en France', asOf: V,
    points: [
      'Le contrôle aérien français est assuré par la DSNA, au sein de la DGAC.',
      'Cinq centres en route (CRNA) : Athis-Mons (Nord), Reims (Est), Brest (Ouest), Bordeaux (Sud-Ouest), Aix-en-Provence (Sud-Est).',
      'Près des aéroports, l’approche puis la tour prennent le relais.',
      'Le contrôleur sépare les avions ; le transpondeur permet au radar secondaire d’identifier chacun.',
      'Fréquence de détresse internationale : 121,5 MHz.',
    ],
    retenir: 'Cinq centres en route, puis approche et tour.',
    sources: [LIVRET],
    questions: [
      q('dj-aero-controle-1', 'Combien de centres de contrôle en route (CRNA) la France compte-t-elle ?', ['Cinq', 'Trois', 'Huit', 'Douze'], 'Athis-Mons, Reims, Brest, Bordeaux et Aix-en-Provence.'),
      q('dj-aero-controle-2', 'Laquelle de ces villes accueille un centre de contrôle en route ?', ['Brest', 'Lille', 'Toulouse', 'Strasbourg'], 'Brest accueille le CRNA Ouest.'),
    ],
  },
  {
    id: 'dj-aero-tenerife', theme: 'aero', title: 'Tenerife 1977 et la naissance du CRM', asOf: V,
    points: [
      'Le 27 mars 1977, deux Boeing 747, de KLM et de Pan Am, se percutent sur la piste de Los Rodeos, à Tenerife.',
      'Bilan : 583 morts, la pire catastrophe de l’histoire de l’aviation.',
      'Causes : brouillard, piste encombrée, messages radio ambigus, et un décollage sans autorisation claire.',
      'Le commandant de bord, très expérimenté, n’a pas été contredit par son équipage.',
      'Leçon : le CRM (gestion des ressources de l’équipage) apprend aux pilotes à communiquer, vérifier et oser contester.',
    ],
    retenir: 'La pire catastrophe aérienne a fait naître le travail en équipage moderne.',
    questions: [
      q('dj-aero-tenerife-1', 'Que désigne le CRM dans l’aviation ?', ['La gestion des ressources de l’équipage', 'Le contrôle radar des mouvements', 'La certification des réacteurs modernes', 'Le carnet de route de maintenance'], 'Crew Resource Management : communication et coopération dans le poste.'),
      q('dj-aero-tenerife-2', 'Quels avions sont impliqués dans la collision de Tenerife en 1977 ?', ['Deux Boeing 747', 'Deux Douglas DC-10', 'Un Concorde et un 747', 'Deux Airbus A300'], 'Un 747 de KLM et un 747 de Pan Am.'),
    ],
  },
  {
    id: 'dj-aero-af447', theme: 'aero', title: 'Le vol Rio-Paris AF447', asOf: V,
    points: [
      'Le 1er juin 2009, l’Airbus A330 du vol AF447 disparaît au-dessus de l’Atlantique : 228 morts.',
      'Les enregistreurs de vol sont retrouvés en 2011, par près de 4 000 m de fond.',
      'Le rapport final du BEA (juillet 2012) décrit le givrage des sondes Pitot, la perte des indications de vitesse, puis un décrochage non récupéré.',
      'Leçons : formation au décrochage et aux situations inhabituelles, remplacement des sondes, travail sur les facteurs humains.',
    ],
    retenir: 'Sondes givrées, vitesses perdues, décrochage : un accident qui a changé la formation.',
    questions: [
      q('dj-aero-af447-1', 'Quel phénomène est à l’origine de la perte des indications de vitesse du vol AF447 ?', ['Le givrage des sondes Pitot', 'Une panne des deux réacteurs', 'Un impact de foudre sur le radar', 'Une erreur de carburant'], 'Les sondes Pitot, givrées, ne mesuraient plus la vitesse.'),
      q('dj-aero-af447-2', 'Quel type d’avion assurait le vol AF447 ?', ['Un Airbus A330', 'Un Boeing 777', 'Un Airbus A340', 'Un Boeing 747'], 'Un Airbus A330-200.'),
    ],
  },
  {
    id: 'dj-aero-pilote-ligne', theme: 'aero', title: 'Le métier de pilote de ligne', asOf: V,
    points: [
      'Un avion de ligne vole avec deux pilotes : le commandant de bord (CDB) et l’officier pilote de ligne (OPL), aussi appelé copilote.',
      'Ils se partagent les rôles : un pilote aux commandes, l’autre qui surveille et gère la radio.',
      'Licence de pilote de ligne : ATPL. Chaque type d’avion demande une qualification de type.',
      'Aptitude médicale de classe 1, exigée avant l’entrée en formation Cadets chez Air France.',
      'Contrôles réguliers sur simulateur tout au long de la carrière.',
    ],
    retenir: 'CDB et OPL ; ATPL, qualification de type, médical classe 1.',
    sources: [{ title: 'Air France, page « Pilote de ligne »', url: 'https://corporate.airfrance.com/fr/node/836' }],
    questions: [
      q('dj-aero-pilote-ligne-1', 'Que signifie OPL ?', ['Officier pilote de ligne', 'Opérateur de piste lourde', 'Officier de planification', 'Opérations pilote en ligne'], 'L’OPL est le copilote ; le CDB est le commandant de bord.'),
      q('dj-aero-pilote-ligne-2', 'Quelle visite médicale est exigée avant d’entrer en formation Cadets Air France ?', ['Une visite de classe 1', 'Une visite de classe 2', 'Une visite de classe 3', 'Aucune visite'], 'La classe 1 est l’aptitude des pilotes professionnels.'),
    ],
  },
  {
    id: 'dj-aero-saf', theme: 'aero', title: 'Les carburants d’aviation durables', asOf: V, volatile: true,
    points: [
      'SAF (sustainable aviation fuel) : carburant fabriqué à partir de déchets, de biomasse ou de façon synthétique, mélangé au kérosène.',
      'Le règlement européen ReFuelEU Aviation impose une part minimale de SAF dans le carburant livré aux aéroports de l’UE.',
      'Cette part est de 2 % en 2025, puis 6 % en 2030, 20 % en 2035 et 70 % en 2050.',
      'Une part de carburants synthétiques est imposée à partir de 2030 (1,2 %), jusqu’à 35 % en 2050.',
      'L’obligation pèse sur les fournisseurs de carburant. Le SAF coûte encore plusieurs fois le prix du kérosène.',
    ],
    retenir: 'ReFuelEU : 2 % de SAF en 2025, 6 % en 2030, 70 % en 2050.',
    sources: [
      { title: 'Parlement européen, résumé du règlement ReFuelEU Aviation', url: 'https://oeil.europarl.europa.eu/oeil/en/procedure-document-summary/pdf?id=1764144' },
      { title: 'S&P Global, objectifs SAF de l’UE (mai 2025)', url: 'https://www.spglobal.com/energy/en/news-research/latest-news/refined-products/052825-eu-policy-stifles-short-term-saf-supply-growth-omv' },
    ],
    questions: [
      q('dj-aero-saf-1', 'Quelle part de SAF le règlement européen impose-t-il en 2030 ?', ['6 %', '2 %', '20 %', '50 %'], '2 % en 2025, 6 % en 2030, 20 % en 2035, 70 % en 2050.', true),
      q('dj-aero-saf-2', 'Sur qui repose l’obligation d’incorporer du SAF selon ReFuelEU ?', ['Les fournisseurs de carburant', 'Les passagers', 'Les constructeurs d’avions', 'Les contrôleurs aériens'], 'Ce sont les fournisseurs qui doivent livrer une part minimale de SAF aux aéroports.'),
    ],
  },
  {
    id: 'dj-aero-alliances', theme: 'aero', title: 'Les trois grandes alliances', asOf: V,
    points: [
      'Star Alliance (1997) : la première, autour de Lufthansa et United Airlines notamment.',
      'Oneworld (1999) : autour de British Airways et American Airlines notamment.',
      'SkyTeam (2000) : fondée notamment par Air France, Delta, Aeroméxico et Korean Air.',
      'Une alliance permet de partager des vols (partage de codes), des salons et des programmes de fidélité.',
    ],
    retenir: 'Star Alliance 1997, Oneworld 1999, SkyTeam 2000 avec Air France.',
    sources: [FICHE_AF],
    questions: [
      q('dj-aero-alliances-1', 'À quelle alliance appartient British Airways ?', ['Oneworld', 'SkyTeam', 'Star Alliance', 'Aucune'], 'British Airways est l’un des piliers de Oneworld.'),
      q('dj-aero-alliances-2', 'Quelle est la plus ancienne des trois grandes alliances ?', ['Star Alliance', 'SkyTeam', 'Oneworld', 'Elles datent toutes de 2000'], 'Star Alliance, 1997.'),
    ],
  },
  {
    id: 'dj-aero-environnement', theme: 'aero', title: 'L’aviation et le climat', asOf: V,
    points: [
      'Selon le livret BIA, l’aviation représente environ 2,5 % des émissions mondiales de CO2.',
      'Elle contribue davantage au réchauffement (environ 4 % selon le même livret), à cause des traînées de condensation et des oxydes d’azote en altitude.',
      'Leviers : avions plus sobres, moteurs à fort taux de dilution, carburants durables, optimisation des trajectoires.',
      'Un nouvel avion consomme en général 15 à 25 % de moins que celui qu’il remplace, selon les constructeurs.',
    ],
    retenir: 'CO2, mais aussi traînées et oxydes d’azote : l’impact de l’aviation dépasse le seul CO2.',
    sources: [LIVRET],
    questions: [
      q('dj-aero-environnement-1', 'Selon le livret BIA, quelle part des émissions mondiales de CO2 l’aviation représente-t-elle ?', ['Environ 2,5 %', 'Environ 0,5 %', 'Environ 10 %', 'Environ 25 %'], 'Environ 2,5 % du CO2, et environ 4 % du réchauffement selon le livret.'),
      q('dj-aero-environnement-2', 'Pourquoi l’effet de l’aviation sur le climat dépasse-t-il celui de son seul CO2 ?', ['Les traînées de condensation et les oxydes d’azote en altitude', 'Le bruit des moteurs au décollage et à l’atterrissage', 'La couleur claire des fuselages, qui renvoie la chaleur', 'Le dégivrage des avions au sol en hiver'], 'Les émissions en altitude ont des effets supplémentaires sur le climat.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Histoire (8)
// ---------------------------------------------------------------------------
const HISTOIRE: DailyFact[] = [
  {
    id: 'dj-hist-revolution', theme: 'histoire', title: 'La Révolution française', asOf: V,
    points: [
      '5 mai 1789 : ouverture des états généraux à Versailles.',
      '14 juillet 1789 : prise de la Bastille. Le 14 juillet devient fête nationale en 1880.',
      '26 août 1789 : Déclaration des droits de l’homme et du citoyen.',
      '21 septembre 1792 : abolition de la monarchie ; la République est proclamée le lendemain.',
      'Louis XVI est exécuté le 21 janvier 1793.',
    ],
    retenir: '1789 : Bastille, puis Déclaration des droits de l’homme.',
    questions: [
      q('dj-hist-revolution-1', 'En quelle année la Déclaration des droits de l’homme et du citoyen est-elle adoptée ?', ['1789', '1792', '1804', '1848'], 'Le 26 août 1789.'),
      q('dj-hist-revolution-2', 'Que se passe-t-il le 14 juillet 1789 ?', ['La prise de la Bastille', 'L’exécution de Louis XVI', 'La proclamation de la République', 'Le sacre de Napoléon'], 'La prise de la Bastille, devenue fête nationale.'),
    ],
  },
  {
    id: 'dj-hist-napoleon', theme: 'histoire', title: 'Napoléon Bonaparte', asOf: V,
    points: [
      'Général de la Révolution, il prend le pouvoir par le coup d’État du 18 brumaire (novembre 1799).',
      '1804 : il est sacré empereur à Notre-Dame de Paris et promulgue le Code civil.',
      'Il crée aussi les lycées, la Banque de France et la Légion d’honneur.',
      '1815 : défaite de Waterloo, exil à Sainte-Hélène, où il meurt en 1821.',
    ],
    retenir: '1804 : sacre et Code civil ; 1815 : Waterloo.',
    questions: [
      q('dj-hist-napoleon-1', 'Quel texte Napoléon promulgue-t-il en 1804 ?', ['Le Code civil', 'La Déclaration des droits de l’homme', 'La Constitution de 1958', 'L’édit de Nantes'], 'Le Code civil, base du droit français.'),
      q('dj-hist-napoleon-2', 'Quelle bataille marque la défaite définitive de Napoléon en 1815 ?', ['Waterloo', 'Austerlitz', 'Iéna', 'Trafalgar'], 'Austerlitz (1805) et Iéna (1806) sont des victoires ; Trafalgar, une défaite navale de 1805.'),
    ],
  },
  {
    id: 'dj-hist-premiere-guerre', theme: 'histoire', title: 'La Première Guerre mondiale', asOf: V,
    points: [
      '28 juin 1914 : assassinat de l’archiduc François-Ferdinand à Sarajevo, élément déclencheur.',
      'Une guerre de tranchées, notamment à Verdun (1916) et sur la Somme (1916).',
      'Les États-Unis entrent en guerre en 1917.',
      '11 novembre 1918 : armistice, signé à Rethondes.',
      '1919 : le traité de Versailles fixe la paix avec l’Allemagne et crée la Société des Nations.',
    ],
    retenir: '1914-1918 ; armistice le 11 novembre 1918.',
    questions: [
      q('dj-hist-premiere-guerre-1', 'Quel événement déclenche la Première Guerre mondiale ?', ['L’assassinat de l’archiduc François-Ferdinand', 'L’invasion de la Pologne par l’Allemagne', 'La prise de la Bastille à Paris', 'Le naufrage du Titanic en 1912'], 'À Sarajevo, le 28 juin 1914. L’invasion de la Pologne déclenche la Seconde Guerre mondiale.'),
      q('dj-hist-premiere-guerre-2', 'Quel traité de 1919 règle la paix avec l’Allemagne ?', ['Le traité de Versailles', 'Le traité de Rome', 'Le traité de Maastricht', 'Le traité de Paris'], 'Le traité de Versailles, signé en 1919.'),
    ],
  },
  {
    id: 'dj-hist-seconde-guerre', theme: 'histoire', title: 'La Seconde Guerre mondiale', asOf: V,
    points: [
      '1er septembre 1939 : l’Allemagne envahit la Pologne ; la France et le Royaume-Uni lui déclarent la guerre.',
      '18 juin 1940 : appel du général de Gaulle depuis Londres.',
      '6 juin 1944 : débarquement allié en Normandie. Paris est libérée le 25 août 1944.',
      '8 mai 1945 : capitulation de l’Allemagne en Europe.',
      'Août 1945 : bombes atomiques sur Hiroshima et Nagasaki ; le Japon capitule le 2 septembre.',
    ],
    retenir: '1939-1945 ; 18 juin 1940, 6 juin 1944, 8 mai 1945.',
    questions: [
      q('dj-hist-seconde-guerre-1', 'Que commémore-t-on le 8 mai ?', ['La capitulation de l’Allemagne en 1945', 'Le débarquement allié en Normandie', 'L’appel du général de Gaulle en 1940', 'L’armistice de 1918'], 'Le 8 mai 1945 marque la fin de la guerre en Europe.'),
      q('dj-hist-seconde-guerre-2', 'D’où le général de Gaulle lance-t-il son appel du 18 juin 1940 ?', ['De Londres', 'D’Alger', 'De Paris', 'De Washington'], 'Depuis les studios de la BBC à Londres.'),
    ],
  },
  {
    id: 'dj-hist-ve-republique', theme: 'histoire', title: 'La Ve République', asOf: V,
    points: [
      'La Constitution de la Ve République est adoptée par référendum en septembre 1958 et promulguée le 4 octobre 1958.',
      'Elle renforce le pouvoir du président. Charles de Gaulle en est le premier président (1959-1969).',
      '1962 : le président est désormais élu au suffrage universel direct.',
      '2000 : le mandat présidentiel passe de 7 à 5 ans (quinquennat).',
      'Le Parlement compte deux chambres : l’Assemblée nationale et le Sénat.',
    ],
    retenir: 'Constitution de 1958 ; élection directe du président depuis 1962.',
    questions: [
      q('dj-hist-ve-republique-1', 'Depuis quelle année le président de la République est-il élu au suffrage universel direct ?', ['1962', '1958', '1946', '1981'], 'Une réforme adoptée par référendum en 1962.'),
      q('dj-hist-ve-republique-2', 'Quelle est la durée du mandat présidentiel depuis la réforme de 2000 ?', ['5 ans', '7 ans', '4 ans', '6 ans'], 'Le quinquennat a remplacé le septennat.'),
    ],
  },
  {
    id: 'dj-hist-construction-europeenne', theme: 'histoire', title: 'La construction européenne', asOf: V,
    points: [
      '1951 : la CECA (charbon et acier) réunit six pays : France, RFA, Italie, Belgique, Pays-Bas, Luxembourg.',
      '1957 : traité de Rome, création de la Communauté économique européenne.',
      '1992 : traité de Maastricht, naissance de l’Union européenne.',
      '2002 : les pièces et billets en euros entrent en circulation dans douze pays.',
      'Robert Schuman et Jean Monnet sont considérés comme des « pères de l’Europe ».',
    ],
    retenir: 'CECA 1951, Rome 1957, Maastricht 1992, euro en poche en 2002.',
    questions: [
      q('dj-hist-construction-europeenne-1', 'Quel traité donne naissance à l’Union européenne en 1992 ?', ['Le traité de Maastricht', 'Le traité de Rome', 'Le traité de Lisbonne', 'Le traité de Versailles'], 'Maastricht, 1992. Rome (1957) crée la CEE ; Lisbonne date de 2007.'),
      q('dj-hist-construction-europeenne-2', 'Combien de pays fondent la CECA en 1951 ?', ['Six', 'Douze', 'Quatre', 'Neuf'], 'France, RFA, Italie, Belgique, Pays-Bas et Luxembourg.'),
    ],
  },
  {
    id: 'dj-hist-guerre-froide', theme: 'histoire', title: 'La guerre froide', asOf: V,
    points: [
      'Après 1945, deux blocs s’opposent : les États-Unis et leurs alliés, l’URSS et les siens. Sans guerre directe entre eux.',
      '1961 : construction du mur de Berlin.',
      '1962 : crise des missiles de Cuba, le moment le plus proche d’une guerre nucléaire.',
      '9 novembre 1989 : chute du mur de Berlin. L’Allemagne est réunifiée en 1990.',
      'Décembre 1991 : dissolution de l’URSS.',
    ],
    retenir: 'Mur de Berlin : construit en 1961, tombé en 1989.',
    questions: [
      q('dj-hist-guerre-froide-1', 'En quelle année le mur de Berlin tombe-t-il ?', ['1989', '1961', '1991', '1975'], 'Le 9 novembre 1989. Il avait été construit en 1961.'),
      q('dj-hist-guerre-froide-2', 'Quelle crise de 1962 fait craindre une guerre nucléaire ?', ['La crise des missiles de Cuba', 'Le blocus de Berlin-Ouest', 'La guerre de Corée', 'La crise du canal de Suez'], 'L’URSS installe des missiles à Cuba ; ils sont retirés après négociation.'),
    ],
  },
  {
    id: 'dj-hist-renaissance', theme: 'histoire', title: 'La Renaissance et les grandes découvertes', asOf: V,
    points: [
      'Vers 1450 : Gutenberg met au point l’imprimerie à caractères mobiles, à Mayence.',
      '1492 : Christophe Colomb atteint l’Amérique en cherchant une route vers l’Asie.',
      '1498 : Vasco de Gama atteint l’Inde par le cap de Bonne-Espérance.',
      '1519-1522 : l’expédition de Magellan, achevée par Elcano, réalise le premier tour du monde.',
      'Léonard de Vinci (1452-1519) incarne l’esprit de la Renaissance.',
    ],
    retenir: 'Imprimerie vers 1450, Amérique 1492, tour du monde 1522.',
    questions: [
      q('dj-hist-renaissance-1', 'Qui met au point l’imprimerie à caractères mobiles en Europe ?', ['Gutenberg', 'Léonard de Vinci', 'Galilée', 'Érasme'], 'Vers 1450, à Mayence.'),
      q('dj-hist-renaissance-2', 'Quelle expédition réalise le premier tour du monde ?', ['Celle de Magellan, achevée par Elcano', 'Celle de Christophe Colomb en 1492', 'Celle de Vasco de Gama vers l’Inde', 'Celle de Jacques Cartier'], 'Partie en 1519, revenue en 1522. Magellan meurt en route.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Géopolitique (7)
// ---------------------------------------------------------------------------
const GEOPOLITIQUE: DailyFact[] = [
  {
    id: 'dj-geo-onu', theme: 'geopolitique', title: 'L’Organisation des Nations unies', asOf: V, volatile: true,
    points: [
      'Créée en 1945 par la Charte de San Francisco, pour succéder à la Société des Nations.',
      'Siège à New York. Elle compte 193 États membres.',
      'Le Conseil de sécurité compte 15 membres, dont 5 permanents disposant d’un droit de veto : États-Unis, Russie, Chine, France, Royaume-Uni.',
      'L’Assemblée générale réunit tous les membres, avec une voix chacun.',
      'La Cour internationale de justice siège à La Haye.',
    ],
    retenir: '193 membres ; 5 membres permanents avec veto, dont la France.',
    sources: [
      { title: 'ONU, présentation de l’Assemblée générale', url: 'https://www.un.org/fr?page=22' },
      { title: 'Cour internationale de justice, États membres de l’ONU', url: 'https://www.icj-cij.org/fr/etats-admis-a-ester' },
    ],
    questions: [
      q('dj-geo-onu-1', 'Combien de membres permanents le Conseil de sécurité de l’ONU compte-t-il ?', ['Cinq', 'Quinze', 'Sept', 'Dix'], 'Cinq permanents, sur quinze membres au total.'),
      q('dj-geo-onu-2', 'Combien d’États sont membres de l’ONU ?', ['193', '151', '207', '177'], '193 États membres.', true),
    ],
  },
  {
    id: 'dj-geo-ue', theme: 'geopolitique', title: 'L’Union européenne aujourd’hui', asOf: V, volatile: true,
    points: [
      '27 États membres depuis la sortie du Royaume-Uni, le 31 janvier 2020.',
      'La zone euro compte 21 pays depuis l’entrée de la Bulgarie, le 1er janvier 2026.',
      'La Commission européenne siège à Bruxelles ; le Parlement européen à Strasbourg ; la Banque centrale européenne à Francfort.',
      'Les députés européens sont élus au suffrage universel direct tous les cinq ans.',
    ],
    retenir: '27 pays dans l’UE, 21 dans la zone euro (Bulgarie, 2026).',
    sources: [
      { title: 'Banque de France, la Bulgarie rejoint la zone euro (janvier 2026)', url: 'https://www.banque-france.fr/fr/actualites/la-bulgarie-rejoint-la-zone-euro' },
      { title: 'BCE, communiqué du 1er janvier 2026', url: 'https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr260101~c830245e42.fr.html' },
    ],
    questions: [
      q('dj-geo-ue-1', 'Quel pays est devenu le 21e membre de la zone euro, le 1er janvier 2026 ?', ['La Bulgarie', 'La Croatie', 'La Roumanie', 'La Pologne'], 'La Croatie l’avait précédée en 2023.', true),
      q('dj-geo-ue-2', 'Où siège la Banque centrale européenne ?', ['À Francfort', 'À Bruxelles', 'À Strasbourg', 'À Luxembourg'], 'Francfort-sur-le-Main, en Allemagne.'),
    ],
  },
  {
    id: 'dj-geo-otan', theme: 'geopolitique', title: 'L’OTAN', asOf: V, volatile: true,
    points: [
      'Alliance militaire née du traité de l’Atlantique Nord, signé à Washington le 4 avril 1949.',
      'Article 5 : une attaque contre un membre est considérée comme une attaque contre tous.',
      '32 membres depuis l’entrée de la Finlande (2023) et de la Suède (2024).',
      'Siège à Bruxelles. Secrétaire général : Mark Rutte, ancien Premier ministre néerlandais, depuis octobre 2024.',
    ],
    retenir: '1949, article 5, 32 membres.',
    sources: [
      { title: 'OTAN, rapport annuel du secrétaire général 2025', url: 'https://nato.int/fr/about-us/official-texts-and-resources/secretary-generals-annual-report/secretary-generals-annual-report-2025' },
      { title: 'CNN, NATO Fast Facts', url: 'https://kvia.com/news/us-world/cnn-world/2025/05/02/nato-fast-facts-2/' },
    ],
    questions: [
      q('dj-geo-otan-1', 'Que prévoit l’article 5 du traité de l’Atlantique Nord ?', ['Une attaque contre un membre est une attaque contre tous', 'Chaque membre consacre 2 % de son PIB à la défense', 'Les membres partagent une monnaie commune', 'Un membre peut quitter l’alliance sans préavis'], 'C’est le principe de défense collective.'),
      q('dj-geo-otan-2', 'Quels sont les deux derniers pays entrés dans l’OTAN ?', ['La Finlande et la Suède', 'L’Ukraine et la Géorgie', 'La Suisse et l’Autriche', 'La Pologne et la Hongrie'], 'La Finlande en 2023, la Suède en 2024.', true),
    ],
  },
  {
    id: 'dj-geo-g7-g20', theme: 'geopolitique', title: 'G7 et G20', asOf: V,
    points: [
      'G7 : États-Unis, Canada, Japon, Allemagne, France, Italie, Royaume-Uni. L’Union européenne participe aux réunions.',
      'La Russie a fait partie du G8 jusqu’en 2014.',
      'G20 : créé en 1999, il réunit 19 pays, l’Union européenne et, depuis 2023, l’Union africaine.',
      'Le G20 représente l’essentiel du PIB mondial et environ les deux tiers de la population mondiale.',
    ],
    retenir: 'G7 : sept grandes économies ; G20 : élargi aux pays émergents.',
    questions: [
      q('dj-geo-g7-g20-1', 'Lequel de ces pays fait partie du G7 ?', ['Le Canada', 'La Chine', 'L’Inde', 'Le Brésil'], 'Chine, Inde et Brésil sont membres du G20, pas du G7.'),
      q('dj-geo-g7-g20-2', 'Quelle organisation régionale a rejoint le G20 en 2023 ?', ['L’Union africaine', 'L’ASEAN', 'La Ligue arabe', 'L’Union eurasiatique'], 'L’Union africaine, comme l’UE avant elle.'),
    ],
  },
  {
    id: 'dj-geo-bretton-woods', theme: 'geopolitique', title: 'FMI, Banque mondiale, OMC', asOf: V,
    points: [
      '1944 : les accords de Bretton Woods (États-Unis) créent le Fonds monétaire international (FMI) et la Banque mondiale.',
      'Le FMI veille à la stabilité financière et prête aux États en difficulté.',
      'La Banque mondiale finance le développement.',
      'L’Organisation mondiale du commerce (OMC), créée en 1995, fixe les règles du commerce international. Siège à Genève.',
    ],
    retenir: 'Bretton Woods 1944 : FMI et Banque mondiale ; OMC en 1995.',
    questions: [
      q('dj-geo-bretton-woods-1', 'Quelles institutions sont créées par les accords de Bretton Woods en 1944 ?', ['Le FMI et la Banque mondiale', 'L’ONU et l’OTAN', 'L’OMC et l’OCDE', 'La BCE et la monnaie euro'], 'Le FMI et la Banque mondiale.'),
      q('dj-geo-bretton-woods-2', 'Quelle organisation fixe les règles du commerce international ?', ['L’OMC', 'Le FMI', 'L’OMS', 'L’UNESCO'], 'L’Organisation mondiale du commerce, créée en 1995.'),
    ],
  },
  {
    id: 'dj-geo-detroits', theme: 'geopolitique', title: 'Les détroits et canaux stratégiques', asOf: V,
    points: [
      'Une grande partie du commerce maritime mondial passe par quelques passages étroits.',
      'Détroit d’Ormuz : entre l’Iran et la péninsule Arabique, passage du pétrole du golfe Persique.',
      'Détroit de Malacca : entre la Malaisie et l’Indonésie, route principale entre l’océan Indien et le Pacifique.',
      'Canal de Suez (ouvert en 1869) : relie la Méditerranée à la mer Rouge, par l’Égypte. Canal de Panama (1914) : relie l’Atlantique et le Pacifique.',
      'Bab-el-Mandeb : entre le Yémen et Djibouti, entrée sud de la mer Rouge.',
    ],
    retenir: 'Ormuz, Malacca, Suez, Panama, Bab-el-Mandeb : les verrous du commerce mondial.',
    questions: [
      q('dj-geo-detroits-1', 'Quelles mers le canal de Suez relie-t-il ?', ['La Méditerranée et la mer Rouge', 'L’Atlantique et le Pacifique', 'La mer Noire et la Méditerranée', 'La mer du Nord et la Baltique'], 'Le canal de Suez traverse l’Égypte depuis 1869.'),
      q('dj-geo-detroits-2', 'Entre quels pays se trouve le détroit d’Ormuz ?', ['L’Iran et la péninsule Arabique', 'La Malaisie et l’Indonésie', 'Le Yémen et Djibouti', 'L’Espagne et le Maroc, à Gibraltar'], 'Il ferme le golfe Persique. Le détroit de Gibraltar sépare l’Espagne et le Maroc.'),
    ],
  },
  {
    id: 'dj-geo-zee-france', theme: 'geopolitique', title: 'La France, puissance maritime', asOf: V,
    points: [
      'La zone économique exclusive (ZEE) s’étend jusqu’à 200 milles marins des côtes. L’État y contrôle les ressources.',
      'Grâce à ses outre-mer, la France possède le deuxième espace maritime mondial, derrière les États-Unis : environ 10 à 11 millions de km² selon le mode de calcul.',
      'Environ 97 % de cet espace se trouve en outre-mer ; la Polynésie française en représente à elle seule près de la moitié.',
      'La France est présente dans trois océans : Atlantique, Indien, Pacifique.',
    ],
    retenir: 'Deuxième espace maritime mondial, à 97 % en outre-mer.',
    sources: [
      { title: 'Vie publique, la France maritime (mai 2025)', url: 'https://www.vie-publique.fr/lettre_essentiel/17' },
      { title: 'Vie publique, stratégie maritime et outre-mer', url: 'https://www.vie-publique.fr/eclairage/286043-strategie-maritime-de-la-france-quelle-place-pour-les-outre-mer' },
    ],
    questions: [
      q('dj-geo-zee-france-1', 'Quel rang la France occupe-t-elle pour la superficie de son espace maritime ?', ['Deuxième, derrière les États-Unis', 'Premier', 'Cinquième, derrière l’Australie', 'Dixième'], 'Deuxième, grâce à ses outre-mer.'),
      q('dj-geo-zee-france-2', 'Jusqu’à quelle distance des côtes une zone économique exclusive s’étend-elle ?', ['200 milles marins', '12 milles marins', '50 milles marins', '500 milles marins'], 'Les 12 milles marins correspondent à la mer territoriale.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Sciences (7)
// ---------------------------------------------------------------------------
const SCIENCES: DailyFact[] = [
  {
    id: 'dj-sci-systeme-solaire', theme: 'sciences', title: 'Le système solaire', asOf: V,
    points: [
      'Huit planètes, depuis le Soleil : Mercure, Vénus, la Terre, Mars, Jupiter, Saturne, Uranus, Neptune.',
      'Les quatre premières sont rocheuses ; les quatre suivantes sont des planètes géantes.',
      'Jupiter est la plus grosse. Vénus est la plus chaude, à cause de son effet de serre.',
      'En 2006, l’Union astronomique internationale reclasse Pluton parmi les planètes naines.',
      'La lumière du Soleil met environ 8 minutes pour atteindre la Terre.',
    ],
    retenir: 'Huit planètes ; Pluton est une planète naine depuis 2006.',
    questions: [
      q('dj-sci-systeme-solaire-1', 'Quelle est la plus grosse planète du système solaire ?', ['Jupiter', 'Saturne', 'Neptune', 'La Terre'], 'Jupiter, une géante gazeuse.'),
      q('dj-sci-systeme-solaire-2', 'Combien de temps la lumière du Soleil met-elle pour atteindre la Terre ?', ['Environ 8 minutes', 'Environ 8 secondes', 'Environ 1 heure', 'Environ 1 jour'], 'Environ 150 millions de km parcourus à 300 000 km/s.'),
    ],
  },
  {
    id: 'dj-sci-mendeleiev', theme: 'sciences', title: 'Le tableau périodique', asOf: V,
    points: [
      'En 1869, le chimiste russe Dmitri Mendeleïev classe les éléments par masse et par propriétés.',
      'Il laisse des cases vides pour des éléments encore inconnus, et prédit leurs propriétés.',
      'Le tableau compte aujourd’hui 118 éléments.',
      'L’hydrogène, numéro 1, est l’élément le plus abondant de l’univers.',
      'Un atome est formé d’un noyau (protons et neutrons) entouré d’électrons.',
    ],
    retenir: 'Mendeleïev, 1869 ; 118 éléments aujourd’hui.',
    questions: [
      q('dj-sci-mendeleiev-1', 'Qui a établi le tableau périodique des éléments ?', ['Dmitri Mendeleïev', 'Marie Curie', 'Antoine Lavoisier', 'Niels Bohr'], 'En 1869.'),
      q('dj-sci-mendeleiev-2', 'Quel est l’élément le plus abondant de l’univers ?', ['L’hydrogène', 'L’oxygène', 'Le carbone', 'Le fer'], 'L’hydrogène, élément numéro 1.'),
    ],
  },
  {
    id: 'dj-sci-adn', theme: 'sciences', title: 'L’ADN', asOf: V,
    points: [
      'L’ADN porte l’information génétique de presque tous les êtres vivants.',
      '1953 : James Watson et Francis Crick décrivent sa structure en double hélice.',
      'Leurs travaux s’appuient sur les clichés de diffraction de Rosalind Franklin.',
      'L’ADN utilise quatre bases : adénine, thymine, guanine, cytosine (A, T, G, C).',
      '2003 : fin du séquençage du génome humain.',
    ],
    retenir: 'Double hélice, 1953, quatre bases A, T, G, C.',
    questions: [
      q('dj-sci-adn-1', 'Quelle forme a la molécule d’ADN ?', ['Une double hélice', 'Une sphère', 'Une chaîne simple et droite', 'Un anneau'], 'Décrite en 1953.'),
      q('dj-sci-adn-2', 'Quelle chercheuse a fourni les images décisives de la structure de l’ADN ?', ['Rosalind Franklin', 'Marie Curie', 'Ada Lovelace', 'Barbara McClintock'], 'Ses clichés de diffraction aux rayons X.'),
    ],
  },
  {
    id: 'dj-sci-newton-einstein', theme: 'sciences', title: 'De Newton à Einstein', asOf: V,
    points: [
      '1687 : Isaac Newton publie les Principia ; il y énonce la loi de la gravitation universelle.',
      'La même force fait tomber une pomme et maintient la Lune en orbite.',
      '1905 : Albert Einstein publie la relativité restreinte ; elle conduit à la formule E = mc².',
      '1915 : relativité générale ; la gravitation y devient une courbure de l’espace-temps.',
      'La vitesse de la lumière dans le vide, environ 300 000 km/s, est une limite infranchissable.',
    ],
    retenir: 'Newton : la gravitation ; Einstein : E = mc² et l’espace-temps.',
    questions: [
      q('dj-sci-newton-einstein-1', 'Que signifie la lettre c dans E = mc² ?', ['La vitesse de la lumière', 'La charge électrique', 'La chaleur', 'La constante de gravitation'], 'c est la vitesse de la lumière dans le vide.'),
      q('dj-sci-newton-einstein-2', 'Quelle loi Newton énonce-t-il dans les Principia ?', ['La gravitation universelle', 'La relativité générale', 'La conservation de l’énergie', 'L’évolution des espèces'], 'En 1687.'),
    ],
  },
  {
    id: 'dj-sci-climat', theme: 'sciences', title: 'L’effet de serre et le climat', asOf: V,
    points: [
      'L’effet de serre est naturel : sans lui, la Terre serait à environ −18 °C en moyenne au lieu de 15 °C.',
      'Les activités humaines l’accentuent, surtout par le CO2 des énergies fossiles et le méthane.',
      'Le GIEC, créé en 1988, fait la synthèse des connaissances scientifiques sur le climat.',
      '2015 : l’accord de Paris vise à contenir le réchauffement bien en dessous de 2 °C, en poursuivant l’effort pour 1,5 °C.',
    ],
    retenir: 'Effet de serre naturel, renforcé par l’homme ; accord de Paris, 2015.',
    questions: [
      q('dj-sci-climat-1', 'Quel organisme fait la synthèse des connaissances scientifiques sur le climat ?', ['Le GIEC', 'L’OMS', 'L’OACI', 'L’UNESCO'], 'Groupe d’experts intergouvernemental sur l’évolution du climat, créé en 1988.'),
      q('dj-sci-climat-2', 'Quel objectif l’accord de Paris de 2015 fixe-t-il ?', ['Contenir le réchauffement bien en dessous de 2 °C', 'Arrêter toute émission de CO2 dès 2020', 'Interdire l’aviation commerciale en 2030', 'Refroidir la planète de 1 °C d’ici 2050'], 'En poursuivant l’effort pour limiter à 1,5 °C.'),
    ],
  },
  {
    id: 'dj-sci-pasteur', theme: 'sciences', title: 'Microbes, vaccins, antibiotiques', asOf: V,
    points: [
      'Louis Pasteur montre que les microbes causent fermentations et maladies ; il invente la pasteurisation.',
      '1885 : il soigne un enfant mordu par un chien enragé avec son vaccin contre la rage.',
      'Le premier vaccin, contre la variole, est dû à Edward Jenner, en 1796.',
      '1928 : Alexander Fleming découvre la pénicilline, premier antibiotique.',
      'Les antibiotiques agissent contre les bactéries, pas contre les virus.',
    ],
    retenir: 'Pasteur : rage, 1885 ; Fleming : pénicilline, 1928.',
    questions: [
      q('dj-sci-pasteur-1', 'Qui découvre la pénicilline en 1928 ?', ['Alexander Fleming', 'Louis Pasteur', 'Robert Koch', 'Edward Jenner, en Angleterre'], 'Le premier antibiotique.'),
      q('dj-sci-pasteur-2', 'Contre quoi les antibiotiques agissent-ils ?', ['Les bactéries', 'Les virus', 'Les allergies', 'Toutes les maladies'], 'Ils sont inefficaces contre les virus.'),
    ],
  },
  {
    id: 'dj-sci-son-lumiere', theme: 'sciences', title: 'La vitesse du son et de la lumière', asOf: V,
    points: [
      'Le son a besoin d’un milieu pour se propager : il ne traverse pas le vide.',
      'Dans l’air à 15 °C, il va à environ 340 m/s, soit environ 1 225 km/h. Sa vitesse diminue quand la température baisse.',
      'Le nombre de Mach compare la vitesse d’un avion à celle du son : Mach 1 = vitesse du son.',
      'La lumière va environ un million de fois plus vite : on voit l’éclair avant d’entendre le tonnerre.',
      'Compter les secondes entre l’éclair et le tonnerre et diviser par 3 donne la distance de l’orage en km.',
    ],
    retenir: 'Son : environ 340 m/s ; Mach 1 = vitesse du son.',
    questions: [
      q('dj-sci-son-lumiere-1', 'Quelle est la vitesse du son dans l’air à 15 °C ?', ['Environ 340 m/s', 'Environ 34 m/s', 'Environ 3 400 m/s', 'Environ 300 000 km/s'], '300 000 km/s est la vitesse de la lumière.'),
      q('dj-sci-son-lumiere-2', 'On compte 9 secondes entre l’éclair et le tonnerre. À quelle distance est l’orage ?', ['Environ 3 km', 'Environ 9 km', 'Environ 1 km', 'Environ 30 km'], 'Le son parcourt environ 1 km en 3 secondes.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Arts et littérature (7)
// ---------------------------------------------------------------------------
const ARTS: DailyFact[] = [
  {
    id: 'dj-arts-hugo', theme: 'arts', title: 'Victor Hugo', asOf: V,
    points: [
      'Écrivain du XIXe siècle (1802-1885), chef de file du romantisme.',
      'Romans : Notre-Dame de Paris (1831), Les Misérables (1862).',
      'Opposé au Second Empire de Napoléon III, il vit en exil, notamment à Guernesey, de 1851 à 1870.',
      'Il combat la peine de mort et la misère.',
      'À sa mort en 1885, il reçoit des funérailles nationales et entre au Panthéon.',
    ],
    retenir: 'Les Misérables, Notre-Dame de Paris, l’exil à Guernesey.',
    questions: [
      q('dj-arts-hugo-1', 'Quel roman Victor Hugo publie-t-il en 1862 ?', ['Les Misérables', 'Germinal', 'Madame Bovary', 'Le Rouge et le Noir'], 'Germinal est de Zola, Madame Bovary de Flaubert, Le Rouge et le Noir de Stendhal.'),
      q('dj-arts-hugo-2', 'Sur quelle île Victor Hugo a-t-il vécu une grande partie de son exil ?', ['Guernesey', 'La Corse', 'Sainte-Hélène', 'La Réunion'], 'De 1855 à 1870. Sainte-Hélène est l’île d’exil de Napoléon Ier.'),
    ],
  },
  {
    id: 'dj-arts-impressionnisme', theme: 'arts', title: 'L’impressionnisme', asOf: V,
    points: [
      'Mouvement de peinture né en France dans les années 1870.',
      'Le nom vient d’un tableau de Claude Monet, « Impression, soleil levant » (1872), moqué par un critique.',
      'Première exposition du groupe en 1874.',
      'Peintres : Monet, Renoir, Degas, Pissarro, Sisley, Berthe Morisot.',
      'Ils peignent en plein air, la lumière et ses variations, avec des touches visibles.',
    ],
    retenir: 'Monet, « Impression, soleil levant », la lumière en plein air.',
    questions: [
      q('dj-arts-impressionnisme-1', 'Quel tableau donne son nom à l’impressionnisme ?', ['« Impression, soleil levant » de Monet', '« La Joconde » de Léonard de Vinci', '« Guernica » de Picasso', '« La Liberté guidant le peuple » de Delacroix'], 'Peint par Claude Monet en 1872.'),
      q('dj-arts-impressionnisme-2', 'Lequel de ces peintres est impressionniste ?', ['Auguste Renoir', 'Pablo Picasso', 'Salvador Dalí', 'Eugène Delacroix'], 'Picasso est cubiste, Dalí surréaliste, Delacroix romantique.'),
    ],
  },
  {
    id: 'dj-arts-moliere', theme: 'arts', title: 'Molière et le théâtre classique', asOf: V,
    points: [
      'Molière (1622-1673), de son vrai nom Jean-Baptiste Poquelin, est le grand auteur de comédies du XVIIe siècle.',
      'Pièces : Le Tartuffe, Dom Juan, Le Misanthrope, L’Avare, Le Malade imaginaire.',
      'Il meurt peu après une représentation du Malade imaginaire, en 1673.',
      'La Comédie-Française, fondée en 1680, est surnommée « la maison de Molière ».',
      'Le français est parfois appelé « la langue de Molière ».',
    ],
    retenir: 'Molière : comédie, XVIIe siècle, la « maison de Molière ».',
    questions: [
      q('dj-arts-moliere-1', 'Quel était le vrai nom de Molière ?', ['Jean-Baptiste Poquelin', 'François-Marie Arouet', 'Henri Beyle', 'Pierre Corneille'], 'François-Marie Arouet est Voltaire ; Henri Beyle, Stendhal.'),
      q('dj-arts-moliere-2', 'Quelle pièce est de Molière ?', ['L’Avare', 'Le Cid', 'Phèdre', 'Cyrano de Bergerac'], 'Le Cid est de Corneille, Phèdre de Racine, Cyrano d’Edmond Rostand.'),
    ],
  },
  {
    id: 'dj-arts-saint-exupery', theme: 'arts', title: 'Saint-Exupéry, l’écrivain aviateur', asOf: V,
    points: [
      'Antoine de Saint-Exupéry (1900-1944) est pilote de l’Aéropostale puis écrivain.',
      'Vol de nuit (1931) raconte les débuts du courrier aérien de nuit en Amérique du Sud.',
      'Terre des hommes (1939) évoque notamment son ami Henri Guillaumet.',
      'Le Petit Prince (1943), écrit à New York, est l’un des livres les plus traduits au monde.',
      'Il disparaît en mission de reconnaissance le 31 juillet 1944, en Méditerranée.',
    ],
    retenir: 'Vol de nuit, Terre des hommes, Le Petit Prince.',
    sources: [LIVRET],
    questions: [
      q('dj-arts-saint-exupery-1', 'Quel livre de Saint-Exupéry raconte le courrier aérien de nuit ?', ['Vol de nuit', 'Le Petit Prince', 'Terre des hommes', 'Courrier sud'], 'Vol de nuit, prix Femina 1931.'),
      q('dj-arts-saint-exupery-2', 'En quelle année paraît Le Petit Prince ?', ['1943', '1931', '1950', '1919'], 'En 1943, à New York.'),
    ],
  },
  {
    id: 'dj-arts-louvre', theme: 'arts', title: 'Le Louvre', asOf: V,
    points: [
      'Ancien palais des rois de France, devenu musée en 1793, pendant la Révolution.',
      'Il abrite La Joconde de Léonard de Vinci, la Vénus de Milo et la Victoire de Samothrace.',
      'La pyramide de verre de l’architecte Ieoh Ming Pei est inaugurée en 1989.',
      'C’est le musée le plus visité au monde.',
    ],
    retenir: 'Musée depuis 1793 ; La Joconde ; pyramide de Pei, 1989.',
    questions: [
      q('dj-arts-louvre-1', 'Qui a peint La Joconde ?', ['Léonard de Vinci', 'Michel-Ange', 'Raphaël', 'Sandro Botticelli'], 'Au début du XVIe siècle.'),
      q('dj-arts-louvre-2', 'Qui a conçu la pyramide du Louvre ?', ['Ieoh Ming Pei', 'Gustave Eiffel', 'Le Corbusier', 'Jean Nouvel'], 'Inaugurée en 1989.'),
    ],
  },
  {
    id: 'dj-arts-musique', theme: 'arts', title: 'Les grands compositeurs', asOf: V,
    points: [
      'Baroque (XVIIe-XVIIIe siècles) : Bach, Vivaldi (Les Quatre Saisons), Lully à la cour de Louis XIV.',
      'Classique : Mozart (1756-1791), compositeur précoce et prolifique.',
      'Beethoven (1770-1827) compose sa Neuvième Symphonie alors qu’il est presque sourd.',
      'Son « Ode à la joie » est l’hymne de l’Union européenne.',
      'Romantisme : Chopin, Liszt, Berlioz ; impressionnisme musical : Debussy, Ravel (Boléro).',
    ],
    retenir: 'Vivaldi baroque, Mozart classique, Beethoven et l’hymne européen.',
    questions: [
      q('dj-arts-musique-1', 'De quelle œuvre vient l’hymne de l’Union européenne ?', ['La Neuvième Symphonie de Beethoven', 'Les Quatre Saisons de Vivaldi', 'Le Boléro de Ravel', 'La Flûte enchantée de Mozart, en 1791'], 'L’« Ode à la joie », dernier mouvement de la Neuvième.'),
      q('dj-arts-musique-2', 'Qui a composé Les Quatre Saisons ?', ['Antonio Vivaldi', 'Jean-Sébastien Bach', 'Wolfgang Amadeus Mozart', 'Frédéric Chopin'], 'Vivaldi, compositeur baroque vénitien.'),
    ],
  },
  {
    id: 'dj-arts-cinema', theme: 'arts', title: 'La naissance du cinéma', asOf: V,
    points: [
      '28 décembre 1895 : première projection payante du cinématographe des frères Lumière, à Paris.',
      'Georges Méliès invente les premiers effets spéciaux ; Le Voyage dans la Lune date de 1902.',
      '1927 : premier long métrage parlant, Le Chanteur de jazz.',
      'Le Festival de Cannes se tient pour la première fois en 1946. Sa récompense suprême : la Palme d’or.',
    ],
    retenir: 'Frères Lumière, 1895 ; Méliès ; Cannes et sa Palme d’or.',
    questions: [
      q('dj-arts-cinema-1', 'Qui organise la première projection publique payante de cinéma en 1895 ?', ['Les frères Lumière', 'Georges Méliès', 'Thomas Edison', 'Les frères Pathé'], 'Le 28 décembre 1895, à Paris.'),
      q('dj-arts-cinema-2', 'Quelle est la récompense suprême du Festival de Cannes ?', ['La Palme d’or', 'L’Ours d’or', 'Le Lion d’or', 'L’Oscar'], 'L’Ours d’or est remis à Berlin, le Lion d’or à Venise.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Religions et philosophie (7)
// ---------------------------------------------------------------------------
const RELIGIONS: DailyFact[] = [
  {
    id: 'dj-rel-monotheismes', theme: 'religions', title: 'Les trois monothéismes', asOf: V,
    points: [
      'Judaïsme, christianisme et islam croient en un dieu unique et se rattachent à la figure d’Abraham.',
      'Judaïsme : la Torah ; lieu de culte, la synagogue ; jour de repos, le shabbat (samedi).',
      'Christianisme : la Bible, avec l’Ancien et le Nouveau Testament ; Jésus est considéré comme le fils de Dieu.',
      'Islam : le Coran, révélé au prophète Mahomet ; lieu de culte, la mosquée ; La Mecque est sa ville sainte.',
      'Jérusalem est une ville sainte pour les trois religions.',
    ],
    retenir: 'Torah, Bible, Coran ; Jérusalem sainte pour les trois.',
    questions: [
      q('dj-rel-monotheismes-1', 'Quel est le livre saint de l’islam ?', ['Le Coran', 'La Torah', 'Les Védas', 'Le Talmud'], 'Le Coran.'),
      q('dj-rel-monotheismes-2', 'Quelle ville est sainte pour le judaïsme, le christianisme et l’islam ?', ['Jérusalem', 'Rome', 'La Mecque', 'Bénarès'], 'Rome est le siège de l’Église catholique, La Mecque la ville sainte de l’islam.'),
    ],
  },
  {
    id: 'dj-rel-bouddhisme', theme: 'religions', title: 'Le bouddhisme', asOf: V,
    points: [
      'Fondé en Inde vers le Ve siècle av. J.-C. par Siddhartha Gautama, appelé le Bouddha, « l’Éveillé ».',
      'Quatre nobles vérités : la souffrance existe, elle a une cause, le désir, elle peut cesser, et un chemin y mène.',
      'Le but est le nirvana : la libération du cycle des renaissances.',
      'Il n’y a pas de dieu créateur au centre de la doctrine.',
      'Très présent en Asie de l’Est et du Sud-Est ; le dalaï-lama est le chef spirituel du bouddhisme tibétain.',
    ],
    retenir: 'Le Bouddha, les quatre nobles vérités, le nirvana.',
    questions: [
      q('dj-rel-bouddhisme-1', 'Dans quel pays le bouddhisme est-il né ?', ['En Inde', 'En Chine', 'Au Japon', 'Au Tibet'], 'Siddhartha Gautama est né au nord de l’Inde actuelle, près du Népal.'),
      q('dj-rel-bouddhisme-2', 'Comment s’appelle la libération ultime recherchée dans le bouddhisme ?', ['Le nirvana', 'Le karma', 'Le yoga', 'Le mantra'], 'Le karma est la loi des actes et de leurs conséquences.'),
    ],
  },
  {
    id: 'dj-rel-hindouisme', theme: 'religions', title: 'L’hindouisme', asOf: V,
    points: [
      'Religion majoritaire en Inde, l’une des plus anciennes du monde, sans fondateur unique.',
      'Textes sacrés : les Védas.',
      'Notions clés : le karma (les actes ont des conséquences) et le cycle des renaissances (samsara).',
      'Trois grandes divinités : Brahma, Vishnou et Shiva.',
      'Le Gange est un fleuve sacré ; Bénarès (Varanasi) est l’une des villes saintes.',
    ],
    retenir: 'Védas, karma, renaissances ; le Gange sacré.',
    questions: [
      q('dj-rel-hindouisme-1', 'Quel fleuve est sacré dans l’hindouisme ?', ['Le Gange', 'L’Indus', 'Le Mékong', 'Le Nil'], 'Le Gange.'),
      q('dj-rel-hindouisme-2', 'Comment s’appellent les plus anciens textes sacrés de l’hindouisme ?', ['Les Védas', 'Les Évangiles', 'Les sourates', 'Les sutras de Bouddha'], 'Les Védas.'),
    ],
  },
  {
    id: 'dj-rel-laicite', theme: 'religions', title: 'La laïcité en France', asOf: V,
    points: [
      'La loi du 9 décembre 1905 sépare les Églises et l’État.',
      'L’État ne reconnaît, ne salarie ni ne subventionne aucun culte ; il garantit le libre exercice des cultes.',
      'Depuis 1958, la Constitution affirme que la France est une République « indivisible, laïque, démocratique et sociale ».',
      'En Alsace et en Moselle, un régime particulier, le Concordat, s’applique encore.',
    ],
    retenir: 'Loi de 1905 : séparation des Églises et de l’État.',
    questions: [
      q('dj-rel-laicite-1', 'En quelle année est adoptée la loi de séparation des Églises et de l’État ?', ['1905', '1789', '1958', '1881'], 'Le 9 décembre 1905.'),
      q('dj-rel-laicite-2', 'Où s’applique encore le régime du Concordat ?', ['En Alsace et en Moselle', 'En Corse', 'En Bretagne', 'Dans tout l’outre-mer'], 'Ces territoires étaient allemands en 1905.'),
    ],
  },
  {
    id: 'dj-rel-philo-antique', theme: 'religions', title: 'Socrate, Platon, Aristote', asOf: V,
    points: [
      'Socrate (Ve siècle av. J.-C.) n’a rien écrit ; il interroge ses interlocuteurs pour les faire réfléchir. « Je sais que je ne sais rien. »',
      'Condamné à mort par Athènes, il boit la ciguë en 399 av. J.-C.',
      'Platon, son élève, rapporte sa pensée ; il écrit l’allégorie de la caverne, sur l’illusion et la connaissance.',
      'Aristote, élève de Platon, travaille sur la logique, la politique, la biologie ; il est le précepteur d’Alexandre le Grand.',
    ],
    retenir: 'Socrate questionne, Platon écrit, Aristote classe.',
    questions: [
      q('dj-rel-philo-antique-1', 'Quel philosophe a écrit l’allégorie de la caverne ?', ['Platon', 'Socrate', 'Aristote', 'Épicure'], 'Dans La République.'),
      q('dj-rel-philo-antique-2', 'De qui Aristote fut-il le précepteur ?', ['Alexandre le Grand', 'Jules César', 'Périclès', 'Cyrus le Grand'], 'Alexandre, futur roi de Macédoine.'),
    ],
  },
  {
    id: 'dj-rel-lumieres', theme: 'religions', title: 'Les Lumières', asOf: V,
    points: [
      'Mouvement intellectuel du XVIIIe siècle qui veut éclairer les esprits par la raison.',
      'Montesquieu, dans De l’esprit des lois (1748), défend la séparation des pouvoirs : législatif, exécutif, judiciaire.',
      'Voltaire combat l’intolérance et le fanatisme.',
      'Rousseau écrit Du contrat social (1762) : la souveraineté appartient au peuple.',
      'Diderot et d’Alembert dirigent l’Encyclopédie, qui rassemble les savoirs de l’époque.',
    ],
    retenir: 'Montesquieu, séparation des pouvoirs ; Rousseau, contrat social.',
    questions: [
      q('dj-rel-lumieres-1', 'Quel philosophe défend la séparation des pouvoirs ?', ['Montesquieu', 'Voltaire', 'Jean-Jacques Rousseau', 'Descartes'], 'Dans De l’esprit des lois, en 1748.'),
      q('dj-rel-lumieres-2', 'Qui dirige l’Encyclopédie avec d’Alembert ?', ['Diderot', 'Voltaire', 'Montesquieu', 'Pascal'], 'Denis Diderot.'),
    ],
  },
  {
    id: 'dj-rel-descartes', theme: 'religions', title: 'Descartes et le doute', asOf: V,
    points: [
      'René Descartes (1596-1650), philosophe et mathématicien français.',
      'Dans le Discours de la méthode (1637), il doute de tout pour trouver une certitude.',
      'Sa conclusion : « Je pense, donc je suis ».',
      'En mathématiques, il relie l’algèbre et la géométrie : on parle de coordonnées cartésiennes.',
      'Le livret BIA le cite : il pensait que l’homme manquait de force pour voler par ses propres moyens.',
    ],
    retenir: '« Je pense, donc je suis » ; coordonnées cartésiennes.',
    sources: [LIVRET],
    questions: [
      q('dj-rel-descartes-1', 'Dans quel ouvrage Descartes écrit-il « Je pense, donc je suis » ?', ['Le Discours de la méthode', 'Les Pensées', 'Du contrat social', 'Les Essais de Montaigne'], 'Les Pensées sont de Pascal ; Candide, de Voltaire.'),
      q('dj-rel-descartes-2', 'Quel outil mathématique porte le nom de Descartes ?', ['Les coordonnées cartésiennes', 'Le théorème de Pythagore', 'Le triangle de Pascal', 'La suite de Fibonacci des nombres'], 'Elles repèrent un point par ses distances à deux axes.'),
    ],
  },
];

// ---------------------------------------------------------------------------
// Géographie (7)
// ---------------------------------------------------------------------------
const GEOGRAPHIE: DailyFact[] = [
  {
    id: 'dj-geog-oceans', theme: 'geographie', title: 'Continents et océans', asOf: V,
    points: [
      'Les océans couvrent environ 71 % de la surface de la Terre.',
      'Cinq océans : Pacifique, Atlantique, Indien, Austral, Arctique.',
      'Le Pacifique est le plus grand : il couvre à lui seul près d’un tiers de la planète.',
      'Le point le plus profond est la fosse des Mariannes, dans le Pacifique, à près de 11 000 m.',
      'L’Asie est le continent le plus vaste et le plus peuplé.',
    ],
    retenir: '71 % d’océans ; le Pacifique est le plus grand.',
    questions: [
      q('dj-geog-oceans-1', 'Quel est le plus grand océan du monde ?', ['Le Pacifique', 'L’Atlantique', 'L’océan Indien', 'L’océan Austral'], 'Il couvre près d’un tiers de la Terre.'),
      q('dj-geog-oceans-2', 'Quelle part de la surface terrestre les océans couvrent-ils ?', ['Environ 71 %', 'Environ 50 %', 'Environ 30 %', 'Environ 90 %'], 'D’où le surnom de « planète bleue ».'),
    ],
  },
  {
    id: 'dj-geog-montagnes', theme: 'geographie', title: 'Les plus hauts sommets', asOf: V, volatile: true,
    points: [
      'L’Everest, à la frontière entre le Népal et la Chine, culmine à 8 848,86 m selon la mesure commune annoncée par ces deux pays en 2020.',
      'Il est gravi pour la première fois en 1953 par Edmund Hillary et Tenzing Norgay.',
      'Le K2 (8 611 m), au Pakistan et en Chine, est le deuxième sommet du monde.',
      'Le mont Blanc, plus haut sommet des Alpes et d’Europe de l’Ouest, dépasse 4 800 m ; sa hauteur varie avec l’épaisseur de neige.',
      'Les quatorze sommets de plus de 8 000 m sont tous en Asie, dans l’Himalaya et le Karakoram.',
    ],
    retenir: 'Everest 8 849 m (mesure de 2020) ; mont Blanc, plus de 4 800 m.',
    sources: [{ title: 'RTBF, nouvelle altitude de l’Everest (décembre 2020)', url: 'https://www.rtbf.be/article/le-mont-everest-prend-de-la-hauteur-son-altitude-fixee-desormais-a-8849-metres-10648952' }],
    questions: [
      q('dj-geog-montagnes-1', 'Quelle est l’altitude de l’Everest selon la mesure de 2020 ?', ['8 848,86 m', '8 611,00 m', '7 848,50 m', '9 012,20 m'], '8 611 m est l’altitude du K2.'),
      q('dj-geog-montagnes-2', 'Qui réussit la première ascension de l’Everest en 1953 ?', ['Edmund Hillary et Tenzing Norgay', 'George Mallory et Andrew Irvine', 'Reinhold Messner et Peter Habeler', 'Maurice Herzog et Louis Lachenal'], 'Mallory et Irvine ont disparu en 1924 ; Herzog et Lachenal ont gravi l’Annapurna en 1950.'),
    ],
  },
  {
    id: 'dj-geog-fleuves', theme: 'geographie', title: 'Les grands fleuves', asOf: V,
    points: [
      'Le Nil (Afrique) et l’Amazone (Amérique du Sud) se disputent le titre de plus long fleuve, autour de 6 400 à 7 000 km selon les mesures.',
      'L’Amazone est de très loin le plus puissant : il apporte environ un cinquième de l’eau douce rejetée dans les océans.',
      'Le Yangzi Jiang, en Chine, est le plus long fleuve d’Asie.',
      'En France, la Loire est le plus long fleuve, avec environ 1 000 km.',
      'Un fleuve se jette dans la mer ; une rivière se jette dans un autre cours d’eau.',
    ],
    retenir: 'Nil ou Amazone pour la longueur ; la Loire en France.',
    questions: [
      q('dj-geog-fleuves-1', 'Quel est le plus long fleuve de France ?', ['La Loire', 'La Seine', 'Le Rhône', 'La Garonne'], 'Environ 1 000 km.'),
      q('dj-geog-fleuves-2', 'Quel fleuve est le plus puissant du monde par son débit ?', ['L’Amazone', 'Le Nil', 'Le Mississippi', 'Le Danube'], 'Son débit dépasse de loin celui de tout autre fleuve.'),
    ],
  },
  {
    id: 'dj-geog-france', theme: 'geographie', title: 'L’organisation de la France', asOf: V,
    points: [
      'Depuis 2016, la France compte 18 régions : 13 en métropole et 5 en outre-mer.',
      'Elle compte 101 départements, dont 5 d’outre-mer : Guadeloupe, Martinique, Guyane, La Réunion, Mayotte.',
      'La France métropolitaine couvre environ 550 000 km² ; c’est le plus grand pays de l’Union européenne.',
      'Point culminant : le mont Blanc. La Guyane est le plus grand département.',
    ],
    retenir: '18 régions, 101 départements ; plus grand pays de l’UE.',
    questions: [
      q('dj-geog-france-1', 'Combien de régions la France compte-t-elle depuis 2016 ?', ['18', '22', '13', '27'], '13 en métropole et 5 en outre-mer.'),
      q('dj-geog-france-2', 'Quel est le plus grand département français ?', ['La Guyane', 'La Gironde', 'La Réunion', 'Les Landes'], 'La Guyane couvre environ 84 000 km².'),
    ],
  },
  {
    id: 'dj-geog-population', theme: 'geographie', title: 'La population mondiale', asOf: V, volatile: true,
    points: [
      'Selon l’ONU, la population mondiale a franchi 8 milliards d’habitants en novembre 2022.',
      'Depuis 2023, l’Inde est le pays le plus peuplé du monde, devant la Chine.',
      'Plus de la moitié des humains vivent en Asie.',
      'L’Afrique est le continent dont la population croît le plus vite.',
      'Plus de la moitié de la population mondiale vit en ville.',
    ],
    retenir: '8 milliards en 2022 ; l’Inde devant la Chine depuis 2023.',
    sources: [{ title: 'L’Écho du mardi, l’Inde dépasse la Chine (juillet 2023, d’après l’ONU)', url: 'https://www.echodumardi.com/?p=82718' }],
    questions: [
      q('dj-geog-population-1', 'Quel est le pays le plus peuplé du monde depuis 2023 ?', ['L’Inde', 'La Chine', 'Les États-Unis', 'L’Indonésie'], 'L’Inde a dépassé la Chine en 2023, selon l’ONU.', true),
      q('dj-geog-population-2', 'Quand la population mondiale a-t-elle franchi 8 milliards d’habitants, selon l’ONU ?', ['En 2022', 'En 2011', 'En 2030', 'En 2000'], 'En novembre 2022.'),
    ],
  },
  {
    id: 'dj-geog-fuseaux', theme: 'geographie', title: 'Fuseaux horaires et ligne de changement de date', asOf: V,
    points: [
      'La Terre est découpée en 24 fuseaux horaires de 15° de longitude.',
      'Le méridien de Greenwich, près de Londres, est la référence : heure UTC.',
      'La ligne de changement de date suit à peu près le méridien 180°, dans le Pacifique. La franchir vers l’ouest fait gagner un jour.',
      'La France utilise l’heure d’Europe centrale : UTC + 1 en hiver, UTC + 2 en été.',
      'Avec ses outre-mer, la France couvre 12 fuseaux horaires, un record mondial.',
    ],
    retenir: '24 fuseaux ; ligne de changement de date vers 180°.',
    sources: [LIVRET],
    questions: [
      q('dj-geog-fuseaux-1', 'Près de quel méridien passe la ligne de changement de date ?', ['Le méridien 180°', 'Le méridien de Greenwich', 'Le méridien de Paris', 'Le méridien 90° Est'], 'Elle traverse le Pacifique.'),
      q('dj-geog-fuseaux-2', 'Combien de fuseaux horaires la France couvre-t-elle avec ses outre-mer ?', ['12', '2', '5', '24'], 'Un record, devant la Russie et les États-Unis.'),
    ],
  },
  {
    id: 'dj-geog-deserts', theme: 'geographie', title: 'Déserts et climats extrêmes', asOf: V,
    points: [
      'Un désert se définit par la faiblesse des précipitations, pas par la chaleur.',
      'L’Antarctique est le plus grand désert du monde ; c’est un désert froid.',
      'Le Sahara est le plus grand désert chaud, sur une superficie proche de celle des États-Unis.',
      'Le désert d’Atacama, au Chili, est l’un des endroits les plus secs de la planète.',
      'La température la plus basse mesurée sur Terre l’a été en Antarctique, près de −90 °C.',
    ],
    retenir: 'Plus grand désert : l’Antarctique ; plus grand désert chaud : le Sahara.',
    questions: [
      q('dj-geog-deserts-1', 'Quel est le plus grand désert du monde ?', ['L’Antarctique', 'Le Sahara', 'Le désert de Gobi', 'L’Atacama'], 'Un désert se définit par l’absence de précipitations, pas par la chaleur.'),
      q('dj-geog-deserts-2', 'Dans quel pays se trouve le désert d’Atacama ?', ['Au Chili', 'Au Maroc', 'En Mongolie', 'En Australie'], 'Le désert de Gobi s’étend entre la Mongolie et la Chine.'),
    ],
  },
];

const OTHERS: Record<Exclude<DailyTheme, 'aero'>, DailyFact[]> = {
  histoire: HISTOIRE, geopolitique: GEOPOLITIQUE, sciences: SCIENCES, arts: ARTS, religions: RELIGIONS, geographie: GEOGRAPHIE,
};
const ROTATION: Exclude<DailyTheme, 'aero'>[] = ['histoire', 'geopolitique', 'sciences', 'arts', 'religions', 'geographie'];

/**
 * Ordre de passage : 2 jours sur 7 en aéronautique (2e et 5e jour de chaque semaine),
 * les autres jours en rotation sur les six thèmes. L'ordre est déterministe :
 * la progression, enregistrée par identifiant, ne bouge pas d'une version à l'autre.
 */
export function buildSequence(aero: DailyFact[], others: Record<string, DailyFact[]>, rotation: string[]): DailyFact[] {
  const queues = Object.fromEntries(Object.entries(others).map(([k, v]) => [k, [...v]]));
  const aeroQ = [...aero];
  const out: DailyFact[] = [];
  let r = 0;
  const total = aero.length + Object.values(others).reduce((s, v) => s + v.length, 0);
  for (let d = 0; out.length < total; d++) {
    if ((d % 7 === 1 || d % 7 === 4) && aeroQ.length) { out.push(aeroQ.shift()!); continue; }
    let tries = 0;
    while (tries < rotation.length && !queues[rotation[r % rotation.length]].length) { r++; tries++; }
    if (tries === rotation.length) { out.push(aeroQ.shift()!); continue; }
    out.push(queues[rotation[r % rotation.length]].shift()!);
    r++;
  }
  return out;
}

export const DAILY: DailyFact[] = buildSequence(AERO, OTHERS, ROTATION);
