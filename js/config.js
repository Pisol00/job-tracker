// === CONFIG ===
// All static constants — API endpoints, option lists, display maps

export const API_URL = 'https://script.google.com/macros/s/AKfycbwqZls3PVPo-fybN8xGnIBB7GsfygB7vErF7zowLNVKH5dT55dAYgKHhTD27fr6A5aNEg/exec';
export const GOOGLE_CLIENT_ID = '479414655504-c6nfa84s18tl8ritag7kfqk0gsrtleer.apps.googleusercontent.com';

// Shared option arrays (used in both filter dropdowns and form/inline pickers)
const LOCATIONS = ['Bangkok', 'Nonthaburi', 'Pathum Thani', 'Samut Prakan', 'Nakhon Pathom', 'Samut Sakhon', 'Remote', 'Hybrid', 'Other'];
const SOURCES   = ['JobsDB', 'JobThai', 'Facebook', 'LinkedIn', "Company's Website", 'Other'];
const STATUSES  = ['Pending', 'Automate Mail Reply', 'Application Viewed', 'Schedule for Interview', 'Accepted', 'Rejected'];

// Merged dropdown options — keys used by both ddBuild (data-dd attribute) and showPicker
export const OPTIONS = {
  // Filter toolbar dropdowns
  filterStatus: ['Automate Mail Reply', 'Rejected', 'Schedule for Interview', 'Application Viewed', 'Accepted', 'Pending'],
  filterLoc:    LOCATIONS,
  filterSource: SOURCES,

  // Form modal dropdowns
  f_location: LOCATIONS,
  f_foundOn:  SOURCES,
  f_status:   STATUSES,

  // Inline cell pickers (same data, different key names)
  location: LOCATIONS,
  foundOn:  SOURCES,
  status:   STATUSES,
};

// Columns that support sorting
export const SORT_COLUMNS = ['company', 'role', 'location', 'applyDate', 'foundOn', 'salary', 'status'];

// Status display metadata (class, icon, label)
export const STATUS_MAP = {
  'Automate Mail Reply':      { cls: 's-reply',     icon: 'ti-mail-forward',  label: 'Mail reply' },
  'Rejected':                  { cls: 's-rejected',  icon: 'ti-circle-x',      label: 'Rejected'   },
  'Schedule for Interview':    { cls: 's-interview', icon: 'ti-calendar-event', label: 'Interview'  },
  'Application Viewed':        { cls: 's-viewed',    icon: 'ti-eye-check',      label: 'Viewed'     },
  'Accepted':                  { cls: 's-accepted',  icon: 'ti-circle-check',   label: 'Accepted'   },
  'Pending':                   { cls: 's-pending',   icon: 'ti-hourglass',      label: 'Pending'    },
};

// Job source icon map (Tabler icon classes)
export const SRC_ICONS = {
  'JobsDB':             'ti-briefcase',
  'JobThai':            'ti-id-badge-2',
  'Facebook':           'ti-brand-facebook',
  'LinkedIn':           'ti-brand-linkedin',
  "Company's Website":  'ti-building',
};

// Statuses that count as "In progress" in the stats bar
export const IN_PROGRESS_STATUSES = ['Automate Mail Reply', 'Application Viewed', 'Pending'];

// Calendar display strings
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOWS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
