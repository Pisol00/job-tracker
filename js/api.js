// === API ===
// All communication with the Google Apps Script backend

import { API_URL } from './config.js';
import { state }   from './state.js';
import { showToast } from './toast.js';

// ── Private helpers ──

function setLoading(isLoading) {
  state.isLoading          = isLoading;
  document.body.style.cursor = isLoading ? 'progress' : '';
}

function normalizeDate(value) {
  if (value == null || value === '') return '';
  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date)) return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  }

  return str;
}

function normalizeJobs(jobs) {
  return (jobs || []).map(job => ({ ...job, applyDate: normalizeDate(job.applyDate) }));
}

// ── Public API ──

export async function fetchApi(payload) {
  if (!state.idToken) {
    // Trigger sign-out via event — avoids circular import with auth.js
    document.dispatchEvent(new CustomEvent('auth:signout'));
    throw new Error('Not signed in');
  }

  let response;
  if (payload) {
    response = await fetch(API_URL, {
      method:  'POST',
      body:    JSON.stringify({ ...payload, token: state.idToken }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
  } else {
    response = await fetch(`${API_URL}?token=${encodeURIComponent(state.idToken)}`);
  }

  const data = await response.json();

  if (!data.ok) {
    if (/token|allowed|expired|audience/i.test(data.error || '')) {
      document.dispatchEvent(new CustomEvent('auth:signout'));
      showToast(data.error, 'error');
    }
    throw new Error(data.error || 'API error');
  }

  return data;
}

export async function loadJobs() {
  if (!state.idToken) return;
  setLoading(true);
  try {
    const data   = await fetchApi();
    state.jobs   = normalizeJobs(data.jobs);
  } catch (err) {
    if (!/Not signed in|token|allowed|expired|audience/i.test(err.message)) {
      showToast(`Failed to load: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
}

export async function saveJob(jobData) {
  setLoading(true);
  try {
    const payload = jobData.id
      ? { action: 'update', job: jobData }
      : { action: 'add',    job: jobData };
    const data   = await fetchApi(payload);
    state.jobs   = normalizeJobs(data.jobs);
    showToast(jobData.id ? 'Application updated' : 'Application added', 'success');
    return true;
  } catch (err) {
    showToast(`Failed to save: ${err.message}`);
    return false;
  } finally {
    setLoading(false);
  }
}

export async function deleteJob(id) {
  setLoading(true);
  try {
    const data = await fetchApi({ action: 'delete', id });
    state.jobs  = normalizeJobs(data.jobs);
    showToast('Application deleted', 'success');
    return true;
  } catch (err) {
    showToast(`Failed to delete: ${err.message}`);
    return false;
  } finally {
    setLoading(false);
  }
}

export async function updateField(id, field, value) {
  if (state.isLoading) return false;

  const job = state.jobs.find(j => j.id === id);
  if (!job) return false;

  const previous = job[field];
  if (previous === value || (previous == null && value === '')) return false;

  job[field] = value;
  setLoading(true);
  try {
    const data = await fetchApi({ action: 'update', job });
    state.jobs  = normalizeJobs(data.jobs);
    return true;
  } catch (err) {
    job[field] = previous;
    showToast(`Failed to update: ${err.message}`);
    return false;
  } finally {
    setLoading(false);
  }
}
