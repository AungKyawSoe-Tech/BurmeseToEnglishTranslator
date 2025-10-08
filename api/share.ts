import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Serverless share endpoint for Vercel (also works on other platforms that use same handler shape)
// - POST /api/share  { text }
//   -> returns { id, url }
// - GET /api/share?id=... or GET /api/share/[id]
//   -> returns { id, text, createdAt }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { 'x-from': 'api/share' } } });
}

async function insertToSupabase(id: string, text: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('shares').insert([{ id, text }]).select().limit(1);
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

async function fetchFromSupabase(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shares').select('*').eq('id', id).limit(1);
  if (error) return null;
  return data && data.length ? data[0] : null;
}

async function readLocal(id: string) {
  try {
    const fs = await import('fs/promises');
    const p = new URL('../data/shares.json', import.meta.url);
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw || '{}');
    return obj[id] || null;
  } catch (e) {
    return null;
  }
}

async function writeLocal(id: string, text: string) {
  const fs = await import('fs/promises');
  const p = new URL('../data/shares.json', import.meta.url);
  let obj = {} as Record<string, any>;
  try {
    const raw = await fs.readFile(p, 'utf8');
    obj = raw ? JSON.parse(raw) : {};
  } catch (e) {
    // ignore
  }
  obj[id] = { id, text, createdAt: new Date().toISOString() };
  await fs.mkdir(new URL('..', p).pathname + '/data', { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2), 'utf8');
  return obj[id];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { text } = req.body || {};
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'text is required' });
        return;
      }
      const id = randomUUID().slice(0, 12);
      let record: any = null;
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          record = await insertToSupabase(id, text);
        } catch (e) {
          // fallback to local
          record = await writeLocal(id, text);
        }
      } else {
        record = await writeLocal(id, text);
      }
      const url = `${req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'] + '://' : 'https://'}${req.headers.host || ''}/share?id=${encodeURIComponent(id)}`;
      res.status(201).json({ id, url, record });
      return;
    }

    // GET
    const id = (req.query.id as string) || (req.query[0] as string);
    if (!id) {
      res.status(400).json({ error: 'id query required' });
      return;
    }
    let record = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      record = await fetchFromSupabase(id);
    }
    if (!record) {
      record = await readLocal(id);
    }
    if (!record) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(record);
  } catch (e: any) {
    console.error('share handler error', e);
    res.status(500).json({ error: e?.message || String(e) });
  }
}
