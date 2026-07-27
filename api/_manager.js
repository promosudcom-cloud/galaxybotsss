// Appelle le petit serveur HTTP interne du Bot Manager (lib/apiServer.js côté bot)
// pour créer une VRAIE licence (data/licenses.json) juste après un paiement confirmé.
// C'est l'équivalent automatique de taper /cree-licence à la main.

export async function createManagerLicense({ type, days }) {
  const base = process.env.MANAGER_API_URL;
  const secret = process.env.MANAGER_API_SECRET;
  if (!base || !secret) {
    throw new Error('MANAGER_API_URL / MANAGER_API_SECRET manquants dans les variables d\'environnement');
  }

  const res = await fetch(`${base}/internal/create-license`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manager-secret': secret
    },
    body: JSON.stringify({ type, days })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur de création de licence côté Bot Manager');
  return data; // { id, type, expiresAt }
}
