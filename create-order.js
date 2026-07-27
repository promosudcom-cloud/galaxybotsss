// Ce catalogue DOIT rester identique à DEFAULT_PRODUCTS dans index.html.
// Il sert à recalculer le prix côté serveur (jamais confiance au prix envoyé par le navigateur)
// ET à savoir quel type/durée demander au Bot Manager (licenses.create(type, days)).
export const PRODUCTS = [
  {
    id: 'p-gestion',
    name: 'Bot Gestion',
    licenseType: 'gestion', // correspond au type attendu par lib/licenses.js du Bot Manager
    options: [
      { id: 'g1', label: '1 mois', price: 2.5, days: 30 },
      { id: 'g3', label: '3 mois', price: 6.5, days: 90 },
      { id: 'g12', label: '12 mois', price: 22, days: 365 }
    ]
  },
  {
    id: 'p-music',
    name: 'Bot Musique IA',
    licenseType: 'music',
    options: [
      { id: 'r1', label: '1 mois', price: 1.5, days: 30 },
      { id: 'r3', label: '3 mois', price: 4, days: 90 },
      { id: 'r12', label: '12 mois', price: 14, days: 365 }
    ]
  }
];
