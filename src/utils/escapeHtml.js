/**
 * Escape HTML special characters for safe text insertion.
 * @param {string} text
 * @returns {string}
 * @category Utils
 */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
