// Client minimaliste pour Upstash Redis (API REST), sans dépendance npm.
// Crée une base gratuite sur https://upstash.com puis copie l'URL REST + le TOKEN
// dans les variables d'environnement Vercel : UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.

const BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function call(command) {
  if (!BASE || !TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquants dans les variables d\'environnement');
  }
  const res = await fetch(`${BASE}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export async function kvSet(key, value, exSeconds) {
  const cmd = exSeconds ? ['SET', key, value, 'EX', String(exSeconds)] : ['SET', key, value];
  return call(cmd);
}

export async function kvGet(key) {
  return call(['GET', key]);
}

export async function kvDel(key) {
  return call(['DEL', key]);
}
