import React, { useEffect, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Select,
  RadioGroup,
  Radio,
  FormHelperText
} from '@chakra-ui/react';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store";
import { UserIndicatorFormData, setFormField, UpdateFieldPayload } from "../../store/userIndicatorSlice";
import FileUploadComponent from "./FileUploadComponent";


interface RenderStep2Props {
}


const RenderStep2: React.FC<RenderStep2Props> = () => {
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
    const [isNewAsset, setIsNewAsset] = useState<boolean>(false);
    
    useEffect(() => {
      if (formData.inputLayerId !== '') {
        setIsNewAsset(true);
      }
    }, [formData]);

    return (
        <VStack spacing={4} align="stretch">
          <Heading size="md" color="dark_green.800">Choose Asset</Heading>
          <FormControl>
            <RadioGroup
                value={isNewAsset ? "new" : "existing"}
                onChange={(value) => setIsNewAsset(value === "new")}
            >
                <HStack direction="column" spacing={3}>
                    <Radio value="existing">Use existing Asset</Radio>
                    <Radio value="new">Upload New Asset</Radio>
                </HStack>
            </RadioGroup>
        </FormControl>

        { !isNewAsset && (<VStack spacing={4} align="stretch">
            <FormControl>
                <FormLabel>Enter GEE Asset ID</FormLabel>
                <Input
                  value={formData.geeAssetID}
                  onChange={(e) => handleInputChange('geeAssetID', e.target.value)}
                  placeholder="Enter GEE Asset ID"
                />
                <FormHelperText>
                    The GEE Asset ID of the asset you want to use. The asset must be public or shared with the ARW cloud project. 
                    Contact us if you need help with this.
                </FormHelperText>
            </FormControl>
            <FormLabel>Or</FormLabel>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Select from Uploaded Asset</FormLabel>
              <Select
                value={formData.uploadedInputLayerName}
                onChange={(e) => handleInputChange('uploadedInputLayerName', e.target.value)}
                placeholder="Select asset"
              >
                {/* TODO: fetch existing InputLayer with Raster (Image/ImageCollection) */}
              </Select>
            </FormControl>
          </HStack>
        </VStack>)}

        {/* TODO: Add upload new asset form */}
        { isNewAsset && (
            <VStack spacing={4} align="stretch">
              <FileUploadComponent />
            </VStack>
        )}


        </VStack>
    );
};

export default RenderStep2;
