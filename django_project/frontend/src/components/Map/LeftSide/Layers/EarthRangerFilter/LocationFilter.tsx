import React, { useEffect, useState } from 'react';
import {
  Box,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import ReactSelect, { MultiValue } from 'react-select';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../store';
import { fetchLandscapes } from '../../../../../store/landscapeSlice';
import { LocationValue } from './types';
import { earthRangerSelectStyles } from './index';

interface Option {
  value: number;
  label: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  analysisLocation?: LocationValue | null;
  usePortal?: boolean;
}

type Mode = 'custom' | 'analysis';

export default function LocationFilter({ value, onChange, analysisLocation, usePortal = true }: Props) {
  const hasAnalysisLocation = !!(
    analysisLocation?.landscapeId || analysisLocation?.communityIds?.length
  );
  const [mode, setMode] = useState<Mode>('custom');
  const dispatch = useDispatch<AppDispatch>();
  const landscapes = useSelector((s: RootState) => s.landscape.landscapes);

  useEffect(() => {
    if (landscapes.length === 0) dispatch(fetchLandscapes());
  }, []);
  const [communityOptions, setCommunityOptions] = useState<Option[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const isCustom = mode === 'custom';
  const activeLandscapeId = isCustom ? value.landscapeId : analysisLocation?.landscapeId;
  const activeCommunityIds = isCustom ? value.communityIds : (analysisLocation?.communityIds ?? []);

  useEffect(() => {
    if (!activeLandscapeId) { setCommunityOptions([]); return; }
    let cancelled = false;
    setLoadingCommunities(true);
    axios
      .get(`/api/landscape-communities/?landscape=${activeLandscapeId}&page_size=1000`)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data.results ?? res.data;
        setCommunityOptions(
          raw.map((c: any) => ({
            value: c.id,
            label: c.community_name || `Community ${c.id}`,
          }))
        );
      })
      .finally(() => { if (!cancelled) setLoadingCommunities(false); });
    return () => { cancelled = true; };
  }, [activeLandscapeId]);

  const handleModeChange = (next: Mode) => {
    setMode(next);
    if (next === 'analysis' && hasAnalysisLocation) {
      onChange({
        landscapeId: analysisLocation.landscapeId,
        communityIds: analysisLocation.communityIds,
      });
    }
  };

  const selectedOptions = communityOptions.filter((o) => activeCommunityIds.includes(o.value));

  return (
    <Box mt={3} mb={1}>
      <Text fontWeight="bold" fontSize="sm" mb={2} color="black">Event Location</Text>
      <RadioGroup value={mode} onChange={(v) => handleModeChange(v as Mode)}>
        <Stack direction="row" spacing={4} align="center">
          <Radio value="custom" size="sm">Custom</Radio>
          <Tooltip
            label="Only available on dashboard when locations are available"
            isDisabled={hasAnalysisLocation}
            placement="right"
          >
            <Box display="inline-block">
              <Radio value="analysis" size="sm" isDisabled={!hasAnalysisLocation}>
                From analysis
              </Radio>
            </Box>
          </Tooltip>
        </Stack>
      </RadioGroup>

      <Box mt={2}>
        <Select
          size="sm"
          value={activeLandscapeId ?? ''}
          onChange={(e) => {
            if (!isCustom) return;
            const id = e.target.value ? parseInt(e.target.value, 10) : null;
            onChange({ landscapeId: id, communityIds: [] });
          }}
          isDisabled={!isCustom}
          opacity={!isCustom ? 0.6 : 1}
          borderRadius="md"
          fontSize="sm"
          color={activeLandscapeId ? 'black' : undefined}
        >
          <option value="">All landscapes</option>
          {landscapes.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </Select>

        {activeLandscapeId && (
          <Box mt={2} opacity={!isCustom ? 0.6 : 1} pointerEvents={!isCustom ? 'none' : 'auto'}>
            <ReactSelect
              isMulti
              options={communityOptions}
              value={selectedOptions}
              onChange={(opts: MultiValue<Option>) => {
                if (!isCustom) return;
                onChange({ landscapeId: value.landscapeId, communityIds: opts.map((o) => o.value) });
              }}
              isLoading={loadingCommunities}
              placeholder="All communities"
              menuPortalTarget={usePortal ? document.body : undefined}
              menuPosition={usePortal ? 'fixed' : undefined}
              styles={earthRangerSelectStyles as any}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
