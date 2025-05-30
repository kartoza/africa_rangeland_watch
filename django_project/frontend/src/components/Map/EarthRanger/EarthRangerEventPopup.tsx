import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Image,
  IconButton,
  Heading,
  Divider,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Avatar,
  Flex,
  Spacer,
  useColorModeValue
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

interface EarthRangerEventData {
  id: string;
  icon: {
    iconUrl: string;
    iconSize: [number, number];
    className: string;
    iconAncor: [number, number];
    popupAncor: [number, number];
  };
  time: string;
  image: string;
  state: string;
  title: string | null;
  message: string;
  datetime: string;
  priority: number;
  created_at: string;
  event_type: string;
  updated_at: string;
  event_details: {
    updates: Array<{
      text: string;
      time: string;
      type: string;
      user: {
        id: string;
        username: string;
        last_name: string;
        first_name: string;
        content_type: string;
      };
      message: string;
    }>;
    hwcrep_species?: string;
    hwcrep_humandeath?: string;
    hwcrep_humaninjury?: string;
    hwcrep_livestocktypes?: string;
    hwcrep_livestockInjuredKilled?: number;
  };
  is_collection: boolean;
  serial_number: number;
  event_category: string;
  priority_label: string;
}

interface Props {
  data: EarthRangerEventData;
  earthRangerUuid: string;
  onClose: () => void;
}

export default function EarthRangerEventPopup({ data, earthRangerUuid, onClose }: Props) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColorScheme = (priority: number) => {
    if (priority >= 200) return 'red';
    if (priority >= 100) return 'orange';
    return 'green';
  };

  const getStateColorScheme = (state: string) => {
    switch (state.toLowerCase()) {
      case 'resolved': return 'green';
      case 'active': return 'red';
      case 'new': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="xl"
      maxW="400px"
      maxH="500px"
      overflowY="auto"
      border="1px"
      borderColor={borderColor}
    >
      {/* Header */}
      <Flex
        p={4}
        bg={headerBg}
        borderTopRadius="lg"
        borderBottom="1px"
        borderColor={borderColor}
        align="center"
      >
        <HStack spacing={3} flex={1}>
          {/* <Image
            src={data.icon.iconUrl}
            alt="Event Icon"
            boxSize="24px"
            borderRadius="md"
            fallbackSrc="https://via.placeholder.com/24"
          /> */}
          <Heading size="sm" color="gray.800">
            {data.title || `${data.event_type.toUpperCase()} Event`}
          </Heading>
        </HStack>
        <IconButton
          aria-label="Close popup"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </Flex>

      {/* Content */}
      <VStack spacing={4} p={4} align="stretch">
        {/* Status and Priority Grid */}
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          <GridItem>
            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
              STATUS
            </Text>
            <Badge colorScheme={getStateColorScheme(data.state)} variant="solid">
              {data.state.toUpperCase()}
            </Badge>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
              PRIORITY
            </Text>
            <Badge colorScheme={getPriorityColorScheme(data.priority)} variant="solid">
              {data.priority_label}
            </Badge>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
              CATEGORY
            </Text>
            <Badge variant="outline" textTransform="capitalize">
              {data.event_category}
            </Badge>
          </GridItem>
          <GridItem>
            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>
              SERIAL #
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {data.serial_number}
            </Text>
          </GridItem>
        </Grid>

        <Divider />

        {/* Event Details */}
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              DATE/TIME
            </Text>
            <Text fontSize="sm">{formatDate(data.datetime)}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              CREATED
            </Text>
            <Text fontSize="sm">{formatDate(data.created_at)}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color={textColor}>
              UPDATED
            </Text>
            <Text fontSize="sm">{formatDate(data.updated_at)}</Text>
          </HStack>
        </VStack>

        {/* Message */}
        {data.message && (
          <>
            <Divider />
            <Box>
              <Text fontSize="xs" fontWeight="bold" color={textColor} mb={2}>
                MESSAGE
              </Text>
              <Box bg={headerBg} p={3} borderRadius="md">
                <Text fontSize="sm" color="gray.700">
                  {data.message}
                </Text>
              </Box>
            </Box>
          </>
        )}

        {/* Event Specific Details */}
        {data.event_details && (
          <>
            <Divider />
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton px={0}>
                  <Box flex="1" textAlign="left">
                    <Text fontSize="sm" fontWeight="bold">
                      Event Details
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px={0} pb={0}>
                  <VStack spacing={2} align="stretch">
                    {data.event_details.hwcrep_species && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          SPECIES
                        </Text>
                        <Text fontSize="sm" textTransform="capitalize">
                          {data.event_details.hwcrep_species}
                        </Text>
                      </HStack>
                    )}
                    {data.event_details.hwcrep_humandeath && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          HUMAN DEATH
                        </Text>
                        <Badge 
                          colorScheme={data.event_details.hwcrep_humandeath === 'yes' ? 'red' : 'green'}
                          variant="subtle"
                        >
                          {data.event_details.hwcrep_humandeath.toUpperCase()}
                        </Badge>
                      </HStack>
                    )}
                    {data.event_details.hwcrep_humaninjury && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          HUMAN INJURY
                        </Text>
                        <Badge 
                          colorScheme={data.event_details.hwcrep_humaninjury === 'yes' ? 'orange' : 'green'}
                          variant="subtle"
                        >
                          {data.event_details.hwcrep_humaninjury.toUpperCase()}
                        </Badge>
                      </HStack>
                    )}
                    {data.event_details.hwcrep_livestocktypes && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          LIVESTOCK TYPE
                        </Text>
                        <Text fontSize="sm" textTransform="capitalize">
                          {data.event_details.hwcrep_livestocktypes}
                        </Text>
                      </HStack>
                    )}
                    {data.event_details.hwcrep_livestockInjuredKilled && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>
                          LIVESTOCK INJURED/KILLED
                        </Text>
                        <Badge colorScheme="red" variant="solid">
                          {data.event_details.hwcrep_livestockInjuredKilled}
                        </Badge>
                      </HStack>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </>
        )}

        {/* Updates */}
        {data.event_details?.updates && data.event_details.updates.length > 0 && (
          <>
            <Divider />
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton px={0}>
                  <Box flex="1" textAlign="left">
                    <Text fontSize="sm" fontWeight="bold">
                      Updates ({data.event_details.updates.length})
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px={0} pb={0}>
                  <VStack spacing={3} align="stretch">
                    {data.event_details.updates.map((update, index) => (
                      <Box
                        key={index}
                        p={3}
                        bg={headerBg}
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="blue.400"
                      >
                        <Flex mb={2}>
                          <HStack spacing={2}>
                            <Avatar
                              size="xs"
                              name={`${update.user.first_name} ${update.user.last_name}`}
                            />
                            <Text fontSize="xs" fontWeight="bold">
                              {update.user.first_name} {update.user.last_name}
                            </Text>
                          </HStack>
                          <Spacer />
                          <Text fontSize="xs" color={textColor}>
                            {formatDate(update.time)}
                          </Text>
                        </Flex>
                        {update.message && (
                          <Text fontSize="sm" mb={1}>
                            {update.message}
                          </Text>
                        )}
                        {update.text && (
                          <Text fontSize="sm" color={textColor}>
                            {update.text}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </>
        )}

        {/* Footer */}
        <Divider />
        <Box textAlign="center">
          <Text fontSize="xs" color={textColor}>
            UUID: {earthRangerUuid}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
