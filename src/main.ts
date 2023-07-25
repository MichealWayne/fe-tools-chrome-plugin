/**
 * @author Wayne
 * @Date 2022-11-27 17:45:33
 * @LastEditTime 2023-07-09 14:15:05
 */
import { createApp } from 'vue';

import 'moo-css-base/pc.css';
import './styles/popup.less';

import App from './views/app.vue';

// 创建vue实例
const app = createApp(App);

// 挂载实例
app.mount('#app');
