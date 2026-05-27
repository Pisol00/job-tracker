// === AUTH ===
// Google Sign-In (GSI) integration and session management

import { GOOGLE_CLIENT_ID } from './config.js';
import { state }            from './state.js';
import { showToast }        from './toast.js';
import { loadJobs }         from './api.js';
import { render }           from './render.js';

// ── Private helpers ──

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes  = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const json   = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Public API ──

export function renderUserBadge() {
  const el = document.getElementById('userBadge');
  if (!el) return;

  if (!state.userInfo) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <img src="${state.userInfo.picture}" alt="" referrerpolicy="no-referrer">
    <span>${state.userInfo.email}</span>
    <button id="signOutBtn" title="Sign out"><i class="ti ti-logout"></i></button>`;

  document.getElementById('signOutBtn').addEventListener('click', signOut);
}

export function signOut() {
  state.idToken  = '';
  state.userInfo = null;
  sessionStorage.removeItem('jt_token');
  sessionStorage.removeItem('jt_user');

  if (window.google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }

  document.getElementById('app').classList.add('app-hidden');
  document.getElementById('loginOverlay').style.display = 'flex';
  renderUserBadge();
}

// Called by Google GSI SDK — must be on window for the callback to find it
export function onCredential(response) {
  const token = response.credential;
  const info  = decodeJwt(token);

  if (!info) {
    showToast('Invalid token');
    return;
  }

  state.idToken  = token;
  state.userInfo = { email: info.email, name: info.name, picture: info.picture, exp: info.exp };
  sessionStorage.setItem('jt_token', token);
  sessionStorage.setItem('jt_user', JSON.stringify(state.userInfo));
  enterApp();
}

export async function enterApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').classList.remove('app-hidden');
  renderUserBadge();

  await loadJobs();
  render();
}

export function initGsi() {
  if (!window.google?.accounts?.id) {
    setTimeout(initGsi, 200);
    return;
  }

  google.accounts.id.initialize({
    client_id:   GOOGLE_CLIENT_ID,
    callback:    onCredential,
    auto_select: false,
  });

  google.accounts.id.renderButton(
    document.getElementById('gisBtn'),
    { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 280 }
  );
}

export function bootstrap() {
  const tokenValid = state.idToken && state.userInfo && state.userInfo.exp * 1000 > Date.now() + 60_000;

  if (tokenValid) {
    enterApp();
  } else {
    sessionStorage.removeItem('jt_token');
    sessionStorage.removeItem('jt_user');
    state.idToken  = '';
    state.userInfo = null;
    initGsi();
  }
}

// Handle sign-out triggered by API auth errors (avoids circular import)
document.addEventListener('auth:signout', signOut);
