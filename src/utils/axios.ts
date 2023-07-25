/**
 * @author Wayne
 * @Date 2022-11-27 17:45:33
 * @LastEditTime 2023-07-22 10:01:25
 */
// eslint-disable-next-line filenames/match-exported
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const service = axios.create();

// Request interceptors
service.interceptors.request.use(
  (config: AxiosRequestConfig) => config,
  (error: any) => {
    Promise.reject(error);
  }
);

// Response interceptors
service.interceptors.response.use(
  async (response: AxiosResponse) => {
    console.log(response);

    // do something
  },
  (error: any) => Promise.reject(error)
);

export default service;
