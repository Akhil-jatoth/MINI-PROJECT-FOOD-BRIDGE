const statusConfig = {
  pending:   { label: 'Pending',    cls: 'badge-yellow' },
  accepted:  { label: 'Accepted',   cls: 'badge-blue'   },
  rejected:  { label: 'Rejected',   cls: 'badge-red'    },
  cancelled: { label: 'Cancelled',  cls: 'badge-gray'   },
  picked_up: { label: 'Picked Up',  cls: 'badge-blue'   },
  delivered: { label: 'Delivered',  cls: 'badge-green'  },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, cls: 'badge-gray' };
  return <span className={cfg.cls}>{cfg.label}</span>;
};

export default StatusBadge;
