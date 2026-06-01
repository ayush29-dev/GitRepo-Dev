/**
 * api.js — all calls to FastAPI, routed through background.js
 *
 * Why route through background.js?
 * Content scripts (and iframes loaded from extension) have
 * stricter CORS rules. The background service worker has
 * broader permissions and can call localhost:8000 freely.
 *
 * chrome.runtime.sendMessage() sends a message to background.js,
 * which makes the actual fetch() and returns the result.
 */

function callApi(endpoint, method = "POST", body = null) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "API_CALL", endpoint, method, body },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      }
    );
  });
}

export const analyzeRepo     = (repoFullName) =>
  callApi("/analyze/repo",    "POST", { repo_full_name: repoFullName });

export const analyzeBugs     = (repoFullName, filePath, code) =>
  callApi("/analyze/bugs",    "POST", { repo_full_name: repoFullName, file_path: filePath, code });

export const explainCode     = (snippet, language = "auto") =>
  callApi("/analyze/explain", "POST", { snippet, language });

export const generateReadme  = (repoFullName, purpose, stack) =>
  callApi("/generate/readme", "POST", { repo_full_name: repoFullName, purpose, stack });

export const optimizeSuggest = (repoFullName, filePath, code) =>
  callApi("/optimize/suggest","POST", { repo_full_name: repoFullName, file_path: filePath, code });
