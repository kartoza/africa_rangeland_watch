import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import Select, { MultiValue } from 'react-select';
import { EventTypeRow, OptionType, SortMode } from './types';
import { earthRangerSelectStyles } from './index';

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

interface Props {
  value: string[];
  onChange: (types: string[]) => void;
  usePortal?: boolean;
}

export default function EventTypeFilter({ value, onChange, usePortal = true }: Props) {
  const [rows, setRows] = useState<EventTypeRow[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('name');

  useEffect(() => {
    fetch('/frontend-api/earth-ranger/event-types/')
      .then((r) => r.json())
      .then((data: EventTypeRow[]) => setRows(data))
      .catch(() => {});
  }, []);

  const options = buildOptions(rows, sortMode);
  const selected = options.filter((o) => value.includes(o.value));

  const handleChange = (newValue: MultiValue<OptionType>) => {
    onChange(newValue.map((o) => o.value));
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
        styles={earthRangerSelectStyles}
        menuPortalTarget={usePortal ? document.body : null}
        menuPosition={usePortal ? 'fixed' : 'absolute'}
        isClearable
        isSearchable
      />
    </Box>
  );
}
