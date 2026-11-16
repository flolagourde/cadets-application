import type { Fiche } from './types';

/**
 * Fiches rédigées pour l'app. Chaque donnée a été relevée le jour indiqué par `asOf`
 * et recoupée sur au moins deux sources quand elle peut changer (dirigeants, flotte, réseau).
 * Les chiffres de flotte bougent chaque mois : ils portent leur date dans le texte.
 */
const LIVRET = { title: 'Manuel du BIA, CIRAS Toulouse, version 4.0, édition 2021 (livret du projet)' };

export const FICHES: Fiche[] = [
  {
    id: 'af-groupe',
    theme: 'airfrance',
    title: 'Air France : repères et gouvernance',
    asOf: '2026-11-16',
    sections: [
      {
        title: 'Histoire',
        points: [
          'Création en 1933, par le regroupement de cinq compagnies : l’Aéropostale, Air Union, Farman, la CIDNA et Air Orient.',
          'L’hippocampe ailé, emblème de la compagnie, vient d’Air Orient.',
          'Concorde exploité de 1976 à 2003, en même temps que British Airways.',
          'Airbus A380 exploité de 2009 à 2020.',
          'Rapprochement avec KLM en 2004 : naissance du groupe Air France-KLM, qui détient Air France à 100 %.',
        ],
      },
      {
        title: 'Identité',
        points: [
          'Code IATA : AF. Code OACI : AFR.',
          'Alliance SkyTeam, fondée en 2000 ; Air France en est membre fondateur.',
          'Siège : Roissypôle, sur l’aéroport Paris-Charles de Gaulle, commune de Tremblay-en-France.',
          'Programme de fidélité : Flying Blue.',
        ],
      },
      {
        title: 'Dirigeants',
        points: [
          'Directrice générale d’Air France : Anne Rigail, depuis décembre 2018. Première femme à diriger la compagnie.',
          'Directeur général d’Air France-KLM : Benjamin Smith, arrivé en 2018. Il préside aussi le conseil d’administration d’Air France depuis juillet 2024.',
          'Présidente du conseil d’administration d’Air France-KLM : Florence Parly, depuis le 4 juin 2025. Elle a succédé à Anne-Marie Couderc.',
        ],
      },
      {
        title: 'Groupe',
        points: [
          'Filiales et marques : Transavia France (bas coûts), Air France Hop (régional), Air France Cargo, Air France Industries (maintenance), Servair (restauration).',
          'SAS : le 3 juillet 2025, Air France-KLM a annoncé vouloir porter sa participation de 19,9 % à 60,5 %. SAS a rejoint SkyTeam en septembre 2024.',
        ],
      },
    ],
    caveats: [
      'SAS : la finalisation était annoncée pour le second semestre 2026. Je n’ai pas trouvé de confirmation qu’elle est faite : à revérifier avant la sélection.',
      'Wikipédia en français donnait encore Anne-Marie Couderc comme présidente le 16/11/2026 ; six articles de presse datés de 2025 confirment son remplacement par Florence Parly.',
    ],
    sources: [
      { title: 'Wikipédia, « Air France » (consulté le 16/11/2026)', url: 'https://fr.wikipedia.org/wiki/Air_France' },
      { title: 'L’Écho touristique, Florence Parly présidente du conseil d’Air France-KLM', url: 'https://www.lechotouristique.com/article/florence-parly-nouvelle-presidente-du-conseil-dadministration-dair-france-klm' },
      { title: 'Journal de l’Aviation, nomination de Florence Parly (29/04/2025)', url: 'https://www.journal-aviation.com/les-breves/air-france-klm-nomme-florence-parly-comme-presidente-du-conseil-dadministration-20250429.html' },
      { title: 'Voyages d’Affaires, Anne Rigail directrice générale (12/12/2018)', url: 'https://www.voyages-d-affaires.com/anne-rigail-directrice-generale-air-france-20181212.html' },
      { title: 'DéplacementsPros, vœux 2026 d’Air France-KLM', url: 'https://www.deplacementspros.com/transport/air-france-klm-vise-deux-acquisitions-pour-devenir-un-champion-europeen' },
      { title: 'TourMaG, Benjamin Smith président du conseil d’Air France', url: 'https://www.tourmag.com/Air-France-Anne-Marie-Couderc-est-remplacee-par-Ben-Smith-_a123961.html' },
      { title: 'TourMaG, Air France-KLM et SAS (juillet 2025)', url: 'https://www.tourmag.com/Air-France-KLM-veut-prendre-le-controle-de-SAS-et-renforcer-sa-presence-en-Scandinavie_a127796.html' },
      LIVRET,
    ],
    questions: [
      { id: 'afg1', q: 'En quelle année Air France a-t-elle été créée ?', choices: ['1933', '1919', '1946', '1927'], explain: 'Air France naît en 1933 du regroupement de cinq compagnies françaises.' },
      { id: 'afg2', q: 'Laquelle de ces compagnies a participé au regroupement qui a créé Air France ?', choices: ['L’Aéropostale', 'UTA', 'Air Inter', 'TAT'], explain: 'Les cinq compagnies de 1933 sont l’Aéropostale, Air Union, Farman, la CIDNA et Air Orient.' },
      { id: 'afg3', q: 'De quelle compagnie Air France a-t-elle hérité son emblème, l’hippocampe ailé ?', choices: ['Air Orient', 'Air Union', 'L’Aéropostale', 'Farman'], explain: 'L’hippocampe était l’emblème d’Air Orient.' },
      { id: 'afg4', q: 'À quelle alliance appartient Air France ?', choices: ['SkyTeam', 'Star Alliance', 'Oneworld', 'Aucune alliance'], explain: 'Air France est membre fondateur de SkyTeam, créée en 2000.' },
      { id: 'afg5', q: 'En quelle année l’alliance SkyTeam a-t-elle été fondée ?', choices: ['2000', '1997', '2004', '1989'], explain: 'SkyTeam a été fondée en 2000.' },
      { id: 'afg6', q: 'Depuis quelle année Air France et KLM forment-elles un même groupe ?', choices: ['2004', '1999', '2009', '2014'], explain: 'Le groupe Air France-KLM existe depuis 2004.' },
      { id: 'afg7', q: 'Qui est directrice générale d’Air France ?', choices: ['Anne Rigail', 'Florence Parly', 'Anne-Marie Couderc', 'Marjan Rintel'], explain: 'Anne Rigail dirige Air France depuis décembre 2018. Marjan Rintel dirige KLM.', volatile: true },
      { id: 'afg8', q: 'Qui est directeur général du groupe Air France-KLM ?', choices: ['Benjamin Smith', 'Anne Rigail', 'Jean-Marc Janaillac', 'Pieter Elbers'], explain: 'Benjamin Smith, venu d’Air Canada, dirige le groupe depuis 2018.', volatile: true },
      { id: 'afg9', q: 'Qui préside le conseil d’administration d’Air France-KLM ?', choices: ['Florence Parly', 'Anne-Marie Couderc', 'Benjamin Smith', 'Anne Rigail'], explain: 'Florence Parly a succédé à Anne-Marie Couderc le 4 juin 2025.', volatile: true },
      { id: 'afg10', q: 'Quel est le code OACI d’Air France ?', choices: ['AFR', 'AF', 'AIF', 'FRA'], explain: 'AFR est le code OACI à trois lettres ; AF est le code IATA à deux lettres.' },
      { id: 'afg11', q: 'Où se trouve le siège d’Air France ?', choices: ['À Roissypôle, sur l’aéroport Paris-Charles de Gaulle', 'À Orly', 'Près de la gare Montparnasse, à Paris', 'À Toulouse-Blagnac'], explain: 'Le siège est à Roissypôle (Tremblay-en-France). Il se trouvait auparavant près de la gare Montparnasse.' },
      { id: 'afg12', q: 'Quelle filiale du groupe Air France exploite les vols à bas coûts ?', choices: ['Transavia', 'Air France Hop', 'Servair', 'Air France Industries'], explain: 'Transavia est la compagnie à bas coûts du groupe ; Air France Hop assure le réseau régional.' },
    ],
  },
  {
    id: 'af-flotte',
    theme: 'airfrance',
    title: 'La flotte d’Air France',
    asOf: '2026-11-16',
    intro: 'Deux relevés sont donnés quand ils diffèrent : le chiffre officiel du groupe au 31/12/2025, et l’état indiqué par Wikipédia en novembre 2026.',
    sections: [
      {
        title: 'Long-courrier (120 avions)',
        points: [
          'Boeing 777-300ER : 43 avions. Moteurs GE90.',
          'Airbus A350-900 : 41 au 31/12/2025, 43 en novembre 2026. Moteurs Rolls-Royce Trent XWB.',
          'Boeing 777-200ER : 18 avions. Moteurs GE90.',
          'Boeing 787-9 : 10 avions. Moteurs GEnx.',
          'Airbus A330-200 : 8 au 31/12/2025, 6 en novembre 2026. Moteurs CF6. En cours de retrait.',
        ],
      },
      {
        title: 'Moyen-courrier (107 avions au 31/12/2025)',
        points: [
          'Airbus A220-300 : 52 avions. 11 livrés en 2025.',
          'Airbus A320 : 36. Airbus A321 : 12. Airbus A319 : 3. Airbus A318 : 4.',
          'Les A320 de l’ancienne génération sont équipés de moteurs CFM56-5B.',
        ],
      },
      {
        title: 'Régional et cargo',
        points: [
          'Air France Hop : Embraer 170 (12) et Embraer 190 (27) au 31/12/2025.',
          'Cargo : 2 Boeing 777F.',
        ],
      },
      {
        title: 'Renouvellement',
        points: [
          'L’A220-300 remplace les A318 et A319, puis les A320 de l’ancienne génération.',
          'L’A350-900 remplace les A330-200 et les 777 les plus anciens.',
          'Types retirés : Airbus A380 (2020), Airbus A340 (2020), Concorde (2003).',
          'Groupe Air France-KLM : 596 avions au 31/12/2025, dont 50 appareils de nouvelle génération livrés en 2025.',
        ],
      },
    ],
    caveats: [
      'Les effectifs changent à chaque livraison ou retrait. Retiens les ordres de grandeur et revérifie les chiffres exacts juste avant le psy0.',
      'La motorisation de l’A220 n’apparaissait pas dans les sources consultées : elle n’est pas dans le quiz.',
    ],
    sources: [
      { title: 'Air France-KLM, page « Fleet » (chiffres au 31/12/2025)', url: 'https://www.airfranceklm.com/en/group/fleet' },
      { title: 'Air France-KLM, fiches avions et motorisations', url: 'https://www.airfranceklm.com/en/fleet' },
      { title: 'Wikipédia, « Air France », section Flotte (novembre 2026)', url: 'https://fr.wikipedia.org/wiki/Air_France' },
      { title: 'Safran, moteurs CFM56 d’Air France-KLM', url: 'https://www.safran-group.com/fr/espace-presse/air-france-klm-negociations-exclusives-cfm-international-motorisation-sa-future-flotte-da320neo-2022-04-07' },
      { title: 'Air Journal, cession d’A318 (20/02/2026)', url: 'https://www.air-journal.fr/2026-02-20-fin-de-regne-pour-la318-air-france-cede-sept-airbus-a-ftai-aviation-5273247.html' },
    ],
    questions: [
      { id: 'aff1', q: 'Combien de Boeing 777-300ER Air France exploite-t-elle ?', choices: ['43', '18', '70', '25'], explain: '43 Boeing 777-300ER, chiffre identique dans le relevé officiel de fin 2025 et dans celui de novembre 2026.', volatile: true },
      { id: 'aff2', q: 'Quel moteur équipe les Airbus A350-900 d’Air France ?', choices: ['Rolls-Royce Trent XWB', 'GE90', 'GEnx', 'CFM56'], explain: 'Le Trent XWB de Rolls-Royce est le moteur de l’A350.' },
      { id: 'aff3', q: 'Quel moteur équipe les Boeing 777 d’Air France ?', choices: ['GE90', 'Trent XWB', 'CF6', 'GEnx'], explain: 'Les 777-200ER et 777-300ER d’Air France volent avec des GE90.' },
      { id: 'aff4', q: 'Quel moteur équipe les Boeing 787-9 d’Air France ?', choices: ['GEnx', 'GE90', 'Trent XWB', 'CFM56'], explain: 'Les 787-9 d’Air France sont équipés de GEnx.' },
      { id: 'aff5', q: 'Quel avion remplace les Airbus A318 et A319 d’Air France ?', choices: ['L’Airbus A220-300', 'L’Airbus A321neo', 'L’Embraer 195-E2', 'Le Boeing 737 MAX'], explain: 'L’A220-300 renouvelle la flotte moyen-courrier : 52 exemplaires fin 2025.' },
      { id: 'aff6', q: 'Jusqu’à quelle année Air France a-t-elle exploité l’Airbus A380 ?', choices: ['2020', '2016', '2023', 'Elle l’exploite toujours'], explain: 'L’A380 a volé chez Air France de 2009 à 2020.' },
      { id: 'aff7', q: 'Sur quelle période Air France a-t-elle exploité le Concorde ?', choices: ['De 1976 à 2003', 'De 1969 à 2000', 'De 1980 à 2010', 'De 1972 à 1996'], explain: 'Concorde a été exploité commercialement de 1976 à 2003.' },
      { id: 'aff8', q: 'Lequel de ces avions fait partie de la flotte long-courrier d’Air France fin 2026 ?', choices: ['Le Boeing 787-9', 'L’Airbus A380', 'L’Airbus A340-300', 'Le Boeing 747-400'], explain: 'La flotte long-courrier compte quatre familles : 777, 787, A350 et A330. A380, A340 et 747 sont retirés.', volatile: true },
      { id: 'aff9', q: 'Combien d’avions compte environ la flotte long-courrier d’Air France ?', choices: ['Environ 120', 'Environ 60', 'Environ 200', 'Environ 300'], explain: '120 avions long-courriers, au 31/12/2025 comme en novembre 2026.', volatile: true },
      { id: 'aff10', q: 'Quel avion long-courrier d’Air France est en cours de retrait fin 2026 ?', choices: ['L’Airbus A330-200', 'L’Airbus A350-900', 'Le Boeing 787-9', 'Le Boeing 777-300ER'], explain: 'Les A330-200 sont remplacés par des A350-900 : 8 fin 2025, 6 en novembre 2026.', volatile: true },
      { id: 'aff11', q: 'Quel constructeur fournit les avions régionaux d’Air France Hop ?', choices: ['Embraer', 'ATR', 'Bombardier', 'Airbus'], explain: 'Air France Hop exploite des Embraer 170 et 190.', volatile: true },
      { id: 'aff12', q: 'Quel moteur équipe les Airbus A320 de l’ancienne génération d’Air France ?', choices: ['CFM56', 'GE90', 'Trent XWB', 'GEnx'], explain: 'Le CFM56-5B équipe les A320ceo d’Air France.' },
    ],
  },
  {
    id: 'af-reseau',
    theme: 'airfrance',
    title: 'Réseau et bases',
    asOf: '2026-11-16',
    sections: [
      {
        title: 'Paris',
        points: [
          'Hub : Paris-Charles de Gaulle. Depuis le programme d’été 2026, tous les vols intérieurs et internationaux d’Air France en partent.',
          'Paris-Orly : Air France l’a quitté le 28 mars 2026, 80 ans après son premier vol depuis cet aéroport (1946). Seules les liaisons vers la Corse y restent.',
          'À Orly, Transavia est devenue l’opérateur de référence du groupe. Elle a repris les lignes vers Nice, Marseille et Toulouse.',
          'Depuis Roissy, à partir d’avril 2026 : 12 vols par jour vers Nice et vers Toulouse, 10 vers Marseille.',
        ],
      },
      {
        title: 'Groupe',
        points: [
          'Second hub du groupe : Amsterdam-Schiphol, base de KLM.',
          'Copenhague est présentée par le groupe comme un troisième hub possible avec SAS.',
        ],
      },
    ],
    caveats: [
      'Les derniers chiffres de réseau trouvés datent de 2023 (116 destinations dans 77 pays, 49,7 millions de passagers) : trop anciens pour le quiz.',
    ],
    sources: [
      { title: 'Europe 1, Air France quitte Orly (28/03/2026)', url: 'https://www.europe1.fr/node/918031' },
      { title: 'Hespress, Air France quitte Orly (28/03/2026)', url: 'https://fr.hespress.com/467489-467489.html' },
      { title: 'DéplacementsPros, ce qui change à Orly (26/03/2026)', url: 'https://www.deplacementspros.com/transport/aerien/depart-dair-france-dorly-ce-qui-change-pour-les-voyageurs-des-ce-week-end' },
      { title: 'DéplacementsPros, vœux 2026 d’Air France-KLM', url: 'https://www.deplacementspros.com/transport/air-france-klm-vise-deux-acquisitions-pour-devenir-un-champion-europeen' },
    ],
    questions: [
      { id: 'afr1', q: 'Quel est le hub d’Air France ?', choices: ['Paris-Charles de Gaulle', 'Paris-Orly', 'Lyon-Saint-Exupéry', 'Amsterdam-Schiphol'], explain: 'Air France regroupe ses vols à Paris-Charles de Gaulle.' },
      { id: 'afr2', q: 'Quand Air France a-t-elle quitté l’aéroport d’Orly ?', choices: ['Le 28 mars 2026', 'Le 1er janvier 2024', 'Elle y est toujours', 'Le 31 octobre 2025'], explain: 'Le dernier vol s’est posé à Orly le 28 mars 2026.', volatile: true },
      { id: 'afr3', q: 'Quelles liaisons Air France a-t-elle conservées à Orly ?', choices: ['Les vols vers la Corse', 'Les vols vers les Antilles', 'La navette vers Toulouse', 'Aucune'], explain: 'Seules les liaisons vers la Corse restent à Orly.', volatile: true },
      { id: 'afr4', q: 'Quelle compagnie du groupe a repris les lignes Orly-Nice, Orly-Marseille et Orly-Toulouse ?', choices: ['Transavia', 'Air France Hop', 'KLM', 'Air Corsica'], explain: 'Transavia est l’opérateur de référence du groupe à Orly depuis le printemps 2026.', volatile: true },
      { id: 'afr5', q: 'Quel aéroport est le hub de KLM ?', choices: ['Amsterdam-Schiphol', 'Rotterdam', 'Bruxelles', 'Copenhague'], explain: 'KLM est basée à Amsterdam-Schiphol, second hub du groupe.' },
    ],
  },
  {
    id: 'institutions',
    theme: 'industrie',
    title: 'Les institutions de l’aviation civile',
    asOf: '2026-11-16',
    sections: [
      {
        title: 'OACI — Organisation de l’aviation civile internationale',
        points: [
          'Née de la convention de Chicago, signée le 7 décembre 1944 par 52 États.',
          'Siège à Montréal, choisi en 1946. Institution spécialisée des Nations unies depuis 1947.',
          '193 États membres. Le Conseil compte 36 États.',
          'Rôle : fixer les normes du transport aérien international.',
        ],
      },
      {
        title: 'IATA — Association du transport aérien international',
        points: [
          'Association de compagnies aériennes : ce n’est pas une autorité publique.',
          'Constituée en 1945, à Montréal. Elle a aussi un siège à Genève.',
        ],
      },
      {
        title: 'Europe et France',
        points: [
          'EASA (AESA) : agence européenne de la sécurité aérienne, basée à Cologne.',
          'DGAC : direction générale de l’Aviation civile. Sécurité, sûreté et contrôle aérien en France. Elle délivre les certificats de navigabilité.',
          'ENAC : école nationale de l’Aviation civile, à Toulouse. Les psy1 s’y déroulent.',
          'BEA : bureau chargé des enquêtes de sécurité après un accident d’aviation civile.',
        ],
      },
    ],
    sources: [
      { title: 'OACI, « À propos de l’OACI »', url: 'https://www.icao.int/fr/about-icao' },
      { title: 'OACI, choix de Montréal comme siège', url: 'https://www.icao.int/fr/selection-montreal-permanent-seat-icao' },
      { title: 'OACI, l’OACI et les Nations unies', url: 'https://www.icao.int/fr/icao-and-united-nations' },
      { title: 'Encyclopædia Universalis, « IATA »', url: 'https://www.universalis.fr/encyclopedie/iata-international-air-transport-association/' },
      LIVRET,
    ],
    questions: [
      { id: 'ins1', q: 'Dans quelle ville se trouve le siège de l’OACI ?', choices: ['Montréal', 'Genève', 'Chicago', 'Paris'], explain: 'Montréal a été choisie en 1946. Paris et Genève étaient candidates.' },
      { id: 'ins2', q: 'Quelle convention a fondé l’OACI ?', choices: ['La convention de Chicago, en 1944', 'La convention de Varsovie, en 1929', 'La convention de Montréal, en 1999', 'La convention de Paris, en 1919'], explain: 'La convention de Chicago a été signée le 7 décembre 1944.' },
      { id: 'ins3', q: 'Combien d’États sont membres de l’OACI ?', choices: ['193', '52', '120', '36'], explain: '193 États. 52 est le nombre de signataires de 1944, 36 celui des États du Conseil.' },
      { id: 'ins4', q: 'Qu’est-ce que l’IATA ?', choices: ['Une association de compagnies aériennes', 'Une agence des Nations unies', 'L’autorité européenne de sécurité aérienne', 'Un constructeur aéronautique'], explain: 'L’IATA regroupe des compagnies aériennes. L’agence des Nations unies est l’OACI.' },
      { id: 'ins5', q: 'Dans quelle ville est basée l’EASA ?', choices: ['Cologne', 'Bruxelles', 'Toulouse', 'Francfort'], explain: 'L’agence européenne de la sécurité aérienne est installée à Cologne.' },
      { id: 'ins6', q: 'Quel organisme délivre le certificat de navigabilité d’un avion en France ?', choices: ['La DGAC', 'L’IATA', 'Le BEA', 'L’ENAC'], explain: 'La certification relève de la DGAC.' },
      { id: 'ins7', q: 'Où se trouve l’ENAC ?', choices: ['À Toulouse', 'À Paris', 'À Bordeaux', 'À Marseille'], explain: 'L’école nationale de l’Aviation civile est à Toulouse.' },
      { id: 'ins8', q: 'Depuis quelle année l’OACI est-elle une institution spécialisée des Nations unies ?', choices: ['1947', '1944', '1958', '1919'], explain: 'Le protocole a été signé en octobre 1947.' },
    ],
  },
  {
    id: 'selection',
    theme: 'industrie',
    title: 'La sélection Cadets, étape par étape',
    asOf: '2026-11-16',
    intro: 'Synthèse de ce que publient Air France, Pilotest et la presse. Le programme des épreuves change d’une session à l’autre.',
    sections: [
      {
        title: 'Calendrier habituel',
        points: [
          'Candidatures en juin et juillet. Campagne 2026 : du 15 juin au 31 juillet.',
          'Psy0 début septembre, psy1 en octobre, psy2 à partir de janvier.',
        ],
      },
      {
        title: 'Psy0 : présélection en ligne',
        points: [
          'Passée depuis chez soi : 12 à 15 épreuves, jusqu’à 2 h 30 selon les sessions.',
          'Anglais : compréhension écrite, environ 45 questions en 30 minutes, le texte restant visible. Ce n’est pas un TOEIC.',
          'Un test de culture générale aéronautique.',
        ],
      },
      {
        title: 'Psy1 : une journée à l’ENAC, à Toulouse',
        points: [
          'Tests sur ordinateur, enchaînés rapidement. L’ordre peut varier.',
          'Le test psychomoteur se passe avec deux joysticks.',
          'Pas de brouillon pour le calcul mental.',
          'Un test de personnalité est aussi à remplir.',
        ],
      },
      {
        title: 'Ensuite',
        points: [
          'Psy2 : entretiens individuels et épreuves de groupe.',
          'Formation d’environ 24 mois, financée par Air France, puis vol sur Airbus A220 ou A320.',
        ],
      },
    ],
    caveats: [
      'Durée du psy0 : Pilotest indique jusqu’à 2 h 30 ; l’éditeur des tests en ligne indique une heure et demie en moyenne.',
      'Les conditions pour se représenter après un échec sont fixées par Air France : lis les « règles d’ajournement et d’élimination » sur son site avant de candidater.',
    ],
    sources: [
      { title: 'Pilotest, psy0 Cadets Air France', url: 'https://www.pilotest.com/en/selections/preparez-la-preselection-pilotes-cadets-air-france' },
      { title: 'Pilotest, psy1 Cadets Air France', url: 'https://www.pilotest.com/en/selections/preparez-les-tests-psychotechniques-et-psychomoteurs-des-selections-pilotes-cadets-air-france' },
      { title: 'Air France, page « Pilote de ligne »', url: 'https://corporate.airfrance.com/fr/pilote-de-ligne' },
      { title: 'Air Journal, campagne Cadets 2026 (17/06/2026)', url: 'https://www.air-journal.fr/2026-06-17-air-france-rouvre-sa-filiere-cadets-une-formation-de-pilote-de-ligne-100-financee-5275748.html' },
      { title: 'Humans Matter, présélection Cadets Air France', url: 'https://www.humansmatter.co/case-studies/air-france-cadet-selection' },
    ],
    questions: [
      { id: 'sel1', q: 'Où se déroulent les psy1 de la sélection Cadets ?', choices: ['À l’ENAC, à Toulouse', 'En ligne, depuis chez soi', 'Au siège d’Air France, à Roissy', 'Dans un aéro-club agréé'], explain: 'Les psy1 se passent sur une journée à l’ENAC. C’est le psy0 qui se passe en ligne.' },
      { id: 'sel2', q: 'Avec quel matériel se passe le test psychomoteur des psy1 ?', choices: ['Deux joysticks', 'Un clavier seul', 'Un volant et des pédales', 'Un écran tactile'], explain: 'Pilotest indique que le test psychomoteur se fait avec deux joysticks.' },
      { id: 'sel3', q: 'Quelle forme prend l’épreuve d’anglais du psy0 ?', choices: ['Une compréhension écrite', 'Un entretien oral', 'Un TOEIC complet', 'Une dictée'], explain: 'Environ 45 questions de compréhension écrite en 30 minutes, texte visible.', volatile: true },
      { id: 'sel4', q: 'Combien de temps dure la formation Cadets ?', choices: ['Environ 24 mois', 'Environ 6 mois', 'Environ 12 mois', 'Environ 48 mois'], explain: 'La formation dure environ 24 mois et son coût est pris en charge par Air France.', volatile: true },
    ],
  },
  {
    id: 'reperes',
    theme: 'technique',
    title: 'Chiffres et repères à connaître',
    asOf: '2026-11-16',
    intro: 'Repères stables, tirés du livret BIA du projet. Ils ne dépendent pas de l’actualité.',
    sections: [
      {
        title: 'Unités',
        points: [
          '1 mille nautique (NM) = 1,852 km. 1 nœud (kt) = 1 NM par heure = 1,852 km/h.',
          '1 pied (ft) = 0,3048 m, soit environ 0,3 m.',
          '1 m/s = environ 200 ft/min.',
          '1° de latitude = 60 NM.',
        ],
      },
      {
        title: 'Atmosphère standard (ISA)',
        points: [
          'Au niveau de la mer : 15 °C et 1013,25 hPa.',
          'La température baisse de 6,5 °C par 1000 m, soit 2 °C par 1000 ft.',
          'Tropopause fixée à 11 km ; au-delà, −56,5 °C.',
          'Près du sol, 1 hPa correspond à 28 ft (8,5 m).',
        ],
      },
      {
        title: 'Altimétrie',
        points: [
          'Calage QNH : l’altimètre indique une altitude, au-dessus du niveau de la mer.',
          'Calage QFE : il indique une hauteur, au-dessus de l’aérodrome.',
          'Calage 1013 : il indique un niveau de vol (FL), en centaines de pieds.',
        ],
      },
      {
        title: 'Radio et transpondeur',
        points: [
          'Codes transpondeur : 7000 vol VFR, 7500 détournement, 7600 panne radio, 7700 détresse.',
          'Fréquence de détresse internationale : 121,5 MHz.',
        ],
      },
      {
        title: 'Vol',
        points: [
          'Portance = ½ × ρ × V² × S × Cz. Doubler la vitesse multiplie la portance par 4.',
          'Le décrochage survient vers 15° d’incidence.',
          'Finesse = portance / traînée = distance parcourue / hauteur perdue.',
          'En virage à 60° d’inclinaison, le facteur de charge vaut 2.',
          'Décollage et atterrissage se font face au vent.',
        ],
      },
      {
        title: 'Aérodrome',
        points: [
          'Le numéro de piste est son orientation magnétique en dizaines de degrés : une piste orientée au 052° porte le numéro 05.',
          'Feux de navigation : vert à droite, rouge à gauche, blanc à l’arrière.',
          'Le vent est toujours donné par la direction d’où il vient.',
        ],
      },
    ],
    sources: [LIVRET],
    questions: [
      { id: 'rep1', q: 'Combien vaut un mille nautique ?', choices: ['1,852 km', '1,609 km', '1 km', '2,54 km'], explain: '1 NM = 1,852 km. 1,609 km est le mille terrestre.' },
      { id: 'rep2', q: 'En atmosphère standard, quelle est la température au niveau de la mer ?', choices: ['15 °C', '0 °C', '20 °C', '25 °C'], explain: 'ISA : 15 °C et 1013,25 hPa au niveau de la mer.' },
      { id: 'rep3', q: 'En atmosphère standard, quelle est la température à 6000 ft ?', choices: ['3 °C', '9 °C', '−3 °C', '−24 °C'], explain: 'La température baisse de 2 °C par 1000 ft : 15 − 12 = 3 °C.' },
      { id: 'rep4', q: 'Près du sol, à quelle variation de hauteur correspond 1 hPa ?', choices: ['28 ft', '100 ft', '8,5 ft', '300 ft'], explain: '1 hPa correspond à 28 ft, soit 8,5 m.' },
      { id: 'rep5', q: 'Altimètre calé au QNH : que lit-on ?', choices: ['Une altitude au-dessus du niveau de la mer', 'Une hauteur au-dessus de l’aérodrome', 'Un niveau de vol', 'Une vitesse verticale'], explain: 'QNH → altitude. QFE → hauteur. 1013 → niveau de vol.' },
      { id: 'rep6', q: 'Quel code transpondeur signale une panne radio ?', choices: ['7600', '7500', '7700', '7000'], explain: '7600 panne radio, 7500 détournement, 7700 détresse, 7000 vol VFR.' },
      { id: 'rep7', q: 'Quel code transpondeur signale une détresse ?', choices: ['7700', '7600', '7500', '7000'], explain: '7700 détresse, 7600 panne radio, 7500 détournement.' },
      { id: 'rep8', q: 'Quelle est la fréquence de détresse internationale ?', choices: ['121,5 MHz', '118,0 MHz', '123,45 MHz', '108,0 MHz'], explain: 'La fréquence de détresse est 121,5 MHz.' },
      { id: 'rep9', q: 'On double la vitesse d’un avion, à incidence égale. Que devient la portance ?', choices: ['Elle est multipliée par 4', 'Elle est multipliée par 2', 'Elle ne change pas', 'Elle est divisée par 2'], explain: 'La portance varie avec le carré de la vitesse.' },
      { id: 'rep10', q: 'Quel est le facteur de charge en virage stabilisé à 60° d’inclinaison ?', choices: ['2', '1', '1,5', '4'], explain: 'À 60° d’inclinaison, la portance doit valoir deux fois le poids.' },
      { id: 'rep11', q: 'Une piste est orientée au 052° magnétique. Quel est son numéro ?', choices: ['05', '52', '23', '5,2'], explain: 'On arrondit à la dizaine de degrés la plus proche : 05.' },
      { id: 'rep12', q: 'De quelle couleur est le feu de navigation en bout d’aile droite ?', choices: ['Vert', 'Rouge', 'Blanc', 'Bleu'], explain: 'Vert à droite, rouge à gauche, blanc à l’arrière.' },
      { id: 'rep13', q: 'Un planeur de finesse 40 perd 1000 m de hauteur. Quelle distance parcourt-il sans vent ?', choices: ['40 km', '4 km', '25 km', '400 km'], explain: 'Finesse = distance / hauteur : 40 × 1 km = 40 km.' },
      { id: 'rep14', q: 'Un avion vole à 120 kt. Quelle distance parcourt-il en 20 minutes ?', choices: ['40 NM', '20 NM', '60 NM', '120 NM'], explain: '120 NM par heure, donc 40 NM en un tiers d’heure.' },
      { id: 'rep15', q: 'Vers quel angle d’incidence une aile décroche-t-elle ?', choices: ['Environ 15°', 'Environ 5°', 'Environ 30°', 'Environ 45°'], explain: 'Au-delà d’environ 15°, l’écoulement décolle de l’extrados.' },
    ],
  },
];
