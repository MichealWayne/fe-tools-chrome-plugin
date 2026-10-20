import type { ProbeCoverage, TechStackHit } from './types';
import { redactUrl } from './versions';

export type TechStackReport = {
  target: string;
  scannedAt: string;
  scope: 'main-frame';
  coverage?: ProbeCoverage;
  hits: TechStackHit[];
};

/** Builds a local shareable report; URL secrets are stripped at the export boundary too. */
export const createTechStackReport = (report: TechStackReport): TechStackReport => ({
  ...report,
  target: redactUrl(report.target),
  hits: report.hits.map(hit => ({
    ...hit,
    evidence: hit.evidence.map(item => item.replace(/https?:\/\/[^\s]+/gi, redactUrl)),
    versions: hit.versions?.map(item => ({
      ...item,
      detail: item.source === 'asset' ? redactUrl(item.detail) : item.detail,
    })),
  })),
});

export const formatTechStackSummary = (report: TechStackReport): string =>
  [
    report.target,
    report.scannedAt,
    `Scope: ${report.scope}; DOM: ${report.coverage?.isolated || 'unknown'}; runtime: ${report.coverage?.main || 'unknown'}`,
    ...report.hits.map(
      hit =>
        `${hit.name}: ${
          hit.versions?.length
            ? hit.versions
                .map(
                  version =>
                    `${version.version} [${version.source}: ${version.detail}; ${version.confidence}]`
                )
                .join('; ')
            : 'version unknown'
        } (${hit.confidence})`
    ),
  ].join('\n');
