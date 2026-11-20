# Letters to Grow campaign preview

Revision branch `campaign-folded-preview` at `fa368ba`, based on `c53b6bb`.

## Review the design

Open `review/homepage-and-reader.jpg` to compare the folded homepage and open reader on desktop and phone. The review folder also contains Community and writer captures, the Story builder, and a 1080 × 1920 Story PNG.

## Run the local preview

Open a terminal in `source/`, use Node.js 22 or newer and run `npm ci`. Start the build with the samples enabled.

```sh
SAMPLE_LETTERS_ENABLED=true npm start
```

In Windows PowerShell, use these equivalent commands.

```powershell
$env:SAMPLE_LETTERS_ENABLED = "true"
npm start
```

Open http://localhost:4173. The prebuilt `dist/` is already included. Run `npm run build` after source edits. Local viewing and publication use isolated embedded PostgreSQL by default.

## Deploy to the existing Vercel project

The preview deployment still requires access to the GitHub repository and its existing Vercel project. The patch in this ZIP contains the revision commit. In a clean checkout at `c53b6bb`, create a preview branch and apply the patch.

```sh
git switch -c campaign-folded-preview
git am /path/to/apply-campaign-revision.patch
git push -u origin campaign-folded-preview
```

In the existing Vercel project, keep its Preview database variables and add `SAMPLE_LETTERS_ENABLED=true` for this branch's Preview environment. Deploy or redeploy the branch after saving that value. Open `/?community` on the generated Preview URL and check for five entries labeled **Sample letter**. The five are supplied at runtime, without Supabase inserts or a new migration. Clear the flag and redeploy to remove them from the new preview. Earlier preview deployments retain their own settings until retired.

The Production deployment remains a separate release decision.
