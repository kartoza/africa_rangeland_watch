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
  Spinner,
  Select
} from '@chakra-ui/react';
import { AppDispatch, RootState } from "../../store";
import { setFormat, submitDownloadRequest, fetchExportStatus } from '../../store/downloadSlice';

interface DatasetDownloaderProps {
    buttonVariant?: string | null;
  }
  

const DatasetDownloader: React.FC<DatasetDownloaderProps> = ({ buttonVariant = null }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { format, uuid_list, status, error, requestId } = useSelector(
        (state: RootState) => state.download
    );

    const handleFormatChange = (value: string) => {
        dispatch(setFormat(value));
    };

    const handleSubmit = () => {
        dispatch(submitDownloadRequest({uuid_list: uuid_list, format: format}));
    };


    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (status === 'RUNNING' && requestId) {
            interval = setInterval(() => {
            dispatch(fetchExportStatus(requestId));
            }, 1000);
        }

        if (status === 'COMPLETED' || status === 'FAILED' || status === 'DOWNLOADING') {
            if (interval) clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, requestId, dispatch]);

    return (
        <Popover placement="bottom-end">
          <PopoverTrigger>
            <Button minWidth={150} h={10}
                borderRadius="5px"  colorScheme="orange_a200" size="sm"
                variant={buttonVariant || undefined}
                leftIcon={status === 'RUNNING' || status === 'DOWNLOADING' ? <Spinner size={'sm'} /> : null}
                disabled={!uuid_list.length}>
              {status === 'RUNNING' || status === 'DOWNLOADING' ? 'Downloading': 'Download'}
            </Button>
          </PopoverTrigger>
          <PopoverContent bg="white">
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Download Selected Datasets</PopoverHeader>
            <PopoverBody>
                <VStack align={"start"} spacing={3}>
                    <Text color={"black"}>Select format:</Text>
                    <Select placeholder="Select format"
                        disabled={status === 'RUNNING' || status === 'DOWNLOADING'}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFormatChange(e.target.value)} value={format}>
                        <option value="shapefile">Shapefile</option>
                        <option value="geojson">GeoJSON</option>
                        <option value="geopackage">GeoPackage</option>
                        <option value="kml">KML</option>
                    </Select>
                    {(status === 'RUNNING' || status === 'DOWNLOADING') && (
                    <Box width="100%">
                        <Progress size="sm" colorScheme="blue" isIndeterminate />
                        <Text mt={1}>Exporting datasets...</Text>
                    </Box>
                    )}
                    {status === 'FAILED' && <Text color="red">{error}</Text>}
                    <Button
                        colorScheme="dark_green_800"
                        size="sm"
                        width="full"
                        mt={2}
                        borderRadius="5px"
                        onClick={handleSubmit}
                        disabled={format === '' || status === 'RUNNING' || status === 'DOWNLOADING'}
                    >
                        Download
                    </Button>
                </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
    );
};

export default DatasetDownloader;