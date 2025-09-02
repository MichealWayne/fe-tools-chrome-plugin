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
  let r = 0;
  let g = 0;
  let b = 0;
  const h = hsb[0];
  let s = hsb[1];
  let v = hsb[2];
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

/**
 * Convert RGB to CMYK
 * @param rgb RGB color array [r, g, b]
 * @returns CMYK color array [c, m, y, k]
 */
export function rgbToCmyk(rgb: number[]): number[] {
  const [r, g, b] = rgb.map(value => value / 255);
  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return [0, 0, 0, 100];
  }

  const c = ((1 - r - k) / (1 - k)) * 100;
  const m = ((1 - g - k) / (1 - k)) * 100;
  const y = ((1 - b - k) / (1 - k)) * 100;

  return [Math.round(c), Math.round(m), Math.round(y), Math.round(k * 100)];
}

/**
 * Convert CMYK to RGB
 * @param cmyk CMYK color array [c, m, y, k]
 * @returns RGB color array [r, g, b]
 */
export function cmykToRgb(cmyk: number[]): number[] {
  const [c, m, y, k] = cmyk.map(value => value / 100);

  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return [r, g, b];
}

/**
 * Convert RGB to HSL
 * @param rgb RGB color array [r, g, b]
 * @returns HSL color array [h, s%, l%]
 */
export function rgbToHsl(rgb: string[]): string[] {
  const [r, g, b] = rgb.map(val => Number(val) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h.toFixed(0), `${(s * 100).toFixed(0)}%`, `${(l * 100).toFixed(0)}%`];
}

/**
 * Convert HSL to RGB
 * @param hsl HSL color array [h, s%, l%]
 * @returns RGB color array [r, g, b]
 */
export function hslToRgb(hsl: string[]): number[] {
  const h = Number(hsl[0]);
  const s = Number(hsl[1].replace('%', '')) / 100;
  const l = Number(hsl[2].replace('%', '')) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Check if HSL is a valid color format
 * @param hsl HSL color string
 * @param success Callback for successful validation
 * @param fail Callback for failed validation
 */
export function checkHsl(hsl: string, success: AnyFunc, fail: AnyFunc) {
  const hslArr = hsl.split(',');
  if (
    hslArr.length === 3 &&
    hslArr[0] !== '' &&
    hslArr[1].endsWith('%') &&
    hslArr[2].endsWith('%')
  ) {
    success();
  } else {
    fail();
  }
}

/**
 * Color name to hex conversion map
 */
const COLOR_NAMES: Record<string, string> = {
  red: 'ff0000',
  green: '00ff00',
  blue: '0000ff',
  yellow: 'ffff00',
  cyan: '00ffff',
  magenta: 'ff00ff',
  white: 'ffffff',
  black: '000000',
  gray: '808080',
  orange: 'ffa500',
  purple: '800080',
  pink: 'ffc0cb',
  brown: 'a52a2a',
  navy: '000080',
  olive: '808000',
  lime: '00ff00',
  maroon: '800000',
  silver: 'c0c0c0',
  teal: '008080',
};

/**
 * Convert color name to hex
 * @param colorName Color name
 * @returns Hex color code or undefined if not found
 */
export function colorNameToHex(colorName: string): string | undefined {
  return COLOR_NAMES[colorName.toLowerCase()];
}

/**
 * Convert hex to color name
 * @param hex Hex color code
 * @returns Color name or undefined if not found
 */
export function hexToColorName(hex: string): string | undefined {
  const normalizedHex = hex.toLowerCase();
  return Object.entries(COLOR_NAMES).find(([, value]) => value === normalizedHex)?.[0];
}
