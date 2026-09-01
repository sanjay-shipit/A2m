# Adtomate Solutions — Website

Marketing website for **Adtomate Solutions Pvt. Ltd.**, a technology & AI consulting
company building intelligent products, AI agents, MCP servers, scalable software
systems, and next-generation digital solutions.

## Overview

A fast, dependency-free static site. No build step — open `index.html` in a browser
or serve the folder with any static file server.

### Design

- **Palette:** deep navy + electric blue on a light, premium base (derived from the
  brand logo), with a dark navy CTA band and footer for contrast.
- **Type:** Sora (display), Manrope (body), JetBrains Mono (technical labels) via Google Fonts.
- **Motion:** staggered scroll reveals, an animated agent-orchestration graph in the hero,
  and a technology marquee. All motion respects `prefers-reduced-motion`.

### Sections

Hero → technology marquee → **What We Do** (services) → **Modern Technology Stack** →
**Our Products** (Sociovia, Sociovia Chat, Sociovia Engage, SocioOptimizer, + more) →
**Why Adtomate** → **Our Approach** → **CTA & Contact** (with a no-backend `mailto` form) → footer.

## Structure

```
index.html                     Single-page site markup
assets/
  css/styles.css               All styles + responsive + reduced-motion
  js/main.js                   Nav, mobile menu, scroll reveals, scroll-spy, contact form
  adtomate-logo.png            Original brand logo (source)
  adtomate-logo-trans.png      Full lockup, transparent background
  adtomate-mark.png            "A" monogram — used in the nav / favicon
  adtomate-mark-light.png      "A" monogram for dark backgrounds (footer)
  favicon.png                  Browser tab icon
```

## Run locally

```bash
# any static server, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment — Firebase Hosting (CI/CD)

Deploys are automated with GitHub Actions (`.github/workflows/firebase-hosting.yml`):

| Event | Action |
| --- | --- |
| Pull request | Deploys to a temporary **preview channel**; the preview URL is posted on the PR (expires in 7 days). |
| Merge to `main` | Deploys to the **live channel** (production). |

Hosting config lives in `firebase.json` (long-cache immutable assets, no-cache HTML,
clean URLs, security headers, and `404.html` as the not-found page).

### One-time setup

1. Create a Firebase project and enable Hosting, then set the project id:
   - edit `.firebaserc` → replace `adtomate-solutions` with your project id, **and/or**
   - add a repo **variable** `FIREBASE_PROJECT_ID` (Settings → Secrets and variables → Actions → Variables).
2. Generate the deploy credentials (creates the secret automatically):
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase init hosting:github   # links this repo, adds FIREBASE_SERVICE_ACCOUNT secret
   ```
   Or add the secret manually: **FIREBASE_SERVICE_ACCOUNT** = the JSON key of a service
   account with the *Firebase Hosting Admin* role.
3. Push a PR to get a preview URL; merge to `main` to go live.

### Manual deploy (optional)

```bash
firebase deploy --only hosting
```

> **Note:** the benchmark figures on the site (ROAS, cost-per-lead, response times, etc.)
> are illustrative placeholders — replace them with your real audited numbers before launch.

## Contact

**Adtomate Solutions Private Limited**
71 S/F R/S F/P, Hari Nagar Ashram, South Delhi, New Delhi – 110014, India
Phone: +91 96677 96730 · Email: contact@sociovia.com · Product: [Sociovia.com](https://sociovia.com)
