export type MooSearchResult = {
  label: string;
  color: string;
  name: string;
  link: string;
};

export type MooStyleItem = {
  type: string;
  name: string;
  desc: string;
  ver: string;
};

export type MooColorItem = {
  name: string;
  desc: string;
  show: string;
};

export type MooFuncItem = {
  name: string;
  desc: string;
  place: string;
};

export type MooClassItem = {
  type: string;
  name: string;
  desc: string;
  val: string;
};

export type MooSearchIndex = {
  styleList: MooStyleItem[];
  mooColorList: MooColorItem[];
  mooFuncList: MooFuncItem[];
  mooClassList: MooClassItem[];
};
