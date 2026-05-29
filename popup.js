/**
 * popup.js — HubSpot SEO Bulk Updater
 * Three tabs: Settings | Export | Import
 */

/* ══════════════════════════════════════════════════════════════════
   DOM REFERENCES
   ══════════════════════════════════════════════════════════════════ */

// Header
const apiStatusDot     = document.getElementById("api-status-dot");

// Tabs
const tabBtns          = document.querySelectorAll(".tab-btn");
const tabPanels        = document.querySelectorAll(".tab-panel");

// Settings
const apiKeyInput      = document.getElementById("api-key-input");
const baseDomainInput  = document.getElementById("base-domain-input");
const btnSaveKey       = document.getElementById("btn-save-key");
const btnClearKey      = document.getElementById("btn-clear-key");
const settingsStatus   = document.getElementById("settings-status");

// Export
const chkSitePages     = document.getElementById("chk-site-pages");
const chkLandingPages  = document.getElementById("chk-landing-pages");
const chkBlogPosts     = document.getElementById("chk-blog-posts");
const chkPublished     = document.getElementById("chk-published");
const chkUnpublished   = document.getElementById("chk-unpublished");
const fmtCSV           = document.getElementById("fmt-csv");
const fmtXLSX          = document.getElementById("fmt-xlsx");
const fmtHTML          = document.getElementById("fmt-html");
const btnExport        = document.getElementById("btn-export");
const btnLoadAuthors    = document.getElementById("btn-load-authors");
const authorFilterSel   = document.getElementById("author-filter-select");
const btnLoadBlogTypes  = document.getElementById("btn-load-blog-types");
const blogTypeSelect    = document.getElementById("blog-type-select");
const btnLoadTags       = document.getElementById("btn-load-tags");
const tagsDisplay       = document.getElementById("tags-display");
const tagsList          = document.getElementById("tags-list");
const tagsPlaceholder   = document.getElementById("tags-placeholder");
const exportProgress   = document.getElementById("export-progress");
const exportBar        = document.getElementById("export-bar");
const exportProgLabel  = document.getElementById("export-progress-label");
const exportStatus     = document.getElementById("export-status");
const exportSummary    = document.getElementById("export-summary");
const exportCount      = document.getElementById("export-count");

// Import
const csvFileInput     = document.getElementById("csv-file-input");
const fileLabel        = document.querySelector(".file-label");
const importFieldsWrap = document.getElementById("import-fields-wrap");
const updMetaTitle     = document.getElementById("upd-meta-title");
const updMetaDesc      = document.getElementById("upd-meta-desc");
const updAuthor        = document.getElementById("upd-author");
const updTags          = document.getElementById("upd-tags");
const previewWrap      = document.getElementById("preview-wrap");
const previewCount     = document.getElementById("preview-count");
const previewWarn      = document.getElementById("preview-warn");
const previewTbody     = document.getElementById("preview-tbody");
const btnPush          = document.getElementById("btn-push");
const pushProgress     = document.getElementById("push-progress");
const pushBar          = document.getElementById("push-bar");
const pushProgLabel    = document.getElementById("push-progress-label");
const pushResults      = document.getElementById("push-results");
const importStatus     = document.getElementById("import-status");

/* ══════════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════════ */
let apiKey     = "";
let baseDomain = "";
let csvRows    = [];
let portalId   = "";
let authorCache = {};
let tagCache    = {};

/* ══════════════════════════════════════════════════════════════════
   HUBSPOT API HELPERS
   ══════════════════════════════════════════════════════════════════ */
const HS_BASE = "https://api.hubapi.com";

async function hsGet(path) {
  const res = await fetch(`${HS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.message || err.error || JSON.stringify(err);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return res.json();
}

async function hsPatch(path, body) {
  const res = await fetch(`${HS_BASE}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.message || err.error || JSON.stringify(err);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return res.json();
}

async function hsPost(path, body) {
  const res = await fetch(`${HS_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchAllPages(basePath, params = {}, onProgress = () => {}) {
  const all   = [];
  let   after = null;
  let   total = null;
  do {
    const qp   = new URLSearchParams({ limit: 100, ...params, ...(after ? { after } : {}) });
    const data = await hsGet(`${basePath}?${qp}`);
    all.push(...(data.results || []));
    total = data.total ?? all.length;
    onProgress(all.length, total);
    after = data.paging?.next?.after ?? null;
  } while (after);
  return all;
}

async function loadPortalId() {
  if (portalId) return portalId;
  const data = await hsGet("/account-info/v3/details");
  portalId = data.portalId || data.hubId || "";
  return portalId;
}

/* ── Author & Tag helpers ────────────────────────────────────────── */
async function loadAuthorCache() {
  authorCache = {};
  const authors = await fetchAllPages("/cms/v3/blogs/authors");
  authors.forEach(a => {
    const k = (a.fullName || a.name || "").toLowerCase().trim();
    if (k) authorCache[k] = a.id;
  });
}

async function resolveAuthorId(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();

  // 1. Check cache first
  if (authorCache[key]) return authorCache[key];

  // 2. Always re-fetch fresh from API before giving up
  const authors = await fetchAllPages("/cms/v3/blogs/authors");
  authors.forEach(a => {
    const k = (a.fullName || a.name || "").toLowerCase().trim();
    if (k) authorCache[k] = a.id;
  });

  // 3. Try exact match first
  if (authorCache[key]) return authorCache[key];

  // 4. Try partial / case-insensitive match
  const partialKey = Object.keys(authorCache).find(k => k.includes(key) || key.includes(k));
  if (partialKey) return authorCache[partialKey];

  // 5. Create new author only if truly not found
  const n = await hsPost("/cms/v3/blogs/authors", { fullName: name.trim(), name: name.trim() });
  authorCache[key] = n.id;
  return n.id;
}

async function loadTagCache() {
  tagCache = {};
  const tags = await fetchAllPages("/cms/v3/blogs/tags");
  tags.forEach(t => {
    const k = (t.name || "").toLowerCase().trim();
    if (k) tagCache[k] = t.id;
  });
}

async function resolveTagId(name) {
  const key = name.toLowerCase().trim();
  if (tagCache[key]) return tagCache[key];
  const n = await hsPost("/cms/v3/blogs/tags", { name: name.trim() });
  tagCache[key] = n.id;
  return n.id;
}

/* ══════════════════════════════════════════════════════════════════
   URL HELPERS
   ══════════════════════════════════════════════════════════════════ */

/** Extract clean slug path — strips domain if HubSpot returns full URL */
function cleanSlug(slug) {
  if (!slug) return "";
  if (slug.startsWith("http")) {
    try { slug = new URL(slug).pathname; } catch { return slug; }
  }
  return slug.startsWith("/") ? slug : `/${slug}`;
}

/** Build full page URL from slug + baseDomain, or editor link for drafts */
function buildPageUrl(p, portalId) {
  const state = p.currentState || p.state || "";
  if (state === "PUBLISHED") {
    const slug = cleanSlug(p.slug);
    if (baseDomain) return `${baseDomain}${slug}`;
    // Fallback to whatever HubSpot returned
    const full = p.url || p.fullUrl || p.absoluteUrl || "";
    if (full.startsWith("http")) return full;
    return slug;
  }
  return portalId
    ? `https://app.hubspot.com/pages/${portalId}/editor/${p.id}/content`
    : "";
}

/** Normalise image URL — encode spaces in HubSpot file paths */
function normaliseImageUrl(url) {
  if (!url || typeof url !== "string") return "";

  url = url.trim();

  // Encode spaces in path
  const parts = url.split("/hubfs/");
  if (parts.length < 2) return url;

  const encodedPath = parts[1].split("/").map(seg => seg.replace(/ /g, "%20")).join("/");
  return parts[0] + "/hubfs/" + encodedPath;
}

/* ══════════════════════════════════════════════════════════════════
   TAB SWITCHING
   ══════════════════════════════════════════════════════════════════ */
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => { p.classList.add("hidden"); p.classList.remove("active"); });
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

/* ══════════════════════════════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════════════════════════════ */
function showStatus(el, msg, type = "info") {
  el.textContent = msg;
  el.className   = `inline-status ${type}`;
  el.classList.remove("hidden");
}
function hideStatus(el) { el.classList.add("hidden"); }

function setProgress(barEl, labelEl, wrapEl, pct, label) {
  wrapEl.classList.remove("hidden");
  barEl.style.width   = `${Math.min(pct, 100)}%`;
  labelEl.textContent = label;
}

/** Always wrap value in quotes for CSV — guarantees commas inside values never break columns */
function csvCell(val) {
  const s = String(val ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function parseCSV(text) {
  const rows    = [];
  let   col     = 0;
  let   row     = [""];
  let   inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch   = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') {
        // Escaped quote "" → single "
        row[col] += '"';
        i++;
      } else if (ch === '"') {
        // Closing quote
        inQuote = false;
      } else {
        // Any character inside quotes — including \n \r — is part of the value
        row[col] += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        col++;
        row.push("");
      } else if (ch === '\r' && next === '\n') {
        // CRLF line ending — skip \r, \n handled next iteration
      } else if (ch === '\n' || ch === '\r') {
        // End of row
        rows.push(row);
        row = [""];
        col = 0;
      } else {
        row[col] += ch;
      }
    }
  }
  // Push final row if not empty
  if (row.some(v => v.trim())) rows.push(row);

  if (rows.length < 2) return [];

  // First row = headers
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(v => v.trim()))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
      return obj;
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function appendLog(container, text, cls) {
  const div = document.createElement("div");
  div.className = cls; div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/* ══════════════════════════════════════════════════════════════════
   SETTINGS TAB
   ══════════════════════════════════════════════════════════════════ */
function setApiDot(valid) {
  apiStatusDot.className = `status-dot ${valid ? "green" : "red"}`;
  apiStatusDot.title     = valid ? "API key saved ✓" : "API key not set";
}

async function loadApiKey() {
  const data = await chrome.storage.local.get(["hsApiKey", "hsBaseDomain"]);
  if (data.hsApiKey) {
    apiKey = data.hsApiKey;
    apiKeyInput.value = apiKey;
    setApiDot(true);
  }
  if (data.hsBaseDomain) {
    baseDomain = data.hsBaseDomain;
    baseDomainInput.value = baseDomain;
  }
}

btnSaveKey.addEventListener("click", async () => {
  const val    = apiKeyInput.value.trim();
  const domain = baseDomainInput.value.trim().replace(/\/$/, "");
  if (!val) { showStatus(settingsStatus, "⚠ Please enter a token.", "error"); return; }
  if (!val.startsWith("pat-")) {
    showStatus(settingsStatus, "⚠ Token should start with 'pat-'.", "error"); return;
  }
  if (domain && !domain.startsWith("http")) {
    showStatus(settingsStatus, "⚠ Base domain should start with https://", "error"); return;
  }
  await chrome.storage.local.set({ hsApiKey: val, hsBaseDomain: domain });
  apiKey = val; baseDomain = domain;
  setApiDot(true);
  showStatus(settingsStatus, "✅ Settings saved!", "success");
});

btnClearKey.addEventListener("click", async () => {
  await chrome.storage.local.remove(["hsApiKey", "hsBaseDomain"]);
  apiKey = ""; baseDomain = "";
  apiKeyInput.value = ""; baseDomainInput.value = "";
  setApiDot(false);
  showStatus(settingsStatus, "🗑 Settings cleared.", "info");
});

/* ══════════════════════════════════════════════════════════════════
   LOAD AUTHORS INTO DROPDOWN
   ══════════════════════════════════════════════════════════════════ */
btnLoadAuthors.addEventListener("click", async () => {
  if (!apiKey) { showStatus(exportStatus, "⚠ Save your API key in Settings first.", "error"); return; }
  btnLoadAuthors.disabled    = true;
  btnLoadAuthors.textContent = "⏳";
  try {
    // Fetch authors directly — do not rely on loadAuthorCache return value
    const authors = await fetchAllPages("/cms/v3/blogs/authors");

    if (!Array.isArray(authors) || authors.length === 0) {
      showStatus(exportStatus, "⚠ No authors found in this HubSpot portal.", "error");
      return;
    }

    // Sort alphabetically
    authors.sort((a, b) =>
      (a.fullName || a.name || "").localeCompare(b.fullName || b.name || ""));

    // Also populate the cache while we're here
    authorCache = {};
    authors.forEach(a => {
      const nameKey = (a.fullName || a.name || "").toLowerCase().trim();
      if (nameKey) authorCache[nameKey] = a.id;
      const slugKey = (a.slug || "").toLowerCase().trim();
      if (slugKey) authorCache[slugKey] = a.id;
    });

    // Populate dropdown
    authorFilterSel.innerHTML = `<option value="">— All Authors (${authors.length}) —</option>`;
    authors.forEach(a => {
      const opt       = document.createElement("option");
      opt.value       = a.id;
      opt.textContent = a.fullName || a.name || `Author ${a.id}`;
      authorFilterSel.appendChild(opt);
    });

    btnLoadAuthors.textContent = "✅";
    setTimeout(() => {
      btnLoadAuthors.textContent = "🔄";
      btnLoadAuthors.disabled    = false;
    }, 1500);

  } catch (err) {
    showStatus(exportStatus, `❌ Could not load authors: ${err.message}`, "error");
    btnLoadAuthors.textContent = "🔄";
    btnLoadAuthors.disabled    = false;
  }
});

/* ══════════════════════════════════════════════════════════════════
   BLOG TYPE FILTER — fetch blog groups from HubSpot
   ══════════════════════════════════════════════════════════════════ */

btnLoadBlogTypes.addEventListener("click", async () => {
  if (!apiKey) { showStatus(exportStatus, "⚠ Save your API key in Settings first.", "error"); return; }
  btnLoadBlogTypes.disabled    = true;
  btnLoadBlogTypes.textContent = "⏳";

  try {
    // HubSpot blog groups endpoint
    const res = await fetch(
      "https://api.hubapi.com/content/api/v2/blogs?limit=100",
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Handle both response formats
    const blogs = data.objects || data.results || [];

    if (!blogs.length) {
      showStatus(exportStatus, "⚠ No blog types found.", "error");
      return;
    }

    // Sort alphabetically
    blogs.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    // Populate dropdown
    blogTypeSelect.innerHTML = `<option value="">— All Blog Types (${blogs.length}) —</option>`;
    blogs.forEach(b => {
      const opt       = document.createElement("option");
      opt.value       = String(b.id);
      opt.textContent = b.name || `Blog ${b.id}`;
      blogTypeSelect.appendChild(opt);
    });

    btnLoadBlogTypes.textContent = "✅";
    setTimeout(() => {
      btnLoadBlogTypes.textContent = "🔄";
      btnLoadBlogTypes.disabled    = false;
    }, 1500);

  } catch (err) {
    showStatus(exportStatus, `❌ Could not load blog types: ${err.message}`, "error");
    btnLoadBlogTypes.textContent = "🔄";
    btnLoadBlogTypes.disabled    = false;
  }
});

let selectedTagIds = new Set(); // currently selected tag IDs
let allTagsData    = [];        // full tag objects { id, name }

/** Render the tag pills + placeholder inside the display box */
function renderTagDisplay() {
  tagsDisplay.innerHTML = "";
  if (selectedTagIds.size === 0) {
    const ph = document.createElement("span");
    ph.id = "tags-placeholder";
    ph.style.cssText = "color:var(--color-text-tertiary,#aaa);font-size:12px";
    ph.textContent = `— All Tags —`;
    tagsDisplay.appendChild(ph);
    return;
  }
  selectedTagIds.forEach(id => {
    const tag = allTagsData.find(t => t.id === id);
    if (!tag) return;
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.innerHTML = `${tag.name}<span class="remove" data-id="${id}">×</span>`;
    pill.querySelector(".remove").addEventListener("click", e => {
      e.stopPropagation();
      selectedTagIds.delete(id);
      // Uncheck in dropdown list
      const cb = tagsList.querySelector(`input[data-id="${id}"]`);
      if (cb) { cb.checked = false; cb.closest(".tag-list-item").classList.remove("selected"); }
      renderTagDisplay();
    });
    tagsDisplay.appendChild(pill);
  });
}

/** Build the dropdown list from allTagsData */
function buildTagsList(tags) {
  tagsList.innerHTML = "";
  if (!tags.length) {
    tagsList.innerHTML = `<div style="padding:10px;font-size:12px;color:#aaa;text-align:center">No tags found</div>`;
    return;
  }
  tags.forEach(tag => {
    const item = document.createElement("div");
    item.className = "tag-list-item" + (selectedTagIds.has(tag.id) ? " selected" : "");
    item.innerHTML = `
      <input type="checkbox" data-id="${tag.id}" ${selectedTagIds.has(tag.id) ? "checked" : ""}/>
      <span>${tag.name}</span>`;
    item.querySelector("input").addEventListener("change", e => {
      const id = String(e.target.dataset.id);
      if (e.target.checked) {
        selectedTagIds.add(id);
        item.classList.add("selected");
      } else {
        selectedTagIds.delete(id);
        item.classList.remove("selected");
      }
      renderTagDisplay();
    });
    tagsList.appendChild(item);
  });
}

// Toggle dropdown open/close when display box is clicked
tagsDisplay.addEventListener("click", () => {
  const isOpen = !tagsList.classList.contains("hidden");
  tagsList.classList.toggle("hidden", isOpen);
});

// Close dropdown when clicking outside
document.addEventListener("click", e => {
  if (!tagsDisplay.contains(e.target) && !tagsList.contains(e.target)) {
    tagsList.classList.add("hidden");
  }
});

// Fetch tags button
btnLoadTags.addEventListener("click", async () => {
  if (!apiKey) { showStatus(exportStatus, "⚠ Save your API key in Settings first.", "error"); return; }
  btnLoadTags.disabled    = true;
  btnLoadTags.textContent = "⏳";
  try {
    const tags = await fetchAllPages("/cms/v3/blogs/tags");
    if (!Array.isArray(tags) || tags.length === 0) {
      showStatus(exportStatus, "⚠ No tags found in this HubSpot portal.", "error");
      return;
    }
    // Sort alphabetically
    tags.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    allTagsData = tags.map(t => ({ id: String(t.id), name: t.name || `Tag ${t.id}` }));

    buildTagsList(allTagsData);
    renderTagDisplay();

    btnLoadTags.textContent = "✅";
    setTimeout(() => { btnLoadTags.textContent = "🔄"; btnLoadTags.disabled = false; }, 1500);
  } catch (err) {
    showStatus(exportStatus, `❌ Could not load tags: ${err.message}`, "error");
    btnLoadTags.textContent = "🔄";
    btnLoadTags.disabled    = false;
  }
});
btnExport.addEventListener("click", async () => {
  hideStatus(exportStatus);
  exportSummary.classList.add("hidden");
  exportProgress.classList.add("hidden");

  if (!apiKey) { showStatus(exportStatus, "⚠ Set your API key in Settings first.", "error"); return; }
  if (!chkSitePages.checked && !chkLandingPages.checked && !chkBlogPosts.checked) {
    showStatus(exportStatus, "⚠ Select at least one content type.", "error"); return;
  }
  if (!chkPublished.checked && !chkUnpublished.checked) {
    showStatus(exportStatus, "⚠ Select at least one status.", "error"); return;
  }

  btnExport.disabled = true;
  const allPages = [];

  try {
    setProgress(exportBar, exportProgLabel, exportProgress, 2, "Fetching portal info…");
    await loadPortalId();

    const statusFilter = p => {
      const s = p.currentState || p.state || "";
      return s === "PUBLISHED" ? chkPublished.checked : chkUnpublished.checked;
    };

    /* ── Site Pages ─────────────────────────────────────────────── */
    if (chkSitePages.checked) {
      setProgress(exportBar, exportProgLabel, exportProgress, 5, "Fetching site pages…");
      const pages = await fetchAllPages(
        "/cms/v3/pages/site-pages",
        { properties: "id,name,slug,htmlTitle,metaDescription,url,fullUrl,absoluteUrl,updatedAt,currentState,featuredImage" },
        (done, total) => setProgress(exportBar, exportProgLabel, exportProgress,
          5 + (total ? (done / total) * 20 : 10), `Site pages: ${done} / ${total ?? "?"}`)
      );
      pages.filter(statusFilter).forEach(p => allPages.push({
        id:               p.id,
        type:             "site_page",
        name:             p.name || "",
        slug:             cleanSlug(p.slug),
        url:              buildPageUrl(p, portalId),
        meta_title:       p.htmlTitle || "",
        meta_description: p.metaDescription || "",
        author_name:      "",
        tags:             "",
        status:           p.currentState || p.state || "",
        featured_image:   normaliseImageUrl(p.featuredImage || ""),
        updated_at:       p.updatedAt || ""
      }));
    }

    /* ── Landing Pages ──────────────────────────────────────────── */
    if (chkLandingPages.checked) {
      setProgress(exportBar, exportProgLabel, exportProgress, 28, "Fetching landing pages…");
      const pages = await fetchAllPages(
        "/cms/v3/pages/landing-pages",
        { properties: "id,name,slug,htmlTitle,metaDescription,url,fullUrl,absoluteUrl,updatedAt,currentState,featuredImage" },
        (done, total) => setProgress(exportBar, exportProgLabel, exportProgress,
          28 + (total ? (done / total) * 17 : 8), `Landing pages: ${done} / ${total ?? "?"}`)
      );
      pages.filter(statusFilter).forEach(p => allPages.push({
        id:               p.id,
        type:             "landing_page",
        name:             p.name || "",
        slug:             cleanSlug(p.slug),
        url:              buildPageUrl(p, portalId),
        meta_title:       p.htmlTitle || "",
        meta_description: p.metaDescription || "",
        author_name:      "",
        tags:             "",
        status:           p.currentState || p.state || "",
        featured_image:   normaliseImageUrl(p.featuredImage || ""),
        updated_at:       p.updatedAt || ""
      }));
    }

    /* ── Blog Posts ─────────────────────────────────────────────── */
    if (chkBlogPosts.checked) {
      setProgress(exportBar, exportProgLabel, exportProgress, 48, "Fetching blog posts…");
      const posts = await fetchAllPages(
        "/cms/v3/blogs/posts",
        { properties: "id,name,slug,htmlTitle,metaDescription,url,fullUrl,absoluteUrl,updatedAt,currentState,tagIds,blogAuthorId,featuredImage,contentGroupId" },
        (done, total) => setProgress(exportBar, exportProgLabel, exportProgress,
          48 + (total ? (done / total) * 25 : 12), `Blog posts: ${done} / ${total ?? "?"}`)
      );

      setProgress(exportBar, exportProgLabel, exportProgress, 75, "Resolving authors & tags…");
      const [authorsAll, tagsAll] = await Promise.all([
        fetchAllPages("/cms/v3/blogs/authors"),
        fetchAllPages("/cms/v3/blogs/tags")
      ]);
      const authorById = {}, tagById = {};
      authorsAll.forEach(a => { authorById[a.id] = a.fullName || a.name || ""; });
      tagsAll.forEach(t => { tagById[t.id] = t.name || ""; });
      authorsAll.forEach(a => { const k=(a.fullName||a.name||"").toLowerCase().trim(); if(k) authorCache[k]=a.id; });
      tagsAll.forEach(t => { const k=(t.name||"").toLowerCase().trim(); if(k) tagCache[k]=t.id; });

      posts.filter(statusFilter).forEach(p => {
        // Author filter
        const selectedAuthorId = authorFilterSel.value;
        if (selectedAuthorId && p.blogAuthorId !== selectedAuthorId) return;

        // Blog type filter — filter by contentGroupId
        const selectedBlogType = blogTypeSelect.value;
        if (selectedBlogType && String(p.contentGroupId) !== selectedBlogType) return;

        // Tags filter
        if (selectedTagIds.size > 0) {
          const postTagIds = new Set((p.tagIds || []).map(id => String(id)));
          const hasMatch   = [...selectedTagIds].some(id => postTagIds.has(String(id)));
          if (!hasMatch) return;
        }

        // Safely resolve author name — fallback to empty string not other fields
        const authorName = (p.blogAuthorId && authorById[p.blogAuthorId])
          ? authorById[p.blogAuthorId]
          : "";

        // Safely resolve tag names — only from tagIds array
        const tagNames = Array.isArray(p.tagIds)
          ? p.tagIds.map(id => tagById[id] || "").filter(Boolean).join(", ")
          : "";

        allPages.push({
          id:               p.id,
          type:             "blog_post",
          name:             p.name || "",
          slug:             cleanSlug(p.slug),
          url:              buildPageUrl(p, portalId),
          meta_title:       p.htmlTitle || "",
          meta_description: p.metaDescription || "",
          author_name:      authorName,
          tags:             tagNames,
          status:           p.currentState || p.state || "",
          featured_image:   normaliseImageUrl(p.featuredImage || ""),
          updated_at:       p.updatedAt || ""
        });
      });
    }

    /* ── Format & Download ──────────────────────────────────────── */
    const isXLSX       = fmtXLSX.checked;
    const isHTML       = fmtHTML.checked;
    const date         = new Date().toISOString().slice(0, 10);
    const authorLabel  = authorFilterSel.value
      ? ` · author: ${authorFilterSel.options[authorFilterSel.selectedIndex].text}`
      : "";
    const tagsLabel    = selectedTagIds.size > 0
      ? ` · tags: ${[...selectedTagIds].map(id => allTagsData.find(t=>t.id===id)?.name||id).join(", ")}`
      : "";
    const filterLabel  = authorLabel + tagsLabel;

    if (isHTML) {
      setProgress(exportBar, exportProgLabel, exportProgress, 95, "Building HTML…");
      const blob     = new Blob([buildHTML(allPages)], { type: "text/html;charset=utf-8" });
      const url      = URL.createObjectURL(blob);
      const filename = `hubspot_seo_export_${date}.html`;
      await chrome.downloads.download({ url, filename, saveAs: false });
      URL.revokeObjectURL(url);
      setProgress(exportBar, exportProgLabel, exportProgress, 100, "Done!");
      exportCount.textContent = allPages.length;
      exportSummary.classList.remove("hidden");
      showStatus(exportStatus, `✅ Exported ${allPages.length} pages to "${filename}"`, "success");

    } else if (isXLSX) {
      if (typeof ExcelJS === "undefined") {
        showStatus(exportStatus, "❌ ExcelJS library not loaded. Make sure exceljs.min.js is in the extension folder.", "error");
        return;
      }
      const filename = `hubspot_seo_export_${date}.xlsx`;
      await buildXLSX(allPages, filename, (pct, label) =>
        setProgress(exportBar, exportProgLabel, exportProgress, pct, label));
      exportCount.textContent = allPages.length;
      exportSummary.classList.remove("hidden");
      showStatus(exportStatus, `✅ Exported ${allPages.length} pages to "${filename}"`, "success");

    } else {
      // CSV
      setProgress(exportBar, exportProgLabel, exportProgress, 95, "Building CSV…");
      const headers  = ["id","type","name","slug","url","meta_title","meta_description","author_name","tags","status","featured_image","updated_at"];
      const csvLines = [headers.join(","), ...allPages.map(row => headers.map(h => csvCell(row[h])).join(","))];
      const blob     = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url      = URL.createObjectURL(blob);
      const filename = `hubspot_seo_export_${date}.csv`;
      await chrome.downloads.download({ url, filename, saveAs: false });
      URL.revokeObjectURL(url);
      setProgress(exportBar, exportProgLabel, exportProgress, 100, "Done!");
      exportCount.textContent = allPages.length;
      exportSummary.classList.remove("hidden");
      showStatus(exportStatus, `✅ Exported ${allPages.length} pages to "${filename}"`, "success");
    }

  } catch (err) {
    showStatus(exportStatus, `❌ Export failed: ${err.message}`, "error");
  } finally {
    btnExport.disabled = false;
  }
});

/* ══════════════════════════════════════════════════════════════════
   IMPORT TAB
   ══════════════════════════════════════════════════════════════════ */
csvFileInput.addEventListener("change", async () => {
  const file = csvFileInput.files[0];
  if (!file) return;
  fileLabel.textContent = `📂 ${file.name}`;
  hideStatus(importStatus);
  previewWrap.classList.add("hidden");
  pushResults.classList.add("hidden");

  try {
    const rows    = parseCSV(await file.text());
    const required = ["id","type","meta_title","meta_description"];
    const missing  = required.filter(c => !(c in (rows[0] || {})));
    if (missing.length) {
      showStatus(importStatus, `❌ CSV missing columns: ${missing.join(", ")}`, "error"); return;
    }

    csvRows = rows.filter(r => r.id);

    const badIds = csvRows.filter(r => !/^\d+$/.test(r.id.trim()));
    if (badIds.length) {
      showStatus(importStatus,
        `⚠ ${badIds.length} row(s) have invalid IDs (e.g. "${badIds[0].id}"). Re-export to get correct IDs.`, "error");
      return;
    }

    importFieldsWrap.classList.remove("hidden");

    previewTbody.innerHTML = "";
    csvRows.forEach(r => {
      const isBlog    = r.type === "blog_post";
      const isLanding = r.type === "landing_page";
      const tagClass  = isBlog ? "blog" : isLanding ? "landing" : "site";
      const tagLabel  = isBlog ? "Blog" : isLanding ? "Landing" : "Site";
      const tr        = document.createElement("tr");
      tr.innerHTML = `
        <td class="cell-truncate" title="${r.id}">${r.id}</td>
        <td><span class="tag-${tagClass}">${tagLabel}</span></td>
        <td class="cell-truncate" title="${r.slug||""}">${r.slug||r.name||""}</td>
        <td class="cell-truncate" title="${r.meta_title||""}">${r.meta_title||"<em style='color:#aaa'>empty</em>"}</td>
        <td class="cell-truncate" title="${r.meta_description||""}">${r.meta_description||"<em style='color:#aaa'>empty</em>"}</td>
        <td class="cell-truncate" title="${r.author_name||""}">${isBlog?(r.author_name||"<em style='color:#aaa'>—</em>"):"<em style='color:#ccc'>n/a</em>"}</td>
        <td class="cell-truncate" title="${r.tags||""}">${isBlog?(r.tags||"<em style='color:#aaa'>—</em>"):"<em style='color:#ccc'>n/a</em>"}</td>
      `;
      previewTbody.appendChild(tr);
    });

    previewCount.textContent = csvRows.length;
    const emptyMeta = csvRows.filter(r => !r.meta_title || !r.meta_description).length;
    if (emptyMeta) {
      previewWarn.textContent = `⚠ ${emptyMeta} row(s) have empty meta fields`;
      previewWarn.classList.remove("hidden");
    } else {
      previewWarn.classList.add("hidden");
    }
    previewWrap.classList.remove("hidden");

  } catch (err) {
    showStatus(importStatus, `❌ Could not read CSV: ${err.message}`, "error");
  }
});

/* ══════════════════════════════════════════════════════════════════
   PUSH TO HUBSPOT
   ══════════════════════════════════════════════════════════════════ */
btnPush.addEventListener("click", async () => {
  if (!apiKey) { showStatus(importStatus, "⚠ Set your API key in Settings first.", "error"); return; }
  if (!csvRows.length) return;
  if (!updMetaTitle.checked && !updMetaDesc.checked && !updAuthor.checked && !updTags.checked) {
    showStatus(importStatus, "⚠ Select at least one field to update.", "error"); return;
  }

  btnPush.disabled = true;
  pushResults.innerHTML = "";
  pushResults.classList.remove("hidden");
  hideStatus(importStatus);

  try {
    if (updAuthor.checked || updTags.checked) {
      setProgress(pushBar, pushProgLabel, pushProgress, 2, "Loading authors & tags…");
      await Promise.all([
        updAuthor.checked ? loadAuthorCache() : Promise.resolve(),
        updTags.checked   ? loadTagCache()    : Promise.resolve(),
      ]);
    }
  } catch (e) {
    appendLog(pushResults, `⚠ Could not pre-load authors/tags: ${e.message}`, "log-err");
  }

  let ok = 0, fail = 0;

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    setProgress(pushBar, pushProgLabel, pushProgress,
      5 + ((i + 1) / csvRows.length) * 95, `Updating ${i + 1} / ${csvRows.length}…`);

    if (!/^\d+$/.test(row.id.trim())) {
      fail++;
      appendLog(pushResults, `❌ Skipped: "${row.id}" — not a valid numeric ID`, "log-err");
      continue;
    }

    const isBlog   = row.type === "blog_post";
    const endpoint = isBlog
      ? `/cms/v3/blogs/posts/${row.id}`
      : row.type === "landing_page"
        ? `/cms/v3/pages/landing-pages/${row.id}`
        : `/cms/v3/pages/site-pages/${row.id}`;

    try {
      const payload = {};
      if (updMetaTitle.checked && row.meta_title)       payload.htmlTitle       = row.meta_title;
      if (updMetaDesc.checked  && row.meta_description) payload.metaDescription = row.meta_description;

      if (isBlog) {
        // Fetch existing post first to carry over required fields
        const existing = await hsGet(`/cms/v3/blogs/posts/${row.id}`);
        if (existing.contentGroupId) payload.contentGroupId = existing.contentGroupId;
        if (existing.currentState)   payload.currentState   = existing.currentState;

        // Resolve author name → ID (never creates a new author)
        if (updAuthor.checked && row.author_name?.trim()) {
          const authorId = await resolveAuthorId(row.author_name.trim());
          if (authorId) {
            payload.blogAuthorId = authorId;
          } else {
            appendLog(pushResults,
              `⚠ ${row.slug||row.id}: author "${row.author_name}" not found in HubSpot — skipped. Use ⬇ Authors to check exact names.`,
              "log-err");
          }
        }

        // Resolve tag names → IDs
        if (updTags.checked && row.tags?.trim()) {
          const names    = row.tags.split(",").map(t => t.trim()).filter(Boolean);
          payload.tagIds = await Promise.all(names.map(resolveTagId));
        }
      }

      if (!Object.keys(payload).length) {
        appendLog(pushResults, `⏭ Skipped: ${row.slug||row.id} (nothing to update)`, "log-ok");
        continue;
      }

      await hsPatch(endpoint, payload);
      ok++;
      const updated = [
        payload.htmlTitle       && "meta title",
        payload.metaDescription && "meta desc",
        payload.blogAuthorId    && "author",
        payload.tagIds          && "tags",
      ].filter(Boolean).join(", ");
      appendLog(pushResults, `✅ ${row.slug||row.id} — updated: ${updated}`, "log-ok");

    } catch (err) {
      fail++;
      appendLog(pushResults, `❌ ${row.slug||row.id}: ${err.message}`, "log-err");
    }

    await sleep(110);
  }

  pushProgress.classList.add("hidden");
  showStatus(importStatus,
    `Done! ✅ ${ok} updated${fail ? ` · ❌ ${fail} failed` : ""}`,
    fail ? "error" : "success");
  btnPush.disabled = false;
});

/* ══════════════════════════════════════════════════════════════════
   HTML BUILDER
   ══════════════════════════════════════════════════════════════════ */
function buildHTML(rows) {
  const typeLabel  = { site_page: "Site", landing_page: "Landing", blog_post: "Blog" };
  const typeColor  = { site_page: "#d4edda;color:#155724", landing_page: "#fff3cd;color:#856404", blog_post: "#cce5ff;color:#004085" };
  const statusColor= { PUBLISHED: "#d4edda;color:#188038", DRAFT: "#fff3cd;color:#856404", SCHEDULED: "#cce5ff;color:#1a73e8" };
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const rows_html = rows.map((r, i) => {
    const bg          = i % 2 === 0 ? "#fff" : "#f8f9fa";
    const typeBadge   = `<span style="background:${typeColor[r.type]||"#eee"};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${typeLabel[r.type]||r.type}</span>`;
    const statusBadge = `<span style="background:${statusColor[r.status]||"#eee"};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${esc(r.status)}</span>`;
    const imgCell     = r.featured_image
      ? `<img src="${esc(r.featured_image)}" width="120" height="80" style="object-fit:cover;border-radius:6px;display:block" onerror="this.outerHTML='<span style=color:#aaa;font-size:11px>⚠ No image</span>'" />`
      : `<span style="color:#ccc;font-size:11px">—</span>`;
    const urlCell     = r.url
      ? `<a href="${esc(r.url)}" target="_blank" style="color:#1a73e8;font-size:11px;word-break:break-all">${esc(r.url)}</a>`
      : "—";
    return `
    <tr style="background:${bg};vertical-align:middle">
      <td style="padding:8px;font-size:11px;color:#666;white-space:nowrap">${esc(r.id)}</td>
      <td style="padding:8px;text-align:center">${typeBadge}</td>
      <td style="padding:8px;font-size:11px;max-width:180px;word-break:break-word">${esc(r.name)}</td>
      <td style="padding:8px;font-size:11px;max-width:160px;word-break:break-all;color:#555">${esc(r.slug)}</td>
      <td style="padding:8px;font-size:11px;max-width:200px;font-weight:600">${esc(r.meta_title)||'<em style="color:#ccc">empty</em>'}</td>
      <td style="padding:8px;font-size:11px;max-width:240px;color:#555">${esc(r.meta_description)||'<em style="color:#ccc">empty</em>'}</td>
      <td style="padding:8px;font-size:11px">${esc(r.author_name)||'<span style="color:#ccc">—</span>'}</td>
      <td style="padding:8px;font-size:11px;max-width:160px">${esc(r.tags)||'<span style="color:#ccc">—</span>'}</td>
      <td style="padding:8px;text-align:center">${statusBadge}</td>
      <td style="padding:8px;text-align:center">${imgCell}</td>
      <td style="padding:8px;font-size:11px">${urlCell}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>HubSpot SEO Export — ${new Date().toLocaleDateString()}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5fa;padding:24px;color:#202124}
    h1{font-size:20px;font-weight:700;margin-bottom:4px}
    .meta{font-size:12px;color:#888;margin-bottom:16px}
    .meta span{background:#ff7a59;color:#fff;padding:2px 10px;border-radius:20px;font-weight:700;margin-right:6px;font-size:11px}
    .summary{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
    .stat{background:#fff;border:1px solid #e0e0ef;border-radius:8px;padding:8px 14px;font-size:12px;color:#555}
    .stat strong{font-size:18px;display:block;color:#ff7a59;font-weight:700}
    .wrap{overflow-x:auto;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
    table{width:100%;border-collapse:collapse;background:#fff}
    thead tr{background:linear-gradient(135deg,#ff7a59,#ff3d00)}
    thead th{padding:10px;font-size:11px;font-weight:700;color:#fff;text-align:left;white-space:nowrap}
    tbody tr:hover{background:#fff8f6!important}
    tbody td{border-bottom:1px solid #f0f0f0}
    footer{margin-top:16px;font-size:11px;color:#aaa;text-align:center}
  </style>
</head>
<body>
  <h1>🚀 HubSpot SEO Export</h1>
  <p class="meta"><span>${rows.length} pages</span>Generated on ${new Date().toLocaleString()}</p>
  <div class="summary">
    <div class="stat"><strong>${rows.filter(r=>r.type==="site_page").length}</strong>Site Pages</div>
    <div class="stat"><strong>${rows.filter(r=>r.type==="landing_page").length}</strong>Landing Pages</div>
    <div class="stat"><strong>${rows.filter(r=>r.type==="blog_post").length}</strong>Blog Posts</div>
    <div class="stat"><strong>${rows.filter(r=>r.status==="PUBLISHED").length}</strong>Published</div>
    <div class="stat"><strong>${rows.filter(r=>r.status==="DRAFT").length}</strong>Drafts</div>
    <div class="stat"><strong>${rows.filter(r=>r.featured_image).length}</strong>With Image</div>
    <div class="stat"><strong>${rows.filter(r=>!r.meta_title).length}</strong>Missing Meta Title</div>
    <div class="stat"><strong>${rows.filter(r=>!r.meta_description).length}</strong>Missing Meta Desc</div>
  </div>
  <div class="wrap">
    <table>
      <thead><tr>
        <th>ID</th><th>Type</th><th>Name</th><th>Slug</th>
        <th>Meta Title</th><th>Meta Description</th>
        <th>Author</th><th>Tags</th><th>Status</th>
        <th>Featured Image</th><th>URL</th>
      </tr></thead>
      <tbody>${rows_html}</tbody>
    </table>
  </div>
  <footer>Exported by HubSpot SEO Bulk Updater · ${new Date().toLocaleDateString()}</footer>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   XLSX BUILDER
   ══════════════════════════════════════════════════════════════════ */
async function fetchImageAsBase64(url) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob   = await res.blob();
    const mime   = blob.type || "image/jpeg";
    const ext    = mime.includes("png") ? "png" : mime.includes("gif") ? "gif" : "jpeg";
    const buf    = await blob.arrayBuffer();
    const bytes  = new Uint8Array(buf);
    let   binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { base64: btoa(binary), ext };
  } catch { return null; }
}

const XLSX_COLUMNS = [
  { key: "id",               header: "ID",                width: 18 },
  { key: "type",             header: "Type",              width: 14 },
  { key: "name",             header: "Name",              width: 28 },
  { key: "slug",             header: "Slug",              width: 30 },
  { key: "url",              header: "URL",               width: 40 },
  { key: "meta_title",       header: "Meta Title",        width: 38 },
  { key: "meta_description", header: "Meta Description",  width: 46 },
  { key: "author_name",      header: "Author",            width: 22 },
  { key: "tags",             header: "Tags",              width: 30 },
  { key: "status",           header: "Status",            width: 14 },
  { key: "featured_image",   header: "Featured Image URL",width: 38 },
  { key: "_thumb",           header: "Image Preview",     width: 19 },
  { key: "updated_at",       header: "Updated At",        width: 22 },
];

async function buildXLSX(rows, filename, onProgress = () => {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HubSpot SEO Bulk Updater";
  wb.created = new Date();
  const ws = wb.addWorksheet("SEO Export", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = XLSX_COLUMNS.map(c => ({ key: c.key, header: c.header, width: c.width }));

  const hdr = ws.getRow(1);
  hdr.height = 22;
  hdr.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF7A59" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  const statusColors = {
    PUBLISHED: { bg: "FF188038", fg: "FFFFFFFF" },
    DRAFT:     { bg: "FFFBBC04", fg: "FF202124" },
    SCHEDULED: { bg: "FF1A73E8", fg: "FFFFFFFF" },
  };
  const typeColors = {
    site_page:    { bg: "FFD4EDDA", fg: "FF155724" },
    landing_page: { bg: "FFFFF3CD", fg: "FF856404" },
    blog_post:    { bg: "FFCCE5FF", fg: "FF004085" },
  };

  const imgColIdx = XLSX_COLUMNS.findIndex(c => c.key === "_thumb");

  // Fetch images in batches
  onProgress(5, "Fetching featured images…");
  const imageCache = {};
  const urls = [...new Set(rows.map(r => r.featured_image).filter(Boolean))];
  for (let i = 0; i < urls.length; i += 10) {
    const batch   = urls.slice(i, i + 10);
    const results = await Promise.all(batch.map(fetchImageAsBase64));
    batch.forEach((url, j) => { if (results[j]) imageCache[url] = results[j]; });
    onProgress(5 + (Math.min(i+10, urls.length)/Math.max(urls.length,1))*55,
      `Fetching images… ${Math.min(i+10,urls.length)} / ${urls.length}`);
  }

  onProgress(62, "Building Excel rows…");

  for (let i = 0; i < rows.length; i++) {
    const r      = rows[i];
    const rowNum = i + 2;
    const dr     = ws.addRow({
      id: r.id, type: r.type, name: r.name, slug: r.slug,
      url: r.url, meta_title: r.meta_title, meta_description: r.meta_description,
      author_name: r.author_name, tags: r.tags, status: r.status,
      featured_image: r.featured_image || "", _thumb: "", updated_at: r.updated_at,
    });
    dr.height = 62;
    dr.eachCell({ includeEmpty: true }, cell => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.font      = { size: 9 };
      if (i % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
    });

    const sc = statusColors[r.status];
    if (sc) { const c = dr.getCell("status"); c.fill={type:"pattern",pattern:"solid",fgColor:{argb:sc.bg}}; c.font={bold:true,color:{argb:sc.fg},size:9}; c.alignment={horizontal:"center",vertical:"middle"}; }
    const tc = typeColors[r.type];
    if (tc) { const c = dr.getCell("type"); c.fill={type:"pattern",pattern:"solid",fgColor:{argb:tc.bg}}; c.font={bold:true,color:{argb:tc.fg},size:9}; c.alignment={horizontal:"center",vertical:"middle"}; }
    if (r.url) { const c=dr.getCell("url"); c.value={text:r.url.length>45?r.url.slice(0,42)+"…":r.url,hyperlink:r.url}; c.font={color:{argb:"FF1A73E8"},underline:true,size:9}; }
    if (r.featured_image) { const c=dr.getCell("featured_image"); c.value={text:"🔗 View Image",hyperlink:r.featured_image}; c.font={color:{argb:"FF1A73E8"},underline:true,size:9}; c.alignment={horizontal:"center",vertical:"middle"}; }

    const imgData = r.featured_image ? imageCache[r.featured_image] : null;
    if (imgData) {
      ws.addImage(wb.addImage({ base64: imgData.base64, extension: imgData.ext }), {
        tl: { nativeCol: imgColIdx, nativeColOff: 190000, nativeRow: rowNum-1, nativeRowOff: 90000 },
        ext: { width: 120, height: 80 }, editAs: "oneCell",
      });
    } else {
      const c = dr.getCell("_thumb");
      c.value = r.featured_image ? "⚠ Load failed" : "—";
      c.font  = { color: { argb: r.featured_image ? "FFC0392B" : "FFAAAAAA" }, size: 8, italic: true };
      c.alignment = { horizontal: "center", vertical: "middle" };
    }
    if (i % 20 === 0) onProgress(62+(i/rows.length)*30, `Building rows… ${i+1} / ${rows.length}`);
  }

  ws.autoFilter = { from: { row:1, column:1 }, to: { row:1, column: XLSX_COLUMNS.length } };
  onProgress(94, "Writing file…");

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const dlUrl  = URL.createObjectURL(blob);
  await chrome.downloads.download({ url: dlUrl, filename, saveAs: false });
  URL.revokeObjectURL(dlUrl);
  onProgress(100, "Done!");
}

/* ══════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════ */
loadApiKey();