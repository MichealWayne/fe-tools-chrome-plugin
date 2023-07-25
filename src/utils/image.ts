/**
 * @author Wayne
 * @Date 2019-10-04 17:27:22
 * @LastEditTime 2023-07-25 10:02:17
 */
import { compressImg, getFileBase64 } from './index';

/**
 * @function getCompressedImageBase64
 * @param imgUrl
 * @param rate
 * @returns
 */
export function getCompressedImageBase64(imgUrl: string, rate: number | string): Promise<string> {
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
 * @function handleInputUploadImageFile
 * @param {FileList} fileList
 * @param {number | string} compressRate
 * @returns
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
        base64result: (compressRate && compressImg(_img, Number(compressRate))) || '',
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
