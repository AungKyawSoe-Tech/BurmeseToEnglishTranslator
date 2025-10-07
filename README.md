# Burmese <> English Translator Plug-in

A modern and intuitive web plug-in to translate text from Burmese to English using the power of the Gemini API. This plug-in can be easily embedded into any website to provide on-page translation capabilities.

## Features

*   **Embeddable Widget:** Add a full-featured translator to any website with a single script tag.
*   **Bidirectional Translation:** Instantly translate text between Burmese and English.
*   **Voice Input:** Use the microphone to speak in either language for translation.
*   **Text-to-Speech:** Listen to the translated text spoken aloud.
*   **Translation History:** Recent translations are saved locally for quick access.
*   **Isolated Styling:** Uses a Shadow DOM to prevent any style conflicts with the host website.
*   **PWA Ready:** The standalone version can be installed on mobile devices.

---

## Getting Started: Setting Up Your API Key

This application requires a Google Gemini API key to function. The key must be provided as an environment variable named `API_KEY`.

### How It Works

The application code securely accesses the API key using `process.env.API_KEY`. You do not need to modify any source code files to add your key.

### For Local Development & Testing

Your local development environment must be configured to provide the `API_KEY` environment variable. If the key is not provided, the plug-in will still load, but translation attempts will show an error message inside the widget.

### For Production Deployment (Vercel)

When you deploy to Vercel, you must set the `API_KEY` as a secret environment variable in your project settings. The deployment guide below has detailed instructions for this.

---

## How to Embed the Plug-in on Your Website

Once you have deployed the plug-in (see next section), you can add it to any website by adding the following code to your HTML file.

1.  Add this `<script type="importmap">` tag to the `<head>` of your HTML file. This tells the browser where to find the necessary libraries.

    ```html
    <script type="importmap">
    {
      "imports": {
        "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
        "@google/genai": "https://aistudiocdn.com/@google/genai@^1.22.0",
        "react/": "https://aistudiocdn.com/react@^19.2.0/",
        "react": "https://aistudiocdn.com/react@^19.2.0"
      }
    }
    </script>
    ```

2.  Add this `<script>` tag just before the closing `</body>` tag. **Make sure to replace `your-project-name.vercel.app` with the actual URL of your deployed plug-in.**

    ```html
    <script type="module" src="https://your-project-name.vercel.app/index.tsx"></script>
    ```

That's it! The plug-in will automatically appear as a floating button on the page.

## How to Deploy (So you can use it on your sites!)

To use this plug-in, you need to host its files online. We recommend using Vercel, a free and easy-to-use hosting service.

### Prerequisites

1.  **GitHub Account:** You'll need a free GitHub account.
2.  **Vercel Account:** Sign up for a free Vercel account.

### Step-by-Step Deployment Guide

**Step 1: Push Your Code to GitHub**

1.  Create a new repository on GitHub.
2.  Follow the instructions on GitHub to push your project files to this new repository.

**Step 2: Deploy with Vercel**

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New... -> Project".
2.  Import your newly created GitHub repository.
3.  Vercel will automatically detect the project settings.
4.  **Crucial Step:** Before deploying, you must add your Gemini API Key.
    *   Expand the "Environment Variables" section.
    *   Add a new variable:
        *   **Name:** `API_KEY`
        *   **Value:** Paste your Google Gemini API Key here.
    *   Click "Add".
5.  Click the "Deploy" button.

Vercel will deploy your plug-in and give you a public URL (e.g., `your-project-name.vercel.app`). Use this URL in the embed script mentioned above.