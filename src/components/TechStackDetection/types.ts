export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type VersionObservation = {
  technology: string;
  version: string;
  source: 'runtime' | 'dom' | 'devtools' | 'asset';
  detail: string;
  confidence: ConfidenceLevel;
};

export type ProbeCoverage = {
  isolated: 'ok' | 'failed';
  main: 'ok' | 'failed';
};

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
  versionObservations?: VersionObservation[];
  coverage?: ProbeCoverage;
};

export type TechStackHit = {
  key: string;
  name: string;
  category: 'framework' | 'bundler' | 'library';
  confidence: ConfidenceLevel;
  score: number;
  evidence: string[];
  versions?: VersionObservation[];
  versionConflict?: boolean;
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
