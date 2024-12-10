import React, { useEffect, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Text,
  Progress,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Spinner
} from '@chakra-ui/react';
import { AppDispatch, RootState } from "../../store";
import { uploadFile, fetchProcessingStatus, resetState } from '../../store/uploadSlice';


const DatasetUploader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { file, uploadProgress, processingProgress, status, error, uploadId, layerId } = useSelector(
    (state: RootState) => state.upload
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (status === 'uploading' || status === 'processing') {
        event.preventDefault();
        event.returnValue = ''; // Required for modern browsers
      }
    };

    if (status === 'uploading' || status === 'processing') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === 'processing') {
      interval = setInterval(() => {
        dispatch(fetchProcessingStatus({layerId: layerId, uploadId: uploadId}));
      }, 1000);
    }

    if (status === 'success' || status === 'failed') {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, layerId, uploadId, dispatch]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      dispatch(uploadFile(selectedFile));
    }
  };

  const handleClear = () => {
    dispatch(resetState());
  }

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button minWidth={150} colorScheme="orange_a200" size="sm" leftIcon={status === 'uploading' || status === 'processing' ? <Spinner size={'sm'} /> : null}>
          {status === 'uploading' || status === 'processing' ? 'Uploading': 'Upload'}
        </Button>
      </PopoverTrigger>
      <PopoverContent bg="white">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Add Data</PopoverHeader>
        <PopoverBody>
          {!file ? (
            <Text color="black">Supported file format: zip</Text>
          ) : (
            <VStack align="start" spacing={3}>
              <Text color="black"><strong>File Name:</strong> {file.name}</Text>
              <Text color="black"><strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB</Text>
              <Text color="black"><strong>Status:</strong> {status}</Text>
              {status === 'failed' && <Text color="red"><strong>Error:</strong> {error}</Text>}
              {status === 'uploading' && (
                <Box width="100%">
                  <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                  <Text mt={1}>{uploadProgress}%</Text>
                </Box>
              )}
              {status === 'processing' && (
                <Box width="100%">
                  <Progress value={processingProgress} size="sm" colorScheme="blue" />
                  <Text mt={1}>{processingProgress}%</Text>
                </Box>
              )}
            </VStack>
          )}
          <Box mt={3}>
            {!file && status === 'idle' && (
                <Button
                as="label"
                size="sm"
                colorScheme="dark_green_800"
                width="full"
                >
                Select File
                <input
                    type="file"
                    hidden
                    accept=".zip"
                    onChange={handleFileChange}
                />
                </Button>
            )}
            {file && (
              <Button
                colorScheme="light_orange_400"
                size="sm"
                width="full"
                mt={2}
                onClick={handleClear}
                disabled={status === 'uploading' || status === 'processing'}
              >
                Clear
              </Button>
            )}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default DatasetUploader;