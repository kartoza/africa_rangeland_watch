import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import Select, { MultiValue } from 'react-select';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../store';
import { setSelectedEventTypes } from '../../../../store/earthRangerSlice';

interface EventTypeRow {
  event_type: string;
  count: number;
}

interface OptionType {
  label: string;
  value: string;
  count: number;
}

type SortMode = 'name' | 'count';

function humanize(str: string): string {
  return str
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildOptions(rows: EventTypeRow[], sort: SortMode): OptionType[] {
  const opts: OptionType[] = rows.map((r) => ({
    value: r.event_type,
    label: `${humanize(r.event_type)} (${r.count})`,
    count: r.count,
  }));
  return sort === 'count'
    ? opts.sort((a, b) => b.count - a.count)
    : opts.sort((a, b) => a.label.localeCompare(b.label));
}

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: '2rem',
    fontSize: '13px',
    borderColor: '#E2E8F0',
    borderRadius: '0.375rem',
    boxShadow: 'none',
    backgroundColor: 'white',
    '&:hover': { borderColor: '#CBD5E0' },
  }),
  menu: (base: any) => ({ ...base, fontSize: '13px', zIndex: 9999 }),
  option: (base: any, state: any) => ({
    ...base,
    color: '#1A202C',
    backgroundColor: state.isSelected
      ? '#C6F6D5'
      : state.isFocused
      ? '#F0FFF4'
      : 'white',
  }),
  singleValue: (base: any) => ({ ...base, color: '#1A202C' }),
  input: (base: any) => ({ ...base, color: '#1A202C' }),
  multiValue: (base: any) => ({ ...base, backgroundColor: '#E6FFFA' }),
  multiValueLabel: (base: any) => ({ ...base, color: '#276749', fontSize: '13px' }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: '#276749',
    '&:hover': { backgroundColor: '#B2F5EA', color: '#22543D' },
  }),
  placeholder: (base: any) => ({ ...base, fontSize: '13px', color: '#1A202C' }),
};

export default function EarthRangerFilter() {
  const dispatch = useDispatch<AppDispatch>();
  const [rows, setRows] = useState<EventTypeRow[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [selected, setSelected] = useState<MultiValue<OptionType>>([]);

  useEffect(() => {
    fetch('/frontend-api/earth-ranger/event-types/')
      .then((r) => r.json())
      .then((data: EventTypeRow[]) => setRows(data))
      .catch(() => {});
  }, []);

  const options = buildOptions(rows, sortMode);

  const handleChange = (newValue: MultiValue<OptionType>) => {
    setSelected(newValue);
    dispatch(setSelectedEventTypes(newValue.map((o) => o.value)));
  };

  const sortBtn = (mode: SortMode, label: string) => (
    <Button
      size="xs"
      variant="ghost"
      fontWeight={sortMode === mode ? 'bold' : 'normal'}
      color={sortMode === mode ? 'dark_green.800' : 'gray.500'}
      textDecoration={sortMode === mode ? 'underline' : 'none'}
      px={1}
      minW="auto"
      height="auto"
      onClick={() => setSortMode(mode)}
    >
      {label}
    </Button>
  );

  return (
    <Box mt={2} mb={1}>
      <Flex align="center" justify="space-between" mb={1}>
          <b>Event Type</b>
        <Flex gap={1} align="center">
          <Text fontSize="10px" color="gray.400">Sort:</Text>
          {sortBtn('name', 'Name')}
          {sortBtn('count', 'Count')}
        </Flex>
      </Flex>
      <Select
        isMulti
        options={options}
        value={selected}
        onChange={handleChange}
        placeholder="All event types…"
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        isClearable
        isSearchable
      />
    </Box>
  );
}
