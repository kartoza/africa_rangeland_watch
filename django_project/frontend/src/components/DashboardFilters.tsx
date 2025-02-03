import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Input,
  Select,
  Text,
} from '@chakra-ui/react';
import { FaFilter } from 'react-icons/fa';
import { InProgressBadge } from './InProgressBadge';

interface DashboardFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ isOpen, onClose, setSearchTerm }) => {
  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent backgroundColor="white">
        <DrawerCloseButton />
        <Flex alignItems="center" justifyContent="space-between" mb="4" paddingX="4">
          <Flex alignItems="center" gap="2">
            <FaFilter />
            <Text fontSize="lg" fontWeight="bold" color="black">
              Filter
            </Text>
          </Flex>
          <Button
            colorScheme="green"
            variant="outline"
            borderColor="dark_green.800"
            textColor="dark_green.800"
            fontWeight={700}
            h={8}
            width="40%"
            borderRadius="0px"
            onClick={() => {}}
            mr={35}
            mt={2}
          >
            Clear Filters
          </Button>
        </Flex>

        {/* Divider */}
        <Box borderBottom="1px solid gray" mb="4" />
        <DrawerBody>
          <InProgressBadge />
          {/* Search Field Inside Drawer */}
          <Input
            placeholder="Search dashboard..."
            size="md"
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="md"
            mb="4"
          />

          {/* Filters inside Drawer */}
          <Text fontWeight="bold" mt="4" color="black" mb={4} fontSize={18}>
            Resources
          </Text>
          <Checkbox mb="4">My Resources</Checkbox>
          <Checkbox mb="4">My Organisations</Checkbox>
          <Checkbox mb="4">Favorites</Checkbox>
          <Checkbox mb="4">My Dashboards</Checkbox>
          <Checkbox mb="4">Datasets</Checkbox>

          <Checkbox mb="2" ml={5}>
            EVI
          </Checkbox>
          <Checkbox mb="2" ml={5}>
            NDVI
          </Checkbox>
          <Checkbox mb="2" ml={5}>
            BACI
          </Checkbox>
          <Checkbox mb="4" ml={5}>
            Bare Ground
          </Checkbox>

          {/* Other Sections */}
          <Checkbox mb="4">Maps</Checkbox>
          <Checkbox mb="4">Map Viewers</Checkbox>
          <Checkbox mb="4">Dashboards</Checkbox>

          {/* Category Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Category
            </Text>
            <Select placeholder="Select Category">
              <option value="category1">Category 1</option>
              <option value="category2">Category 2</option>
            </Select>
          </Box>

          {/* Keyword Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Keyword
            </Text>
            <Select placeholder="Select Keyword">
              <option value="keyword1">Keyword 1</option>
              <option value="keyword2">Keyword 2</option>
            </Select>
          </Box>

          {/* Region Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Region
            </Text>
            <Select placeholder="Select Region">
              <option value="region1">Region 1</option>
              <option value="region2">Region 2</option>
            </Select>
          </Box>

          {/* Owner Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Owner
            </Text>
            <Select placeholder="Select Owner">
              <option value="owner1">Owner 1</option>
              <option value="owner2">Owner 2</option>
            </Select>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default DashboardFilters;
