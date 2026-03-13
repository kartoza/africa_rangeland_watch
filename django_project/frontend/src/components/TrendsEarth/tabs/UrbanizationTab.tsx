// coding=utf-8
/**
 * UrbanizationTab.tsx
 * Tab for submitting SDG 11.3.1 sustainable urbanization jobs.
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Text,
  Alert,
  AlertIcon,
  Link,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { AppDispatch, RootState } from '../../../store';
import {
  submitUrbanizationJob,
  clearUrbanizationTaskId,
} from '../../../store/analysisSlice';
import JobStatusBanner from '../JobStatusBanner';
import AoiSelector from '../AoiSelector';

interface Props {
  onNavigateToAccount: () => void;
}

const UrbanizationTab: React.FC<Props> = ({ onNavigateToAccount }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendsEarthConfigured, urbanizationTaskId } = useSelector(
    (state: RootState) => state.analysis
  );

  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [unAdju, setUnAdju] = useState<boolean>(false);
  const [isiThr, setIsiThr] = useState<number>(30);
  const [ntlThr, setNtlThr] = useState<number>(10);
  const [watThr, setWatThr] = useState<number>(25);
  const [capOpe, setCapOpe] = useState<number>(200);
  const [pctSuburban, setPctSuburban] = useState<number>(25);
  const [pctUrban, setPctUrban] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    dispatch(clearUrbanizationTaskId());
    setSubmitting(true);
    const result = await dispatch(
      submitUrbanizationJob({
        location_ids: locationIds,
        un_adju: unAdju,
        isi_thr: Number.isFinite(isiThr) ? isiThr : 30,
        ntl_thr: Number.isFinite(ntlThr) ? ntlThr : 10,
        wat_thr: Number.isFinite(watThr) ? watThr : 25,
        cap_ope: Number.isFinite(capOpe) ? capOpe : 200,
        pct_suburban: (Number.isFinite(pctSuburban) ? pctSuburban : 25) / 100,
        pct_urban: (Number.isFinite(pctUrban) ? pctUrban : 50) / 100,
      })
    );
    setSubmitting(false);

    if (!submitUrbanizationJob.fulfilled.match(result)) {
      setSubmitError(
        (result.payload as { message: string })?.message ||
          'Failed to submit job.'
      );
    }
  };

  return (
    <Box>
      <Text fontWeight="bold" fontSize="md" mb={2} color="black">
        Sustainable Urbanization (SDG 11.3.1)
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Calculates the ratio of land consumption rate to population
        growth rate using the Trends.Earth &quot;urban-area&quot; script.
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

      <JobStatusBanner jobId={urbanizationTaskId} />

      {submitError && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {submitError}
        </Alert>
      )}

      <AoiSelector onChange={setLocationIds} />

      <Text fontWeight="semibold" fontSize="sm" mb={2} color="black">
        Threshold Parameters
      </Text>

      <SimpleGrid columns={2} spacing={4} mb={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="black">
            ISI Threshold (0–100)
          </FormLabel>
          <NumberInput
            value={isiThr}
            onChange={(_, val) => setIsiThr(val)}
            min={0}
            max={100}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="black">
            NTL Threshold (0–100)
          </FormLabel>
          <NumberInput
            value={ntlThr}
            onChange={(_, val) => setNtlThr(val)}
            min={0}
            max={100}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="black">
            Water Threshold (0–100)
          </FormLabel>
          <NumberInput
            value={watThr}
            onChange={(_, val) => setWatThr(val)}
            min={0}
            max={100}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="black">
            Cap Openness (metres)
          </FormLabel>
          <NumberInput
            value={capOpe}
            onChange={(_, val) => setCapOpe(val)}
            min={0}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="black">
            Suburban % (0–100)
          </FormLabel>
          <NumberInput
            value={pctSuburban}
            onChange={(_, val) => setPctSuburban(val)}
            min={0}
            max={100}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" color="black">
            Urban % (0–100)
          </FormLabel>
          <NumberInput
            value={pctUrban}
            onChange={(_, val) => setPctUrban(val)}
            min={0}
            max={100}
          >
            <NumberInputField color="black" />
          </NumberInput>
        </FormControl>
      </SimpleGrid>

      <FormControl mb={6}>
        <Checkbox
          isChecked={unAdju}
          onChange={(e) => setUnAdju(e.target.checked)}
          colorScheme="green"
        >
          <Text fontSize="sm" color="black">
            Apply UN population adjustment
          </Text>
        </Checkbox>
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
        Submit Urbanization Job
      </Button>
    </Box>
  );
};

export default UrbanizationTab;
