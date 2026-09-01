# Deploy from your phone — Firebase Hosting

You need **no laptop and no terminal**. Everything below is done in a mobile browser
(Chrome/Safari) using the Firebase console, the Google Cloud console, and github.com.

> Tip: use github.com in a **browser**, not the GitHub mobile app — the app hides
> *Settings → Secrets*. In the browser you can tap "Desktop site" if a menu is hard to reach.

Once set up, **every commit you make to the default branch deploys the site live.**
Your live URL will be `https://<your-project-id>.web.app`.

---

## Step 1 — Create the Firebase project (Firebase console)

1. Open **console.firebase.google.com** → **Add project** (or open an existing one).
2. Name it (e.g. `adtomate`). Finish the wizard.
3. Open **Project settings** (gear icon, top-left) → **General** tab.
   Copy the **Project ID** (looks like `adtomate-1a2b3`). You'll need it in Step 3.
4. In the left menu: **Build → Hosting → Get started**. You can stop as soon as
   Hosting is enabled — ignore the CLI instructions it shows.

## Step 2 — Create the deploy key (Google Cloud console)

This is a "service account" the robot uses to deploy.

1. Open **console.cloud.google.com** → make sure your project is selected (top bar).
2. Go to **IAM & Admin → Service Accounts**
   (direct: `console.cloud.google.com/iam-admin/serviceaccounts`).
3. **+ Create service account**
   - Name: `github-deploy` → **Create and continue**.
   - Role: search and pick **Firebase Hosting Admin** → **Continue** → **Done**.
4. Tap the new account in the list → **Keys** tab → **Add key → Create new key** →
   **JSON** → **Create**. A `.json` file downloads to your phone.
5. Open that file (Files app / Downloads) and **copy its entire contents** — everything
   from the first `{` to the last `}`.

## Step 3 — Add the two settings to GitHub (github.com in a browser)

Go to the repo → **Settings → Secrets and variables → Actions**.

1. **Secrets** tab → **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the whole JSON you copied → **Add secret**.
2. **Variables** tab → **New repository variable**
   - Name: `FIREBASE_PROJECT_ID`
   - Value: your Project ID from Step 1 (e.g. `adtomate-1a2b3`) → **Add variable**.

## Step 4 — Deploy

1. Make any commit to the **default branch** (e.g. edit `README.md` → **Commit changes**),
   or re-run the latest workflow: **Actions** tab → open the newest run → **Re-run jobs**.
2. Open the **Actions** tab → **Deploy to Firebase Hosting** → the **Live deploy** job.
3. When it turns green ✅, your site is live at **`https://<your-project-id>.web.app`**
   (also `https://<your-project-id>.firebaseapp.com`).

---

## Editing the site later (all from your phone)

- On github.com, open any file (e.g. `index.html`) → pencil ✏️ → edit → **Commit**.
  The commit to the default branch auto-deploys.
- Prefer a safe preview first? Commit to a **new branch** and open a **Pull Request** —
  the Actions bot comments a temporary **preview URL** so you can check before it goes live.

## Custom domain (e.g. adtomate.com)

Firebase console → **Hosting → Add custom domain** → follow the DNS records it gives you
(add them at your domain registrar). SSL is automatic.

## Troubleshooting

- **Live job was skipped** → the commit wasn't on the default branch. Commit to the
  default branch (Settings → Branches shows which one it is).
- **Deploy failed with a permissions error** → the service account is missing the
  *Firebase Hosting Admin* role (Step 2.3), or the JSON secret was pasted incompletely.
- **`HTTP 403 / project not found`** → `FIREBASE_PROJECT_ID` doesn't match your real
  Project ID (Step 1.3).

---

### Prefer zero key handling?

Firebase **App Hosting** can connect this GitHub repo directly from the Firebase console
(no service-account key, no secrets) and redeploy on every push. It's heavier and
costlier than classic Hosting for a plain static site like this one, so classic Hosting
(above) is recommended — but if you'd rather click "Connect GitHub" in the console, ask
and the repo can be adapted for App Hosting.
