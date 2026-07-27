# Automatisation de la création de licence — déjà en place

La génération automatique de licence est maintenant réelle : `api/capture-order.js`
(site) appelle directement `lib/apiServer.js` (Bot Manager) juste après un
paiement PayPal confirmé, ce qui crée une vraie entrée dans
`data/licenses.json` avec le bon type (`gestion` / `music`) et le bon nombre
de jours (1 mois → 30, 3 mois → 90, 12 mois → 365). Voir le README principal,
étape 3bis, pour le branchement.

Ce qu'il reste encore manuel : le client doit lui-même taper
`/active-bot token:<son token> licence-id:<sa clé>` puis
`/mybot action:start` — c'est volontaire, son **token Discord** ne doit
jamais transiter par le site ou par toi.

## Idée pour aller plus loin : DM automatique après paiement

Si tu veux que le client reçoive directement ses instructions par message
privé Discord (en plus de l'affichage sur le site), il faudrait :
1. Récupérer son ID Discord au moment du paiement (déjà demandé en option
   dans le formulaire de checkout).
2. Ajouter une route côté Bot Manager (`lib/apiServer.js`) qui envoie un DM
   via `client.users.fetch(discordId).then(u => u.send(...))` avec le code
   de licence et le rappel des commandes `/active-bot` / `/mybot`.
3. Faire en sorte que `capture-order.js` appelle cette route juste après la
   création de la licence, avec le `discordId` fourni par l'acheteur.

Ce n'est pas indispensable (l'affichage sur le site + le webhook Discord
suffisent déjà), mais ça évite au client de devoir retourner sur le site
pour retrouver sa clé.
