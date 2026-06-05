import React from 'react';
import { Box } from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../store';
import { setSelectedEventTypes, setEarthRangerDateRange, setEarthRangerLocation } from '../../../../../store/earthRangerSlice';
import EventTypeFilter from './EventTypeFilter';
import DateRangeFilter from './DateRangeFilter';
import LocationFilter from './LocationFilter';
import { DateRange, LocationValue } from './types';

export const earthRangerSelectStyles = {
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

interface Props {
  /** Controlled: current selected event type values */
  value?: string[];
  /** Controlled: called when event type selection changes */
  onChange?: (types: string[]) => void;
  /** Controlled: current date range */
  dateValue?: DateRange;
  /** Controlled: called when date range changes */
  onDateChange?: (range: DateRange) => void;
  /** Pre-fills "From analysis" option; null/undefined disables it */
  analysisDate?: DateRange | null;
  /** Controlled: current location filter */
  locationValue?: LocationValue;
  /** Controlled: called when location filter changes */
  onLocationChange?: (v: LocationValue) => void;
  /** Pre-fills location "From analysis" option */
  analysisLocation?: LocationValue | null;
  /** Set false when rendering inside a Chakra Menu to avoid portal/blur conflicts */
  usePortal?: boolean;
}

/**
 * Combined EarthRanger filter panel (event type + date range).
 *
 * Without props: reads/writes the global Redux state (main map page).
 * With value/onChange/dateValue/onDateChange: fully controlled (dashboard widgets).
 */
export default function EarthRangerFilter({
  value,
  onChange,
  dateValue,
  onDateChange,
  analysisDate,
  locationValue,
  onLocationChange,
  analysisLocation,
  usePortal = true,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const isControlled = value !== undefined && onChange !== undefined;
  const isDateControlled = dateValue !== undefined && onDateChange !== undefined;
  const isLocationControlled = locationValue !== undefined && onLocationChange !== undefined;

  const reduxEventTypes = useSelector((s: RootState) => s.earthRanger.selectedEventTypes);
  const reduxStartDate = useSelector((s: RootState) => s.earthRanger.startDate);
  const reduxEndDate = useSelector((s: RootState) => s.earthRanger.endDate);
  const reduxLandscapeId = useSelector((s: RootState) => s.earthRanger.landscapeId);
  const reduxCommunityIds = useSelector((s: RootState) => s.earthRanger.communityIds);

  const resolvedEventTypes = isControlled ? value : reduxEventTypes;
  const resolvedDateRange: DateRange = isDateControlled
    ? dateValue
    : { start: reduxStartDate, end: reduxEndDate };
  const resolvedLocation: LocationValue = isLocationControlled
    ? locationValue
    : { landscapeId: reduxLandscapeId, communityIds: reduxCommunityIds };

  const handleEventTypeChange = (types: string[]) => {
    if (isControlled) {
      onChange(types);
    } else {
      dispatch(setSelectedEventTypes(types));
    }
  };

  const handleDateChange = (range: DateRange) => {
    if (isDateControlled) {
      onDateChange(range);
    } else {
      dispatch(setEarthRangerDateRange({ startDate: range.start, endDate: range.end }));
    }
  };

  const handleLocationChange = (v: LocationValue) => {
    if (isLocationControlled) {
      onLocationChange(v);
    } else {
      dispatch(setEarthRangerLocation({ landscapeId: v.landscapeId, communityIds: v.communityIds }));
    }
  };

  return (
    <Box>
      <EventTypeFilter
        value={resolvedEventTypes}
        onChange={handleEventTypeChange}
        usePortal={usePortal}
      />
      <DateRangeFilter
        value={resolvedDateRange}
        onChange={handleDateChange}
        analysisDate={analysisDate}
      />
      <LocationFilter
        value={resolvedLocation}
        onChange={handleLocationChange}
        analysisLocation={analysisLocation}
        usePortal={usePortal}
      />
    </Box>
  );
}
