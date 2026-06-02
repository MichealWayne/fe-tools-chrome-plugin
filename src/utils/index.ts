/* eslint-disable no-magic-numbers */
/**
 * utils
 * @author Wayne
 * @time 2019.10.08
 */

/**
 * Read a query parameter from the current location search string.
 * @param name - Query string key to read.
 * @param decode - Optional decode function for the raw value.
 * @returns The decoded value or null when missing.
 * @example
 * getUrlParam('fundCode'); // '000697'
 */
export function getUrlParam(name: string, decode?: (s: string) => string) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
  const res = window.location.search.substring(1).match(reg);
  if (res) {
    if (!decode) {
      return decodeURI(res[2]);
    }
    // eslint-disable-next-line no-eval
    return decode(res[2]);
  }
  return null;
}

/**
 * Create helpers to render and download a QR code for a given URL.
 * @param url - Content to encode.
 * @param type - Render target for inline preview (canvas or svg).
 */
export function handleQRCode(url: string, type = 'canvas') {
  const { AraleQRCode } = window;
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

    downloadQR(renderType = 'svg') {
      const qrnode = new AraleQRCode({
        text: url,
        render: renderType === 'svg' ? renderType : 'canvas',
      });

      const ctn = document.createElement('div');
      ctn.appendChild(qrnode);

      const blobType = renderType === 'svg' ? 'application/svg' : `image/${renderType}`;
      alert(blobType);
      const blobContent = new Blob([ctn.innerHTML], {
        type: `application/${blobType}`,
      });
      const blobUrl = window.URL.createObjectURL(blobContent);
      const eleLink = document.createElement('a');

      eleLink.download = `qr-code.${renderType}`;
      eleLink.style.display = 'none';
      eleLink.href = blobUrl;

      document.body.appendChild(eleLink);
      eleLink.click();

      document.body.removeChild(eleLink);
    },
  };
}

/**
 * Read a File into a Base64 data URL.
 * @param file - File object selected by the user.
 * @param cb - Callback invoked with the Base64 string.
 */
export function getFileBase64(file: File, cb: (base64: string) => unknown) {
  if (!file) throw new Error('Error! no param "file"(getFileBase64()).');

  const reader = new FileReader();
  reader.onload = function (e) {
    /**
     * Base64 payload for the entire file.
     */
    const base64 = e.target!.result;

    if (cb) cb(base64 as string);
  };
  reader.onerror = function () {
    alert('Read file fail.');
  };
  reader.readAsDataURL(file);
}

/**
 * Compress an image element into a JPEG data URL.
 * @param img - Source image element.
 * @param rate - Compression quality between 0 and 1.
 * @returns Compressed image data URL.
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
    count = Math.floor(Math.sqrt(count) + 1);

    const nw = Math.floor(width / count);
    const nh = Math.floor(height / count);
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
