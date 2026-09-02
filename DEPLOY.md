# Deploy from your phone — Firebase Hosting

You need **no laptop and no terminal**. Everything is done in a mobile browser
(Chrome/Safari): the Google Cloud console and github.com.

**Already configured for you:**
- Firebase project: **`sociovia-c9473`**
- Hosting site: **`sociovia-c9473-81765`** (the site already linked to your
  `adtomate-solutions` web app) → live URL **`https://sociovia-c9473-81765.web.app`**
- This is a *separate* site from the project default, so deploying here never touches
  the Sociovia app.
- Google Analytics is wired in (`assets/js/firebase.js`).

So there's just **one thing to set up: the deploy key.** After that, every commit to the
default branch deploys live automatically.

> Use github.com in a **browser**, not the GitHub mobile app — the app hides
> *Settings → Secrets*. Tap "Desktop site" if a control is hard to reach.

---

## Step 1 — Create the deploy key (Google Cloud console)

A "service account" the deploy robot uses.

1. Open **console.cloud.google.com** → confirm project **sociovia-c9473** is selected (top bar).
2. **IAM & Admin → Service Accounts**
   (direct: `console.cloud.google.com/iam-admin/serviceaccounts`).
3. **+ Create service account**
   - Name: `github-deploy` → **Create and continue**.
   - Role: search and pick **Firebase Hosting Admin** → **Continue** → **Done**.
4. Tap the new account → **Keys** tab → **Add key → Create new key → JSON → Create**.
   A `.json` file downloads to your phone.
5. Open that file (Files / Downloads) and **copy its entire contents** (first `{` to last `}`).

## Step 2 — Add the key to GitHub (github.com in a browser)

Repo → **Settings → Secrets and variables → Actions → Secrets** tab →
**New repository secret**:

- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: paste the whole JSON → **Add secret**.

That's the only setting — the project (`sociovia-c9473`) and site (`sociovia-c9473-81765`)
are already baked into the repo.

## Step 3 — Deploy

1. Make any commit to the **default branch** (e.g. edit `README.md` on github.com →
   **Commit changes**), or **Actions** tab → newest run → **Re-run jobs**.
2. **Actions** tab → **Deploy to Firebase Hosting** → **Live deploy** job.
3. Green ✅ → site is live at **`https://sociovia-c9473-81765.web.app`**.

---

## Editing the site later (all from your phone)

- github.com → open a file (e.g. `index.html`) → pencil ✏️ → edit → **Commit**.
  The commit to the default branch auto-deploys.
- Want to preview before going live? Commit to a **new branch** and open a **Pull Request** —
  the bot comments a temporary **preview URL**.

## Custom domain (e.g. adtomate.com)

Firebase console → **Hosting → the `sociovia-c9473-81765` site → Add custom domain** →
add the DNS records it gives you at your registrar. SSL is automatic.

## Analytics

Wired in `assets/js/firebase.js` (project `sociovia-c9473`, stream `G-6K7Q3WD797`).
Traffic appears in the Firebase console under **Analytics**. That web config is safe to be
public; for hygiene you can later restrict the API key in Google Cloud console →
**APIs & Services → Credentials**.

## Booking form → leads

The "Book a free consultation" form needs **no backend**: on submit it opens **WhatsApp**
to **+91 96677 96730** with the person's details prefilled, so every lead reaches you
instantly. Nothing to set up.

**Optional — also save leads in Firebase (so you have a list):**
1. Firebase console → project `sociovia-c9473` → **Build → Firestore Database → Create
   database** (Production mode is fine).
2. **Rules** tab → paste this (lets the public *submit* a lead, but not read/edit others'),
   then **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /leads/{id} {
         allow create: if request.resource.data.keys().hasOnly(
           ['name','business','phone','email','service','message',
            'createdAt','source','page','userAgent']);
         allow read, update, delete: if false;
       }
     }
   }
   ```
   Leads then appear under Firestore → **leads**. (Until you do this, the form still works —
   it just skips the save and relies on WhatsApp.)

## Troubleshooting

- **Live job was skipped** → the commit wasn't on the default branch
  (Settings → Branches shows which one it is).
- **Permissions error on deploy** → the service account is missing the
  *Firebase Hosting Admin* role (Step 1.3), or the JSON secret was pasted incompletely.
- **`Site not found`** → the `site` value in `firebase.json` must equal
  `sociovia-c9473-81765`.
