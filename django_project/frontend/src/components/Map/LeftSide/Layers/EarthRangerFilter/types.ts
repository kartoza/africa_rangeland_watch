export interface EventTypeRow {
  event_type: string;
  count: number;
}

export interface OptionType {
  label: string;
  value: string;
  count: number;
}

export type SortMode = 'name' | 'count';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface LocationValue {
  landscapeId: number | null;
  communityIds: number[];
}
