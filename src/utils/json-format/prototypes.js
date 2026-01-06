/* eslint-disable quotes */
/**
 * FeHelper Json Format Lib
 */

/**
 * 获取某字符串的字节数
 */
String.prototype.getBytes = function () {
  var stream = this.replace(/\n/g, 'xx').replace(/\t/g, 'x');
  var escapedStr = encodeURIComponent(stream);
  return escapedStr.replace(/%[A-Z0-9][A-Z0-9]/g, 'x').length;
};

/**
 * 让所有字符串支持空白过滤功能：trim
 * @retrn {String} 返回两端无空白的字符串
 */
String.prototype.trim = function () {
  return this.replace(/^\s*|\s*$/g, '');
};

/**
 * 日期格式化
 * @param {Object} pattern
 */
Date.prototype.format = function (pattern) {
  let pad = function (source, length) {
    let pre = '',
      negative = source < 0,
      string = String(Math.abs(source));

    if (string.length < length) {
      pre = new Array(length - string.length + 1).join('0');
    }

    return (negative ? '-' : '') + pre + string;
  };

  if (typeof pattern !== 'string') {
    return this.toString();
  }

  let replacer = function (patternPart, result) {
    pattern = pattern.replace(patternPart, result);
  };

  let year = this.getFullYear(),
    month = this.getMonth() + 1,
    date2 = this.getDate(),
    hours = this.getHours(),
    minutes = this.getMinutes(),
    seconds = this.getSeconds(),
    milliSec = this.getMilliseconds();

  replacer(/yyyy/g, pad(year, 4));
  replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
  replacer(/MM/g, pad(month, 2));
  replacer(/M/g, month);
  replacer(/dd/g, pad(date2, 2));
  replacer(/d/g, date2);

  replacer(/HH/g, pad(hours, 2));
  replacer(/H/g, hours);
  replacer(/hh/g, pad(hours % 12, 2));
  replacer(/h/g, hours % 12);
  replacer(/mm/g, pad(minutes, 2));
  replacer(/m/g, minutes);
  replacer(/ss/g, pad(seconds, 2));
  replacer(/s/g, seconds);
  replacer(/SSS/g, pad(milliSec, 3));
  replacer(/S/g, milliSec);

  return pattern;
};
