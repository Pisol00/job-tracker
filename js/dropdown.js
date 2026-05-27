// === DROPDOWN ===
// Custom dropdown widget used in toolbar filters and form selects

import { OPTIONS } from './config.js';

const ddState = {};

export function ddBuild(dd) {
  const key         = dd.dataset.dd;
  const opts        = OPTIONS[key] || [];
  const placeholder = dd.dataset.placeholder || '';

  if (!(key in ddState)) {
    ddState[key] = placeholder ? '' : (opts[0] || '');
  }

  const current = ddState[key];
  const label   = current || placeholder;

  dd.innerHTML = `
    <button type="button" class="dd-toggle">${label}</button>
    <div class="dd-menu" role="listbox">
      ${placeholder ? `<div class="dd-option${current === '' ? ' selected' : ''}" data-val="">${placeholder}<span class="dd-check"><i class="ti ti-check"></i></span></div>` : ''}
      ${opts.map(opt => `
        <div class="dd-option${opt === current ? ' selected' : ''}" data-val="${escapeAttr(opt)}">
          ${opt}<span class="dd-check"><i class="ti ti-check"></i></span>
        </div>
      `).join('')}
    </div>`;

  dd.querySelector('.dd-toggle').addEventListener('click', e => {
    e.stopPropagation();
    const wasOpen = dd.classList.contains('open');
    document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
    if (!wasOpen) dd.classList.add('open');
  });

  dd.querySelectorAll('.dd-option').forEach(option => {
    option.addEventListener('click', e => {
      e.stopPropagation();
      ddSet(key, option.dataset.val);
      dd.classList.remove('open');
      dd.dispatchEvent(new CustomEvent('dd:change', { bubbles: true, detail: { key, value: option.dataset.val } }));
    });
  });
}

export function ddSet(key, value) {
  ddState[key] = value;
  document.querySelectorAll(`.dd[data-dd="${key}"]`).forEach(ddBuild);
}

export function ddGet(key) {
  return ddState[key] || '';
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// Close all open dropdowns when clicking outside or pressing Escape
document.addEventListener('click', e => {
  if (!e.target.closest('.dd')) {
    document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
  }
});
