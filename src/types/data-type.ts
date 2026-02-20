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
  related_screen?: string; // optional — navigator screen name to link to
  related_screen_label?: string; // optional — label for the link button
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
