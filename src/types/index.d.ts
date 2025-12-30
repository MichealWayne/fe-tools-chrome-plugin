/**
 * @author Wayne
 * @Date 2022-08-04 13:14:23
 * @LastEditTime 2022-08-16 10:21:39
 */
declare global {
  // 扩展 Window 上的二维码库引用
  interface Window {
    AraleQRCode: any;
  }
  // Chrome 扩展 API 全局
  const chrome: any;
}

// 通用函数类型
export type AnyFunc = (...args: unknown[]) => any;

// 通用对象字典
export type AnyObj = {
  [key: string]: unknown;
};
