# Segadty POS - Deployment Guide

This guide explains how to deploy the Segadty POS application to Vercel and connect it to Google Sheets.

## Prerequisites

1.  **GitHub Account**: Required for Vercel deployment.
2.  **Vercel Account**: For hosting the application (Free tier).
3.  **Google Cloud Account**: To enable Google Sheets API.
4.  **Firebase Project**: For authentication and database.

## Step 1: Push Code to GitHub

1.  Initialize a git repository if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on GitHub (e.g., `segadty-pos`).
3.  Link your local repository to GitHub:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/segadty-pos.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Deploy to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `segadty-pos` repository.
4.  In the "Configure Project" screen:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./`
5.  **Environment Variables**: You will need to add these later for full functionality (see below).
6.  Click **Deploy**.

## Step 3: Configure Environment Variables

Create a `.env.local` file locally (and add these to Vercel settings) with the following keys:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Sheets API (Server-side only)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

## Step 4: Google Sheets Integration Setup

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable **Google Sheets API**.
4.  Go to **Credentials** -> **Create Credentials** -> **Service Account**.
5.  Download the JSON key file for the service account.
6.  **Important**: Share your Google Sheet with the `client_email` found in the JSON file (give it Editor access).

## Step 5: Verification

1.  Visit your Vercel URL (e.g., `https://segadty-pos.vercel.app`).
2.  Login with the default mock credentials (or implement real Firebase Auth).
3.  Navigate to **Settings** to check connection status.

## Troubleshooting

*   **Build Failures**: Check the Vercel logs. Ensure all dependencies are in `package.json`.
*   **Database Errors**: Check your Firebase rules and API keys.
*   **Google Sheets Error**: Ensure the service account email is added as an **Editor** to the specific Google Sheet.
