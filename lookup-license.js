import { PRODUCTS } from './_products.js';
import { PAYPAL_API, getAccessToken } from './_paypal.js';
import { kvSet } from './_kv.js';

function computeCart(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('Panier vide');
  let total = 0;
  const validated = [];
  for (const it of items) {
    const product = PRODUCTS.find(p => p.id === it.productId);
    if (!product) throw new Error(`Produit inconnu : ${it.productId}`);
    const option = product.options.find(o => o.id === it.optionId);
    if (!option) throw new Error(`Formule inconnue pour ${product.name}`);
    total += option.price;
    validated.push({
      productId: product.id,
      productName: product.name,
      licenseType: product.licenseType,
      optionId: option.id,
      optionLabel: option.label,
      price: option.price,
      days: option.days
    });
  }
  return { total: Math.round(total * 100) / 100, validated };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { items } = req.body || {};
    const { total, validated } = computeCart(items);

    const accessToken = await getAccessToken();
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'EUR', value: total.toFixed(2) },
            description: validated.map(v => `${v.productName} (${v.optionLabel})`).join(', ').slice(0, 127)
          }
        ]
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) return res.status(500).json({ error: orderData.message || 'Erreur PayPal' });

    // On stocke le panier validé (5 min) pour que /api/capture-order génère
    // exactement les licences payées — jamais ce que le client renverrait.
    await kvSet(`pending:${orderData.id}`, JSON.stringify(validated), 300);

    res.status(200).json({ id: orderData.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
