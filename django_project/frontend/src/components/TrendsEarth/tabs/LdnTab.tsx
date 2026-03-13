// coding=utf-8
/**
 * LdnTab.tsx
 * Tab for submitting SDG 15.3.1 Land Degradation Neutrality jobs.
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Text,
  Alert,
  AlertIcon,
  Link,
  Divider,
} from '@chakra-ui/react';
import { AppDispatch, RootState } from '../../../store';
import {
  submitLdnJob,
  clearLdnTaskId,
} from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';
import AoiSelector from '../AoiSelector';

interface Props {
  onNavigateToAccount: () => void;
}

// LDN uses MODIS NDVI (2001–2024). Start range: 2001–2023; end range: 2004–2024.
// The TE backend's Mann-Kendall trajectory test requires at least 4 observations,
// so the end year must be at least start + 3.
const LDN_START_MIN = 2001;
const LDN_START_MAX = 2023;
const LDN_END_MAX = 2024;
const LDN_MIN_GAP = 3;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const LdnTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured, ldnTaskId } = useSelector(
    (state: RootState) => state.analysis
  );

  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [yearInitial, setYearInitial] = useState<number>(2001);
  const [yearFinal, setYearFinal] = useState<number>(2015);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Clamp end year when start year changes so end is always at least
  // start + LDN_MIN_GAP (required by the TE Mann-Kendall trajectory test).
  useEffect(() => {
    if (yearFinal < yearInitial + LDN_MIN_GAP) {
      setYearFinal(yearInitial + LDN_MIN_GAP);
    }
  }, [yearInitial]);

  const handleSubmit = async () => {
    setSubmitError(null);
    dispatch(clearLdnTaskId());
    setSubmitting(true);
    const safeInitial = yearInitial;
    const safeFinal = yearFinal;
    const result = await dispatch(
      submitLdnJob({
        location_ids: locationIds,
        year_initial: safeInitial,
        year_final: safeFinal,
      })
    );
    setSubmitting(false);

    if (!submitLdnJob.fulfilled.match(result)) {
      setSubmitError(
        (result.payload as { message: string })?.message ||
          'Failed to submit job.'
      );
    }
  };

  return (
    <Box>
      <Text fontWeight="bold" fontSize="md" mb={2} color="black">
        Land Degradation Neutrality (SDG 15.3.1)
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Calculates SDG 15.3.1 sub-indicators (land productivity, land
        cover, soil organic carbon) using the Trends.Earth
        &quot;sdg-15-3-1-sub-indicators&quot; script.
      </Text>

      {!trendsEarthConfigured && (
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          Trends.Earth credentials are not configured.&nbsp;
          <Link
            color="blue.500"
            onClick={onNavigateToAccount}
            cursor="pointer"
          >
            Set up your account
          </Link>
        </Alert>
      )}

      <JobStatusBanner jobId={ldnTaskId} />

      {submitError && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {submitError}
        </Alert>
      )}

      <AoiSelector onChange={setLocationIds} />

      <FormControl mb={4}>
        <FormLabel color="black">Start Year</FormLabel>
        <Select
          value={yearInitial}
          onChange={(e) => setYearInitial(Number(e.target.value))}
          color="black"
        >
          {range(LDN_START_MIN, LDN_START_MAX).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel color="black">End Year</FormLabel>
        <Select
          value={yearFinal}
          onChange={(e) => setYearFinal(Number(e.target.value))}
          color="black"
        >
          {range(yearInitial + LDN_MIN_GAP, LDN_END_MAX).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </FormControl>

      <Divider mb={4} />

      <Button
        colorScheme="green"
        bg="dark_green.800"
        _hover={{ bg: 'light_green.400' }}
        color="white"
        onClick={handleSubmit}
        isLoading={submitting}
        isDisabled={
          !trendsEarthConfigured || locationIds.length === 0
        }
      >
        Submit LDN Job
      </Button>
    </Box>
  );
};

export default LdnTab;
