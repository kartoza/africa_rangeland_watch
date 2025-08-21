import React, {  } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Checkbox,
  FormHelperText
} from '@chakra-ui/react';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { UserIndicatorFormData, setFormField, UpdateFieldPayload } from "../../store/userIndicatorSlice";


interface RenderStep1Props {
}

const RenderStep1: React.FC<RenderStep1Props> = () => {
    const { formData } = useSelector((state: any) => state.userIndicator);
    const dispatch = useDispatch<AppDispatch>();

    const handleInputChange = (field: keyof UserIndicatorFormData, value: string | boolean, isCheckbox?: boolean, isChecked?: boolean) => {
        const updateValue: UpdateFieldPayload = {
            field: field,
            value: value,
            isCheckbox: isCheckbox,
            isChecked: isChecked
        }
        dispatch(setFormField(updateValue));
    };

    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md" color="dark_green.800">Indicator Detail</Heading>
            <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter indicator name"
                />
            </FormControl>
            <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter indicator description"                
                />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Variable Name</FormLabel>
                <Input
                    value={formData.variableName}
                    onChange={(e) => handleInputChange('variableName', e.target.value)}
                    placeholder="Enter unique variable name"
                />
                <FormHelperText>
                    A unique identifier for this variable. Use only letters, numbers, and underscores.
                </FormHelperText>
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Select Analysis Types</FormLabel>
                <VStack align="start" spacing={3} pl={2}>
                    <Checkbox
                        isChecked={formData.analysisTypes.includes('Temporal')}
                        onChange={(e) => handleInputChange(
                            'analysisTypes', 'Temporal', true, e.target.checked
                        )}
                    >
                        Temporal
                    </Checkbox>
                    <Checkbox
                        isChecked={formData.analysisTypes.includes('Spatial')}
                        onChange={(e) => handleInputChange(
                            'analysisTypes', 'Spatial', true, e.target.checked
                        )}
                    >
                        Spatial
                    </Checkbox>
                    {/* <Checkbox
                        isChecked={formData.analysisTypes.includes('BACI')}
                        onChange={(e) => handleInputChange(
                            'analysisTypes', 'BACI', true, e.target.checked
                        )}
                    >
                        BACI
                    </Checkbox> */}
                </VStack>
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Select Temporal Resolutions</FormLabel>
                <VStack align="start" spacing={3} pl={2}>
                    <Checkbox
                        isChecked={formData.temporalResolutions.includes('Annual')}
                        onChange={(e) => handleInputChange(
                            'temporalResolutions', 'Annual', true, e.target.checked
                        )}
                    >
                        Annual
                    </Checkbox>
                    <Checkbox
                        isChecked={formData.temporalResolutions.includes('Quarterly')}
                        onChange={(e) => handleInputChange(
                            'temporalResolutions', 'Quarterly', true, e.target.checked
                        )}
                    >
                        Quarterly
                    </Checkbox>
                    <Checkbox
                        isChecked={formData.temporalResolutions.includes('Monthly')}
                        onChange={(e) => handleInputChange(
                            'temporalResolutions', 'Monthly', true, e.target.checked
                        )}
                    >
                        Monthly
                    </Checkbox>
                </VStack>
            </FormControl>
        </VStack>
    );
};

export default RenderStep1;
