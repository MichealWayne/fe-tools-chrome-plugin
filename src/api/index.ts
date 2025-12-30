/**
 * @description handle ajax
 * @author Wayne
 * @time 2019.10.08
 * @updated 2024.04.15
 */

import { ApiClient } from './client';
import { AJAX_INTERFACE } from '@/constant';
import { API_HOST } from '@/constant';
import {
  ApiResponse,
  ToolsData,
  TranslateRequest,
  TranslateResponse,
  MooCSSData,
  RegexData,
  LinuxCommand,
  UtilFunction,
} from '@/types/api';

// FeTools API 服务：封装各资源请求
class FeToolsService extends ApiClient {
  constructor() {
    super({ baseURL: API_HOST });
  }

  // 工具列表
  async getFeTools(): Promise<ApiResponse<ToolsData[]>> {
    return this.get<ToolsData[]>('/fe-tools/datas/tools.json');
  }

  // 翻译接口
  async handleTranslate(data: TranslateRequest): Promise<ApiResponse<TranslateResponse>> {
    return this.post<TranslateResponse>('/translate', data);
  }

  // MooCSS 数据
  async getMooCSS(): Promise<ApiResponse<MooCSSData[]>> {
    return this.get<MooCSSData[]>('/fe-tools/datas/moo-css.json');
  }

  // 正则表达式库
  async getRegex(): Promise<ApiResponse<RegexData[]>> {
    return this.get<RegexData[]>('/fe-tools/datas/regex.json');
  }

  // Linux 命令文档
  async getLinuxCommands(): Promise<ApiResponse<LinuxCommand[]>> {
    return this.get<LinuxCommand[]>('/fe-tools/datas/linux-commands.json');
  }

  // 工具函数元数据
  async getUtilFuncs(): Promise<ApiResponse<UtilFunction[]>> {
    return this.get<UtilFunction[]>('/fe-tools/stable/data/yafReflectionMap.json');
  }
}

// 创建服务实例
export const feToolsService = new FeToolsService();

// 兼容旧的API调用方式
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return feToolsService.get<T>(url, params);
}

// 兼容旧的API调用方式
export function post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return feToolsService.post<T>(url, data);
}

// 动态生成API方法（保持向后兼容）
// 动态 API 映射的类型约束
interface ApiMethods {
  [key: string]: (data?: unknown) => Promise<ApiResponse<unknown>>;
}

// 动态 API 容器
const api: ApiMethods = {};

// 解析 "METHOD /path" 字符串并返回调用函数
function handleAjax(info: string) {
  const [method, url] = info.split(' ');
  return function (data?: unknown) {
    if (!method || !url) {
      throw new Error(`Invalid API configuration: ${info}`);
    }
    if (method.toLowerCase() === 'get') {
      return feToolsService.get(url, data as Record<string, unknown>);
    } else if (method.toLowerCase() === 'post') {
      return feToolsService.post(url, data);
    }
    throw new Error(`Unsupported HTTP method: ${method}`);
  };
}

// 生成API方法
for (const key in AJAX_INTERFACE) {
  if (Object.prototype.hasOwnProperty.call(AJAX_INTERFACE, key)) {
    api[key] = handleAjax(AJAX_INTERFACE[key as keyof typeof AJAX_INTERFACE]);
  }
}

export default api;
