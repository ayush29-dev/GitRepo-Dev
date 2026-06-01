/**
 * background.js — Service Worker (MV3)
 *
 * Runs in the background, separate from any tab.
 * In MV3, background pages are replaced by service workers —
 * they spin up when needed and shut down when idle.
 *
 * Jobs:
 *  1. Listen for messages from content.js
 *  2. Make API calls that content.js can't (cross-origin to localhost:8000)
 *  3. Manage extension state (open/close sidebar)
 */

const API_BASE = "http://localhost:8000";

// ── Listen for messages from content.js / sidebar ────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Must return true if we respond asynchronously
  if (message.type === "API_CALL") {
    handleApiCall(message.endpoint, message.method, message.body)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === "TOGGLE_SIDEBAR") {
    // Tell the content script in that tab to toggle the sidebar
    chrome.tabs.sendMessage(sender.tab.id, { type: "TOGGLE_SIDEBAR" });
    return false;
  }
});

// ── Forward API calls to FastAPI backend ─────────────────────────────────────
async function handleApiCall(endpoint, method = "POST", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Extension icon click → toggle sidebar ────────────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  if (tab.url?.includes("github.com")) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  }
});
