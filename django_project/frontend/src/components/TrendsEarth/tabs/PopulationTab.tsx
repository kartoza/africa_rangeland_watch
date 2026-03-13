// coding=utf-8
/**
 * PopulationTab.tsx
 * Tab for submitting GPW population download jobs.
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
  submitPopulationJob,
  clearPopulationTaskId,
} from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';
import AoiSelector from '../AoiSelector';

interface Props {
  onNavigateToAccount: () => void;
}

// Population uses WorldPop, which the backend clamps to 2000–2020.
// Start range: 2000–2019; end range: dynamically > start, up to 2020.
const POP_START_MIN = 2000;
const POP_START_MAX = 2019;
const POP_END_MAX = 2020;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const PopulationTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured, populationTaskId } = useSelector(
    (state: RootState) => state.analysis
  );

  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [yearInitial, setYearInitial] = useState<number>(2000);
  const [yearFinal, setYearFinal] = useState<number>(2020);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Clamp end year when start year changes so end always > start.
  useEffect(() => {
    if (yearFinal <= yearInitial) {
      setYearFinal(yearInitial + 1);
    }
  }, [yearInitial]);

  const handleSubmit = async () => {
    setSubmitError(null);
    dispatch(clearPopulationTaskId());
    setSubmitting(true);
    const safeInitial = yearInitial;
    const safeFinal = yearFinal;
    const result = await dispatch(
      submitPopulationJob({
        location_ids: locationIds,
        year_initial: safeInitial,
        year_final: safeFinal,
      })
    );
    setSubmitting(false);

    if (!submitPopulationJob.fulfilled.match(result)) {
      setSubmitError(
        (result.payload as { message: string })?.message ||
          'Failed to submit job.'
      );
    }
  };

  return (
    <Box>
      <Text fontWeight="bold" fontSize="md" mb={2} color="black">
        Population (GPW)
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Downloads Gridded Population of the World (GPW) data for a
        year range via the Trends.Earth &quot;download-data&quot; script.
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

      <JobStatusBanner jobId={populationTaskId} />

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
          {range(POP_START_MIN, POP_START_MAX).map((y) => (
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
          {range(yearInitial + 1, POP_END_MAX).map((y) => (
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
        Submit Population Job
      </Button>
    </Box>
  );
};

export default PopulationTab;
