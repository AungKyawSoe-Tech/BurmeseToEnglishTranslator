const fetch = require('node-fetch');

async function run() {
  const apiBase = process.env.TEST_API_BASE; // e.g. https://your-deploy.vercel.app
  if (!apiBase) {
    console.error('TEST_API_BASE env required');
    process.exit(2);
  }

  const url = `${apiBase.replace(/\/$/, '')}/api/share`;
  console.log('POST ->', url);
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'CI test share from repo' }),
  });
  if (resp.status !== 201) {
    console.error('Unexpected status', resp.status);
    const body = await resp.text();
    console.error(body);
    process.exit(1);
  }
  const data = await resp.json();
  if (!data || !data.id || !data.url) {
    console.error('Bad response', data);
    process.exit(1);
  }
  console.log('Created share', data.id, data.url);

  // Check that the share URL is reachable
  const hit = await fetch(data.url);
  if (hit.status !== 200) {
    console.error('Share URL not reachable', hit.status);
    process.exit(1);
  }
  console.log('Share URL OK');
}

run().catch((err) => { console.error(err); process.exit(1); });
