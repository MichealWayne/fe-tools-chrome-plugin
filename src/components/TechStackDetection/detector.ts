import { TECH_STACK_CANDIDATES } from './rules/catalog';
import { detectFromCandidates } from './scoring';
import type { ProbeSignals, TechStackHit } from './types';

export type {
  ConfidenceLevel,
  MatchOperator,
  ProbeSignals,
  SignalSource,
  SignatureCandidate,
  SignatureGroup,
  SignatureRule,
  TechStackHit,
} from './types';

/** Detects supported frameworks, bundlers, and libraries from page probe signals. */
export const detectTechStackFromSignals = (signals: ProbeSignals): TechStackHit[] =>
  detectFromCandidates(signals, TECH_STACK_CANDIDATES);
