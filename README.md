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

## Deployment — Firebase Hosting (CI/CD, phone-only)

No laptop or terminal required. GitHub Actions (`.github/workflows/firebase-hosting.yml`)
deploys to Firebase project **`sociovia-c9473`**, into the Hosting site
**`sociovia-c9473-81765`** (the one linked to your `adtomate-solutions` web app — separate
from the project default, so the Sociovia app is never touched):

| Event | Action |
| --- | --- |
| Commit to the **default branch** | Deploys **live** → `https://sociovia-c9473-81765.web.app` |
| Pull Request | Deploys a temporary **preview** URL, posted as a PR comment (expires 7 days) |

Hosting config is in `firebase.json` (`site: sociovia-c9473-81765`, immutable long-cache
assets, no-cache HTML, clean URLs, security headers, `404.html`). Google Analytics is wired
in `assets/js/firebase.js`. **Full step-by-step phone guide: [`DEPLOY.md`](DEPLOY.md).**

### One-time setup (from your phone)

In **github.com** (a browser, not the app) → repo **Settings → Secrets and variables →
Actions → Secrets** → add `FIREBASE_SERVICE_ACCOUNT` = the JSON key of a service account
with the *Firebase Hosting Admin* role (create it in the Google Cloud console — see
[`DEPLOY.md`](DEPLOY.md)).

Then commit anything to the default branch → the **Actions** tab shows the deploy → live.

> **Note:** the benchmark figures on the site (ROAS, cost-per-lead, response times, etc.)
> are illustrative placeholders — replace them with your real audited numbers before launch.

## Contact

**Adtomate Solutions Private Limited**
71 S/F R/S F/P, Hari Nagar Ashram, South Delhi, New Delhi – 110014, India
Phone: +91 96677 96730 · Email: contact@sociovia.com · Product: [Sociovia.com](https://sociovia.com)
