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
  ApiItemResponse,
  ApiListResponse,
  ApiEndpoints,
  isApiItemResponse,
  isApiListResponse,
  ToolsData,
  TranslateRequest,
  TranslateResponse,
  MooCSSData,
  RegexData,
  LinuxCommand,
  UtilFunctionMap,
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
  async getFeTools(): Promise<ApiListResponse<ToolsData>> {
    return this.getList<ToolsData>('/fe-tools/datas/tools.json');
  }

  /**
   * Submit a translation request to the backend proxy.
   * @param data - Translation input payload.
   */
  async handleTranslate(data: TranslateRequest): Promise<ApiItemResponse<TranslateResponse>> {
    return this.postItem<TranslateResponse>('/translate', data);
  }

  /**
   * Load MooCSS reference data.
   */
  async getMooCSS(): Promise<ApiListResponse<MooCSSData>> {
    return this.getList<MooCSSData>('/fe-tools/datas/moo-css.json');
  }

  /**
   * Fetch the regex catalog used by the regex tool.
   */
  async getRegex(): Promise<ApiListResponse<RegexData>> {
    return this.getList<RegexData>('/fe-tools/datas/regex.json');
  }

  /**
   * Load the Linux command reference list.
   */
  async getLinuxCommands(): Promise<ApiListResponse<LinuxCommand>> {
    return this.getList<LinuxCommand>('/fe-tools/datas/linux-commands.json');
  }

  /**
   * Fetch metadata for the utils catalog.
   */
  async getUtilFuncs(): Promise<ApiItemResponse<UtilFunctionMap>> {
    const response = await this.get<UtilFunctionMap>('/fe-tools/stable/data/yafReflectionMap.json');
    if (isApiItemResponse(response)) return response;
    throw new TypeError(
      'Expected an item response from /fe-tools/stable/data/yafReflectionMap.json'
    );
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
 * Parse "METHOD /path" strings into callable API functions.
 * @param info - "METHOD /path" string from AJAX_INTERFACE.
 * @returns A function that issues the request with optional payload.
 */
function handleAjax<T>(
  info: string,
  expectedShape: 'list'
): (data?: unknown) => Promise<ApiListResponse<T>>;
function handleAjax<T>(
  info: string,
  expectedShape: 'item'
): (data?: unknown) => Promise<ApiItemResponse<T>>;
function handleAjax<T>(info: string, expectedShape: 'list' | 'item') {
  const [method, url] = info.split(' ');
  return async function (data?: unknown) {
    if (!method || !url) {
      throw new Error(`Invalid API configuration: ${info}`);
    }
    let response: ApiResponse<T>;
    if (method.toLowerCase() === 'get') {
      response = await feToolsService.get<T>(url, data as Record<string, unknown>);
    } else if (method.toLowerCase() === 'post') {
      response = await feToolsService.post<T>(url, data);
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    if (expectedShape === 'list' && isApiListResponse(response)) return response;
    if (expectedShape === 'item' && isApiItemResponse(response)) return response;
    const article = expectedShape === 'item' ? 'an' : 'a';
    throw new TypeError(`Expected ${article} ${expectedShape} response from ${url}`);
  };
}

/**
 * Legacy API facade. The explicit mapping keeps AJAX_INTERFACE and ApiEndpoints exhaustive.
 */
const api: ApiEndpoints = {
  getFeTools: handleAjax<ToolsData>(AJAX_INTERFACE.getFeTools, 'list'),
  handleTranslate: handleAjax<TranslateResponse>(AJAX_INTERFACE.handleTranslate, 'item'),
  getMooCSS: handleAjax<MooCSSData>(AJAX_INTERFACE.getMooCSS, 'list'),
  getRegex: handleAjax<RegexData>(AJAX_INTERFACE.getRegex, 'list'),
  getLinuxCommands: handleAjax<LinuxCommand>(AJAX_INTERFACE.getLinuxCommands, 'list'),
  getUtilFuncs: handleAjax<UtilFunctionMap>(AJAX_INTERFACE.getUtilFuncs, 'item'),
};

export default api;
