/**
 * content.js — injected into every github.com/* page
 *
 * This script runs inside the GitHub page's DOM.
 * It can read/modify the page HTML, detect what repo we're on,
 * and inject the sidebar iframe.
 *
 * Flow:
 *  1. Detect if we're on a repo page (github.com/owner/repo)
 *  2. Inject a sidebar <div> + <iframe> into the page
 *  3. Listen for text selection → send to sidebar for "Explain" feature
 *  4. Listen for TOGGLE_SIDEBAR messages from background.js
 */

// ── State ─────────────────────────────────────────────────────────────────────
let sidebarContainer = null;
let sidebarOpen      = false;
let currentRepo      = null;

// ── Detect repo page ──────────────────────────────────────────────────────────
function getRepoFromUrl() {
  // github.com/owner/repo  →  "owner/repo"
  // github.com/owner/repo/blob/main/file.js  →  "owner/repo"
  const match = window.location.pathname.match(/^\/([^/]+\/[^/]+)/);
  if (!match) return null;

  // Exclude GitHub non-repo pages
  const excluded = ["/settings", "/explore", "/marketplace", "/topics", "/trending"];
  if (excluded.some(p => window.location.pathname.startsWith(p))) return null;

  return match[1];   // "facebook/react"
}

// ── Inject sidebar into page ───────────────────────────────────────────────────
function injectSidebar(repoFullName) {
  if (sidebarContainer) return;  // already injected

  // Push GitHub page content left to make room
  document.body.style.transition = "margin-right 0.25s ease";

  // Create sidebar container div
  sidebarContainer = document.createElement("div");
  sidebarContainer.id = "gitrepo-dev-sidebar";
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: -420px;
    width: 420px;
    height: 100vh;
    z-index: 999999;
    box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    transition: right 0.25s ease;
    background: white;
    border-left: 1px solid #e5e7eb;
  `;

  // Use an iframe so the React sidebar runs in its own context
  // chrome.runtime.getURL() gives the extension's internal URL for sidebar.html
  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("sidebar.html") + `?repo=${encodeURIComponent(repoFullName)}`;
  iframe.style.cssText = "width:100%;height:100%;border:none;";
  iframe.id = "gitrepo-dev-iframe";

  sidebarContainer.appendChild(iframe);
  document.body.appendChild(sidebarContainer);
}

// ── Toggle sidebar open/closed ────────────────────────────────────────────────
function toggleSidebar() {
  if (!sidebarContainer) return;

  sidebarOpen = !sidebarOpen;

  if (sidebarOpen) {
    sidebarContainer.style.right = "0px";
    document.body.style.marginRight = "420px";
  } else {
    sidebarContainer.style.right = "-420px";
    document.body.style.marginRight = "0px";
  }
}

// ── Text selection → Code Explainer ──────────────────────────────────────────
document.addEventListener("mouseup", () => {
  const selection = window.getSelection()?.toString().trim();
  if (!selection || selection.length < 20) return;   // ignore tiny selections

  // Send selected text to the sidebar iframe
  const iframe = document.getElementById("gitrepo-dev-iframe");
  if (iframe && sidebarOpen) {
    iframe.contentWindow.postMessage(
      { type: "CODE_SELECTED", snippet: selection },
      "*"
    );
  }
});

// ── Listen for messages ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    toggleSidebar();
  }
});

// ── Auto-open on repo pages ───────────────────────────────────────────────────
function init() {
  currentRepo = getRepoFromUrl();
  if (!currentRepo) return;   // not a repo page — do nothing

  injectSidebar(currentRepo);

  // Auto-open sidebar when visiting a repo page
  setTimeout(() => {
    sidebarOpen = false;   // start closed, user opens with extension icon
  }, 500);
}

// Run on page load
init();

// Re-run on GitHub's SPA navigation (GitHub uses pushState navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    sidebarContainer = null;   // reset so sidebar re-injects on new page
    sidebarOpen = false;
    const repo = getRepoFromUrl();
    if (repo) injectSidebar(repo);
  }
}).observe(document.body, { subtree: true, childList: true });
