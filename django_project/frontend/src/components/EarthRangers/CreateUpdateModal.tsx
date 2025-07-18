import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Button,
} from "@chakra-ui/react";

interface EarthRangerSetting {
  id: string;
  name: string;
  url: string;
  token: string;
  privacy: 'public' | 'private';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

interface FormData {
  name: string;
  url: string;
  token: string;
  privacy: 'public' | 'private';
  is_active: boolean;
}

interface EarthRangerCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
}

const EarthRangerCreateUpdateModal: React.FC<EarthRangerCreateUpdateModalProps> = ({
  isOpen,
  onClose,
  isEditMode,
  formData,
  setFormData,
  onSubmit,
}) => {

    const [urlError, setUrlError] = useState('');

    const validateUrl = (url: string) => {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
    };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="white">
        <ModalHeader>
          {isEditMode ? 'Edit EarthRanger Setting' : 'Create New EarthRanger Setting'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box display="flex" flexDirection="column" gap={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="Enter setting name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired isInvalid={!!urlError}>
            <FormLabel>EarthRanger URL</FormLabel>
            <Input
                placeholder="https://your-earthranger-instance.com"
                value={formData.url}
                onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({ ...prev, url: value }));
                
                if (value && !validateUrl(value)) {
                    setUrlError('Please enter a valid URL starting with http:// or https://');
                } else {
                    setUrlError('');
                }
                }}
            />
            <FormErrorMessage>{urlError}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Token/Key</FormLabel>
              <Input
                type="password"
                placeholder="Enter your EarthRanger token"
                value={formData.token}
                onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Privacy</FormLabel>
              <Select
                value={formData.privacy}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value as 'public' | 'private' }))}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </Select>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              >
                Is Active
              </Checkbox>
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            backgroundColor="dark_green.800"
            _hover={{ backgroundColor: "light_green.400" }}
            onClick={onSubmit}
            isDisabled={!formData.name || !formData.url || !formData.token || urlError !== ''}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EarthRangerCreateUpdateModal;
