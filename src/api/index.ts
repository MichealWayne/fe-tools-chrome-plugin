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

/**
 * FeTools API service that wraps the core resource endpoints.
 */
class FeToolsService extends ApiClient {
  constructor() {
    super({ baseURL: API_HOST });
  }

  /**
   * Fetch the tool list used by the main dashboard.
   */
  async getFeTools(): Promise<ApiResponse<ToolsData[]>> {
    return this.get<ToolsData[]>('/fe-tools/datas/tools.json');
  }

  /**
   * Submit a translation request to the backend proxy.
   * @param data - Translation input payload.
   */
  async handleTranslate(data: TranslateRequest): Promise<ApiResponse<TranslateResponse>> {
    return this.post<TranslateResponse>('/translate', data);
  }

  /**
   * Load MooCSS reference data.
   */
  async getMooCSS(): Promise<ApiResponse<MooCSSData[]>> {
    return this.get<MooCSSData[]>('/fe-tools/datas/moo-css.json');
  }

  /**
   * Fetch the regex catalog used by the regex tool.
   */
  async getRegex(): Promise<ApiResponse<RegexData[]>> {
    return this.get<RegexData[]>('/fe-tools/datas/regex.json');
  }

  /**
   * Load the Linux command reference list.
   */
  async getLinuxCommands(): Promise<ApiResponse<LinuxCommand[]>> {
    return this.get<LinuxCommand[]>('/fe-tools/datas/linux-commands.json');
  }

  /**
   * Fetch metadata for the utils catalog.
   */
  async getUtilFuncs(): Promise<ApiResponse<UtilFunction[]>> {
    return this.get<UtilFunction[]>('/fe-tools/stable/data/yafReflectionMap.json');
  }
}

/**
 * Shared API client instance used by legacy helper methods.
 */
export const feToolsService = new FeToolsService();

/**
 * Legacy GET helper preserved for backward compatibility.
 * @param url - Absolute or relative endpoint path.
 * @param params - Optional query params or payload.
 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return feToolsService.get<T>(url, params);
}

/**
 * Legacy POST helper preserved for backward compatibility.
 * @param url - Absolute or relative endpoint path.
 * @param data - Optional request payload.
 */
export function post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  return feToolsService.post<T>(url, data);
}

/**
 * Type contract for dynamically generated API methods.
 */
interface ApiMethods {
  [key: string]: (data?: unknown) => Promise<ApiResponse<unknown>>;
}

/**
 * Dynamic API container that mirrors AJAX_INTERFACE.
 */
const api: ApiMethods = {};

/**
 * Parse "METHOD /path" strings into callable API functions.
 * @param info - "METHOD /path" string from AJAX_INTERFACE.
 * @returns A function that issues the request with optional payload.
 */
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

/**
 * Generate API methods from the static interface map for legacy usage.
 */
for (const key in AJAX_INTERFACE) {
  if (Object.prototype.hasOwnProperty.call(AJAX_INTERFACE, key)) {
    api[key] = handleAjax(AJAX_INTERFACE[key as keyof typeof AJAX_INTERFACE]);
  }
}

export default api;
