import React from 'react';

const STATUS_MAP = {
  // AI result
  QUALIFIED:  { label: 'Qualified',   cls: 'badge-qualified' },
  SHORTLIST:  { label: 'Shortlist',   cls: 'badge-shortlist' },
  REJECT:     { label: 'Rejected',    cls: 'badge-reject'    },
  PENDING:    { label: 'Pending',     cls: 'badge-pending'   },
  // Admin status
  shortlisted:{ label: 'Shortlisted', cls: 'badge-shortlist' },
  rejected:   { label: 'Rejected',    cls: 'badge-reject'    },
  accepted:   { label: 'Accepted',    cls: 'badge-accepted'  },
  pending:    { label: 'Pending',     cls: 'badge-pending'   },
};

export default function StatusBadge({ value }) {
  const config = STATUS_MAP[value] || { label: value, cls: 'badge-pending' };
  return <span className={config.cls}>{config.label}</span>;
}
