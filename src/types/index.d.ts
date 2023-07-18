/**
 * @author Wayne
 * @Date 2022-08-04 13:14:23
 * @LastEditTime 2022-08-16 10:21:39
 */
declare global {
  interface Window {
    AraleQRCode: any;
  }
  const chrome: any;
}

export type AnyFunc = (...args: unknown[]) => any;

export type AnyObj = {
  [key: string]: unknown;
};
