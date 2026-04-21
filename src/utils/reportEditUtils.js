const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const COMPLETED_STATUSES = new Set(['tamamlandı', 'tamamlandi', 'completed', 'done', 'finished']);
const INCOMPLETE_STATUSES = new Set([
  'devam ediyor',
  'devam_ediyor',
  'in_progress',
  'in progress',
  'pending',
  'beklemede',
  'eksik'
]);

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const toDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return Number.isNaN(parsed?.getTime?.()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const ms = (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const inferStatusFromTasks = (report) => {
  const tasks = Array.isArray(report?.tasks) ? report.tasks : Array.isArray(report?.items) ? report.items : [];
  if (!tasks.length) return 'unknown';

  const allDone = tasks.every((task) => COMPLETED_STATUSES.has(normalizeText(task?.status)));
  if (allDone) return 'completed';

  const hasInProgress = tasks.some((task) => INCOMPLETE_STATUSES.has(normalizeText(task?.status)));
  if (hasInProgress) return 'incomplete';

  return 'unknown';
};

export const normalizeReportStatus = (status) => {
  const normalized = normalizeText(status);
  if (!normalized) return 'unknown';
  if (COMPLETED_STATUSES.has(normalized)) return 'completed';
  if (INCOMPLETE_STATUSES.has(normalized)) return 'incomplete';
  return 'unknown';
};

export const getRemainingEditWindowMs = (completedAt, now = Date.now()) => {
  const completedDate = toDateSafe(completedAt);
  if (!completedDate) return null;
  return (completedDate.getTime() + EDIT_WINDOW_MS) - now;
};

export const getReportEditState = (report, now = Date.now()) => {
  if (!report || report.isVirtual) {
    return {
      editable: false,
      reason: 'Sistem kaydı düzenlenemez.',
      isCompleted: false,
      isWithin24Hours: false,
      remainingMs: 0,
      remainingHours: 0,
      lockType: 'completed_locked'
    };
  }

  const directStatus = normalizeReportStatus(report.status);
  const derivedStatus = directStatus !== 'unknown' ? directStatus : inferStatusFromTasks(report);

  if (derivedStatus === 'completed') {
    const remainingMs = getRemainingEditWindowMs(report.completedAt, now);

    if (remainingMs === null) {
      // TODO: Veri migrasyonu ile historical "completed" raporlara completedAt alanı doldurulmalı.
      return {
        editable: false,
        reason: 'Tamamlanma zamanı bulunamadığı için düzenleme kapalı.',
        isCompleted: true,
        isWithin24Hours: false,
        remainingMs: null,
        remainingHours: 0,
        lockType: 'missing_completedAt'
      };
    }

    if (remainingMs > 0) {
      return {
        editable: true,
        reason: 'Tamamlanan rapor 24 saat içinde düzenlenebilir.',
        isCompleted: true,
        isWithin24Hours: true,
        remainingMs,
        remainingHours: Math.ceil(remainingMs / (60 * 60 * 1000)),
        lockType: 'completed_within_24h'
      };
    }

    return {
      editable: false,
      reason: 'Bu tamamlanan rapor için 24 saatlik düzenleme süresi doldu.',
      isCompleted: true,
      isWithin24Hours: false,
      remainingMs,
      remainingHours: 0,
      lockType: 'completed_locked'
    };
  }

  if (derivedStatus === 'incomplete') {
    return {
      editable: true,
      reason: 'Bu rapor henüz tamamlanmadığı için düzenlenebilir.',
      isCompleted: false,
      isWithin24Hours: true,
      remainingMs: null,
      remainingHours: null,
      lockType: 'open'
    };
  }

  // Fallback: status bilinmiyorsa yanlışlıkla açık bırakmak yerine güvenli yaklaşım uygulanır.
  return {
    editable: false,
    reason: 'Rapor durumu tanımlanamadığı için düzenleme kapalı.',
    isCompleted: false,
    isWithin24Hours: false,
    remainingMs: null,
    remainingHours: 0,
    lockType: 'completed_locked'
  };
};

export const isReportEditable = (report, now = Date.now()) => getReportEditState(report, now).editable;

export const getReportEditTooltip = (editState) => {
  if (!editState) return 'Düzenleme durumu hesaplanamadı.';
  return editState.reason;
};

export const getLockedEditToastMessage = (editState) => {
  if (!editState) return 'Düzenleme yapılamıyor.';
  if (editState.lockType === 'missing_completedAt') {
    return 'Tamamlanma zamanı eksik olduğu için düzenleme yapılamıyor.';
  }
  if (editState.lockType === 'completed_locked') {
    return 'Bu rapor tamamlandı ve 24 saatlik düzenleme süresi geçti.';
  }
  return editState.reason || 'Düzenleme yapılamıyor.';
};

export const REPORT_EDIT_WINDOW_MS = EDIT_WINDOW_MS;
