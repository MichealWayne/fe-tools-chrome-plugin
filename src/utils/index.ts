/**
 * utils
 * @author Wayne
 * @time 2019.10.08
 */

/**
 * @function getUrlParam
 * @description **getUrlParam(name, decode)**。获取url中search参数
 * @param {String} name 字段名
 * @param {String} decode decode方法（可选）
 * @return {String|Null} 返回结果
 * @example
 *   getUrlParam('fundCode'); // '000697'
 */
export function getUrlParam(name: string, decode?: string) {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  const res = window.location.search.substring(1).match(reg); //匹配目标参数

  if (res) {
    if (!decode) {
      return decodeURI(res[2]);
    } else {
      return eval(decode + '(res[2])');
    }
  }
  return null;
}

/**
 * @function handleQRCode
 * @description QR code handler
 * @param {string} url
 * @param {string} type
 */
export function handleQRCode(url: string, type = 'canvas') {
  console.warn('AraleQRCode', window.AraleQRCode);
  const AraleQRCode = window.AraleQRCode;
  if (typeof AraleQRCode === 'undefined') {
    alert('工具库加载失败，请重试');
    return null;
  }

  return {
    getImgUrl() {
      const qrnode = new AraleQRCode({
        text: url,
        render: type,
      });
      return qrnode.toDataURL('image/png');
    },

    downloadQR() {
      const qrnode = new AraleQRCode({
        text: url,
        render: 'svg',
      });

      const ctn = document.createElement('div');
      ctn.appendChild(qrnode);

      const blobContent = new Blob([ctn.innerHTML], {
        type: 'application/svg',
      });
      const blobUrl = window.URL.createObjectURL(blobContent);
      const eleLink = document.createElement('a');

      eleLink.download = 'qr-code.svg';
      eleLink.style.display = 'none';
      eleLink.href = blobUrl;

      document.body.appendChild(eleLink);
      eleLink.click();

      document.body.removeChild(eleLink);
    },
  };
}

/**
 * @function getFileBase64
 * @description 图片压缩转换
 * @param {file object} imgfile
 * @param {function} cb
 */
export function getFileBase64(file: File, cb: (base64: string) => unknown) {
  if (!file) throw new Error('Error! no param "file"(getFileBase64()).');

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target!.result; // 该文件的完整Base64

    if (cb) cb(base64 as string);
  };
  reader.onerror = function () {
    alert('Read file fail.');
  };
  reader.readAsDataURL(file);
}

/**
 * @function compressImg
 * @description compress image
 * @param {image object} img
 * @param {number} rate
 */
export function compressImg(img: HTMLImageElement, rate = 0.9) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const tCanvas = document.createElement('canvas');
  const tctx = tCanvas.getContext('2d')!;

  let { width, height } = img;

  let ratio;
  if ((width > 750 || height > 1000) && (ratio = (width * height) / 500000) > 1) {
    ratio = Math.sqrt(ratio);
    width /= ratio;
    height /= ratio;
  } else {
    ratio = 1;
  }

  let count;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  if ((count = (width * height) / 600000) > 1) {
    count = ~~(Math.sqrt(count) + 1);
    const nw = ~~(width / count),
      nh = ~~(height / count);
    tCanvas.width = nw;
    tCanvas.height = nh;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
        ctx.drawImage(tCanvas, i * nw, j * nh);
      }
    }
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }
  const ndata = canvas.toDataURL('image/jpeg', rate);
  tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0;
  return ndata;
}
