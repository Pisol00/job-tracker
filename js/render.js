// === RENDER ===
// All DOM rendering: stats bar, table rows, inline editing, sort

import { state }                                       from './state.js';
import { STATUS_MAP, SRC_ICONS, OPTIONS, SORT_COLUMNS, IN_PROGRESS_STATUSES } from './config.js';
import { updateField }                                 from './api.js';
import { ddGet }                                       from './dropdown.js';
import { openCal }                                     from './calendar.js';
import { displayToIso, isoToDisplay, parseISO }        from './date.js';
import { isTruthy, escapeHtml }                        from './utils.js';

function countByStatus(status) {
  return state.jobs.filter(job => job.status === status).length;
}

function getStatusInfo(status) {
  return STATUS_MAP[status] ?? { cls: 's-pending', icon: 'ti-hourglass', label: status };
}

function getFilteredJobs() {
  const query  = document.getElementById('searchInput').value.toLowerCase();
  const status = ddGet('filterStatus');
  const loc    = ddGet('filterLoc');
  const source = ddGet('filterSource');

  return state.jobs.filter(job => {
    const matchesQuery  = !query  || `${job.company || ''}${job.role || ''}${job.location || ''}${job.foundOn || ''}`.toLowerCase().includes(query);
    const matchesStatus = !status || job.status === status;
    const matchesLoc    = !loc    || (job.location || '').includes(loc);
    const matchesSource = !source || job.foundOn === source;
    return matchesQuery && matchesStatus && matchesLoc && matchesSource;
  });
}

// ── Inline cell picker ──

function closePicker() {
  document.querySelector('.picker-pop')?.remove();
}

function showPicker(anchor, field, id, current) {
  closePicker();

  const opts = OPTIONS[field] || [];
  const pop  = document.createElement('div');
  pop.className = 'dd-menu picker-pop';

  pop.innerHTML = opts.map(opt =>
    `<div class="dd-option${opt === current ? ' selected' : ''}" data-val="${escapeHtml(opt)}">
      ${escapeHtml(opt)}<span class="dd-check"><i class="ti ti-check"></i></span>
    </div>`
  ).join('');

  document.body.appendChild(pop);

  const rect = anchor.getBoundingClientRect();
  pop.style.left = `${rect.left + window.scrollX}px`;
  pop.style.top  = `${rect.bottom + window.scrollY + 4}px`;

  pop.querySelectorAll('.dd-option').forEach(option => {
    option.addEventListener('click', async e => {
      e.stopPropagation();
      const value = option.dataset.val;
      closePicker();
      if (value !== current) {
        const ok = await updateField(id, field, value);
        if (ok) render();
      }
    });
  });

  requestAnimationFrame(() => document.addEventListener('click', closePicker, { once: true }));
}

export function bindInline() {
  document.querySelectorAll('#tbody .cell-edit').forEach(el => {
    const id    = Number(el.closest('tr').dataset.id);
    const field = el.dataset.field;

    el.addEventListener('focus', () => {
      if (field === 'salary') {
        const job = state.jobs.find(j => j.id === id);
        el.textContent = job?.salary ? String(job.salary) : '';
      }
    });

    el.addEventListener('blur', async () => {
      let value = el.textContent.trim();
      if (field === 'salary') value = value.replace(/[^\d.]/g, '');
      await updateField(id, field, value);
      render();
    });

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); render(); }
    });
  });

  document.querySelectorAll('#tbody .cell-pick').forEach(el => {
    const id    = Number(el.closest('tr').dataset.id);
    const field = el.dataset.field;

    el.addEventListener('click', e => {
      e.stopPropagation();
      const job = state.jobs.find(j => j.id === id);

      if (field === 'applyDate') {
        openCal(el, el.dataset.iso || '', async iso => {
          const value = iso ? isoToDisplay(iso) : '';
          const ok = await updateField(id, 'applyDate', value);
          if (ok) render();
        });
      } else {
        showPicker(el, field, id, job?.[field] ?? '');
      }
    });
  });
}

export function renderStats() {
  const total   = state.jobs.length;
  const pending = state.jobs.filter(job => IN_PROGRESS_STATUSES.includes(job.status)).length;

  const stats = [
    { label: 'Total applied', val: total,                                  sub: 'All applications',  dot: '#534AB7' },
    { label: 'Accepted',      val: countByStatus('Accepted'),              sub: 'Offers received',   dot: '#639922' },
    { label: 'Interview',     val: countByStatus('Schedule for Interview'), sub: 'Scheduled',         dot: '#EF9F27' },
    { label: 'In progress',   val: pending,                                sub: 'Awaiting response', dot: '#378ADD' },
    { label: 'Rejected',      val: countByStatus('Rejected'),              sub: 'Not selected',      dot: '#E24B4A' },
  ];

  document.getElementById('statsBar').innerHTML = stats.map(s =>
    `<div class="stat">
      <div class="stat-head">
        <div class="stat-label">${s.label}</div>
        <div class="stat-dot" style="background:${s.dot}"></div>
      </div>
      <div class="stat-val">${s.val}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`
  ).join('');
}

export function renderTable() {
  const sorted = [...getFilteredJobs()].sort((a, b) => {
    const aVal = a[state.sortColumn] || '';
    const bVal = b[state.sortColumn] || '';

    if (state.sortColumn === 'salary') {
      return ((parseFloat(aVal) || 0) - (parseFloat(bVal) || 0)) * state.sortDirection;
    }

    if (state.sortColumn === 'applyDate') {
      // applyDate is "D/M/YYYY" — convert to ISO so comparison is chronological
      const aDate = parseISO(displayToIso(aVal))?.getTime() ?? 0;
      const bDate = parseISO(displayToIso(bVal))?.getTime() ?? 0;
      return (aDate - bDate) * state.sortDirection;
    }

    return String(aVal).localeCompare(String(bVal)) * state.sortDirection;
  });

  document.getElementById('tblCount').textContent = `Showing ${sorted.length} of ${state.jobs.length}`;

  const tbody = document.getElementById('tbody');

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="ti ti-inbox" aria-hidden="true"></i><p>No matching applications</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(job => {
    const { cls: statusClass, icon: statusIcon, label: statusLabel } = getStatusInfo(job.status);
    const srcIcon  = SRC_ICONS[job.foundOn] || 'ti-world';
    const srcLabel = job.foundOn === "Company's Website" ? 'Website' : job.foundOn;

    const hasInterview1 = isTruthy(job.interview1);
    const hasInterview2 = isTruthy(job.interview2);

    const isoDate = displayToIso(job.applyDate);

    return `<tr data-id="${job.id}">
      <td>
        <span class="company-name cell-edit" contenteditable="plaintext-only"
          data-field="company" data-placeholder="Company"
          data-empty="${job.company ? '0' : '1'}">${escapeHtml(job.company)}</span>
      </td>
      <td>
        <span class="role-text cell-edit" contenteditable="plaintext-only"
          data-field="role" data-placeholder="Role"
          data-empty="${job.role ? '0' : '1'}"
          title="${escapeHtml(job.role)}">${escapeHtml(job.role)}</span>
      </td>
      <td class="td-center">
        <span class="status-badge cell-pick ${statusClass}" data-field="status">
          <i class="ti ${statusIcon}" aria-hidden="true"></i>${statusLabel}
        </span>
      </td>
      <td class="td-center">
        <input type="checkbox" class="chk" ${hasInterview1 ? 'checked' : ''} data-field="interview1" aria-label="Interview 1">
      </td>
      <td class="td-center">
        <input type="checkbox" class="chk" ${hasInterview2 ? 'checked' : ''} data-field="interview2" aria-label="Interview 2">
      </td>
      <td class="td-center cell-applydate">
        <span class="cell-pick" data-field="applyDate" data-iso="${isoDate}">${job.applyDate || '—'}</span>
      </td>
      <td class="td-center">
        <span class="loc-text cell-pick" data-field="location">${job.location || ''}</span>
      </td>
      <td class="td-center">
        <span class="source-chip cell-pick" data-field="foundOn">
          <i class="ti ${srcIcon}" aria-hidden="true"></i>${srcLabel || ''}
        </span>
      </td>
      <td class="td-center">
        <span class="cell-edit ${job.salary ? 'sal-val' : 'sal-none'}"
          contenteditable="plaintext-only" inputmode="numeric"
          data-field="salary" data-placeholder="—"
          data-empty="${job.salary ? '0' : '1'}">${job.salary ? '฿' + Number(job.salary).toLocaleString() : ''}</span>
      </td>
      <td class="td-center">
        <div class="act-cell">
          <button class="act-btn del" type="button" data-action="delete" aria-label="Delete application" title="Delete">
            <i class="ti ti-trash" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  bindInline();
}

export function render() {
  renderStats();
  renderTable();
}

export function updateSortIndicators() {
  SORT_COLUMNS.forEach(c => {
    const el = document.getElementById(`s-${c}`);
    if (el) el.textContent = c === state.sortColumn ? (state.sortDirection === 1 ? '↑' : '↓') : '';
  });
}

export function sortBy(col) {
  if (state.sortColumn === col) {
    state.sortDirection *= -1;
  } else {
    state.sortColumn    = col;
    state.sortDirection = 1;
  }

  updateSortIndicators();
  renderTable();
}
