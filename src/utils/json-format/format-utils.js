/**
 * Escape HTML special characters to prevent HTML injection.
 * @param {string} value
 * @returns {string}
 */
export const escapeHtml = value => {
  let output = value;
  output = output.replace(/&/g, '&amp;');
  output = output.replace(/</g, '&lt;');
  output = output.replace(/>/g, '&gt;');
  output = output.replace(/"/g, '&quot;');
  output = output.replace(/'/g, '&#039;');
  return output;
};

/**
 * Parse and format a JSON string with indentation.
 * @param {string} jsonStr
 * @param {number} indent
 * @returns {string}
 */
export const formatJsonString = (jsonStr, indent = 4) =>
  JSON.stringify(JSON.parse(jsonStr), null, indent);
