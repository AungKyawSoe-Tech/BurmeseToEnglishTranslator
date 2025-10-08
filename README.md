<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/10HWtFsLcFd_OxTDgwNwaUdiYP7xgTrey

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Enable Facebook sharing

1. Create a Facebook App at https://developers.facebook.com/apps and note the App ID.
2. Add the App Domains and OAuth redirect settings as needed (for local development you can use http://localhost:5173).
3. Create a file named `.env` in the project root and add:

```
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

4. Restart the dev server. The app will show a "Sign in with Facebook" button in the UI. Sharing requires a valid App ID and an app in development or live mode depending on the account used.

Note: The Facebook SDK is loaded at runtime. If `VITE_FACEBOOK_APP_ID` is not set the Facebook panel will be disabled.

## Test inside Facebook (Canvas) using ngrok

If you want to test the app embedded inside Facebook (Canvas), follow these steps. Canvas apps must be served over HTTPS and need a public URL — ngrok is ideal for local testing.

1. Install ngrok (if you don't have it):

   ```bash
   npm i -g ngrok
   ```

2. Start the dev server in one terminal:

   ```powershell
   cmd /c "cd C:\Work\BurmeseToEnglishTranslator && npm run dev"
   ```

3. In another terminal, start an ngrok tunnel to the Vite port (default 5173):

   ```powershell
   npx ngrok http 5173
   ```

   ngrok will print a public HTTPS URL like `https://abcd-1234.ngrok.io`.

4. In your Facebook App settings (developers.facebook.com/apps):
   - In "Settings > Basic", add the `ngrok` domain to "App Domains" (e.g. `abcd-1234.ngrok.io`).
   - In "Facebook Login > Settings", add your ngrok URL to "Valid OAuth Redirect URIs" (e.g. `https://abcd-1234.ngrok.io/`).
   - In "Products > Facebook Canvas" enable the Canvas and set the Canvas URL to your ngrok URL. Choose the 'Canvas width' and 'Canvas height' appropriate for your app.

5. Make sure `VITE_FACEBOOK_APP_ID` in `.env` matches your App ID. Restart the dev server if you change `.env`.

6. Visit the Facebook App Canvas URL (there's a link in the App Dashboard) — Facebook will iframe your ngrok-hosted app. If everything is configured the FB meta tag and canvas settings will allow your app to be embedded.

Notes and troubleshooting
 - Facebook may block embedding if your server sets `X-Frame-Options: DENY` or `frame-ancestors` CSP; Vite dev server does not add those headers by default, but some proxies or hosts might.
 - When testing in ngrok, ensure the ngrok URL is added to App Domains and Redirect URIs. Facebook sometimes caches settings — reloading the App Dashboard or waiting a minute helps.
 - For production, host on HTTPS and configure your production domain in the Facebook app settings instead of ngrok.

## Serverless share endpoint (local dev + deploy)

This project includes a small serverless share endpoint to make shared links permanent (recommended over localStorage). There are two ways to run it:

1) Local dev (quick)

    - Start the client + local API together:

       ```powershell
       npm run dev:all
       ```

       This runs the Vite dev server and a small local server at http://localhost:6789 which exposes `/api/share`.

    - To create a share from the client, the app will POST to `/api/share` (relative) and receive back a JSON object with `id` and `url`.

    - You can also run the API by itself:

       ```powershell
       npm run dev:api
       ```

2) Deploy to Vercel (production)

    - The serverless function `api/share.ts` is compatible with Vercel serverless functions. Deploy the repo to Vercel and the endpoint will be available at `https://<your-deployment>/api/share`.

    - Optionally, configure Supabase to store shares by setting `SUPABASE_URL` and `SUPABASE_KEY` as environment variables in Vercel. The function will write/fetch from Supabase when those are set; otherwise it falls back to local file storage (for dev only).

Client configuration: VITE_SHARE_API

 - By default the client will POST to a relative `/api/share` path which works when your serverless functions are co-hosted with the client (for example on Vercel).
 - To point the client to an external API base (for example a separate API deployment), set the `VITE_SHARE_API` environment variable in your `.env` or Vercel environment, for example:

```
VITE_SHARE_API=https://your-api-host.example.com
```

 - When `VITE_SHARE_API` is set the client will POST to `${VITE_SHARE_API}/api/share`. If the API request fails, the client falls back to storing the share in localStorage.

Notes
 - The local server stores shares in `data/shares.json` for development only. For production, use Vercel and (optionally) Supabase or any other DB to persist shared items across deployments.
 - After deploying serverless functions, update Facebook share links or `VITE_FACEBOOK_APP_ID` as needed in your production `.env` or Vercel environment variables.
