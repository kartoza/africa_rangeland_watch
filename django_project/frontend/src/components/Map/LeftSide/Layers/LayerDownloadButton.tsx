// src/components/Map/LeftSide/LayerDownloadButton.tsx
import React, { useEffect, useRef } from 'react';
import { Button, Spinner, Box, useToast } from '@chakra-ui/react';
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store";
import {ExportNrtLayer, setStatusForExportNrtLayer} from "../../../../store/layerSlice";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  layerId: string;
  landscapeId: string;
  exportNrtLayer?: ExportNrtLayer;
  isSelected?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CogDownloadButton({
  layerId,
  landscapeId,
  exportNrtLayer
}: Props) {
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Poll the server *only if* we have a taskId and no URL yet.       */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (exportNrtLayer?.download_url) return;

    if (!exportNrtLayer?.cogId) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/nrt-layer/${exportNrtLayer.cogId}/export-status/`
        );
        const json = await res.json();

        if (json.status === 'completed') {
          if (!cancelled) {
            dispatch(setStatusForExportNrtLayer({
              layerId,
              status: 'completed',
              download_url: json.download_url
            }));
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
          if (!cancelled) {
            dispatch(setStatusForExportNrtLayer({
              layerId,
              status: 'error'
            }));
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // else still processing
      } catch {
        if (!cancelled) {
          dispatch(setStatusForExportNrtLayer({
            layerId,
            status: 'error'
          }));
        }
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
  }, [exportNrtLayer?.cogId, exportNrtLayer?.download_url, layerId, landscapeId, toast]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  if (!exportNrtLayer?.cogId && !exportNrtLayer?.download_url) return null;

  if (exportNrtLayer?.status === 'processing') {
    return (
    <Box fontSize="xs" paddingTop={'8px'}>
      <Spinner size="sm"/>
    </Box>
    )
  }

  if (exportNrtLayer?.status === 'completed' && exportNrtLayer?.download_url) {
    return (
      <Button
        as="a"
        href={exportNrtLayer.download_url}
        size="xs"
        colorScheme="green"
        target="_blank"
        rel="noopener noreferrer"
      >
        Download
      </Button>
    );
  }

  if (exportNrtLayer?.status === 'error') {
    return (
      <Box fontSize="xs" color="red.500" paddingTop={'8px'}>
        Export failed
      </Box>
    );
  }

  return null;
}
