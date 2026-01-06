/**
 * @author Wayne
 * @Date 2019-10-04 17:27:22
 * @LastEditTime 2024-03-04 15:40:34
 */
import { compressImg, getFileBase64 } from './index';

/**
 * Load an image URL and return a compressed Base64 string.
 * @param imgUrl - Source image URL or data URL.
 * @param rate - Compression ratio between 0 and 1.
 * @returns Promise resolving to the compressed Base64 data.
 */
export function getCompressedImageBase64(imgUrl: string, rate = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const rateNum = Number(rate) || 1;
    if (rateNum > 0 && rateNum <= 1) {
      const img = new Image();
      img.onload = () => {
        if (rateNum) {
          resolve(compressImg(img, rateNum));
        }
      };
      img.onerror = e => reject(e);
      img.src = imgUrl;
    }
  });
}

/**
 * Handle file input selection and return a preview URL + Base64 payload.
 * @param fileList - FileList from an input element.
 * @param compressRate - Optional compression ratio.
 * @returns Promise resolving to image URL and Base64 content.
 */
export function handleInputUploadImageFile(
  fileList?: FileList,
  compressRate?: number | string
): Promise<{
  imgUrl: string;
  base64result: string;
}> {
  return new Promise((resolve, reject) => {
    const len = fileList?.length;

    if (!fileList || !len || !/\/(?:jpeg|png|gif)/i.test(fileList[0].type)) {
      reject('文件格式错误');
      return;
    }
    const _imgUrl = window.URL.createObjectURL(fileList[0]);

    const _img = new Image();
    _img.onload = () => {
      resolve({
        imgUrl: _imgUrl,
        base64result: compressRate ? compressImg(_img, Number(compressRate)) : '',
      });
    };
    _img.onerror = function (e) {
      console.error(e);
      reject('转换失败，请重试');
    };
    _img.src = _imgUrl;

    if (!compressRate) {
      getFileBase64(fileList[0], (base64: string) => {
        resolve({
          imgUrl: _imgUrl,
          base64result: base64,
        });
      });
    }
  });
}
