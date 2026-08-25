/**
 * @author Wayne
 * @Date 2023-07-22 13:57:04
 * @LastEditTime 2024-03-04 15:41:42
 */
import ajax from '@/api';

/**
 * Call the translation API and return the translated text.
 * @param txt - Source text to translate.
 * @returns Promise resolving to the translated string.
 */
export default function handleTxtTranslate(txt: string): Promise<string> {
  return ajax
    .handleTranslate({
      doctype: 'json',
      type: 'AUTO',
      i: txt,
    })
    .then(data => {
      const payload = data.data || data;
      const translateResult = (payload as { translateResult?: Array<Array<{ tgt?: string }>> })
        .translateResult;

      return (
        translateResult
          ?.flat()
          .map(item => item.tgt || '')
          .join('') || ''
      );
    });
}
