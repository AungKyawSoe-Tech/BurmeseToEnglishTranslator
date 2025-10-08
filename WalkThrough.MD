## Live Demo & Deployment Walkthrough

This walkthrough shows how to deploy the BurmeseToEnglishTranslator app to Vercel, enable the serverless share endpoint, and optionally configure Supabase to persist shares. It also covers local development and verification steps so you can run a live demo.

Prerequisites
- Node.js (16+ recommended)
- A Vercel account (https://vercel.com)
- A Supabase account (optional, https://supabase.com)
- A Facebook App ID if you want to test Facebook Login / Canvas (https://developers.facebook.com)

Summary of steps
1. Prepare the project locally
2. Configure Supabase (optional) and create the `shares` table
3. Deploy to Vercel (serverless functions + static client)
4. Set environment variables in Vercel
5. Verify the `/api/share` serverless endpoint and the client
6. (Optional) Configure Facebook Canvas and test embedding

1) Prepare the project locally

- Clone or pull the repo locally and install dependencies:

```powershell
cd C:\Work\BurmeseToEnglishTranslator
npm install
```

- Create a local `.env` file with your Facebook App ID (if available) and any local overrides:

```
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
# Optional: set VITE_SHARE_API to an external deployed API if you prefer
# VITE_SHARE_API=https://your-api-host.example.com
```

- Start the local API and client together for testing:

```powershell
npm run dev:all
```

The UI will be available at the port Vite reports (usually http://localhost:5173). The local serverless API will be available at http://localhost:6789 and exposes `/api/share`.

2) Configure Supabase (optional, recommended for production persistence)

- Create a Supabase project at https://app.supabase.com and copy the API URL and anon/public key.

- Create a `shares` table. Minimal SQL for a table (Run in Supabase SQL editor):

```sql
create table public.shares (
  id text primary key,
  text text,
  created_at timestamptz default now()
);

-- Allow inserts from your server/client by setting Row Level Security policies appropriately or use service role on server-side.
```

Notes on Supabase keys
- For server-side writes from the serverless function, use the Supabase service role key and set it as `SUPABASE_KEY` in Vercel (server environment variable). Do NOT expose the service role key in client-side envs.

3) Deploy to Vercel

- Create a new project on Vercel by importing the Git repository.
- Vercel will detect the project and configure a build. The project already contains a serverless function in `api/share.ts` which Vercel will deploy automatically.

Recommended Vercel settings
- Build Command: `npm run build` (or leave empty; Vercel picks up `vite` automatically)
- Output Directory: `dist` (Vite default)

4) Set environment variables in Vercel

- In your Vercel project dashboard, go to Settings > Environment Variables and add the following:

  - `VITE_FACEBOOK_APP_ID` = your Facebook App ID (if using Facebook features)
  - `SUPABASE_URL` = your Supabase REST/URL (e.g., https://xyz.supabase.co)
  - `SUPABASE_KEY` = your Supabase service_role key (keep this secret, server-only)

Important: On Vercel, mark `SUPABASE_KEY` as a secret and **set it only for the Production/Preview/Development environments where needed**. `VITE_` prefixed variables are exposed to the client after build — so only put non-secret values there.

5) Verify the serverless endpoint and client

- After deployment, your serverless endpoint will be available at:

```
https://<your-vercel-deployment>.vercel.app/api/share
```

- Test creating a share (replace the domain with your deployment URL):

```bash
curl -X POST "https://<your-vercel-deployment>.vercel.app/api/share" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world — a test share"}'
```

Expected response (201):

```json
{ "id": "<id>", "url": "https://<your-vercel-deployment>.vercel.app/share?id=<id>", ... }
```

- Open the returned `url` in a browser; it should render the shared translation using the client `ShareView` route.

6) Configure Facebook Canvas and test embedding (optional)

- If you want to embed the app in Facebook Canvas for a live demo inside Facebook:
  1. In the Facebook App Dashboard (developers.facebook.com/apps), go to Settings > Basic and add your Vercel domain (e.g. `your-app.vercel.app`) to "App Domains".
  2. In "Facebook Login > Settings" add your `https://your-app.vercel.app/` to "Valid OAuth Redirect URIs".
  3. Add/enable the "Facebook Canvas" product and set the Canvas URL to `https://your-app.vercel.app/` (or your ngrok URL for local testing).

Testing canvas locally with ngrok

- Start the client locally:

```powershell
npm run dev
```

- Start ngrok in a separate terminal pointing to the Vite port (replace 5173 with your observed port):

```powershell
npx ngrok http 5173
```

- Copy the ngrok HTTPS URL (e.g. `https://abcd-1234.ngrok.io`) and add it to the Facebook App settings as the Canvas URL and App Domain. Also add it to valid OAuth redirect URIs.

Troubleshooting
- If the FB Canvas shows a blank page, inspect the browser console for X-Frame/CSP errors; ensure `X-Frame-Options` is not DENY and `frame-ancestors` CSP allows facebook.com if necessary.
- If the share API 404s, confirm the serverless function is deployed and the path is `/api/share`. Use the curl test above to confirm.
- If shares don't persist on Vercel, ensure `SUPABASE_URL` and `SUPABASE_KEY` are set and that the Supabase table exists and has insert permissions for the provided key.

Extras and automation
- You may add a `vercel.json` file to customize function runtime, routes, and headers. Example minimal `vercel.json` (optional):

```json
{
  "version": 2,
  "builds": [
    { "src": "api/*.ts", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "(.*)", "dest": "/index.html" }
  ]
}
```

Closing notes
- This repository already contains:
  - `api/share.ts` — the serverless function for Vercel
  - `serverless-local.cjs` — a local dev server exposing `/api/share`
  - `components/ShareView.tsx` — the client view that renders shared text from `?id=` or `?text=`

If you'd like, I can:
- Create `vercel.json` in the repo and wire a GitHub/Vercel integration for zero-config deploys.
- Replace Supabase REST calls with the official Supabase client in `api/share.ts`.
- Add a short CI test that automatically POSTs to the deployed `/api/share` and verifies a 201 response.

Which of those would you like me to implement next?

## Automatic post-deploy CI (Vercel -> GitHub)

This repo includes an endpoint `api/vercel-webhook.ts` which you can use to trigger a GitHub repository_dispatch after a Vercel deployment completes. The repository_dispatch triggers the `Post-deploy Share Test` GitHub Actions workflow which runs `tests/test-share.js` against the new deployment URL.

Setup steps:

1. Create a GitHub personal access token with `repo` permissions (or `public_repo` for public repos). Save it as a secret in your Vercel project as `GITHUB_REPO_DISPATCH_TOKEN`.
2. In Vercel, go to your project -> Settings -> Git -> Outgoing Webhooks (or Project Settings -> Webhooks) and add a webhook for the `Deployment` event pointing to:

  `https://<your-vercel-deploy>.vercel.app/api/vercel-webhook`

  - If you want to secure the webhook, set `VERCEL_WEBHOOK_SECRET` in Vercel and configure the webhook to send that secret in the body/header. Also set `VERCEL_WEBHOOK_SECRET` as a secret environment variable in the Vercel project.
3. Also add `GITHUB_REPO` as an environment variable in Vercel with the value `owner/repo` (e.g. `AungKyawSoe-Tech/BurmeseToEnglishTranslator`).
4. After deployment, Vercel will call the webhook, which will forward a repository_dispatch event to GitHub with event_type `vercel-deploy` and a payload `{ deployment_url }`.
5. The `Post-deploy Share Test` workflow listens for that repository_dispatch and runs `tests/test-share.js` using the deployment URL provided in the payload.

Notes:
- Ensure that `GITHUB_REPO_DISPATCH_TOKEN` has permissions to create `repository_dispatch` events (repo scope).
- The webhook implementation is minimal; adjust verification, logging, and retry logic for production usage.

### Webhook logging

- The webhook writes compact JSON lines to a log file for debugging:
  - On serverless Linux environments (like Vercel) it attempts to write to `/tmp/vercel-webhook.log`.
  - For local development it writes to `./data/webhook.log`.

- To inspect logs locally:

```powershell
type .\data\webhook.log
```

- On Vercel you can view function logs via the Vercel dashboard (Function logs) or connect to your logging provider. `/tmp` is ephemeral on serverless, so use the Vercel logs UI to see messages produced by the function.

### Use a GitHub App instead of a Personal Access Token (recommended)

Using a GitHub App is more secure than a personal access token. Steps:

1. Create a GitHub App:
  - Go to https://github.com/settings/apps -> New GitHub App
  - Fill required fields. Set "Webhook URL" to your Vercel webhook receiver (optional).
  - Assign required Repository permissions (e.g., `Actions - Read & write` or `Repository metadata` and `Contents` if needed). For repository_dispatch you only need to be able to create repository_dispatch events via the REST API using an installation token.
  - Save and generate a private key. Download the `.pem` file.

2. Install the GitHub App on your repository (or org) and note the installation id.

3. In your Vercel Project Environment Variables, add:
  - `GITHUB_APP_ID` = the GitHub App ID (a numeric value)
  - `GITHUB_APP_PRIVATE_KEY` = the private key contents (paste the PEM content; replace newlines with `\n` when setting via the UI or use Vercel CLI to set multiline secrets)
  - `GITHUB_INSTALLATION_ID` = optional — if not provided the webhook will query GitHub to find the installation for the repository.

4. The webhook will use the app credentials to create a short-lived installation access token and use it to call the repository_dispatch API. This avoids storing a long-lived personal access token.

Notes on private key formatting
- If the Vercel UI strips newlines, replace actual newlines with the two-character sequence `\n` and the server code will convert them back. Example when setting via CLI or API you can set the raw PEM contents.


