// === UTILS ===
// Small shared helpers

// Backend may return booleans as JS true/false, sheet strings "TRUE"/"true", or 1/0.
// Normalise all of them to a real boolean.
export function isTruthy(value) {
  return value === true
    || value === 1
    || value === 'TRUE'
    || value === 'true';
}

export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
