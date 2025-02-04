import React, { useEffect, useState } from 'react';
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
import { fetchDashboardOwners, FilterParams } from '../store/dashboardSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import axios from 'axios';

interface DashboardFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
  filters: FilterParams;
}



const DashboardFilters: React.FC<DashboardFiltersProps> = ({ isOpen, onClose, setSearchTerm, setFilters, filters }) => {

  const dispatch = useDispatch<AppDispatch>();

  const { owners, loading, error } = useSelector((state: any) => state.dashboard)
  const dashboardData = useSelector((state: any) => state.dashboard.dashboards);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedRegionLatLng, setSelectedRegionLatLng] = useState<{ lat: number; lng: number } | null>(null);
  

  useEffect(() => {
    dispatch(fetchDashboardOwners());
  }, [dispatch]);

  // TODO current method inefficient ,won't work
  // useEffect(() => {
  //   const fetchRegions = async () => {
  //     const regionSet: Set<string> = new Set();

  //     // Iterate over dashboard data
  //     for (const dashboard of dashboardData) {
  //       if (Array.isArray(dashboard.analysis_results)) {
  //         // Iterate over all analysis results if it's an array
  //         for (const analysisResult of dashboard.analysis_results) {
  //           const { data } = analysisResult.analysis_results;
  //           if (data && data.latitude && data.longitude) {
  //             const { latitude, longitude } = data;
  //             const region = await getRegionFromCoordinates(latitude, longitude);
  //             if (region) regionSet.add(region);
  //           }
  //         }
  //       }
  //     }

  //     // Set the regions
  //     setRegions(Array.from(regionSet));
  //   };

  //   if (!loading) {
  //     fetchRegions();
  //   }
  // }, [dashboardData, loading]);


  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOwner(e.target.value);
    updateFilter("owner", e.target.value)
  };

  // Update filters when any change occurs
  const updateFilter = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
    if (key === 'region' && typeof value === 'string') {
      const selectedRegionData = findRegionLatLng(value);
  
      if (selectedRegionData) {
        setSelectedRegionLatLng(selectedRegionData);
        setFilters((prevFilters) => ({
          ...prevFilters,
          region: JSON.stringify(selectedRegionData),
        }));
      }
    }
  
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };
  

  const findRegionLatLng = (regionName: string) => {
    const regionData = dashboardData.find((dashboard: { analysis_results: any[]; }) => {
      return dashboard.analysis_results.some(async (analysisResult) => {
        const { data } = analysisResult.analysis_results;
        return await getRegionFromCoordinates(data.latitude, data.longitude) === regionName;
      });
    });

    if (regionData) {
      const { latitude, longitude } = regionData.analysis_results[0].analysis_results.data;
      return { lat: latitude, lng: longitude };
    }

    return null;
  };

  const getRegionFromCoordinates = async (latitude: number, longitude: number) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const response = await axios.get(url);
      const region = response.data.address?.region;
      return region || "Unknown Region";
    } catch (error) {
      return "Unknown Region";
    }
  };

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
            colorScheme="teal"
            variant="outline"
            borderColor="teal.500"
            textColor="teal.600"
            fontWeight={700}
            h={8}
            width="40%"
            borderRadius="md"
            onClick={() => {
              setSelectedRegionLatLng(null)
              setSelectedOwner('');
              setFilters({
                searchTerm: '',
                my_resources: false,
                category: '',
                keyword: '',
                region: '',
                my_organisations: false,
                my_dashboards: false,
                favorites: false,
                datasets: [],
                maps: false,
                owner: '',
              });
            }}            
            mr={35}
            mt={2}
          >
            Clear Filters
          </Button>
        </Flex>

        <Box borderBottom="1px solid gray" mb="4" />
        <DrawerBody>
          <InProgressBadge />

          {/* Search Field */}
          <Input
            placeholder="Search dashboard..."
            size="md"
            value={filters?.searchTerm || ""}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            borderRadius="md"
            mb="4"
          />

          {/* Checkboxes */}
          <Text fontWeight="bold" mt="4" color="black" mb={4} fontSize={18}>
            Resources
          </Text>
          {
            [
              { label: 'My Resources', key: 'my_resources', disabled: true },
              { label: 'My Organisations', key: 'my_organisations', disabled: false },
              { label: 'Favorites', key: 'favorites', disabled: true },
              { label: 'My Dashboards', key: 'my_dashboards', disabled: false },
              { label: 'Maps', key: 'maps', disabled: false },
            ].map((item) => (
              <>
                <Checkbox
                  key={item.key}
                  mb="4"
                  isChecked={!!filters?.[item.key as keyof FilterParams]}
                  onChange={(e) => updateFilter(item.key as keyof FilterParams, e.target.checked)}
                  isDisabled={item.disabled}
                >
                  {item.label}
                </Checkbox>
                <br />
              </>
            ))
          }



          {/* Category Selection */}
          <Box mb="6" mt={4}>
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Category
            </Text>
            <Select
              placeholder="Select Category"
              disabled
            >
              <option value="category1">Category 1</option>
              <option value="category2">Category 2</option>
            </Select>
          </Box>

          {/* Keyword Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Keyword
            </Text>
            <Select
              placeholder="Select Keyword"
              disabled
            >
              <option value="keyword1">Keyword 1</option>
              <option value="keyword2">Keyword 2</option>
            </Select>
          </Box>

          {/* Region Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Region
            </Text>
            <Select
              placeholder="Select Region"
              value={selectedRegion}
              onChange={(e) => {
                updateFilter("region", e.target.value)
              }}
              isDisabled={true}
            >
              {regions.length > 0 ? (
                regions.map((region, index) => (
                  <option key={index} value={region}>
                    {region}
                  </option>
                ))
              ) : (
                <option>No regions available</option>
              )}
            </Select>
            {error && <Text color="red.500">{error}</Text>}
          </Box>

          {/* Owner Selection */}
          <Box mb="6">
            <Text fontWeight="bold" color="black" mb="2" fontSize={16}>
              Select Owner
            </Text>
            <Select
              placeholder="Select Owner"
              value={selectedOwner}
              onChange={handleOwnerChange}
              isDisabled={loading || error} 
            >
              {loading && <option>Loading...</option>}
              {error && <option>{`Error: ${error}`}</option>}
              {!loading && !error && owners.map((owner: any) => (
                <option key={owner.id} value={owner.username}>
                  {owner.username}
                </option>
              ))}
            </Select>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default DashboardFilters;
