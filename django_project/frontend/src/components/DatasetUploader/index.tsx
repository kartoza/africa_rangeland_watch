import React, { useState, ChangeEvent } from 'react';
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
} from '@chakra-ui/react';

type UPLOAD_STATUS = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

const DatasetUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<UPLOAD_STATUS>('PENDING');
  const [uploadNote, setUploadNote] = useState<string>('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setUploadProgress(0); // Reset progress for new file
      setUploadNote(''); // Reset status
      setUploadStatus('PENDING');
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setUploadStatus('RUNNING')
    // Simulate file upload progress
    const fakeUpload = setInterval(() => {
        setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(fakeUpload)
          setUploadNote('Upload complete')
          setUploadStatus('SUCCESS')
          return prev;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button colorScheme="orange_a200" size="sm">
          Upload
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
              <Text color="black"><strong>Status:</strong> {uploadNote || 'Not uploaded'}</Text>
              {uploadProgress > 0 && (
                <Box width="100%">
                  <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                  <Text mt={1}>{uploadProgress}%</Text>
                </Box>
              )}
            </VStack>
          )}
          <Box mt={3}>
            {!file && (
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
            {file && uploadStatus === 'PENDING' && (
              <Button
                colorScheme="dark_green_800"
                size="sm"
                width="full"
                mt={2}
                onClick={handleUpload}
              >
                Start Upload
              </Button>
            )}
            {file && (
              <Button
                colorScheme="light_orange_400"
                size="sm"
                width="full"
                mt={2}
                onClick={() => setFile(null)}
                disabled={uploadStatus === 'RUNNING'}
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