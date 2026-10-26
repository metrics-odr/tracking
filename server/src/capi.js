import { hashField, validFbc, validFbp } from './normalize.js';

const HASHED_KEYS = ['em', 'ph', 'fn', 'ln', 'db', 'ge', 'ct', 'st', 'zp', 'country', 'external_id'];

/**
 * Monta user_data da CAPI a partir de dados crus.
 * Entrada: { em, ph, fn, ln, db, ge, ct, st, zp, country, external_id,
 *            client_ip_address, client_user_agent, fbc, fbp }
 */
export function buildUserData(raw, opts) {
  const ud = {};
  for (const k of HASHED_KEYS) {
    const h = hashField(k, raw[k], opts);
    if (h !== undefined) ud[k] = h;
  }
  // Não hasheados
  if (raw.client_ip_address) ud.client_ip_address = String(raw.client_ip_address).trim();
  if (raw.client_user_agent) ud.client_user_agent = String(raw.client_user_agent);
  const fbc = validFbc(raw.fbc);
  const fbp = validFbp(raw.fbp);
  if (fbc) ud.fbc = fbc;
  if (fbp) ud.fbp = fbp;
  return ud;
}

/** Monta um evento CAPI. event_time em SEGUNDOS. */
export function buildEvent({ event_name, event_id, event_time, event_source_url,
  action_source = 'website', user = {}, custom_data = {}, opt_out }, opts) {
  if (!event_name) throw new Error('event_name é obrigatório');
  if (!event_id) throw new Error('event_id é obrigatório (deduplicação)');
  if (event_name === 'Purchase' && (custom_data.value == null || !custom_data.currency)) {
    throw new Error('Purchase exige custom_data.value e custom_data.currency');
  }
  const t = event_time ?? Math.floor(Date.now() / 1000);
  if (t > 1e11) throw new Error('event_time deve estar em segundos, não em ms');
  const ev = {
    event_name,
    event_time: t,
    event_id: String(event_id),
    action_source,
    user_data: buildUserData(user, opts),
    custom_data,
  };
  if (event_source_url) ev.event_source_url = event_source_url;
  if (opt_out) ev.opt_out = true;
  return ev;
}

/** Envia eventos. Token deve vir de variável de ambiente, nunca do cliente. */
export async function sendEvents({ datasetId, accessToken, events, testEventCode,
  apiVersion = 'v21.0', fetchImpl = fetch }) {
  if (!datasetId || !accessToken) throw new Error('datasetId e accessToken são obrigatórios');
  const body = { data: events };
  if (testEventCode) body.test_event_code = testEventCode;
  const res = await fetchImpl(
    `https://graph.facebook.com/${apiVersion}/${datasetId}/events?access_token=${encodeURIComponent(accessToken)}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`CAPI ${res.status}: ${JSON.stringify(json)}`);
  return json;
}
