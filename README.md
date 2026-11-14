# Cap Cadets

Application personnelle (PWA) de préparation aux sélections Cadets et au BIA.
Toutes les données restent sur l'appareil (IndexedDB) : aucun compte, aucun serveur, aucun suivi.

## État : lot 1

- 10 exercices générés à l'infini, 10 niveaux chacun : calcul (opérations, pourcentages/fractions, estimation),
  mémoire (empan de chiffres, N-back), attention (recherche de symboles, comparaison de séquences, changement de règle),
  logique (suites numériques), spatial (rotation mentale).
- Correction, explication des erreurs, enregistrement automatique.
- Niveau adaptatif explicable et séance du jour composée selon les résultats (`src/domain/adaptive.ts`).
- Saisie manuelle des résultats Pilotest / EPL Test, historique filtrable, synthèse par domaine.
- Sauvegarde / restauration, chiffrement AES-256-GCM facultatif.
- Installable et utilisable hors connexion.

À venir : module BIA (pack de contenus importé), calendrier, bilans, bibliothèque. Voir le document de conception du projet.

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
