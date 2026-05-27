# BanLab — Vercel Deployment Guide

## ✅ Pre-Deploy Checklist

### 1. Required Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables** (set for Production, Preview, and Development):

| Variable | Type | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | Supabase → Project Settings → API → `anon` public key |
| `SUPABASE_URL` | Server | Same as above |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (secret 🔒) | Supabase → Project Settings → API → `service_role` key |

> ⚠️ Never commit `SUPABASE_SERVICE_ROLE_KEY` to git. It bypasses RLS.

### 2. Build Settings (auto-detected, no action needed)

- **Framework Preset:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `.vercel/output`
- **Install Command:** `npm install`

## 🚀 Deploy Steps

1. Push this repo to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add all 5 env vars from the table above
4. Click **Deploy**
5. After deploy, visit `https://your-app.vercel.app/api/health` to verify

## 🩺 Health Check Endpoint

`GET /api/health` returns:

```json
{
  "status": "ok",
  "timestamp": "2026-05-27T...",
  "missingServerEnv": [],
  "requiredPublicEnv": ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
  "requiredServerEnv": ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
}
```

- **200 OK** → All server env vars present
- **503** → Some env vars missing (see `missingServerEnv`)

The app itself also shows a friendly config screen on boot if `VITE_*` vars are missing.

## 🐛 Common Vercel Build Errors

| Error | Fix |
|---|---|
| `Missing Supabase environment variable(s)` | Add the 5 env vars above and **Redeploy** |
| `Cannot find module '@tanstack/react-start'` | Run `npm install` locally and commit `package-lock.json` |
| Build succeeds but blank page | Open `/api/health` — likely missing `VITE_*` vars |
| 404 on all routes | Confirm Output Directory = `.vercel/output` |
| `Function exceeded timeout` | Vercel Hobby has 10s limit — upgrade or optimize server fn |

## 🔗 Custom Domain

Vercel → Project → Settings → Domains → Add your domain → Follow DNS instructions.
