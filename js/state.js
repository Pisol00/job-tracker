// === STATE ===
// Single mutable app state object shared across all modules

function loadUserInfo() {
  try {
    return JSON.parse(sessionStorage.getItem('jt_user') || 'null');
  } catch {
    return null;
  }
}

export const state = {
  jobs:          [],
  sortColumn:    'applyDate',
  sortDirection: -1,
  editId:        null,
  isLoading:     false,
  idToken:       sessionStorage.getItem('jt_token') || '',
  userInfo:      loadUserInfo(),
};
