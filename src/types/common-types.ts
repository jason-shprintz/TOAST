import ReferenceEntryType from './data-type';

export type ToolType = {
  id: string;
  name: string;
  screen: string;
  icon: string;
};

export type CategoryType = {
  id: string;
  title: string;
  icon: string;
  category: Record<string, string>;
  data: ReferenceEntryType[];
};
