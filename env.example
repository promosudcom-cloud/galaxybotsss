import { kvGet } from './_kv.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const email = (req.query.email || '').toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    const raw = await kvGet(`licenses:${email}`);
    res.status(200).json({ licenses: raw ? JSON.parse(raw) : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
