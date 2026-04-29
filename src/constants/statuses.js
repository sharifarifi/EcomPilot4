export const TASK_STATUSES = Object.freeze({
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal'
});

export const TASK_UI_ALIASES = Object.freeze({
  IN_PROGRESS: 'Sürüyor'
});

export const ORDER_STATUSES = Object.freeze({
  APPROVED: 'Onaylandı',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargolandı',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal'
});

export const LEAVE_STATUSES = Object.freeze({
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi'
});

export const SHIFT_STATUSES = Object.freeze({
  IN: 'İçeride',
  BREAK: 'Molada',
  COMPLETED: 'Tamamlandı',
  OUT: 'Dışarıda'
});

export const REPORT_STATUSES = Object.freeze({
  IN_PROGRESS: TASK_STATUSES.IN_PROGRESS,
  COMPLETED: TASK_STATUSES.COMPLETED
});

const TASK_STATUS_ALIAS_TO_CANONICAL = Object.freeze({
  [TASK_UI_ALIASES.IN_PROGRESS]: TASK_STATUSES.IN_PROGRESS
});

export const normalizeTaskStatusForRead = (status) => (
  TASK_STATUS_ALIAS_TO_CANONICAL[status] || status
);

export const normalizeTaskStatusForWrite = (status) => (
  TASK_STATUS_ALIAS_TO_CANONICAL[status] || status
);

export const getTaskStatusDisplayLabel = (status) => {
  const normalized = normalizeTaskStatusForRead(status);
  if (normalized === TASK_STATUSES.IN_PROGRESS) return TASK_UI_ALIASES.IN_PROGRESS;
  return normalized;
};
