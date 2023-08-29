/* eslint-disable no-magic-numbers */
import { AnyFunc } from '@/types';

/**
 * 检验是否合法16进制颜色
 * @param hex
 * @param success
 * @param fail
 */
export function checkHex(hex: string, success: AnyFunc, fail: AnyFunc) {
  if (/^[0-9a-f]{6}$/g.test(hex)) {
    success();
  } else {
    fail();
  }
}

/**
 * 检查是否合法的hsb颜色
 * @param hsb
 * @param success
 * @param fail
 */
export function checkHsb(hsb: string, success: AnyFunc, fail: AnyFunc) {
  if (hsb.split(',').length === 3) {
    success();
  } else {
    fail();
  }
}

/**
 * 检查是否合法的rgb颜色
 * @param rgb
 * @param success
 * @param fail
 */

export function checkRgb(rgb: string, success: AnyFunc, fail: AnyFunc) {
  const rgbArr = rgb.split(',');
  if (
    rgbArr.length === 3 &&
    rgbArr.every(function (item) {
      return /^\d{1,3}$/g.test(item) && Number(item) <= 255;
    })
  ) {
    success();
  } else {
    fail();
  }
}

/**
 * 分割字符串
 * @param str 要分割的字符串
 * @param num 按几位分割
 * @return {number[]}
 */
export function divisionString(str: string, num = 1) {
  const result = [];
  if (num === 1) {
    return str.split('');
  }
  for (let i = 0; i < str.length; i += num) {
    result.push(str.slice(i, i + num));
  }
  return result;
}

/**
 * grb转16进制
 * @param rgb
 * @return {number[]}
 */
export function rgbToHex(rgb: string[]) {
  const hex: string[] = [];
  rgb.forEach(item => {
    const value = Number(item);
    hex.push(`${value < 15 ? '0' : ''}${value.toString(16)}`);
  });
  return hex;
}

/**
 * 16进制转rgb颜色
 * @param hex 16进制颜色代码
 * @return {number[]}
 */
export function hexToRgb(hex: string[]) {
  const rgbArr: number[] = [];
  hex.forEach(item => {
    rgbArr.push(Number(`0x${item}`));
  });
  return rgbArr;
}

/**
 * hsb（色相，饱和度，亮度）转 rgb
 * @param hsb
 * @return {number[]}
 */
export function hsbToRgb(hsb: number[]) {
  let r = 0,
    g = 0,
    b = 0;
  const h = hsb[0];
  let s = hsb[1],
    v = hsb[2];
  s = s / 100;
  v = v / 100;
  const i = Math.round((h / 60) % 6);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      break;
  }
  r = Math.round(r * 255.0);
  g = Math.round(g * 255.0);
  b = Math.round(b * 255.0);

  return [r, g, b];
}

/**
 * rgb 转 hsb（色相，饱和度，亮度）
 * @param rgb
 * @return {string[]}
 */
export function rgbToHsb(rgb: string[]) {
  const rgbR = Number(rgb[0]);
  const rgbG = Number(rgb[1]);
  const rgbB = Number(rgb[2]);
  const rgbNums = rgb.map(v => parseInt(v, 10));
  const max = Math.max(...rgbNums);
  const min = Math.min(...rgbNums);

  const hsbB = max / 255.0;
  const hsbS = max === 0 ? 0 : (max - min) / max;

  let hsbH = 0;
  if (max === rgbR && rgbG >= rgbB) {
    hsbH = ((rgbG - rgbB) * 6) / (max - min || 1);
  } else if (max === rgbR && rgbG < rgbB) {
    hsbH = ((rgbG - rgbB) * 60) / (max - min) + 360;
  } else if (max === rgbG) {
    hsbH = ((rgbB - rgbR) * 60) / (max - min) + 120;
  } else if (max === rgbB) {
    hsbH = ((rgbR - rgbG) * 60) / (max - min) + 240;
  }

  return [hsbH.toFixed(0), `${(hsbS * 100).toFixed(0)}%`, `${(hsbB * 100).toFixed(0)}%`];
}
