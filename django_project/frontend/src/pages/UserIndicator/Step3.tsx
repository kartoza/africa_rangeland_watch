import React, { useEffect } from "react";
import {
  FormControl,
  FormLabel,
  VStack,
  Heading,
  Select,
  useToast,
  HStack,
  Input,
  FormHelperText,
  Box,
  Text
} from '@chakra-ui/react';
import axios from 'axios';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import {
    UserIndicatorFormData,
    setFormField,
    UpdateFieldPayload,
    setLoading,
    setBandsData,
    REDUCER_VALUE_LIST,
    UploadedFile,
    setUploadedFileDate
} from "../../store/userIndicatorSlice";


interface RenderStep3Props {
}

const RenderStep3: React.FC<RenderStep3Props> = () => {
    const { formData, loading } = useSelector((state: any) => state.userIndicator);
    const dispatch = useDispatch<AppDispatch>();
    const toast = useToast();
    const handleInputChange = (field: keyof UserIndicatorFormData, value: string | boolean | string[] | number, isCheckbox?: boolean, isChecked?: boolean) => {
        const updateValue: UpdateFieldPayload = {
            field: field,
            value: value,
            isCheckbox: isCheckbox,
            isChecked: isChecked
        }
        dispatch(setFormField(updateValue));
    };
    
    const handleStartDateChange = (fileId: number, value: string) => {
        console.log('startDate ', fileId, ' ', value);
        dispatch(setUploadedFileDate({ fileId, startDate: value }));
    }

    const handleEndDateChange = (fileId: number, value: string) => {
        console.log('endDate ', fileId, ' ', value);
        dispatch(setUploadedFileDate({ fileId, endDate: value }));
    }

    const fetchBands = () => {
        dispatch(setLoading(true));
        const axiosPromise = axios.post('/frontend-api/indicator/fetch-bands/', {
            gee_asset_id: formData.geeAssetID,
            session_id: formData.sessionID
        });

        toast.promise(axiosPromise, {
            'success': {
                'title': 'Bands fetched successfully',
                'description': 'Bands have been successfully fetched from the asset.',
                'position': 'top-right',
                'containerStyle': {
                    'color': "white",
                },
            },
            'error': {
                'title': 'Error fetching bands',
                'description': 'There was an error fetching bands from the asset.',
                'position': 'top-right',
                'containerStyle': {
                    'color': "white",
                },
            },
            'loading': {
                'title': 'Fetching bands...',
                'description': 'Please wait while we fetch bands from the asset.',
                'position': 'top-right',
                'containerStyle': {
                    'color': "white",
                },
            }
        });

        axiosPromise.then((response) => {
            dispatch(setBandsData({
                bands: response.data.bands,
                geeAssetType: response.data.geeAssetType,
                startDate: response.data.startDate,
                endDate: response.data.endDate,
                files: response.data.files
            }));
        }).catch((error) => {
            console.error('Error fetching bands:', error);
            if (error.response && error.response.data && error.response.data.error) {
                let errorMsg = error.response.data.error;
                setTimeout(() => {
                    toast({
                        title: 'Error fetching bands',
                        description: errorMsg,
                        status: 'error',
                        position: 'top-right',
                        duration: 9000,
                        isClosable: true,
                        containerStyle: {
                            color: "white",
                        },
                    });
                }, 1500);                
            }
        }).finally(() => {
            dispatch(setLoading(false));
        });
    }

    useEffect(() => {
        if ((formData.geeAssetID || formData.sessionID) && formData.bands && formData.bands.length === 0) {
            fetchBands();
        }
    }, [formData]);

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md" color="dark_green.800">Configuration</Heading>
            { formData.files.length > 0 && <FormControl isDisabled={loading}>
                <FormLabel>Set images properties</FormLabel>
                <VStack spacing={4} align="stretch" borderWidth={1} p={2}>
                    {formData.files.map((file: UploadedFile, index: number) => (
                    <VStack spacing={2} align="stretch" key={index}>
                        <Text fontSize={"1rem"} fontWeight="bold" color={"black"}>{`${index+1}. ${file.fileName}`}</Text>
                        <HStack spacing={4}>
                            <Box>
                                <FormLabel>Start Date</FormLabel>
                                <Input
                                    type="date"
                                    name="startDate"
                                    value={file.startDate ?? ""}
                                    onChange={(e) => handleStartDateChange(file.uploadItemID, e.target.value)}
                                />
                            </Box>
                            <Box>
                                <FormLabel>End Date</FormLabel>
                                <Input
                                    type="date"
                                    name="endDate"
                                    value={file.endDate ?? ""}
                                    onChange={(e) => handleEndDateChange(file.uploadItemID, e.target.value)}
                                />
                            </Box>
                        </HStack>
                    </VStack>
                ))}
                </VStack>
            </FormControl>
            }
            <FormControl isDisabled={loading}>
                <FormLabel>Select band from asset</FormLabel>
                <Select
                    value={formData.selectedBand}
                    onChange={(e) => handleInputChange('selectedBand', e.target.value)}
                >
                    {(formData.bands || []).map((band: string) => (
                        <option key={band} value={band}>
                            {band}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl isDisabled={loading}>
                <FormLabel>Select reducer</FormLabel>
                <Select
                    value={formData.reducer}
                    onChange={(e) => handleInputChange('reducer', e.target.value)}
                >
                    {REDUCER_VALUE_LIST.map((reducer) => (
                        <option key={reducer} value={reducer}>
                            {reducer.charAt(0).toUpperCase() + reducer.slice(1)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Visualisation parameters</FormLabel>
                <FormHelperText>Set the parameters for visualising the indicator.</FormHelperText>
            </FormControl>
            <FormControl isDisabled={loading}>
                <HStack spacing={4}>
                    <FormLabel width={{ base: "100px" }}>Min Value</FormLabel>
                    <Input
                        type="number"
                        value={formData.minValue}
                        onChange={(e) => handleInputChange('minValue', parseFloat(e.target.value))}
                        width={{ base: "120px" }}
                    />
                </HStack>
            </FormControl>
            <FormControl isDisabled={loading}>
                <HStack spacing={4}>
                    <FormLabel width={{ base: "100px" }}>Max Value</FormLabel>
                    <Input
                        type="number"
                        value={formData.maxValue}
                        onChange={(e) => handleInputChange('maxValue', parseFloat(e.target.value))}
                        width={{ base: "120px" }}
                    />
                </HStack>
            </FormControl>
            <FormControl isDisabled={loading}>
                <HStack spacing={4}>
                    <FormLabel width={{ base: "100px" }}>Colors</FormLabel>
                    <Input
                        type="text"
                        value={formData.colors.join(', ')}
                        onChange={(e) => handleInputChange('colors', e.target.value.split(',').map(color => color.trim()))}
                        width={{ base: "70%" }}
                    />
                </HStack>
            </FormControl>
            <FormControl isDisabled={loading}>
                <HStack spacing={4}>
                    <FormLabel width={{ base: "100px" }}>Opacity</FormLabel>
                    <Input
                        type="number"
                        value={formData.opacity}
                        onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value))}
                        width={{ base: "120px" }}
                    />
                </HStack>
            </FormControl>
        </VStack>
    );
};

export default RenderStep3;
