# Content_flow_Integration_READABLE

Read-only snapshot of the Cross‑Alliance E2E Integration Console (same behavior as `readonly.html` in the main [Content_flow_Integration](https://github.com/chakn005/Content_flow_Integration) project).

**Live site:** [https://chakn005.github.io/Content_flow_Integration_READABLE/](https://chakn005.github.io/Content_flow_Integration_READABLE/)

### Site shows **404** (most common fixes)

1. **Turn Pages on** — Repo **Settings → Pages**. Under **Build and deployment**, you must choose **one** source and save:
   - **GitHub Actions** (uses `.github/workflows/deploy-pages.yml`), **or**
   - **Deploy from a branch** → **main** → **/** (root).  
   If this is wrong (e.g. **/docs** while files live in the root), you get **404**.

2. **Do not mix two sources** — If you use **Actions**, do not also leave Pages on “Deploy from branch” for the same site in a conflicting way. Pick one mode and save.

3. **If you use Actions** — Open **Actions** and confirm **Deploy GitHub Pages** is **green**. A failed or never-run workflow means nothing is published → **404**.

4. **Fastest path** if Actions is confusing: set Pages to **Deploy from branch** → **main** → **/**, **delete** `.github/workflows/deploy-pages.yml`, push, wait 1–2 minutes, reload the site URL.

5. **Repository must be public** (free GitHub Pages for public repos).

This repository should have **`index.html`** at the root. If you use the full console snapshot, also include **`app.js`** and **`styles.css`**. If the page loads but looks unstyled or empty, those files are missing from `main`.

---

## Push updates to GitHub

From this repository’s directory on your machine:

```bash
git add -A
git status   # expect: index.html, app.js, styles.css, .nojekyll, README.md, .github/workflows/deploy-pages.yml
git commit -m "Update read-only site"
git push origin main
```

### If `git push` fails with “Permission denied (publickey)”

Your `origin` is probably using **SSH** (`git@github.com:...`) without a working key. Switch to **HTTPS** and sign in (browser or Personal Access Token):

```bash
git remote set-url origin https://github.com/chakn005/Content_flow_Integration_READABLE.git
git push -u origin main
```

---

## Publishing options (pick one)

### A. GitHub Actions (this repo’s workflow)

1. **Settings → Pages → Build and deployment**
2. Set **Source** to **GitHub Actions**.
3. Push to `main`. Open **Actions** → **Deploy GitHub Pages** → confirm the run is green.
4. The workflow copies only `index.html`, `.nojekyll`, and optional `app.js` / `styles.css` into the published artifact (not the whole repo tree).

### B. Deploy from branch (no Actions)

1. **Settings → Pages → Build and deployment**
2. Set **Source** to **Deploy from a branch** → **main** → **/** (root).
3. Remove or disable `.github/workflows/deploy-pages.yml` so you do not use two publishers at once.
4. Push static files to `main`; GitHub will serve `index.html` from the root.

---

## Update from the main project

In your **content-integration-flow** clone:

```bash
bash scripts/sync-readable-pages.sh
```

Then copy or commit the updated files from `Content_flow_Integration_READABLE/` into **this** repository and push (see above). The source HTML flag is `readonly.html` in the main repo (copied to `index.html` here).
