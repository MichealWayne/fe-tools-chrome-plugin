import type {
  EnvironmentVariable,
  KeyValueEntry,
  PostmanEnvironment,
  PostmanRequestConfig,
} from '../types';
import { DEFAULT_REQUEST_SETTINGS } from '../types';

let entrySequence = 0;

export const createEntryId = (): string => `entry-${Date.now()}-${++entrySequence}`;

export const normalizeEntry = <T extends KeyValueEntry>(entry: T): T => ({
  ...entry,
  id: entry.id || createEntryId(),
  enabled: entry.enabled !== false,
});

export const normalizeEntries = <T extends KeyValueEntry>(entries: T[] = []): T[] =>
  entries.map(normalizeEntry);

export const normalizeEnvironment = (environment: PostmanEnvironment): PostmanEnvironment => ({
  name: environment.name,
  variables: normalizeEntries(environment.variables || []).map(variable => ({
    ...variable,
    secret: Boolean(variable.secret),
  })) as EnvironmentVariable[],
});

export const normalizeRequest = (request: PostmanRequestConfig): PostmanRequestConfig => ({
  method: request.method || 'GET',
  url: request.url || '',
  queryParams: normalizeEntries(request.queryParams || []),
  headers: normalizeEntries(request.headers || []),
  body: {
    type: request.body?.type || 'none',
    json: request.body?.json || '',
    raw: request.body?.raw || '',
    formData: normalizeEntries(request.body?.formData || []),
    urlencoded: normalizeEntries(request.body?.urlencoded || []),
  },
  auth: request.auth || { type: 'none' },
  settings: { ...DEFAULT_REQUEST_SETTINGS, ...request.settings },
  environment: request.environment || '',
});

export const cloneRequest = (request: PostmanRequestConfig): PostmanRequestConfig =>
  normalizeRequest(JSON.parse(JSON.stringify(request)) as PostmanRequestConfig);
