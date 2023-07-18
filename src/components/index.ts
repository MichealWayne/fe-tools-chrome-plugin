/**
 * @author Wayne
 * @Date 2023-07-09 20:15:18
 * @LastEditTime 2023-07-09 14:14:54
 */
const CompMap: {
  [componentName: string]: any;
} = {};

const requireComponents = import.meta.globEager('./**/index.vue');

// 遍历出每个组件的路径
Object.keys(requireComponents).forEach(fileName => {
  const reqComponent = requireComponents[fileName];
  const reqComName =
    reqComponent.name || reqComponent.default?.name || fileName.replace(/\.\/(.*)\.vue/, '$1');

  CompMap[reqComName] = reqComponent.default?.name ? reqComponent.default : reqComponent;
});

export default CompMap;
