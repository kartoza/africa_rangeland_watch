// src/components/Map/LeftSide/LayerDownloadButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Spinner, Box, useToast } from '@chakra-ui/react';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  layerId: string;
  landscapeId: string;
  taskId?: string;          // returned by POST /export/
  downloadUrl?: string;     // present when BE said “already exported”
  isSelected?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CogDownloadButton({
  layerId,
  landscapeId,
  taskId,
  downloadUrl: downloadUrlProp,
}: Props) {
  const toast = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Local state                                                     */
  /* ---------------------------------------------------------------- */
  const [status, setStatus] = useState<
    'idle' | 'processing' | 'completed' | 'error'
  >(downloadUrlProp ? 'completed' : 'idle');

  const [downloadUrl, setDownloadUrl] = useState<string | null>(
    downloadUrlProp ?? null
  );
  console.log('CogDownloadButton', { taskId, downloadUrlProp, status, downloadUrl, layerId, landscapeId });

  /* ---------------------------------------------------------------- */
  /*  Poll the server *only if* we have a taskId and no URL yet.       */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (downloadUrlProp) return;

    if (taskId === 'READY') {
      setStatus('completed');
      return;
    }

    if (!taskId) return;

    let cancelled = false;
    setStatus('processing');

    const check = async () => {
      try {
        const res = await fetch(
          `/nrt-layer/${layerId}/export-status/${taskId}/?landscape_id=${landscapeId}`
        );
        const json = await res.json();

        if (json.status === 'completed') {
          if (!cancelled) {
            setDownloadUrl(json.download_url);
            setStatus('completed');
            toast({
              title: 'Export ready!',
              position: 'top-right',
              duration: 3000,
              status: 'success',
              isClosable: true,
            });
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else if (json.status === 'error') {
          if (!cancelled) setStatus('error');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // else still processing
      } catch {
        if (!cancelled) setStatus('error');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // first check, then poll every 5 s
    check();
    intervalRef.current = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [taskId, layerId, landscapeId, toast, downloadUrlProp]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  if (!taskId && !downloadUrlProp) return null;

  if (status === 'processing') {
    return (
    <Box fontSize="xs" paddingTop={'8px'}>
      <Spinner size="sm"/>
    </Box>
    )
  }

  if (status === 'completed' && downloadUrl) {
    return (
      <Button
        as="a"
        href={downloadUrl}
        size="xs"
        colorScheme="green"
        download
      >
        Download
      </Button>
    );
  }

  if (status === 'error') {
    return (
      <Box fontSize="xs" color="red.500" paddingTop={'8px'}>
        Export failed
      </Box>
    );
  }

  return null;
}
