/**
 * @author Wayne
 * @Date 2023-07-09 20:15:18
 * @LastEditTime 2025-03-31 16:48:59
 */
// eslint-disable-next-line filenames/match-exported
const CompMap: {
  [componentName: string]: any;
} = {};

const requireComponents = import.meta.globEager('./**/index.vue');

// 遍历出每个组件的路径
Object.keys(requireComponents).forEach(fileName => {
  const reqComponent = requireComponents[fileName];
  // 如果是 index.vue 文件，只使用文件夹名称作为组件名
  const reqComName =
    reqComponent.name ||
    reqComponent.default?.name ||
    (fileName.includes('/index.vue')
      ? fileName.replace(/\.\/(.*)\/index\.vue/, '$1')
      : fileName.replace(/\.\/(.*)\.vue/, '$1'));

  CompMap[reqComName] = reqComponent.default?.name ? reqComponent.default : reqComponent;
});

export default CompMap;
