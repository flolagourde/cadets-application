# Cap Cadets

Application personnelle (PWA) de préparation aux sélections Cadets et au BIA.
Toutes les données restent sur l'appareil (IndexedDB) : aucun compte, aucun serveur, aucun suivi.

## État

- **Entraînement sur téléphone** : 16 exercices générés à l'infini, 10 niveaux chacun, niveau adaptatif expliqué.
  Six ciblent les aptitudes des tests les plus sélectifs : sprint de calcul (durée fixe), équations en cascade,
  sommes signées et intervalles, lecture de cadrans, loi commune, matrices.
- **Coach** : le plan du jour combine une séance sur téléphone et des tests de plateforme (Pilotest, EPL Test)
  choisis selon les stanines saisies, l'ancienneté et les points faibles déclarés.
- **Suivi** : catalogue des tests psy0 / psy1, saisie en trois touches, objectifs de stanine, historique, synthèse.
  Les résultats des plateformes ne sont jamais mélangés à ceux de l'app.
- **Bibliothèque** : fiches datées et sourcées (Air France, institutions, sélection, repères techniques) avec quiz,
  vocabulaire aéronautique et compréhension écrite en anglais. Les questions ratées reviennent en priorité.
- **BIA** : le cours et les questions ne sont pas dans ce dépôt. Ils arrivent par un « pack » privé (fichier JSON)
  importé dans l'onglet BIA et stocké sur l'appareil. Fiches par partie avec renvoi aux pages du livret, questionnaires
  par partie ou par matière, révisions espacées (1, 3, 7, 14, 30 jours), examen blanc au format officiel
  (20 questions par matière, 90 secondes par question, aucune correction avant la fin), note sur 20 et détail par matière.
- **Le fait du jour** : une fiche courte et deux questions par jour (environ 5 minutes), par lots de 60 jours :
  2 jours par semaine d'aéronautique et Air France, le reste en rotation (histoire, géopolitique, sciences, arts et
  littérature, religions et philosophie, géographie). Les questions reviennent ensuite en rappels espacés
  (1, 3, 7, 14, 30 jours). Contenus dans `src/content/daily.ts`, moteur dans `src/domain/daily.ts`.
- **Données** : tout reste sur l'appareil. Sauvegarde et restauration, chiffrement AES-256-GCM facultatif.
- Installable et utilisable hors connexion.

À venir : calendrier, bilans hebdomadaires, page d'astuces.

Les fiches de `src/content/` portent une date de vérification (`asOf`) : les données de flotte, de dirigeants et de
réseau sont à revérifier avant chaque sélection.

## Lancer en local

```bash
npm install
npm run dev      # développement
npm test         # tests des générateurs et de l'adaptation
npm run build    # version de production dans dist/
```

## Mettre en ligne (gratuit)

Une PWA doit être servie en HTTPS. Seul le code est publié ; vos résultats ne quittent jamais le téléphone.

**Option A — dépôt public + GitHub Pages** : Settings → Pages → Source : « GitHub Actions ». Le workflow
`.github/workflows/deploy.yml` teste, construit et publie à chaque push sur `main`.

**Option B — dépôt privé + Cloudflare Pages** (GitHub Pages n'accepte pas les dépôts privés en offre gratuite) :
connecter le dépôt, commande de build `npm run build`, dossier de sortie `dist`.

## Installer sur iPhone

1. Ouvrir l'adresse du site dans **Safari**.
2. Partager → « Sur l'écran d'accueil ».
3. Lancer l'app depuis l'icône : elle fonctionne ensuite hors connexion.

Faites l'installation **avant** de commencer à enregistrer des résultats : Safari et l'app installée n'ont pas le même stockage.

## Sauvegarder

Réglages → Sauvegarde → Exporter (mot de passe facultatif). Rangez le fichier dans Fichiers / iCloud Drive.
Un rappel s'affiche sur l'accueil au bout de 7 jours sans export. « Restaurer » remplace les données actuelles.

## Ajouter un exercice

Écrire un `ExerciseDef` (voir `src/exercises/types.ts`) et l'inscrire dans `src/exercises/registry.ts`.
Le moteur (`src/pages/Run.tsx`) gère l'affichage, le chronométrage, la correction et l'enregistrement.

## Pack BIA

Un pack est un fichier JSON (`format: "cap-cadets-bia"`, `version: 1`) : matières → parties → sections de fiche,
signalements et questions (4 choix, la bonne réponse en premier, explication, page du livret, origine `livret` ou `externe`).
Importer une autre matière du même pack l'ajoute aux précédentes ; réimporter une matière la met à jour sans perdre
les statistiques. Types et validation : `src/domain/bia.ts`. Ne jamais déposer un pack dans ce dépôt public.
