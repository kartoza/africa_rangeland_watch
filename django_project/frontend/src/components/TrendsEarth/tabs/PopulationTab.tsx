// coding=utf-8
/**
 * PopulationTab.tsx
 * Tab for submitting GPW population download jobs.
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Text,
  Alert,
  AlertIcon,
  Link,
  Divider,
} from '@chakra-ui/react';
import { AppDispatch, RootState } from '../../../store';
import { submitPopulationJob } from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';

interface Props {
  onNavigateToAccount: () => void;
}

const PopulationTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured } = useSelector(
    (state: RootState) => state.analysis
  );

  const [geojsonText, setGeojsonText] = useState('');
  const [year, setYear] = useState<number>(2020);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    let geojson: object;
    try {
      geojson = JSON.parse(geojsonText);
    } catch {
      setSubmitError('GeoJSON is not valid JSON.');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(
      submitPopulationJob({ geojson, year })
    );
    setSubmitting(false);

    if (submitPopulationJob.fulfilled.match(result)) {
      setTaskId(result.payload.task_id);
    } else {
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
        single year via the Trends.Earth &quot;download-data&quot; script.
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

      <JobStatusBanner taskId={taskId} />

      {submitError && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {submitError}
        </Alert>
      )}

      <FormControl mb={4}>
        <FormLabel color="black">
          Area of Interest (GeoJSON geometry)
        </FormLabel>
        <textarea
          value={geojsonText}
          onChange={(e) => setGeojsonText(e.target.value)}
          placeholder='{"type": "Polygon", "coordinates": [...]}'
          rows={5}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #CBD5E0',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'black',
          }}
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel color="black">Year</FormLabel>
        <NumberInput
          value={year}
          onChange={(_, val) => setYear(val)}
          min={2000}
          max={2024}
        >
          <NumberInputField color="black" />
        </NumberInput>
      </FormControl>

      <Divider mb={4} />

      <Button
        colorScheme="green"
        bg="dark_green.800"
        _hover={{ bg: 'light_green.400' }}
        color="white"
        onClick={handleSubmit}
        isLoading={submitting}
        isDisabled={!trendsEarthConfigured || !geojsonText}
      >
        Submit Population Job
      </Button>
    </Box>
  );
};

export default PopulationTab;
