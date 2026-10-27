import { createHash } from 'node:crypto';

export const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const isHashed = (s) => /^[a-f0-9]{64}$/.test(s);
const str = (v) => (v === undefined || v === null ? '' : String(v)).trim();
const strip = (s) => s.normalize('NFC').toLowerCase().replace(/[\s\p{P}\p{S}\d]/gu, '');

// Cada normalizador devolve string normalizada ou '' (campo omitido).
export const normalizers = {
  em: (v) => str(v).toLowerCase(),
  // Só dígitos, sem zeros à esquerda; adiciona DDI 55 para números BR sem DDI.
  ph: (v, { defaultCountryCode = '55' } = {}) => {
    let d = str(v).replace(/\D/g, '').replace(/^0+/, '');
    if (!d) return '';
    if (defaultCountryCode && !d.startsWith(defaultCountryCode) && d.length <= 11) {
      d = defaultCountryCode + d;
    }
    return d;
  },
  fn: (v) => str(v).toLowerCase().replace(/[\p{P}\p{S}\d]/gu, '').replace(/\s+/g, ' ').trim(),
  ln: (v) => str(v).toLowerCase().replace(/[\p{P}\p{S}\d]/gu, '').replace(/\s+/g, ' ').trim(),
  ct: (v) => strip(str(v)),
  st: (v) => str(v).toLowerCase().replace(/[^a-z]/g, '').slice(0, 2),
  zp: (v) => str(v).toLowerCase().replace(/[\s-]/g, ''),
  country: (v) => str(v).toLowerCase().replace(/[^a-z]/g, '').slice(0, 2),
  // Aceita YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY ou YYYYMMDD.
  db: (v) => {
    const s = str(v);
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return m[1] + m[2].padStart(2, '0') + m[3].padStart(2, '0');
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) return m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0');
    return /^\d{8}$/.test(s) ? s : '';
  },
  ge: (v) => {
    const s = str(v).toLowerCase();
    if (['f', 'female', 'feminino', 'mulher'].includes(s)) return 'f';
    if (['m', 'male', 'masculino', 'homem'].includes(s)) return 'm';
    return '';
  },
  external_id: (v) => str(v),
};

/** Normaliza e hasheia um campo. Já-hasheado passa direto; vazio retorna undefined. */
export function hashField(key, value, opts) {
  if (Array.isArray(value)) {
    const out = value.map((x) => hashField(key, x, opts)).filter(Boolean);
    return out.length ? out : undefined;
  }
  const raw = str(value);
  if (!raw) return undefined;
  if (isHashed(raw.toLowerCase())) return raw.toLowerCase();
  const n = normalizers[key](raw, opts);
  return n ? sha256(n) : undefined;
}

/**
 * fbc válido: fb.<subdomain_index>.<creation_time>.<fbclid>. Retorna undefined se
 * inválido (nunca inventar). A Parameter Builder Library da Meta adiciona um sufixo
 * ao valor, por isso aceitamos qualquer sequência sem espaços após o timestamp.
 */
export function validFbc(v) {
  const s = str(v);
  return /^fb\.[0-2]\.\d{10,13}\.\S+$/.test(s) ? s : undefined;
}

/** fbp: fb.<subdomain_index>.<creation_time>.<random_number> (+ sufixo opcional da Parameter Builder). */
export function validFbp(v) {
  const s = str(v);
  return /^fb\.[0-2]\.\d{10,13}\.\S+$/.test(s) ? s : undefined;
}
