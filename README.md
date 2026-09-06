# Sora High — secure Cloudflare deployment

This folder is a complete Cloudflare Pages project. Deploy it from GitHub; do **not** use GitHub Pages for the production form because GitHub Pages cannot run the protected API in `functions/api/enquiries.js`.

## One-time setup

1. In Cloudflare, open **Workers & Pages → D1 SQL database → Create**. Name it `sora-high-enquiries`.
2. Open the database’s **Console**, paste and run `database/schema.sql`.
3. In **Turnstile**, create a widget. Add your future `*.pages.dev` hostname (and your custom domain later) to its allowed hostnames. Copy its site key and secret.
4. Open `assets/form-config.js` and replace `PASTE_YOUR_TURNSTILE_SITE_KEY` with the site key. This key is designed to be public.
5. Push this folder’s contents to the root of your GitHub repository.
6. In Cloudflare, choose **Workers & Pages → Create application → Pages → Connect to Git**, select the repository, then use these build settings:
   - Framework preset: **None**
   - Build command: `exit 0`
   - Build output directory: `.`
7. In the Pages project, open **Settings → Bindings → Add → D1 database**. Bind the database as `ENQUIRIES_DB`.
8. In **Settings → Environment variables**, add encrypted secrets for both Production and Preview:
   - `TURNSTILE_SECRET`: the Turnstile secret key
   - `IP_HASH_SALT`: a long, random value unique to this project
9. Deploy again after adding the bindings and secrets.

Cloudflare Pages Functions require a Git-connected deployment; do not use Direct Upload. You can turn off the existing GitHub Pages workflow once the Cloudflare deployment is live.

## What is protected

- `functions/api/enquiries.js` is a same-origin server endpoint; D1 is never reachable from the browser.
- Turnstile is verified on the server before data is written.
- Inputs are validated and length-limited server-side.
- Each visitor is limited to three requests per 15-minute window using a salted hash; raw IP addresses are not stored.
- The enquiry form resets after a successful send, so each visitor can submit another enquiry without refreshing.
- `_headers` sets a restrictive Content Security Policy and browser security headers.

## Reading enquiries

Only Cloudflare account members with access to the D1 database can read the records. Use the D1 Console’s query tab:

```sql
SELECT datetime(created_at / 1000, 'unixepoch') AS received_at,
       name, email, trip, timing, group_size
FROM enquiries
ORDER BY created_at DESC;
```

Protect the Cloudflare account with MFA and give other collaborators only the permissions they require.
