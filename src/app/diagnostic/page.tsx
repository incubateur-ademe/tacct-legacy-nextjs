import { readFileSync } from 'node:fs';
import { Pool, type PoolConfig } from 'pg';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

interface Row {
  label: string;
  ok: boolean;
  data: unknown;
  error?: string;
  sql?: string;
}

// ─── Pool brut, identique à notre adapter Prisma mais SANS le SET search_path ──
function buildRawPool(): Pool {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL is not set');
  const url = new URL(rawUrl);
  const hadSslMode = url.searchParams.has('sslmode');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('schema');
  const caPath = process.env.DATABASE_CA_PATH;
  let ssl: PoolConfig['ssl'];
  if (caPath) {
    ssl = { rejectUnauthorized: true, ca: readFileSync(caPath, 'utf8') };
  } else if (hadSslMode) {
    ssl = { rejectUnauthorized: false };
  }
  return new Pool({
    connectionString: url.toString(),
    ...(ssl !== undefined && { ssl }),
    max: 2,
  });
}

async function runRaw(pool: Pool, label: string, sql: string): Promise<Row> {
  try {
    const r = await pool.query(sql);
    return { label, ok: true, data: r.rows, sql };
  } catch (e) {
    return {
      label,
      ok: false,
      data: null,
      sql,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function diagnosePg(): Promise<Row[]> {
  const pool = buildRawPool();
  try {
    return [
      await runRaw(pool, 'session info', 'SELECT current_database() AS db, current_user AS usr'),
      await runRaw(pool, 'search_path par défaut', 'SHOW search_path'),
      await runRaw(
        pool,
        'liste des schemas (hors système)',
        `SELECT schema_name FROM information_schema.schemata
         WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')
         ORDER BY schema_name`,
      ),
      await runRaw(
        pool,
        'recherche de la table user (tous schemas)',
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_name = 'user'`,
      ),
      await runRaw(
        pool,
        'tables dans le schema tacct (max 50)',
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'tacct' ORDER BY table_name LIMIT 50`,
      ),
      await runRaw(pool, 'COUNT tacct."user" (qualifié)', 'SELECT COUNT(*)::int AS n FROM tacct."user"'),
      await runRaw(pool, 'COUNT "user" (non qualifié, search_path par défaut)', 'SELECT COUNT(*)::int AS n FROM "user"'),
      // Après SET search_path, on retente sur la même session (pool.query peut prendre des connexions différentes,
      // donc on ouvre un client dédié).
      await (async (): Promise<Row> => {
        const client = await pool.connect();
        try {
          await client.query('SET search_path TO tacct');
          const sp = await client.query('SHOW search_path');
          const c = await client.query('SELECT COUNT(*)::int AS n FROM "user"');
          return {
            label: 'après SET search_path TO tacct (même connexion)',
            ok: true,
            data: { search_path: sp.rows[0]?.search_path, count: c.rows[0]?.n },
            sql: 'SET search_path TO tacct; SHOW search_path; SELECT COUNT(*) FROM "user"',
          };
        } catch (e) {
          return {
            label: 'après SET search_path TO tacct (même connexion)',
            ok: false,
            data: null,
            error: e instanceof Error ? e.message : String(e),
          };
        } finally {
          client.release();
        }
      })(),
    ];
  } finally {
    await pool.end();
  }
}

async function diagnosePrisma(): Promise<Row[]> {
  const tries: { label: string; fn: () => Promise<unknown> }[] = [
    {
      label: 'prisma.$queryRaw("SHOW search_path")',
      fn: () => prisma.$queryRawUnsafe('SHOW search_path'),
    },
    {
      label: 'prisma.$queryRaw current_schema()',
      fn: () => prisma.$queryRawUnsafe('SELECT current_schema() AS s, current_database() AS db'),
    },
    {
      label: 'prisma.$queryRaw tacct."user" qualifié',
      fn: () => prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS n FROM tacct."user"'),
    },
    {
      label: 'prisma.$queryRaw "user" non qualifié',
      fn: () => prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS n FROM "user"'),
    },
    {
      label: 'prisma.user.count() (modèle Prisma)',
      fn: () => prisma.user.count(),
    },
    {
      label: 'prisma.study.count() (modèle Prisma)',
      fn: () => prisma.study.count(),
    },
  ];

  const rows: Row[] = [];
  for (const t of tries) {
    try {
      const data = await t.fn();
      rows.push({ label: t.label, ok: true, data });
    } catch (e) {
      rows.push({
        label: t.label,
        ok: false,
        data: null,
        error: e instanceof Error ? e.message.split('\n').slice(-3).join(' / ') : String(e),
      });
    }
  }
  return rows;
}

function fmt(value: unknown): string {
  return JSON.stringify(
    value,
    (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
}

function ResultTable({ rows }: { rows: Row[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
      <thead>
        <tr style={{ background: '#eee' }}>
          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Test</th>
          <th style={{ padding: '0.5rem', textAlign: 'left', width: '50%' }}>Résultat</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid #ddd', background: r.ok ? '#f0fdf4' : '#fef2f2' }}>
            <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
              <strong>{r.label}</strong>
              {r.sql && <pre style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', color: '#555' }}>{r.sql}</pre>}
            </td>
            <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
              {r.ok ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{fmt(r.data)}</pre>
              ) : (
                <pre style={{ margin: 0, color: '#dc2626', whiteSpace: 'pre-wrap' }}>{r.error}</pre>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DiagnosticPage() {
  const [pgRows, prismaRows] = await Promise.all([
    diagnosePg().catch((e): Row[] => [{
      label: 'diagnosePg a planté',
      ok: false,
      data: null,
      error: e instanceof Error ? e.message : String(e),
    }]),
    diagnosePrisma().catch((e): Row[] => [{
      label: 'diagnosePrisma a planté',
      ok: false,
      data: null,
      error: e instanceof Error ? e.message : String(e),
    }]),
  ]);

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Diagnostic DB</h1>
      <p>
        Cette page sonde la base directement (sans Prisma) puis via Prisma pour comparer.
        Pense aussi à regarder ta console <code>pnpm dev</code> pour voir le SQL exact que
        Prisma envoie (logs <code>query</code> actifs).
      </p>

      <h2>1. Requêtes brutes via <code>pg</code></h2>
      <ResultTable rows={pgRows} />

      <h2>2. Requêtes Prisma</h2>
      <ResultTable rows={prismaRows} />
    </div>
  );
}
