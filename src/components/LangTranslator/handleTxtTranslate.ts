/**
 * @author Wayne
 * @Date 2023-07-22 13:57:04
 * @LastEditTime 2023-07-25 09:57:07
 */
import ajax from '@/api/ajax';

export default function handleTxtTranslate(txt: string): Promise<string> {
  return new Promise(resolve => {
    ajax
      .handleTranslate({
        doctype: 'json',
        type: 'AUTO',
        i: txt,
      })
      .then((data: any) => {
        let resultTxt = '';
        if (data.translateResult?.length) {
          const resultArr = data.translateResult || [];

          resultArr.forEach((itemArr: any[]) => {
            if (itemArr?.length) {
              itemArr.forEach(item => {
                resultTxt += item.tgt;
              });
            }
          });
        }
        resolve(resultTxt || '');
      });
  });
}
