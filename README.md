# Burmese <> English Translator

A modern and intuitive web application to translate text from Burmese to English using the power of the Gemini API. This application is a Progressive Web App (PWA), which means you can install it on your phone for a native app-like experience.

## Features

*   **Bidirectional Translation:** Instantly translate text between Burmese and English.
*   **Voice Input:** Use your microphone to speak in either language for translation.
*   **Text-to-Speech:** Listen to the translated text spoken aloud.
*   **Translation History:** Your recent translations are saved for quick access.
*   **Responsive Design:** Works beautifully on desktop, tablets, and mobile phones.
*   **PWA Ready:** "Install" the app on your Android or iPhone for easy access from your home screen.
*   **Ready for the Play Store:** Package the app for Android and the Google Play Store.

---

## Getting Started: Setting Up Your API Key

Before you can run or deploy the app, you need to provide your Google Gemini API key.

### For Local Development & Testing

1.  **Get your API Key:** If you don't have one, get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Create your config file:** In the project's root directory, find the file named `config.example.ts`.
3.  **Rename the file** from `config.example.ts` to `config.ts`.
4.  **Add your key:** Open the new `config.ts` and paste your API key into the placeholder string.

Your `config.ts` file is listed in `.gitignore`, so it will be kept private on your computer and never uploaded to GitHub.

### For Production Deployment (Vercel)

When you deploy your app to Vercel, you will use its Environment Variables system. This is the secure, standard way to handle secrets in production. The instructions are in the deployment section below.

---

## How to Deploy (So your friends can try it!)

To share this application, you need to host it online. We recommend using Vercel, a free and easy-to-use hosting service for web projects.

### Prerequisites

1.  **GitHub Account:** You'll need a free GitHub account to store your code.
2.  **Vercel Account:** Sign up for a free Vercel account using your GitHub account.

### Step-by-Step Deployment Guide

**Step 1: Push Your Code to GitHub**

1.  Create a new repository on GitHub.
2.  Follow the instructions on GitHub to push your project files to this new repository. **Do not** push your `config.ts` file (it should be ignored automatically by `.gitignore`).

**Step 2: Deploy with Vercel**

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New... -> Project".
2.  Under "Import Git Repository", select your newly created GitHub repository and click "Import".
3.  Vercel will automatically detect that this is a static web project. You don't need to change any build settings.
4.  **Crucial Step:** Before deploying, you must add your Gemini API Key.
    *   Expand the "Environment Variables" section.
    *   Add a new variable:
        *   **Name:** `API_KEY`
        *   **Value:** Paste your Google Gemini API Key here.
    *   Click "Add".
5.  Click the "Deploy" button.

That's it! Vercel will build and deploy your site, giving you a public URL (e.g., `your-project-name.vercel.app`) that you can share with your friends.

## How to Use on Your Phone (as an App)

This translator is a Progressive Web App (PWA), allowing you to add it to your phone's home screen.

### On Android (using Chrome)

1.  Open the Vercel URL of your deployed app in the Chrome browser.
2.  Tap the three-dot menu icon in the top-right corner.
3.  Tap **"Install app"** or **"Add to Home Screen"**.
4.  Follow the on-screen prompts. The app icon will now appear on your home screen.

### On iPhone (using Safari)

1.  Open the Vercel URL of your deployed app in the Safari browser.
2.  Tap the "Share" icon (a square with an arrow pointing up) at the bottom of the screen.
3.  Scroll down the list of options and tap **"Add to Home Screen"**.
4.  Confirm the name and tap "Add". The app icon will now appear on your home screen.

## Publishing to Google Play Store

To publish your app to the Google Play Store for wider distribution on Android, follow the detailed instructions in the deployment guide:

**➡️ [Android Deployment Guide](./ANDROID_DEPLOYMENT.md)**

## Customizing Icons

This project includes placeholder SVG icons for the PWA. You can replace `icon-192.svg` and `icon-512.svg` in the `/icons` directory with your own custom icons (PNG format is recommended for best compatibility). If you use PNGs, make sure to update `manifest.json` to reflect the new file names and types.
