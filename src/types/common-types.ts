import ReferenceEntryType from './data-type';

export type toolType = {
  id: string;
  name: string;
  screen: string;
  icon: string;
};

export type categoryType = {
  id: string;
  title: string;
  icon: string;
  category: Record<string, string>;
  data: ReferenceEntryType[];
};
