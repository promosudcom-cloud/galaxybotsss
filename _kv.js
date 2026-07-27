# GalaxyBots — Paiement réel PayPal + licences automatiques

Ce dossier contient une vraie intégration de paiement (plus de mode démo) :
- **`index.html`** : ton site, avec un vrai bouton PayPal et un affichage des
  licences + instructions d'activation après paiement.
- **`api/`** : 3 petites fonctions serverless (Vercel) qui font tout le travail
  sensible côté serveur : créer la commande PayPal, vérifier le paiement,
  générer et stocker la clé de licence. **Le secret PayPal n'est jamais
  exposé au navigateur.**
- **`bot-addon/`** : une idée pour automatiser encore plus, plus tard.

Pourquoi un backend est obligatoire pour un "vrai" paiement : un site 100%
statique ne peut pas vérifier lui-même qu'un paiement a réellement eu lieu
(n'importe qui pourrait trafiquer le JavaScript et se donner une licence
gratuite). Ces fonctions servent uniquement à ça — pas besoin de gérer un
serveur, elles tournent automatiquement sur Vercel.

## Étape 1 — Compte PayPal Developer

1. Va sur https://developer.paypal.com puis connecte-toi avec ton compte PayPal pro.
2. **My Apps & Credentials** → **Create App** (choisis "Merchant").
3. Note le **Client ID** et le **Secret** — en mode *Sandbox* d'abord pour tester
   sans vrai argent.
4. Pour tester, crée un compte "Sandbox" acheteur dans l'onglet **Sandbox → Accounts**.

## Étape 2 — Base de données gratuite (Upstash Redis)

Vercel ne garde aucune mémoire entre deux appels : il faut un endroit pour
stocker les licences vendues.

1. Va sur https://upstash.com, crée un compte gratuit.
2. **Create Database** → région proche de toi → type "Regional".
3. Dans l'onglet **REST API**, copie `UPSTASH_REDIS_REST_URL` et
   `UPSTASH_REDIS_REST_TOKEN`.

## Étape 3 — (Optionnel) Webhook Discord pour être notifié des ventes

1. Dans ton serveur Discord, salon souhaité → **Paramètres du salon** →
   **Intégrations** → **Webhooks** → **Nouveau webhook**.
2. Copie l'URL du webhook.

## Étape 3bis — Brancher le vrai Bot Manager (génération automatique de licence)

Le site n'invente plus de clé lui-même : il appelle ton **Bot Manager**
(dossier `deploy-commands/`, celui qui a les commandes `/cree-licence`,
`/active-bot`, `/mybot`...) pour créer une VRAIE licence, exactement comme si
tu avais tapé `/cree-licence` à la main. Le nombre de jours est calculé
automatiquement depuis la formule achetée : 1 mois → 30 jours, 3 mois → 90,
12 mois → 365 (voir `api/_products.js`).

1. Dans le dossier `deploy-commands/` (ton Bot Manager), un nouveau fichier
   `lib/apiServer.js` a été ajouté : il ouvre un petit serveur HTTP interne,
   protégé par un secret, pour recevoir les demandes du site.
2. Remplis dans le `.env` du Bot Manager (copie `.env.example`) :
   - `MANAGER_API_SECRET` : invente une longue chaîne aléatoire (ex:
     générée avec `openssl rand -hex 32`).
   - `MANAGER_API_PORT` : `4000` par défaut.
3. `npm install` dans `deploy-commands/` (installe `express`, ajouté aux
   dépendances) puis `npm start` — le Bot Manager doit tourner **en continu**
   (c'est un bot Discord connecté en websocket + il démarre les bots clients),
   donc il lui faut un hébergement toujours allumé : VPS, Railway, Render...
   (contrairement au site, qui lui reste bien en serverless).
4. Donne à ce serveur une URL publique atteignant le port `MANAGER_API_PORT` :
   - Railway/Render : ils exposent automatiquement une URL HTTPS publique.
   - VPS : mets un reverse proxy (nginx / Caddy) devant, avec HTTPS.
5. Sur Vercel (site), ajoute dans les variables d'environnement :
   - `MANAGER_API_URL` = l'URL publique du Bot Manager (ex.
     `https://ton-manager.up.railway.app`)
   - `MANAGER_API_SECRET` = **exactement** le même secret qu'à l'étape 2.

⚠️ Ce petit serveur n'a aucune autre protection que le secret partagé : ne
donne cette URL à personne d'autre que ton site, et choisis un secret long
et aléatoire.

## Étape 4 — Déployer sur Vercel

1. Crée un compte sur https://vercel.com (gratuit).
2. Installe l'outil en ligne de commande si tu veux déployer depuis ton PC :
   `npm i -g vercel`, puis dans ce dossier : `vercel`.
   — Sinon, plus simple : mets ce dossier dans un dépôt GitHub et connecte-le
   depuis le dashboard Vercel ("Add New Project").
3. Une fois le projet créé, va dans **Project Settings → Environment
   Variables** et ajoute (valeurs de l'étape 1, 2, 3) :
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_API_BASE` = `https://api-m.sandbox.paypal.com` (sandbox)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `MANAGER_API_URL`
   - `MANAGER_API_SECRET`
   - `DISCORD_WEBHOOK_URL` (optionnel)
4. Redéploie (**Deployments → ⋯ → Redeploy**) pour que les variables soient prises en compte.

## Étape 5 — Brancher le Client ID public dans le site

Dans `index.html`, cherche cette ligne (une seule fois dans tout le fichier) :

```js
PAYPAL_CLIENT_ID: 'REMPLACE_PAR_TON_PAYPAL_CLIENT_ID',
```

Remplace par ton vrai **Client ID** (celui-ci n'est pas secret, il est fait
pour être visible dans le navigateur — seul le Secret doit rester caché côté
serveur). Redéploie.

## Étape 6 — Tester

1. Ouvre ton site déployé (`https://ton-projet.vercel.app`).
2. Ajoute un bot au panier → passe au paiement → paye avec un compte
   **Sandbox acheteur** PayPal (créé à l'étape 1).
3. Tu dois voir la clé de licence + les instructions d'activation s'afficher,
   et (si configuré) un message dans ton salon Discord.
4. Vérifie aussi "Mes licences" avec le même email : la clé doit ressortir.

## Étape 7 — Passer en vrai (live)

1. Dans PayPal Developer, bascule ton app en mode **Live** et récupère les
   identifiants Live (Client ID + Secret différents du sandbox).
2. Sur Vercel, remplace `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` par les
   valeurs live, et `PAYPAL_API_BASE` par `https://api-m.paypal.com`.
3. Remplace aussi le Client ID public dans `index.html` (étape 5) par le
   Client ID **live**.
4. Redéploie, fais un vrai petit achat toi-même pour confirmer que tout
   fonctionne avant de partager le lien à tes clients.

## Ajouter/modifier des bots ou des prix

⚠️ Les prix et durées existent à **deux endroits** qui doivent rester synchronisés :
- `DEFAULT_PRODUCTS` dans `index.html` (affichage)
- `PRODUCTS` dans `api/_products.js` (calcul du prix réel + jours + type de
  licence envoyés au Bot Manager — `licenseType` doit être `'gestion'` ou
  `'music'`, exactement ce qu'attend `lib/licenses.js` du Bot Manager)

Si tu changes un prix, une durée ou ajoutes un bot dans l'un, fais pareil
dans l'autre, sinon le paiement demandé au client ne correspondra pas à ce
qui s'affiche, ou la licence créée aura le mauvais type/durée.

## Support

- Erreur "Le paiement n'a pas été confirmé par PayPal" → vérifie
  `PAYPAL_CLIENT_ID`/`SECRET`/`PAYPAL_API_BASE` dans Vercel, et que tu es
  bien en sandbox si tu utilises un compte de test.
- Le bouton PayPal n'apparaît pas / mode "aperçu" affiché → le Client ID
  public dans `index.html` n'a pas été remplacé, ou les fonctions `api/`
  ne sont pas déployées.
- "Aucune licence trouvée" alors que tu as payé → vérifie
  `UPSTASH_REDIS_REST_URL`/`TOKEN`.
- Erreur "MANAGER_API_URL / MANAGER_API_SECRET manquants" ou paiement qui
  échoue à la toute fin → le Bot Manager n'est pas joignable : vérifie qu'il
  tourne (`npm start` dans `deploy-commands/`), que `MANAGER_API_URL` pointe
  bien vers lui, et que le secret est identique des deux côtés.
