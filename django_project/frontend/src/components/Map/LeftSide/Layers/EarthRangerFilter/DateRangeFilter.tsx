import React, { useState } from 'react';
import {
  Box,
  Flex,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { DateRange } from './types';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  analysisDate?: DateRange | null;
}

type Mode = 'custom' | 'analysis';

export default function DateRangeFilter({ value, onChange, analysisDate }: Props) {
  const hasAnalysisDate = !!(analysisDate?.start || analysisDate?.end);
  const [mode, setMode] = useState<Mode>('custom');

  const handleModeChange = (next: Mode) => {
    setMode(next);
    if (next === 'analysis' && hasAnalysisDate) {
      onChange({ start: analysisDate.start, end: analysisDate.end });
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, start: e.target.value || null });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, end: e.target.value || null });
  };

  const isCustom = mode === 'custom';

  return (
    <Box mt={3} mb={1}>
      <Text fontWeight="bold" fontSize="sm" mb={2} color="black">Event Time</Text>
      <RadioGroup value={mode} onChange={(v) => handleModeChange(v as Mode)}>
        <Stack direction="row" spacing={4} align="center">
          <Radio value="custom" size="sm">Custom</Radio>
          <Tooltip
            label="Only available on dashboard when dates are available"
            isDisabled={hasAnalysisDate}
            placement="right"
          >
            <Box display="inline-block">
              <Radio value="analysis" size="sm" isDisabled={!hasAnalysisDate}>
                From analysis
              </Radio>
            </Box>
          </Tooltip>
        </Stack>
      </RadioGroup>

      <Flex mt={2} gap={2} align="center">
        <Input
          type="date"
          size="sm"
          value={isCustom ? (value.start ?? '') : (analysisDate?.start ?? '')}
          onChange={handleStartChange}
          isReadOnly={!isCustom}
          opacity={!isCustom ? 0.6 : 1}
          borderRadius="md"
        />
        <Text fontSize="xs" color="gray.400" flexShrink={0}>to</Text>
        <Input
          type="date"
          size="sm"
          value={isCustom ? (value.end ?? '') : (analysisDate?.end ?? '')}
          onChange={handleEndChange}
          isReadOnly={!isCustom}
          opacity={!isCustom ? 0.6 : 1}
          borderRadius="md"
        />
      </Flex>
    </Box>
  );
}
