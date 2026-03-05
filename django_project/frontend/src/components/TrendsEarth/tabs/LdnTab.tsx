// coding=utf-8
/**
 * LdnTab.tsx
 * Tab for submitting SDG 15.3.1 Land Degradation Neutrality jobs.
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
import { submitLdnJob } from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';

interface Props {
  onNavigateToAccount: () => void;
}

const LdnTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured } = useSelector(
    (state: RootState) => state.analysis
  );

  const [geojsonText, setGeojsonText] = useState('');
  const [yearStart, setYearStart] = useState<number>(2000);
  const [yearEnd, setYearEnd] = useState<number>(2015);
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
      submitLdnJob({
        geojson,
        year_start: yearStart,
        year_end: yearEnd,
      })
    );
    setSubmitting(false);

    if (submitLdnJob.fulfilled.match(result)) {
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

      <FormControl mb={4}>
        <FormLabel color="black">Start Year</FormLabel>
        <NumberInput
          value={yearStart}
          onChange={(_, val) => setYearStart(val)}
          min={2000}
          max={2023}
        >
          <NumberInputField color="black" />
        </NumberInput>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel color="black">End Year</FormLabel>
        <NumberInput
          value={yearEnd}
          onChange={(_, val) => setYearEnd(val)}
          min={2001}
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
        Submit LDN Job
      </Button>
    </Box>
  );
};

export default LdnTab;
