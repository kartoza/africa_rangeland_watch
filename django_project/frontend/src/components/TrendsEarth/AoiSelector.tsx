// coding=utf-8
/**
 * AoiSelector.tsx
 *
 * Reusable AOI picker for Trends.Earth job submission forms.
 *
 * Renders two controls:
 *  1. A landscape <Select> dropdown (populated from Redux state).
 *  2. A react-select multi-select that loads all LandscapeCommunity
 *     rows for the chosen landscape via
 *     GET /api/landscape-communities/?landscape=<id>
 *
 * The parent receives a flat array of selected LandscapeCommunity IDs
 * via the `onChange` callback.
 */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FormControl,
  FormLabel,
  Select,
  Text,
} from '@chakra-ui/react';
import ReactSelect, { MultiValue } from 'react-select';
import axios from 'axios';
import { RootState } from '../../store';

interface CommunityOption {
  value: number;
  label: string;
}

interface Props {
  /** Called whenever the selected community IDs change. */
  onChange: (locationIds: number[]) => void;
}

const AoiSelector: React.FC<Props> = ({ onChange }) => {
  const landscapes = useSelector(
    (state: RootState) => state.landscape.landscapes
  );

  const [landscapeId, setLandscapeId] = useState<number | null>(null);
  const [communityOptions, setCommunityOptions] = useState<
    CommunityOption[]
  >([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [selected, setSelected] = useState<MultiValue<CommunityOption>>(
    []
  );

  // Fetch communities whenever the landscape selection changes.
  useEffect(() => {
    if (landscapeId === null) {
      setCommunityOptions([]);
      setSelected([]);
      onChange([]);
      return;
    }

    let cancelled = false;
    setCommunityLoading(true);
    setSelected([]);
    onChange([]);

    axios
      .get<{ results?: CommunityOption[]; count?: number }>(
        `/api/landscape-communities/?landscape=${landscapeId}&page_size=1000`
      )
      .then((res) => {
        if (cancelled) return;
        const raw: any[] = res.data.results ?? (res.data as any);
        const opts: CommunityOption[] = raw.map((c: any) => ({
          value: c.id,
          label: c.community_name || `Community ${c.id}`,
        }));
        setCommunityOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setCommunityOptions([]);
      })
      .finally(() => {
        if (!cancelled) setCommunityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [landscapeId]);

  const handleLandscapeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const val = e.target.value;
    setLandscapeId(val ? parseInt(val, 10) : null);
  };

  const handleCommunityChange = (
    opts: MultiValue<CommunityOption>
  ) => {
    setSelected(opts);
    onChange(opts.map((o) => o.value));
  };

  return (
    <>
      <FormControl mb={4}>
        <FormLabel color="black">Landscape</FormLabel>
        <Select
          placeholder="Select a landscape"
          onChange={handleLandscapeChange}
          color="black"
        >
          {landscapes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {landscapeId !== null && (
        <FormControl mb={4}>
          <FormLabel color="black">Communities (Area of Interest)</FormLabel>
          {communityLoading ? (
            <Text fontSize="sm" color="gray.500">
              Loading communities…
            </Text>
          ) : (
            <ReactSelect
              isMulti
              options={communityOptions}
              value={selected}
              onChange={handleCommunityChange}
              placeholder="Select one or more communities…"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#CBD5E0',
                  minHeight: '38px',
                }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          )}
        </FormControl>
      )}
    </>
  );
};

export default AoiSelector;
