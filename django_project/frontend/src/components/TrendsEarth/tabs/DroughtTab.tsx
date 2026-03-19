// coding=utf-8
/**
 * DroughtTab.tsx
 * Tab for submitting drought vulnerability analysis jobs.
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
  submitDroughtJob,
  fetchPendingTeJobs,
  removePendingJob,
} from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';
import AoiSelector from '../AoiSelector';

interface Props {
  onNavigateToAccount: () => void;
}

// Drought uses ESA CCI (1992–2022) + GPCC v2020. Requires end >= start + 5.
// Start range: 1992–2017 (latest start leaving room for +5 gap to 2022).
// End range: dynamically >= start + 5, up to 2022.
const DROUGHT_START_MIN = 1992;
const DROUGHT_START_MAX = 2017;
const DROUGHT_END_MAX = 2022;
const DROUGHT_MIN_GAP = 5;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const DroughtTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured, pendingJobs } = useSelector(
    (state: RootState) => state.analysis
  );

  const [dismissedJobs, setDismissedJobs] = useState<number[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissedDroughtJobs') || '[]');
    } catch {
      return [];
    }
  });

  const droughtJob = pendingJobs.find(
    (job) => job.job_type === 'drought' && !dismissedJobs.includes(job.id)
  );
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [yearInitial, setYearInitial] = useState<number>(2000);
  const [yearFinal, setYearFinal] = useState<number>(2015);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPendingTeJobs());
  }, [dispatch]);

  // Clamp end year when start year changes so end always >= start + 5.
  useEffect(() => {
    if (yearFinal < yearInitial + DROUGHT_MIN_GAP) {
      setYearFinal(yearInitial + DROUGHT_MIN_GAP);
    }
  }, [yearInitial]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    const safeInitial = yearInitial;
    const safeFinal = yearFinal;
    const result = await dispatch(
      submitDroughtJob({
        location_ids: locationIds,
        year_initial: safeInitial,
        year_final: safeFinal,
      })
    );
    setSubmitting(false);

    if (submitDroughtJob.fulfilled.match(result)) {
      dispatch(fetchPendingTeJobs());
    } else {
      setSubmitError(
        (result.payload as { message: string })?.message ||
          'Failed to submit job.'
      );
    }
  };

  const handleJobComplete = (jobId: number) => {
    dispatch(removePendingJob(jobId));
    const updated = [...dismissedJobs, jobId];
    setDismissedJobs(updated);
    sessionStorage.setItem('dismissedDroughtJobs', JSON.stringify(updated));
  };

  return (
    <Box>
      <Text fontWeight="bold" fontSize="md" mb={2} color="black">
        Drought (Hazard, Vulnerability &amp; Exposure)
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Calculates drought hazard, vulnerability, and exposure indices
        using the Trends.Earth &quot;drought-vulnerability&quot; script.
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

      <JobStatusBanner
        jobId={droughtJob?.id ?? null}
        onComplete={handleJobComplete}
      />

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
          {range(DROUGHT_START_MIN, DROUGHT_START_MAX).map((y) => (
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
          {range(yearInitial + DROUGHT_MIN_GAP, DROUGHT_END_MAX).map((y) => (
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
        Submit Drought Job
      </Button>
    </Box>
  );
};

export default DroughtTab;
