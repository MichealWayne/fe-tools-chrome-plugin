/** Exact decoded byte count for a Base64 image data URL (excluding the MIME header). */
export const dataUrlBytes = (value: string): number => {
  const base64 = value.split(',')[1] || '';
  return Math.max(0, Math.floor((base64.length * 3) / 4) - (base64.match(/=+$/)?.[0].length || 0));
};

export const formatMediaBytes = (bytes: number): string =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
