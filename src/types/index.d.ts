/**
 * @author Wayne
 * @Date 2022-08-04 13:14:23
 * @LastEditTime 2022-08-16 10:21:39
 */
declare global {
  /**
   * QR code library exposed on window for legacy usage.
   */
  interface Window {
    AraleQRCode: any;
  }
  /**
   * Chrome extension global API reference.
   */
  const chrome: any;
}

/**
 * Generic function signature helper.
 */
export type AnyFunc = (...args: unknown[]) => any;

/**
 * Generic object map helper.
 */
export type AnyObj = {
  [key: string]: unknown;
};
