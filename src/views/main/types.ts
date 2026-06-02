import type { ToolCard } from './tool-cards';

export type BookmarkItem = {
  title?: string;
  url?: string;
  [key: string]: unknown;
};

export type FeToolListItem = {
  name: string;
  link: string;
  desc: string;
  target?: string[];
  children?: FeToolListItem[];
  pinyinSearchIndex?: string;
};

export type SearchResultItem = {
  link: string;
  name: string;
  label?: 'tools' | 'mark';
  type?: string;
  color?: string;
};

export type ComponentDataTypes = {
  keywords: string;
  markList: BookmarkItem[];
  logoFold: string | boolean;
  showSettings: boolean;
  showCompName: string;
  resultList: SearchResultItem[];
  feToolsList: FeToolListItem[];
  toolCards: ToolCard[];
  currentLang: string;
  enablePinyinSearch: boolean;
  languageChangeHandler?: (lang: string) => void;
};
