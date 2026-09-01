export type PageMetrics = {
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  scrollY: number;
};

export type CaptureResponse = {
  success: boolean;
  dataUrl?: string;
  error?: string;
};

export type SelectionResponse = {
  success: boolean;
  error?: string;
  rect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export type DownloadResponse = {
  success: boolean;
  downloadId?: number;
  error?: string;
};

export type TabMessage =
  | { action: 'getPageMetrics' }
  | { action: 'scrollTo'; y: number; delay?: number }
  | { action: 'startElementSelect' }
  | { action: 'startElementSelectAndCapture'; filename: string };

export type BackgroundMessage =
  | { action: 'captureVisibleTab'; windowId: number }
  | { action: 'downloadImage'; dataUrl: string; filename?: string };

export type RuntimeMessage =
  | { action: 'getCodexQuota' }
  | { action: 'handleTabCreate'; url?: string }
  | { action: 'executeScriptAndHandleTabCreate'; type: 'translate' | 'search'; code?: string };

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

export const isPageMetrics = (value: unknown): value is PageMetrics =>
  isRecord(value) &&
  [
    'totalWidth',
    'totalHeight',
    'viewportWidth',
    'viewportHeight',
    'devicePixelRatio',
    'scrollY',
  ].every(key => isFiniteNumber(value[key]));

export const isScrollResponse = (value: unknown): value is { scrollY: number } =>
  isRecord(value) && isFiniteNumber(value.scrollY);

export const isSelectionResponse = (value: unknown): value is SelectionResponse => {
  if (!isRecord(value) || typeof value.success !== 'boolean' || !isOptionalString(value.error)) {
    return false;
  }
  if (value.rect === undefined) return true;
  const rect = value.rect;
  return (
    isRecord(rect) && ['left', 'top', 'width', 'height'].every(key => isFiniteNumber(rect[key]))
  );
};

export const isCaptureResponse = (value: unknown): value is CaptureResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  isOptionalString(value.dataUrl) &&
  isOptionalString(value.error);

export const isDownloadResponse = (value: unknown): value is DownloadResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  (value.downloadId === undefined || typeof value.downloadId === 'number') &&
  isOptionalString(value.error);

export const isTabMessage = (value: unknown): value is TabMessage => {
  if (!isRecord(value) || typeof value.action !== 'string') return false;
  switch (value.action) {
    case 'getPageMetrics':
    case 'startElementSelect':
      return true;
    case 'scrollTo':
      return isFiniteNumber(value.y) && (value.delay === undefined || isFiniteNumber(value.delay));
    case 'startElementSelectAndCapture':
      return typeof value.filename === 'string' && value.filename.length > 0;
    default:
      return false;
  }
};

export const isBackgroundMessage = (value: unknown): value is BackgroundMessage => {
  if (!isRecord(value) || typeof value.action !== 'string') return false;
  if (value.action === 'captureVisibleTab') return isFiniteNumber(value.windowId);
  return (
    value.action === 'downloadImage' &&
    typeof value.dataUrl === 'string' &&
    value.dataUrl.length > 0 &&
    isOptionalString(value.filename)
  );
};

export const isRuntimeMessage = (value: unknown): value is RuntimeMessage => {
  if (!isRecord(value) || typeof value.action !== 'string') return false;
  if (value.action === 'getCodexQuota') return true;
  if (value.action === 'handleTabCreate') return isOptionalString(value.url);
  return (
    value.action === 'executeScriptAndHandleTabCreate' &&
    (value.type === 'translate' || value.type === 'search') &&
    isOptionalString(value.code)
  );
};
