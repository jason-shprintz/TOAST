type ReferenceEntryType = {
  id: string;
  category: string;
  title: string;
  summary: string;
  difficulty: string;
  tags: string[];
  steps: string[];
  do_not: string[];
  watch_for: string[];
  notes: string[];
  image?: string; // optional — maps to key in referenceImages.ts
};

export type ScenarioCardType = {
  id: string;
  category: string;
  title: string;
  summary: string;
  difficulty: string;
  tags: string[];
  situation: string;
  immediate_risks: string[];
  first_5_minutes: string[];
  first_hour: string[];
  first_day: string[];
  watch_for: string[];
  notes: string[];
};

export default ReferenceEntryType;
