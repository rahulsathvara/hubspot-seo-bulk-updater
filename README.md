# hubspot-seo-bulk-updater

> Export, edit, and bulk-update meta titles, descriptions, authors, and tags across all your HubSpot pages — Site Pages, Landing Pages, and Blog Posts — using a simple CSV workflow.

<p align="center">
  <img src="icons/icon128.png" width="80" alt="HubSpot SEO Bulk Updater Logo" />
</p>
<h1 align="center">HubSpot SEO Bulk Updater</h1>
<p align="center">
  A Chrome Extension to export, edit, and bulk update meta titles, descriptions, authors & tags across all your HubSpot pages — via CSV.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/Works%20on-Chrome%20%7C%20Edge-blue?style=for-the-badge&logo=microsoftedge" alt="Chrome and Edge"/>
</p>

## 📌 What Is This?

Managing SEO fields across hundreds of HubSpot pages one by one is painful. This extension solves that.

HubSpot SEO Bulk Updater lets you:

- Export all your HubSpot Site Pages, Landing Pages, and Blog Posts to a CSV file
- Edit meta titles, descriptions, authors, and tags in Excel or Google Sheets
- Import the edited CSV back and bulk push all changes to HubSpot via the official API

No coding required. No HubSpot workflow builder needed. Just export → edit → push.

---

## 👥 Built For

- **HubSpot SEO teams** managing large page inventories
- **Content marketers** who need to clean up metadata fast
- **HubSpot agencies** handling multiple client portals
- **CMS migration projects** requiring bulk content updates
- **Technical SEO audits** needing full meta coverage exports
- **Enterprise content operations** with hundreds of pages to maintain

---

## ✨ Features

| Feature | Details |
|---|---|
| 📄 Export Site Pages | Meta title, description, slug, status, URL |
| 🛬 Export Landing Pages | Meta title, description, slug, status, URL |
| 📝 Export Blog Posts | Meta title, description, author, tags, status, URL |
| 🔍 Filter by Status | Export only Published, only Draft, or both |
| ✏️ Bulk Update Meta Title | Push to all page types at once |
| ✏️ Bulk Update Meta Description | Push to all page types at once |
| 👤 Bulk Update Blog Author | Resolves name → HubSpot Author ID automatically |
| 🏷 Bulk Update Blog Tags | Comma-separated names → Tag IDs, creates new tags if needed |
| 🔗 Smart URLs | Live URL for published pages, editor link for drafts |
| ✅ Field Selector | Choose exactly which fields to update before pushing |
| 🛡 ID Validation | Warns if CSV contains invalid (non-numeric) IDs before pushing |
| ⚡ Rate Limiting | Built-in 110ms delay between API calls — no bans |

---

## 🚀 How to Use

### Step 1 — Create a HubSpot Private App

1. In HubSpot go to **Settings → Integrations → Private Apps**
2. Click **Create a private app**
3. Give it a name (e.g. `SEO Bulk Updater`)
4. Under **Scopes**, enable the following:

| Scope | Why |
|---|---|
| `cms.pages.read` | Read site & landing pages |
| `cms.pages.write` | Update site & landing pages |
| `cms.blogs.read` | Read blog posts, authors, tags |
| `cms.blogs.write` | Update blog posts, authors, tags |
| `content` | Required for blog post updates |
| `account-info.security.read` | Fetch portal ID for editor preview URLs |

5. Click **Create app** and copy your token (starts with `pat-`)

---

### Step 2 — Load the Extension Manually in Chrome

Since this extension is not listed on the Chrome Web Store, you need to load it manually as an unpacked extension:

1. **Download or clone this repository** to your computer
   ```
   git clone https://github.com/rahulsathvara/hubspot-seo-bulk-updater.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the folder where you cloned/downloaded this repository
6. The extension will appear in your toolbar — pin it for easy access

> ℹ️ The same steps work in **Microsoft Edge**: navigate to `edge://extensions`, enable Developer mode, and click **Load unpacked**.

> ⚠️ **Note:** Because this is a manually loaded extension, Chrome may show a warning on startup that developer mode extensions are enabled. This is normal — click **Keep** to dismiss it.

---

### Step 3 — Configure the Extension

1. Click the extension icon in your toolbar
2. Go to the **⚙ Settings** tab
3. Paste your Private App token and click **Save API Key**
4. The dot in the header turns 🟢 green when ready

---

### Step 4 — Export Your Pages

1. Go to the **⬇ Export** tab
2. Select content types: Site Pages, Landing Pages, Blog Posts
3. Select publish status: Published, Unpublished, or both
4. Click **⬇ Export CSV**
5. A file like `hubspot_seo_export_2026-03-09.csv` is saved to your Downloads folder

---

### Step 5 — Edit the CSV

Open the CSV in Excel or Google Sheets and edit these columns:

| Column | Editable | Notes |
|---|---|---|
| `id` | ❌ No | Do not change — used to identify the page |
| `type` | ❌ No | Do not change |
| `name` | ❌ No | For reference only |
| `slug` | ❌ No | For reference only |
| `url` | ❌ No | For reference only |
| `meta_title` | ✅ Yes | Edit freely |
| `meta_description` | ✅ Yes | Edit freely |
| `author_name` | ✅ Yes | Blog posts only — use full name |
| `tags` | ✅ Yes | Blog posts only — comma-separated e.g. `SEO, HubSpot` |
| `status` | ❌ No | Read-only reference |
| `updated_at` | ❌ No | Read-only reference |

> ⚠️ **Never edit the `id` column.** IDs must stay numeric. If an ID looks like a slug, re-export to get a fresh CSV.

---

### Step 6 — Import & Push Updates

1. Go to the **⬆ Import** tab
2. Click **📂 Choose edited CSV file** and select your edited file
3. A preview table shows all rows to be updated
4. Under **Fields to update**, check only the fields you want to push:
   - ✅ Meta Title
   - ✅ Meta Description
   - ✅ Author (blog posts only)
   - ✅ Tags (blog posts only)
5. Click **🚀 Push Updates to HubSpot**
6. A live log shows ✅ success or ❌ error per page

---

## ❓ Troubleshooting

**❌ Object not found. IDs are usually numeric**
The `id` column contains a slug instead of a numeric HubSpot ID. Re-export a fresh CSV — do not manually type or paste IDs.

**❌ Internal error on blog post update**
Make sure your Private App token has all required scopes, especially `content` and `cms.blogs.write`. Re-generate the token if scopes were added after creation.

**❌ HTTP 401: Unauthorized**
Your API token is invalid or expired. Go to the Settings tab, clear the key, and paste a fresh token from HubSpot.

**❌ HTTP 403: Forbidden**
Your Private App is missing one or more required scopes. Go to HubSpot → Private Apps → edit your app → add missing scopes → re-generate the token.

**⚠️ Export shows 0 pages**
Check that the content types and status filters are not both unchecked. Also verify your token has `cms.pages.read` and `cms.blogs.read` scopes.

**⚠️ Author or Tags not updating**
Make sure the Author and Tags checkboxes are checked in the Import tab before clicking Push. Also confirm the page type is `blog_post` — author and tags do not apply to site or landing pages.

**⚠️ Preview/editor links open a 404**
Make sure you are logged into HubSpot in your browser before clicking the editor link. The link only works for users with access to that HubSpot portal.

---

## 🔒 Privacy

- 🔑 Your API key is stored locally on your device only using `chrome.storage.local`
- 🌐 All API calls go directly to `api.hubapi.com` — no third-party servers
- 📂 Exported CSV files are saved to your local Downloads folder only
- 🚫 No browsing history, personal data, or analytics are collected
- 🚫 No data is ever sold or shared with third parties

---

## 🗺️ Roadmap — Full HubSpot Portal Toolkit

This extension is the first tool in a larger suite of HubSpot portal management tools currently in development. Here's what's coming:

| Tool | Description |
|---|---|
| 🏷️ **Tag Manager** | Manage, import, and clean up HubSpot blog tags — bulk cleanup, bulk update, and tag merging |
| 👤 **Bulk Author Assignment** | Reassign authors across hundreds of blog posts in one operation |
| 🔍 **SEO Auditor** | Audit all HubSpot pages for SEO issues and get actionable fix suggestions |
| 📝 **Blog Health Checker** | Analyze all blog posts for SEO and content quality issues |
| 🔗 **Internal Linking Analyzer** | Map all internal links to find orphan pages and linking gaps across your portal |
| 📋 **CTA & Forms Analyzer** | Find missing CTAs, broken links, and form issues across your portal |
| 🖼️ **Image Health Scanner** | Find and fix missing, broken, and wrong-domain images across all pages and blog posts |
| 💔 **Broken Link Checker** | Find all broken internal links across your HubSpot pages |
| 📚 **Blog Post Manager** | Manage all blog posts with advanced filters and bulk actions |
| 🔁 **Duplicate Content Detector** | Scan for duplicate page titles, meta descriptions, URL slugs, blog titles, and featured images that hurt SEO |
| 🔎 **Find & Replace** | Search and replace any text across your entire HubSpot portal |
| 📊 **Page Performance Report** | Analytics-backed performance scores for every page in your portal |
| 📌 **Form Pages Mapper** | Find every page where your HubSpot forms are embedded |
| 📌 **CTA Pages Mapper** | Find every page where your HubSpot CTAs are embedded |
| 🧩 **Module & Widget Mapper** | Discover all custom modules and widgets used across your portal |

> 💡 Have a feature request? [Open an issue](https://github.com/rahulsathvara/hubspot-seo-bulk-updater/issues) — I'd love to hear what would help your workflow.

---

## 💼 Need Custom HubSpot Development?

If you need custom HubSpot CMS development, portal automation, or a tailored version of any of these tools for your team or agency — I'm available for hire.

**Rahul Sathvara** — HubSpot CMS Developer
[GitHub](https://github.com/rahulsathvara) · [Email](mailto:rahul.sathvara@email.com)

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 👨‍💻 Author

Built by **Rahul Sathvara**
[GitHub](https://github.com/rahulsathvara) · [Email](mailto:rahul.sathvara@email.com)

---

<p align="center">
  If this saved you time, please ⭐ star the repo!
</p>
