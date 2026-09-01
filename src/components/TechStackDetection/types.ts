export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ProbeSignals = {
  scripts: string[];
  links: string[];
  scriptTypes: string[];
  globals: string[];
  selectors: string[];
  metas: string[];
  htmlAttrs: string[];
  content: string[];
  resources?: string[];
  runtime?: string[];
  versions?: Record<string, string>;
};

export type TechStackHit = {
  key: string;
  name: string;
  category: 'framework' | 'bundler' | 'library';
  confidence: ConfidenceLevel;
  score: number;
  evidence: string[];
};

export type SignalSource =
  | 'scripts'
  | 'links'
  | 'scriptTypes'
  | 'globals'
  | 'selectors'
  | 'metas'
  | 'htmlAttrs'
  | 'content'
  | 'resources'
  | 'runtime';

export type MatchOperator = 'equals' | 'contains' | 'regex';
export type SignatureGroup = 'runtime' | 'asset' | 'markup' | 'module';

export type SignatureRule = {
  source: SignalSource;
  pattern: string;
  weight: number;
  operator: MatchOperator;
  group: SignatureGroup;
  decisive: boolean;
};

export type SignatureCandidate = {
  key: string;
  name: string;
  category: TechStackHit['category'];
  signatures: SignatureRule[];
  versionKeys?: string[];
};
