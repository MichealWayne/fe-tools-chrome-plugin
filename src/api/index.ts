/**
 * @description handle ajax
 * @author Wayne
 * @time 2019.10.08
 */

import axios, { AxiosResponse } from 'axios';
import { AnyObj } from '../types';

import { AJAX_INTERFACE } from '@/constant';

/**
 * @function handleSuccess
 * @description request sucess callback
 * @param {object} res
 * @return {promise}
 */
function handleSuccess(res: AxiosResponse<any>, url: string) {
  const { statusText, status, data } = res;

  let result: AnyObj = {};
  if (typeof data === 'object') {
    result = data;
    if (Array.isArray(data)) {
      result.list = data;
    }
  } else {
    result.data = data;
  }

  return Promise.resolve({
    success: true,
    message: statusText,
    statusCode: status,
    url,
    ...result,
  });
}

/**
 * @function handleError
 * @description request fail callback
 * @param {object} res
 * @return {promise}
 */
function handleError(err: any, url: string) {
  const { response, message } = err || {};

  let msg;
  let statusCode;

  if (response && response instanceof Object) {
    const { data, statusText } = response;

    statusCode = response.status;
    msg = data.message || statusText;
  } else {
    // eslint-disable-next-line no-magic-numbers
    statusCode = 600;
    msg = message || `Network Error(${url})`;
  }

  return Promise.reject({
    success: false,
    statusCode,
    message: msg,
  });
}

export function get(url: string, ...rest: any[]) {
  return axios
    .get(url, typeof rest[0] === 'function' ? {} : { params: rest[0], timeout: 8000 })
    .catch(e => console.warn(e))
    .then(res => handleSuccess(res!, url))
    .catch(e => handleError(e, url));
}

export function post(url: string, ...rest: any[]) {
  return axios
    .post(url, rest[0], {
      timeout: 10000,
    })
    .catch(e => console.warn(e))
    .then(res => handleSuccess(res!, url))
    .catch(e => handleError(e, url));
}

const AjaxMethods = {
  get,
  post,
};

const api: any = {};
function handleAjax(info: string) {
  const _info = info.split(' ');
  return function (datas: AnyObj) {
    return AjaxMethods[_info[0] as keyof typeof AjaxMethods](_info[1], datas);
  };
}

// eslint-disable-next-line guard-for-in
for (const key in AJAX_INTERFACE) {
  api[key] = handleAjax(AJAX_INTERFACE[key as keyof typeof AJAX_INTERFACE]);
}

export default api;
