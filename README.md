# Sora High website

This repository is configured to publish the site from `outputs/sora-high-website` through GitHub Pages.

## Publish it

1. Create an empty GitHub repository.
2. In this folder, run:

   ```powershell
   git init
   git add .
   git commit -m "Publish Sora High website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages**, set **Build and deployment** to **GitHub Actions**, and save.

The `Deploy Sora High website to GitHub Pages` action will then run on each push to `main`. Its completed deployment shows the public site URL in the action summary.

For a project repository, the address is usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. For a repository named `YOUR-USERNAME.github.io`, it is `https://YOUR-USERNAME.github.io/`.

## Send enquiries to Google Sheets

The website has a ready-made Google Apps Script receiver at `outputs/sora-high-website/google-apps-script/Code.gs`.

1. Create a Google Sheet named **Sora High Enquiries** and copy its ID from the browser address.
2. At [script.google.com](https://script.google.com), create a new Apps Script project, paste in `Code.gs`, and replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with that ID.
3. Choose **Deploy → New deployment → Web app**. Set **Who has access** to **Anyone**, then deploy and copy the web-app URL.
4. Put that URL inside the quotes in `outputs/sora-high-website/assets/form-config.js`.
5. Commit and push. New enquiries will be appended to the **Enquiries** tab of your sheet.

The endpoint has no GitHub token or secret, so it is safe for a GitHub Pages frontend. Do not store the spreadsheet ID or deployment URL as a GitHub secret: the browser needs the endpoint URL to submit the form.
