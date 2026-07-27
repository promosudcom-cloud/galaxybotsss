import { PAYPAL_API, getAccessToken } from './_paypal.js';
import { kvGet, kvSet, kvDel } from './_kv.js';
import { createManagerLicense } from './_manager.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { orderId, email, discordId } = req.body || {};
    if (!orderId || !email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email ou identifiant de commande manquant' });
    }

    const pendingRaw = await kvGet(`pending:${orderId}`);
    if (!pendingRaw) {
      return res.status(400).json({ error: 'Commande inconnue ou expirée, recommence le paiement.' });
    }
    const items = JSON.parse(pendingRaw);

    // Vérification RÉELLE auprès de PayPal — jamais on ne fait confiance au navigateur.
    const accessToken = await getAccessToken();
    const capRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    const capData = await capRes.json();
    const status = capData.status || capData.details?.[0]?.issue;

    if (!capRes.ok || capData.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Le paiement n\'a pas été confirmé par PayPal.', detail: status });
    }

    // Une vraie licence par article, créée par le Bot Manager (équivalent de /cree-licence),
    // avec le bon nombre de jours calculé automatiquement depuis la formule achetée
    // (1 mois -> 30 jours, 3 mois -> 90, 12 mois -> 365 : voir api/_products.js).
    const licenses = [];
    for (const it of items) {
      const managerLicense = await createManagerLicense({ type: it.licenseType, days: it.days });
      licenses.push({
        productId: it.productId,
        product: it.productName,
        option: it.optionLabel,
        key: managerLicense.id,
        expiresAt: managerLicense.expiresAt,
        date: new Date().toLocaleDateString('fr-FR')
      });
    }

    const emailKey = email.toLowerCase();
    const existingRaw = await kvGet(`licenses:${emailKey}`);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    await kvSet(`licenses:${emailKey}`, JSON.stringify([...existing, ...licenses]));
    await kvDel(`pending:${orderId}`);

    // Notification optionnelle vers un salon Discord (webhook) pour garder une trace des ventes.
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content:
              `💰 **Nouvelle vente confirmée** — ${email}${discordId ? ` (Discord: \`${discordId}\`)` : ''}\n` +
              licenses.map(l => `• ${l.product} — ${l.option} → code \`${l.key}\` (expire le ${new Date(l.expiresAt).toLocaleDateString('fr-FR')})`).join('\n') +
              `\nLe client doit faire \`/active-bot token:<son token> licence-id:${licenses[0]?.key}\` puis \`/mybot action:start\`.`
          })
        });
      } catch (notifyErr) {
        console.error('Discord webhook failed:', notifyErr.message);
      }
    }

    res.status(200).json({ licenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
