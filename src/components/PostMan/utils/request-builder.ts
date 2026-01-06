import type { PostmanRequestConfig } from '../types';

export type EnvValueResolver = (value: string) => string;

export type RequestPayload = {
  url: string;
  headers: Record<string, string>;
  data: unknown;
};

/**
 * Build the normalized request payload for Axios.
 * @param request - Postman request configuration.
 * @param resolveValue - Value resolver for environment variables.
 */
export const buildRequestPayload = (
  request: PostmanRequestConfig,
  resolveValue: EnvValueResolver
): RequestPayload => {
  const headers: Record<string, string> = {};

  const processedUrl = resolveValue(request.url);

  request.headers.forEach(header => {
    if (header.key && header.value) {
      const processedValue = resolveValue(header.value);
      headers[header.key] = processedValue;
    }
  });

  if (request.auth.type === 'bearer' && request.auth.token) {
    const processedToken = resolveValue(request.auth.token);
    headers['Authorization'] = `Bearer ${processedToken}`;
  } else if (request.auth.type === 'basic' && request.auth.username && request.auth.password) {
    const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (request.auth.type === 'api-key' && request.auth.key && request.auth.value) {
    const processedValue = resolveValue(request.auth.value);
    if (request.auth.addTo === 'header') {
      headers[request.auth.key] = processedValue;
    }
  }

  let requestData: unknown = undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (request.body.type === 'json' && request.body.json) {
      const processedJson = resolveValue(request.body.json);
      requestData = JSON.parse(processedJson);
      headers['Content-Type'] = 'application/json';
    } else if (request.body.type === 'form-data' && request.body.formData) {
      const formData = new FormData();
      request.body.formData.forEach(item => {
        if (item.key && item.value) {
          const processedValue = resolveValue(item.value);
          formData.append(item.key, processedValue);
        }
      });
      requestData = formData;
    } else if (request.body.type === 'x-www-form-urlencoded' && request.body.urlencoded) {
      const params = new URLSearchParams();
      request.body.urlencoded.forEach(item => {
        if (item.key && item.value) {
          const processedValue = resolveValue(item.value);
          params.append(item.key, processedValue);
        }
      });
      requestData = params;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (request.body.type === 'raw' && request.body.raw) {
      const processedRaw = resolveValue(request.body.raw);
      requestData = processedRaw;
    }
  }

  let finalUrl = processedUrl;
  if (
    request.auth.type === 'api-key' &&
    request.auth.addTo === 'query' &&
    request.auth.key &&
    request.auth.value
  ) {
    const processedValue = resolveValue(request.auth.value);
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}${request.auth.key}=${encodeURIComponent(processedValue)}`;
  }

  return {
    url: finalUrl,
    headers,
    data: requestData,
  };
};
