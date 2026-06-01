/**
 * popup.js — runs inside the extension icon popup
 *
 * When user clicks the extension icon, popup.html opens.
 * This script checks what tab is active and updates the popup UI.
 */

const statusDot    = document.getElementById("status-dot");
const statusText   = document.getElementById("status-text");
const repoSection  = document.getElementById("repo-section");
const notRepoSec   = document.getElementById("not-repo-section");
const repoName     = document.getElementById("repo-name");
const btnToggle    = document.getElementById("btn-toggle");
const btnDashboard = document.getElementById("btn-dashboard");

// Get the active tab and check if it's a GitHub repo page
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const url = tab?.url ?? "";
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);

  if (match) {
    const repo = match[1];

    // Show repo UI
    repoSection.style.display = "block";
    notRepoSec.style.display  = "none";
    repoName.textContent       = repo;
    statusDot.style.background = "#22c55e";
    statusText.textContent     = "On a repo page ✓";

    // Toggle sidebar button
    btnToggle.addEventListener("click", () => {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
      window.close();  // close popup after clicking
    });

    // Open dashboard in new tab
    btnDashboard.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:5173" });
    });

  } else {
    // Not on a GitHub repo page
    repoSection.style.display  = "none";
    notRepoSec.style.display   = "block";
    statusDot.style.background = "#9ca3af";
    statusText.textContent     = "Not on a GitHub repo";
  }
});
