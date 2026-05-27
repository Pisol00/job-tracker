// === MAIN ===
// Entry point — wires all static event listeners and bootstraps the app

import { bootstrap }                  from './auth.js';
import { render, sortBy }             from './render.js';
import { ddBuild, ddSet, ddGet }      from './dropdown.js';
import { openCal, closeCal }          from './calendar.js';
import { state }                      from './state.js';
import { saveJob, deleteJob, updateField } from './api.js';
import { isoToDisplay, displayToIso, fmtDisplay } from './date.js';

// ── Cached DOM references (resolved once at startup) ──

const dom = {};

function cacheDom() {
  const ids = [
    'btnAdd', 'modalClose', 'btnCancel', 'btnSave', 'modalOverlay', 'modalTitle',
    'searchInput', 'tbody', 'statsBar', 'tblCount',
    'f_company', 'f_role', 'f_salary', 'f_applyDate', 'f_applyDate_btn',
  ];
  ids.forEach(id => { dom[id] = document.getElementById(id); });
}

// ── Modal helpers ──

function setApplyDate(iso) {
  dom.f_applyDate.value         = iso || '';
  dom.f_applyDate_btn.textContent = iso ? fmtDisplay(iso) : 'Select date';
}

function readForm() {
  const existing  = state.editId ? state.jobs.find(j => j.id === state.editId) : null;
  const applyDate = isoToDisplay(dom.f_applyDate.value);

  const jobData = {
    company:    dom.f_company.value.trim() || 'Unknown',
    role:       dom.f_role.value.trim(),
    location:   ddGet('f_location'),
    applyDate,
    foundOn:    ddGet('f_foundOn'),
    salary:     dom.f_salary.value,
    status:     ddGet('f_status'),
    interview1: existing ? existing.interview1 : false,
    interview2: existing ? existing.interview2 : false,
  };

  if (state.editId) jobData.id = state.editId;
  return jobData;
}

function writeForm(job) {
  dom.f_company.value = job.company;
  dom.f_role.value    = job.role;
  dom.f_salary.value  = job.salary;
  ddSet('f_location', job.location);
  ddSet('f_foundOn',  job.foundOn);
  ddSet('f_status',   job.status);
  setApplyDate(displayToIso(job.applyDate));
}

function resetForm() {
  dom.f_company.value = '';
  dom.f_role.value    = '';
  dom.f_salary.value  = '';
  ddSet('f_location', 'Bangkok');
  ddSet('f_foundOn',  'JobsDB');
  ddSet('f_status',   'Pending');
  setApplyDate(new Date().toISOString().slice(0, 10));
}

export function openModal(jobId = null) {
  state.editId = jobId;
  dom.modalTitle.textContent = jobId ? 'Edit application' : 'Add application';

  if (jobId) {
    writeForm(state.jobs.find(j => j.id === jobId));
  } else {
    resetForm();
  }

  dom.modalOverlay.classList.add('open');
  document.body.classList.add('modal-open');

  // Focus first input for keyboard users
  requestAnimationFrame(() => dom.f_company.focus());
}

export function closeModal() {
  dom.modalOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  closeCal();
}

async function handleSave() {
  if (state.isLoading) return;
  const ok = await saveJob(readForm());
  if (ok) {
    closeModal();
    render();
  }
}

// ── Static event listeners (wired once at startup) ──

function wireStaticListeners() {
  // Topbar
  dom.btnAdd.addEventListener('click', () => openModal());

  // Modal
  dom.modalClose.addEventListener('click', closeModal);
  dom.btnCancel.addEventListener('click', closeModal);
  dom.btnSave.addEventListener('click', handleSave);
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && dom.modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  // Apply date calendar in modal
  dom.f_applyDate_btn.addEventListener('click', e => {
    e.stopPropagation();
    openCal(e.currentTarget, dom.f_applyDate.value, iso => setApplyDate(iso));
  });

  // Search input
  dom.searchInput.addEventListener('input', render);

  // Sort header delegation
  document.querySelector('thead').addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (th) sortBy(th.dataset.sort);
  });

  // Table — delete button delegation
  dom.tbody.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    if (state.isLoading) return;
    if (!confirm('Delete this application?')) return;

    const id = Number(btn.closest('tr').dataset.id);
    const ok = await deleteJob(id);
    if (ok) render();
  });

  // Table — interview checkbox delegation (uses updateField so applyDate is normalized)
  dom.tbody.addEventListener('change', async e => {
    const chk   = e.target.closest('.chk[data-field]');
    if (!chk) return;

    const field = chk.dataset.field;
    if (field !== 'interview1' && field !== 'interview2') return;

    if (state.isLoading) { chk.checked = !chk.checked; return; }

    const id  = Number(chk.closest('tr').dataset.id);
    chk.disabled = true;
    try {
      await updateField(id, field, chk.checked);
    } finally {
      chk.disabled = false;
    }
  });

  // Filter dropdowns — re-render on selection change
  document.querySelector('.toolbar').addEventListener('dd:change', render);
}

function initDropdowns() {
  document.querySelectorAll('.dd').forEach(ddBuild);
}

// ── App entry point ──

window.addEventListener('load', () => {
  cacheDom();
  wireStaticListeners();
  initDropdowns();
  sortBy('applyDate');
  bootstrap();
});
