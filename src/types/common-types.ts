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
  category: string;
  data: ReferenceEntryType[];
};

export type FlashlightModeType = {
  OFF: string;
  ON: string;
  STROBE: string;
  SOS: string;
  NIGHTVISION?: string;
};
