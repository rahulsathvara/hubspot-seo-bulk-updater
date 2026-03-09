# Privacy Policy — HubSpot SEO Bulk Updater

**Last updated: March 2026**

---

## Overview

HubSpot SEO Bulk Updater ("the Extension") is a Chrome browser extension that helps users export and bulk-update SEO fields on HubSpot pages and blog posts. This Privacy Policy explains what data the Extension accesses, how it is used, and your rights.

---

## Data We Collect

### 1. HubSpot API Key
- **What:** Your HubSpot Private App token (starts with `pat-`)
- **Why:** Required to authenticate requests to the HubSpot API on your behalf
- **Where stored:** Locally on your device only, using Chrome's `chrome.storage.local` API
- **Shared with:** Nobody. The key is never transmitted to any server other than `api.hubapi.com`

### 2. HubSpot Page Data
- **What:** Page IDs, titles, meta descriptions, slugs, author names, tags, and publish status fetched from your HubSpot portal
- **Why:** To display and allow editing within the Extension popup
- **Where stored:** In memory only during the active session. Not persisted anywhere
- **Shared with:** Nobody. Data is only sent back to HubSpot's own API when you choose to push updates

### 3. CSV Files
- **What:** CSV files you export or upload within the Extension
- **Why:** To facilitate the bulk export/import workflow
- **Where stored:** On your local device only (via Chrome's downloads API)
- **Shared with:** Nobody

---

## Data We Do NOT Collect

- ❌ We do not collect any personal information
- ❌ We do not track browsing history or activity
- ❌ We do not use analytics or tracking scripts
- ❌ We do not send any data to third-party servers
- ❌ We do not use cookies
- ❌ We do not collect crash reports or usage statistics

---

## Permissions Justification

| Permission | Why it is needed |
|---|---|
| `storage` | To save your HubSpot API key locally on your device |
| `downloads` | To download the exported CSV file to your computer |
| `host_permissions: api.hubapi.com` | To make API calls directly to HubSpot to fetch and update page data |

---

## Third-Party Services

The Extension communicates exclusively with:
- **HubSpot API** (`https://api.hubapi.com`) — to fetch and update your HubSpot content

No other third-party services, analytics platforms, or external servers are contacted.

---

## Data Retention

- Your API key remains in `chrome.storage.local` until you click **Clear** in the Settings tab or uninstall the Extension
- No other data is retained between sessions

---

## Children's Privacy

This Extension is not directed at children under the age of 13 and does not knowingly collect information from children.

---

## Changes to This Policy

If this Privacy Policy changes, the updated version will be posted at this URL with a new "Last updated" date.

---

## Contact

If you have any questions about this Privacy Policy, please open an issue at:
`https://github.com/rahulsathvara/hubspot-seo-bulk-updater/issues`

Or contact: `rahul.sathvara@email.com`
