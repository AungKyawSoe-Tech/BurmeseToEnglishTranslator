// Minimal local server to emulate the serverless share endpoint for development.
// Usage: node serverless-local.js
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SHARES_FILE = path.join(DATA_DIR, 'shares.json');

function readShares() {
  try {
    if (!fs.existsSync(SHARES_FILE)) return {};
    const raw = fs.readFileSync(SHARES_FILE, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeShares(obj) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SHARES_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('writeShares error', e);
  }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  if (parsed.pathname === '/api/share') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { text } = JSON.parse(body || '{}');
          if (!text) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'text required' }));
            return;
          }
          const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
          const shares = readShares();
          shares[id] = { id, text, createdAt: new Date().toISOString() };
          writeShares(shares);
          const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost:5173';
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id, url: `${origin}/share?id=${encodeURIComponent(id)}` }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
      return;
    }

    if (req.method === 'GET') {
      const id = parsed.query.id;
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id required' }));
        return;
      }
      const shares = readShares();
      if (!shares[id]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(shares[id]));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

const port = process.env.PORT || 6789;
server.listen(port, () => {
  console.log('serverless-local listening on', port);
});
