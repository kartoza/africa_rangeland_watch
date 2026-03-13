// coding=utf-8
/**
 * JobStatusBanner.tsx
 * Displays the current status of a submitted Trends.Earth job and,
 * on completion, links to the map where the layer has been added.
 */
import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  Button,
  Spinner,
  Text,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchLayers } from '../../store/layerSlice';

export type JobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | null;

interface Props {
  jobId: number | null;
  onStatusChange?: (status: JobStatus) => void;
}

const POLL_INTERVAL_MS = 10_000;

const JobStatusBanner: React.FC<Props> = ({ jobId, onStatusChange }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = React.useState<JobStatus>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setErrorMsg(null);
      return;
    }

    const poll = async () => {
      try {
        const response = await axios.get(
          `/api/trends-earth/job/${jobId}/`
        );
        const data = response.data;
        const newStatus: JobStatus = data.status;
        setStatus(newStatus);
        if (onStatusChange) onStatusChange(newStatus);

        if (
          newStatus === 'COMPLETED' ||
          newStatus === 'FAILED'
        ) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (newStatus === 'FAILED') {
            setErrorMsg(
              data.error?.message || 'Job failed on the server.'
            );
          }
          if (newStatus === 'COMPLETED') {
            // Refresh the map layer list so the new TE layer appears
            // immediately, even if the user is already on /map.
            dispatch(fetchLayers());
          }
        }
      } catch {
        // silently ignore transient poll errors
      }
    };

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, onStatusChange]);

  if (!jobId || !status) return null;

  if (status === 'PENDING' || status === 'RUNNING') {
    return (
      <Alert status="info" borderRadius="md" mb={4}>
        <AlertIcon />
        <Flex align="center" gap={2}>
          <Spinner size="sm" />
          <AlertDescription>
            Job submitted — processing on Trends.Earth (Job&nbsp;
            #{jobId})…
          </AlertDescription>
        </Flex>
      </Alert>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <Alert status="success" borderRadius="md" mb={4}>
        <AlertIcon />
        <Box flex="1">
          <AlertDescription>
            Job #{jobId} completed. Results have been added to
            the map as a Trends.Earth layer.
          </AlertDescription>
        </Box>
        <Button
          size="sm"
          ml={4}
          colorScheme="green"
          onClick={() => navigate('/map')}
        >
          View on Map
        </Button>
      </Alert>
    );
  }

  if (status === 'FAILED') {
    return (
      <Alert status="error" borderRadius="md" mb={4}>
        <AlertIcon />
        <AlertDescription>
          Job #{jobId} failed:{' '}
          {errorMsg || 'An error occurred on the server.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default JobStatusBanner;
