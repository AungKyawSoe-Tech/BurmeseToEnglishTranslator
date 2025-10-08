import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// This endpoint is intended to be called by Vercel outgoing webhooks when a deployment completes.
// It will forward a repository_dispatch event to GitHub to trigger the post-deploy CI workflow.
// Environment variables required on Vercel:
// - GITHUB_REPO = owner/repo (e.g. AungKyawSoe-Tech/BurmeseToEnglishTranslator)
// - GITHUB_REPO_DISPATCH_TOKEN = a GitHub personal access token with repo:public_repo or repo scope
// - VERCEL_WEBHOOK_SECRET (optional) - if set, the webhook should include a matching secret in the request body or header.

async function triggerRepoDispatch(repo: string, token: string, deploymentUrl: string) {
  const api = `https://api.github.com/repos/${repo}/dispatches`;
  const body = {
    event_type: 'vercel-deploy',
    client_payload: { deployment_url: deploymentUrl },
  };
  const resp = await fetch(api, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return resp;
}

function createAppJwt(appId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  };
  const pk = privateKey.replace(/\\n/g, '\n');
  return jwt.sign(payload as any, pk, { algorithm: 'RS256' });
}

async function getInstallationIdForRepo(repo: string, appJwt: string) {
  // GET /repos/:owner/:repo/installation
  const api = `https://api.github.com/repos/${repo}/installation`;
  const resp = await fetch(api, { headers: { Authorization: `Bearer ${appJwt}`, Accept: 'application/vnd.github+json' } });
  if (!resp.ok) throw new Error(`Failed to get installation id: ${resp.status}`);
  const data = await resp.json();
  return data.id;
}

async function createInstallationAccessToken(installationId: string, appJwt: string) {
  const api = `https://api.github.com/app/installations/${installationId}/access_tokens`;
  const resp = await fetch(api, { method: 'POST', headers: { Authorization: `Bearer ${appJwt}`, Accept: 'application/vnd.github+json' } });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to create installation token: ${resp.status} ${body}`);
  }
  const data = await resp.json();
  return data.token as string;
}

async function appendLog(entry: Record<string, any>) {
  try {
    const fs = await import('fs/promises');
    const os = await import('os');
    // Prefer /tmp on serverless platforms
    const tmpPath = '/tmp/vercel-webhook.log';
    const localPath = new URL('../../data/webhook.log', import.meta.url).pathname;
    const logPath = os.platform() === 'win32' ? localPath : tmpPath;
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    try {
      await fs.appendFile(logPath, line, 'utf8');
    } catch (e) {
      // fallback to local data folder
      await fs.mkdir(new URL('../../data', import.meta.url).pathname, { recursive: true });
      await fs.appendFile(localPath, line, 'utf8');
    }
  } catch (e) {
    // ignore logging errors
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    // Optional secret verification
    const secret = process.env.VERCEL_WEBHOOK_SECRET;
    if (secret) {
      const provided = req.headers['x-vercel-signature'] || (req.body && req.body.secret) || req.query.secret;
      if (!provided || provided !== secret) {
        res.status(401).json({ error: 'invalid webhook secret' });
        return;
      }
    }

    // Extract deployment URL from Vercel webhook payload
    // Vercel sends deployment info in the body; try common fields
    const payload = req.body || {};
    const deploymentUrl = payload.url || payload.deploymentUrl || payload.deployment?.url || payload.deployment?.meta?.url;
    if (!deploymentUrl) {
      // Try headers
      const forwarded = req.headers['x-should-be-deployment-url'] as string | undefined;
      if (forwarded) {
        // fallback
      }
    }

    const finalUrl = deploymentUrl || (payload.deployment && payload.deployment.url) || null;
    if (!finalUrl) {
      res.status(400).json({ error: 'deployment URL not found in webhook payload' });
      return;
    }

    const repo = process.env.GITHUB_REPO;
    if (!repo) {
      res.status(500).json({ error: 'GITHUB_REPO must be set in environment' });
      return;
    }

    // Prefer GitHub App authentication if available
    const appId = process.env.GITHUB_APP_ID;
    const appPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    let tokenToUse: string | null = null;
    if (appId && appPrivateKey) {
      try {
        const appJwt = createAppJwt(appId, appPrivateKey);
        let installationId = process.env.GITHUB_INSTALLATION_ID;
        if (!installationId) {
          installationId = String(await getInstallationIdForRepo(repo, appJwt));
        }
        tokenToUse = await createInstallationAccessToken(installationId, appJwt);
        await appendLog({ repo, deployment: finalUrl, auth_method: 'github-app', installation: installationId, status: 'got_token' });
      } catch (e) {
        console.error('GitHub App auth failed, falling back to PAT if available', e);
        await appendLog({ repo, deployment: finalUrl, auth_method: 'github-app', status: 'failed', error: String(e) });
      }
    }

    if (!tokenToUse) {
      tokenToUse = process.env.GITHUB_REPO_DISPATCH_TOKEN || null;
      if (tokenToUse) await appendLog({ repo, deployment: finalUrl, auth_method: 'pat', status: 'using_pat' });
      else await appendLog({ repo, deployment: finalUrl, auth_method: 'none', status: 'no_auth' });
    }

    if (!tokenToUse) {
      res.status(500).json({ error: 'No GitHub authentication configured (GITHUB_APP_ID+PRIVATE_KEY or GITHUB_REPO_DISPATCH_TOKEN)' });
      return;
    }

    const r = await triggerRepoDispatch(repo, tokenToUse, finalUrl);
    if (!r.ok) {
      const text = await r.text();
      await appendLog({ repo, deployment: finalUrl, status: 'dispatch_failed', code: r.status, details: text });
      res.status(500).json({ error: `GitHub dispatch failed: ${r.status}`, details: text });
      return;
    }

    await appendLog({ repo, deployment: finalUrl, status: 'dispatched' });
    res.status(200).json({ ok: true, deployment_url: finalUrl });
  } catch (err: any) {
    console.error('vercel-webhook error', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
