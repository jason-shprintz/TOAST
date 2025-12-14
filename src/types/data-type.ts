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
};

export default ReferenceEntryType;
