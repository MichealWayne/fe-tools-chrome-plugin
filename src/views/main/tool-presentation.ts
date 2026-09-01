import { sanitizeInlineMarkup } from '@/utils/sanitize';
import type { ToolCard } from './tool-cards';
import type { SearchResultItem } from './types';

export type ToolTranslate = (key: string, params?: Record<string, string | number>) => string;

export const getToolTitle = (tool: ToolCard, translate: ToolTranslate): string => {
  const parts = [translate(tool.descriptionKey)];
  if (tool.destination !== 'embedded') {
    parts.push(translate('experience.' + tool.destination));
  }
  return parts.join(' · ');
};

export const getToolAccessibleLabel = (
  tool: ToolCard,
  translate: ToolTranslate,
  language: string
): string => {
  const parts = [
    translate(tool.nameKey),
    translate('experience.categories.' + tool.category),
    translate(tool.descriptionKey),
  ];
  if (tool.destination !== 'embedded') {
    parts.push(translate('experience.' + tool.destination));
  }
  return parts.join(language === 'en' ? ', ' : '，');
};

export const getResultText = (item: SearchResultItem): string =>
  sanitizeInlineMarkup(item?.name || '--');

export const getResultLabel = (type?: SearchResultItem['label']): string => {
  if (!type) return '';
  return { tools: 's-simple', mark: 's-red' }[type];
};
