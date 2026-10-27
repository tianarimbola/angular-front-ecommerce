# Clothes Atelier — interface Angular

Interface responsive de vitrine et d’administration pour l’API Spring Boot du dossier `demo`.

## Démarrer

```powershell
npm install
npm start
```

Ouvrir `http://localhost:4200`. Démarrer aussi PostgreSQL `clothes` et Spring Boot sur `http://localhost:8080`; l’URL d’API par défaut est dans `src/environments/environment.ts`.

Le dépôt est actuellement verrouillé sur Angular `21.2.x` dans `package.json` et `package-lock.json` (bien qu’il ait été décrit comme Angular 22). L’interface utilise les composants standalone et la syntaxe de templates modernes et se compile sur cette version.

Les images et vidéos de produits utilisent l’upload `multipart/form-data` du backend; les fichiers sont servis depuis `/api/media/{fileName}`. Formats acceptés côté backend : JPEG, PNG, WebP, GIF, MP4, WebM et MOV.

Les pages sont séparées dans `src/app/components` (tableau de bord, produits, commandes, collections, profil, authentification et formulaire produit). Après une mutation, l’interface applique immédiatement la réponse de l’API aux listes affichées, puis recharge les données en arrière-plan. Les réponses de chargements plus anciens sont ignorées pour éviter qu’une requête lente ne rétablisse un état périmé.
