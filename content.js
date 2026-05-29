/**
 * content.js
 * Injected into the active tab by popup.js via chrome.scripting.executeScript.
 * Runs in the context of the target page — has full DOM access.
 * Returns a structured object that popup.js can display / download.
 */

(function extractPageContent() {

  /* ── 1. Helper: clean raw text ──────────────────────────────────
     Collapses whitespace and trims surrounding spaces.               */
  function clean(str) {
    return (str || "").replace(/\s+/g, " ").trim();
  }

  /* ── 2. Clone the body so we can surgically remove noise
     without touching the live page.                                  */
  const docClone = document.body.cloneNode(true);

  // Selectors for elements we want to strip before extracting text
  const NOISE_SELECTORS = [
    "script", "style", "noscript",
    "nav", "header", "footer",
    "aside", "[role='banner']", "[role='navigation']",
    "[role='complementary']", "[role='contentinfo']",
    // Common ad / tracking patterns
    ".ad", ".ads", ".advert", ".advertisement",
    ".cookie-banner", ".cookie-notice",
    ".popup", ".modal", ".overlay",
    "[id*='ad']", "[class*='ad-']", "[class*='-ad']",
    "[id*='cookie']", "[class*='cookie']",
    "[id*='newsletter']", "[class*='newsletter']",
    "[id*='subscribe']", "[class*='subscribe']",
    "[id*='banner']", "[class*='banner']",
    "[id*='promo']",  "[class*='promo']",
    "[id*='social']", "[class*='social-share']",
    ".sidebar", "#sidebar",
    ".related", ".recommended",
  ];

  NOISE_SELECTORS.forEach(sel => {
    docClone.querySelectorAll(sel).forEach(el => el.remove());
  });

  /* ── 3. Page title ──────────────────────────────────────────────  */
  const pageTitle = clean(document.title);

  /* ── 4. Meta description ────────────────────────────────────────  */
  const metaEl = document.querySelector('meta[name="description"]')
               || document.querySelector('meta[property="og:description"]');
  const metaDesc = metaEl ? clean(metaEl.getAttribute("content")) : "";

  /* ── 5. Headings (H1–H3) ────────────────────────────────────────  */
  const headings = [];
  docClone.querySelectorAll("h1, h2, h3").forEach(el => {
    const text = clean(el.innerText || el.textContent);
    if (text) headings.push({ level: el.tagName, text });
  });

  /* ── 6. Paragraphs ──────────────────────────────────────────────
     Only keep paragraphs with a meaningful amount of text (≥40 chars)
     to skip decorative / empty <p> tags.                            */
  const paragraphs = [];
  docClone.querySelectorAll("p").forEach(el => {
    const text = clean(el.innerText || el.textContent);
    if (text.length >= 40) paragraphs.push(text);
  });

  /* ── 7. Lists (UL / OL) ─────────────────────────────────────────  */
  const lists = [];
  docClone.querySelectorAll("ul, ol").forEach(listEl => {
    const items = [];
    listEl.querySelectorAll("li").forEach(li => {
      const text = clean(li.innerText || li.textContent);
      if (text) items.push(text);
    });
    if (items.length) lists.push({ ordered: listEl.tagName === "OL", items });
  });

  /* ── 8. Return structured payload to popup.js ───────────────────  */
  return { pageTitle, metaDesc, headings, paragraphs, lists };

})();
