export type ToolCategory = 'transform' | 'inspect' | 'reference' | 'network';
export type ToolDestination = 'embedded' | 'standalone' | 'external';

export type ToolCard = {
  key: string;
  nameKey: string;
  descriptionKey: string;
  iconClass: string;
  category: ToolCategory;
  destination: ToolDestination;
  componentName?: string;
  url?: string;
};

export const TOOL_CARDS: ToolCard[] = [
  {
    key: 'qr-code',
    nameKey: 'tools.qrCode',
    descriptionKey: 'descriptions.qrCode',
    iconClass: 'u-icon iconfont icon-erweima g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'QRCode',
  },
  {
    key: 'image-compressor',
    nameKey: 'tools.imageCompressor',
    descriptionKey: 'descriptions.imageCompressor',
    iconClass: 'u-icon iconfont icon-compress-file g-fs36',
    category: 'inspect',
    destination: 'embedded',
    componentName: 'ImageCompressor',
  },
  {
    key: 'color-pass',
    nameKey: 'tools.colorPass',
    descriptionKey: 'descriptions.colorPass',
    iconClass: 'u-icon iconfont icon-chanyexietong g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'ColorPass',
  },
  {
    key: 'postman',
    nameKey: 'tools.postMan',
    descriptionKey: 'descriptions.postMan',
    iconClass: 'u-icon icon-postman g-center g-fs36',
    category: 'network',
    destination: 'standalone',
    url: 'index.html?type=postman',
  },
  {
    key: 'unit-calculator',
    nameKey: 'tools.unitCalculator',
    descriptionKey: 'descriptions.unitCalculator',
    iconClass: 'u-icon iconfont icon-calc g-center g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'UnitCalculator',
  },
  {
    key: 'moo-ctn',
    nameKey: 'tools.mooCtn',
    descriptionKey: 'descriptions.mooCtn',
    iconClass: 'u-icon iconfont icon-moo g-center g-fs36',
    category: 'reference',
    destination: 'embedded',
    componentName: 'MooCtn',
  },
  {
    key: 'lang-translator',
    nameKey: 'tools.langTranslator',
    descriptionKey: 'descriptions.langTranslator',
    iconClass: 'u-icon iconfont icon-fanyi g-center g-fs36',
    category: 'reference',
    destination: 'external',
    url: 'https://fanyi.youdao.com/indexLLM.html#/',
  },
  {
    key: 'regex-ctn',
    nameKey: 'tools.regexCtn',
    descriptionKey: 'descriptions.regexCtn',
    iconClass: 'u-icon iconfont icon-regex g-center g-fs36',
    category: 'reference',
    destination: 'embedded',
    componentName: 'RegexCtn',
  },
  {
    key: 'utils-ctn',
    nameKey: 'tools.utilsCtn',
    descriptionKey: 'descriptions.utilsCtn',
    iconClass: 'u-icon icon-utils g-center g-fs36',
    category: 'reference',
    destination: 'embedded',
    componentName: 'UtilsCtn',
  },
  {
    key: 'json-ctn',
    nameKey: 'tools.jsonCtn',
    descriptionKey: 'descriptions.jsonCtn',
    iconClass: 'u-icon icon-json-tool g-center g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'JsonCtn',
  },
  {
    key: 'svg-editor',
    nameKey: 'tools.svgEditor',
    descriptionKey: 'descriptions.svgEditor',
    iconClass: 'u-icon iconfont icon-compress-file g-center g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'SvgEditor',
  },
  {
    key: 'date-converter',
    nameKey: 'tools.dateConverter',
    descriptionKey: 'descriptions.dateConverter',
    iconClass: 'u-icon iconfont icon-calc g-center g-fs36',
    category: 'transform',
    destination: 'embedded',
    componentName: 'DateConverter',
  },
  {
    key: 'linux-command',
    nameKey: 'tools.linuxCommand',
    descriptionKey: 'descriptions.linuxCommand',
    iconClass: 'u-icon icon-linux-command g-center g-fs36',
    category: 'reference',
    destination: 'embedded',
    componentName: 'LinuxCommand',
  },
  {
    key: 'page-screenshot',
    nameKey: 'tools.pageScreenshot',
    descriptionKey: 'descriptions.pageScreenshot',
    iconClass: 'u-icon icon-page-screenshot g-center g-fs36',
    category: 'inspect',
    destination: 'embedded',
    componentName: 'PageScreenshot',
  },
  {
    key: 'tech-stack-detection',
    nameKey: 'tools.techStack',
    descriptionKey: 'descriptions.techStack',
    iconClass: 'u-icon icon-tech-stack g-center g-fs36',
    category: 'inspect',
    destination: 'embedded',
    componentName: 'TechStackDetection',
  },
];
