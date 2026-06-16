import 'server-only';

/**
 * Les colonnes `expected_effects`, `consequences` et `resources` sont stockées
 * par le legacy Symfony via le type Doctrine `array`, c.-à-d. en PHP
 * `serialize()` (et non en JSON). On reproduit ici un désérialiseur minimal
 * suffisant pour ces données (tableaux de chaînes / tableaux associatifs).
 *
 * Les fiches créées via l'admin Next écrivent du texte libre : on retombe alors
 * sur un découpage par ligne.
 */

export interface Resource {
  name: string;
  url?: string;
}

type Entry = [string, string];

const PHP_ARRAY_RE = /^a:\d+:\{/;

function parsePhpArray(raw: string): Entry[] {
  const buf = Buffer.from(raw, 'utf8');
  let pos = 0;

  const byteAt = (): number => {
    const b = buf.at(pos);
    if (b === undefined) throw new Error('php-unserialize: unexpected end');
    return b;
  };
  const expect = (ch: string): void => {
    if (byteAt() !== ch.charCodeAt(0)) {
      throw new Error(`php-unserialize: expected '${ch}' at ${pos}`);
    }
    pos++;
  };
  const readUntil = (ch: string): string => {
    const start = pos;
    while (pos < buf.length && buf.at(pos) !== ch.charCodeAt(0)) pos++;
    return buf.toString('utf8', start, pos);
  };

  const readString = (): string => {
    expect('s');
    expect(':');
    const len = Number.parseInt(readUntil(':'), 10);
    expect(':');
    expect('"');
    const value = buf.toString('utf8', pos, pos + len);
    pos += len;
    expect('"');
    expect(';');
    return value;
  };
  const readInt = (): string => {
    expect('i');
    expect(':');
    const value = readUntil(';');
    expect(';');
    return value;
  };
  const readScalar = (): string => {
    const type = String.fromCharCode(byteAt());
    if (type === 's') return readString();
    if (type === 'i') return readInt();
    throw new Error(`php-unserialize: unsupported type '${type}' at ${pos}`);
  };

  expect('a');
  expect(':');
  const count = Number.parseInt(readUntil(':'), 10);
  expect(':');
  expect('{');
  const entries: Entry[] = [];
  for (let i = 0; i < count; i++) {
    const key = readScalar();
    const value = readScalar();
    entries.push([key, value]);
  }
  return entries;
}

/** Tableau séquentiel de chaînes (effets attendus, conséquences). */
export function parseStringList(raw: string | null): string[] {
  if (!raw) return [];
  const value = raw.trim();
  if (PHP_ARRAY_RE.test(value)) {
    try {
      return parsePhpArray(value)
        .map(([, v]) => v.trim())
        .filter((v) => v.length > 0);
    } catch {
      // données malformées → on retombe sur le découpage par ligne
    }
  }
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Tableau associatif `nom => url` (ressources complémentaires). */
export function parseResources(raw: string | null): Resource[] {
  if (!raw) return [];
  const value = raw.trim();

  if (PHP_ARRAY_RE.test(value)) {
    try {
      return parsePhpArray(value).map(([name, url]) => ({
        name: name.trim(),
        url: url.trim() || undefined,
      }));
    } catch {
      // on continue avec les fallbacks
    }
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
        .map((r) => ({
          name:
            typeof r.url_name === 'string'
              ? r.url_name
              : typeof r.name === 'string'
                ? r.name
                : '',
          url: typeof r.url === 'string' ? r.url : undefined,
        }));
    }
  } catch {
    // pas du JSON
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, url] = line.split('|').map((s) => s.trim());
      return { name: name ?? '', url: url || undefined };
    });
}
