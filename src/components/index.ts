/**
 * @author Wayne
 * @Date 2023-07-09 20:15:18
 * @LastEditTime 2025-09-08 09:44:48
 */

/**
 * Import and aggregate all shared components.
 */
import QRCode from './QRCode/index.vue';
import JsonCtn from './JsonCtn/index.vue';
import SvgEditor from './SvgEditor/index.vue';
import DateConverter from './DateConverter/index.vue';
import ImageCompressor from './ImageCompressor/index.vue';
import ColorPass from './ColorPass/index.vue';
import LangTranslator from './LangTranslator/index.vue';
import UnitCalculator from './UnitCalculator/index.vue';
import LinuxCommand from './LinuxCommand/index.vue';
import PageScreenshot from './PageScreenshot/index.vue';

const CompMap: {
  [componentName: string]: any;
} = {
  QRCode,
  JsonCtn,
  SvgEditor,
  DateConverter,
  ImageCompressor,
  ColorPass,
  LangTranslator,
  UnitCalculator,
  LinuxCommand,
  PageScreenshot,
};

export default CompMap;
