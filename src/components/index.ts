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
import TechStackDetection from './TechStackDetection/index.vue';
import CodexQuota from './CodexQuota/index.vue';
import MooCtn from '@/views/MooCtn.vue';
import RegexCtn from '@/views/RegexCtn.vue';
import UtilsCtn from '@/views/UtilsCtn.vue';
import type { Component } from 'vue';
import { TOOL_COMPONENT_NAMES, type ToolComponentName } from '@/views/main/tool-cards';

const CompMap: Record<ToolComponentName, Component> = {
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
  TechStackDetection,
  CodexQuota,
  MooCtn,
  RegexCtn,
  UtilsCtn,
};

// Keep this assertion close to the map so new component names cannot be added
// to the registry without also being registered for dynamic component lookup.
if (Object.keys(CompMap).length !== TOOL_COMPONENT_NAMES.length) {
  throw new Error('Tool component registry is incomplete');
}

export default CompMap;
