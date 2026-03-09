# hubspot-seo-bulk-updater
HubSpot SEO Bulk Updater ("the Extension") is a Chrome browser extension that helps users export and bulk-update SEO fields on HubSpot pages and blog posts. This Privacy Policy explains what data the Extension accesses, how it is used, and your rights.

# 🚀 HubSpot SEO Bulk Updater — Chrome Extension

> Export, edit, and bulk-update meta titles, descriptions, authors, and tags across all your HubSpot pages — Site Pages, Landing Pages, and Blog Posts — using a simple CSV workflow.

<p align="center">
  <img src="icons/icon128.png" width="80" alt="HubSpot SEO Bulk Updater Logo" />
</p>
<h1 align="center">HubSpot SEO Bulk Updater</h1>
<p align="center">
  A Chrome Extension to export, edit, and bulk update meta titles, descriptions, authors & tags across all your HubSpot pages — via CSV.
</p>
<p align="center">
  <a href="https://chromewebstore.google.com/detail/YOUR_EXTENSION_ID">
    <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Web Store"/>
  </a>
  <img src="https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License"/>
  <img src="https://img.shields.io/badge/Works%20on-Chrome%20%7C%20Edge-blue?style=for-the-badge&logo=microsoftedge" alt="Chrome and Edge"/>
</p>

📌 What Is This?
Managing SEO fields across hundreds of HubSpot pages one by one is painful. This extension solves that.
HubSpot SEO Bulk Updater lets you:

Export all your HubSpot Site Pages, Landing Pages, and Blog Posts to a CSV file
Edit meta titles, descriptions, authors, and tags in Excel or Google Sheets
Import the edited CSV back and bulk push all changes to HubSpot via the official API

No coding required. No HubSpot workflow builder needed. Just export → edit → push.

✨ Features
FeatureDetails📄 Export Site PagesMeta title, description, slug, status, URL🛬 Export Landing PagesMeta title, description, slug, status, URL📝 Export Blog PostsMeta title, description, author, tags, status, URL🔍 Filter by StatusExport only Published, only Draft, or both✏️ Bulk Update Meta TitlePush to all page types at once✏️ Bulk Update Meta DescriptionPush to all page types at once👤 Bulk Update Blog AuthorResolves name → HubSpot Author ID automatically🏷 Bulk Update Blog TagsComma-separated names → Tag IDs, creates new tags if needed🔗 Smart URLsLive URL for published pages, editor link for drafts✅ Field SelectorChoose exactly which fields to update before pushing🛡 ID ValidationWarns if CSV contains invalid (non-numeric) IDs before pushing⚡ Rate LimitingBuilt-in 110ms delay between API calls — no bans

🚀 How to Use
Step 1 — Create a HubSpot Private App

In HubSpot go to Settings → Integrations → Private Apps
Click Create a private app
Give it a name (e.g. SEO Bulk Updater)
Under Scopes, enable the following:

ScopeWhycms.pages.readRead site & landing pagescms.pages.writeUpdate site & landing pagescms.blogs.readRead blog posts, authors, tagscms.blogs.writeUpdate blog posts, authors, tagscontentRequired for blog post updatesaccount-info.security.readFetch portal ID for editor preview URLs

Click Create app and copy your token (starts with pat-)


Step 2 — Install & Configure the Extension

Install from the Chrome Web Store
Click the extension icon in your toolbar
Go to the ⚙ Settings tab
Paste your Private App token and click Save API Key
The dot in the header turns 🟢 green when ready


Step 3 — Export Your Pages

Go to the ⬇ Export tab
Select content types: Site Pages, Landing Pages, Blog Posts
Select publish status: Published, Unpublished, or both
Click ⬇ Export CSV
A file like hubspot_seo_export_2026-03-09.csv is saved to your Downloads folder


Step 4 — Edit the CSV
Open the CSV in Excel or Google Sheets and edit these columns:
ColumnEditableNotesid❌ NoDo not change — used to identify the pagetype❌ NoDo not changename❌ NoFor reference onlyslug❌ NoFor reference onlyurl❌ NoFor reference onlymeta_title✅ YesEdit freelymeta_description✅ YesEdit freelyauthor_name✅ YesBlog posts only — use full nametags✅ YesBlog posts only — comma-separated e.g. SEO, HubSpotstatus❌ NoRead-only referenceupdated_at❌ NoRead-only reference

⚠️ Never edit the id column. IDs must stay numeric. If an ID looks like a slug, re-export to get a fresh CSV.


Step 5 — Import & Push Updates

Go to the ⬆ Import tab
Click 📂 Choose edited CSV file and select your edited file
A preview table shows all rows to be updated
Under Fields to update, check only the fields you want to push:

✅ Meta Title
✅ Meta Description
✅ Author (blog posts only)
✅ Tags (blog posts only)


Click 🚀 Push Updates to HubSpot
A live log shows ✅ success or ❌ error per page

❓ Troubleshooting
❌ Object not found. IDs are usually numeric

The id column contains a slug instead of a numeric HubSpot ID. Re-export a fresh CSV — do not manually type or paste IDs.

❌ internal error on blog post update

Make sure your Private App token has all required scopes, especially content and cms.blogs.write. Re-generate the token if scopes were added after creation.

❌ HTTP 401: Unauthorized

Your API token is invalid or expired. Go to the Settings tab, clear the key, and paste a fresh token from HubSpot.

❌ HTTP 403: Forbidden

Your Private App is missing one or more required scopes. Go to HubSpot → Private Apps → edit your app → add missing scopes → re-generate the token.

⚠️ Export shows 0 pages

Check that the content types and status filters are not both unchecked. Also verify your token has cms.pages.read and cms.blogs.read scopes.

⚠️ Author or Tags not updating

Make sure the Author and Tags checkboxes are checked in the Import tab before clicking Push. Also confirm the page type is blog_post — author and tags do not apply to site or landing pages.

⚠️ Preview/editor links open a 404

Make sure you are logged into HubSpot in your browser before clicking the editor link. The link only works for users with access to that HubSpot portal.


🔒 Privacy

🔑 Your API key is stored locally on your device only using chrome.storage.local
🌐 All API calls go directly to api.hubapi.com — no third-party servers
📂 Exported CSV files are saved to your local Downloads folder only
🚫 No browsing history, personal data, or analytics are collected
🚫 No data is ever sold or shared with third parties

Read the full Privacy Policy.

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 👨‍💻 Author

Built by **Rahul Satvara**  
[GitHub](https://github.com/rahulsathvara) · [Email](mailto:rahul.satvara@email.com)

---

<p align="center">
  If this saved you time, please ⭐ star the repo and leave a review on the Chrome Web Store!
</p>

