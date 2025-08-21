import React, { useEffect } from "react";
import {
  FormControl,
  FormLabel,
  VStack,
  Heading,
  Select,
  useToast,
  HStack,
  Input
} from '@chakra-ui/react';
import axios from 'axios';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { UserIndicatorFormData, setFormField, UpdateFieldPayload, setLoading } from "../../store/userIndicatorSlice";


interface RenderStep3Props {
}

const RenderStep3: React.FC<RenderStep3Props> = () => {
    const { formData, loading } = useSelector((state: any) => state.userIndicator);
    const dispatch = useDispatch<AppDispatch>();
    const toast = useToast();
    const handleInputChange = (field: keyof UserIndicatorFormData, value: string | boolean | string[], isCheckbox?: boolean, isChecked?: boolean) => {
        const updateValue: UpdateFieldPayload = {
            field: field,
            value: value,
            isCheckbox: isCheckbox,
            isChecked: isChecked
        }
        dispatch(setFormField(updateValue));
    };
    
    const fetchBands = () => {
        console.log('fetch bands');
        dispatch(setLoading(true));
        const axiosPromise = axios.post('/frontend-api/indicator/fetch-bands/', {
            gee_asset_id: formData.geeAssetID
        });

        toast.promise(axiosPromise, {
            'success': {
                'title': 'Bands fetched successfully',
                'description': 'Bands have been successfully fetched from the GEE asset.',
            },
            'error': {
                'title': 'Error fetching bands',
                'description': 'There was an error fetching bands from the GEE asset.',
            },
            'loading': {
                'title': 'Fetching bands...',
                'description': 'Please wait while we fetch bands from the GEE asset.',
            }
        });

        axiosPromise.then((response) => {
            handleInputChange('bands', response.data.bands);
        }).catch((error) => {
            console.error('Error fetching bands:', error);
        }).finally(() => {
            dispatch(setLoading(false));
        });
    }

    useEffect(() => {
        if (formData.geeAssetID && formData.bands && formData.bands.length === 0) {
            fetchBands();
        }
    }, [formData]);

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md" color="dark_green.800">Configuration</Heading>
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
                    <option value="mean">Mean</option>
                    <option value="sum">Sum</option>
                    <option value="median">Median</option>
                    <option value="mode">Mode</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                </Select>
            </FormControl>
            <FormLabel>Visualisation parameters</FormLabel>
            <FormControl isDisabled={loading}>
                <HStack spacing={4}>
                    <FormLabel width={{ base: "100px" }}>Min Value</FormLabel>
                    <Input
                        type="number"
                        value={formData.minValue}
                        onChange={(e) => handleInputChange('minValue', e.target.value)}
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
                        onChange={(e) => handleInputChange('maxValue', e.target.value)}
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
                        onChange={(e) => handleInputChange('opacity', e.target.value)}
                        width={{ base: "120px" }}
                    />
                </HStack>
            </FormControl>
        </VStack>
    );
};

export default RenderStep3;
