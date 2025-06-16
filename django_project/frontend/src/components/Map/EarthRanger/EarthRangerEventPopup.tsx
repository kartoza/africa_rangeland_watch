import React, { useState } from 'react';
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
  Collapse,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

interface EarthRangerEventData {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  time: string;
  end_time: string | null;
  message: string;
  provenance: string;
  event_type: string;
  event_category: string;
  priority: number;
  priority_label: string;
  attributes: Record<string, any>;
  comment: string | null;
  title: string | null;
  notes: Array<{
    id: string;
    text: string;
    event: string;
    created_at: string;
    updated_at: string;
    updates: Array<{
      message: string;
      time: string;
      text: string;
      user: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        content_type: string;
      };
      type: string;
    }>;
  }>;
  reported_by: {
    content_type: string;
    id: string;
    name: string;
    subject_type: string;
    subject_subtype: string;
    common_name: string | null;
    additional: Record<string, any>;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    user: {
      id: string;
    };
    tracks_available: boolean;
    image_url: string;
  } | null;
  state: string;
  contains: any[];
  is_linked_to: any[];
  is_contained_in: any[];
  sort_at: string;
  patrol_segments: any[];
  geometry: any | null;
  updated_at: string;
  created_at: string;
  icon_id: string;
  serial_number: number;
  url: string;
  image_url: string;
  geojson: {
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      message: string;
      datetime: string;
      image: string;
      icon: {
        iconUrl: string;
        iconSize: [number, number];
        iconAncor: [number, number];
        popupAncor: [number, number];
        className: string;
      };
    };
  };
  is_collection: boolean;
  event_details: Record<string, any> & {
    updates: Array<{
      message?: string;
      time?: string;
      text?: string;
      user?: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        content_type: string;
      };
      type?: string;
    }>;
    Days?: number;
    Hours?: number;
    Quater?: number;
    CSA_Rep?: string;
    Comment?: string;
    Attendance1?: number;
    Attendance2?: number;
    Training_Theme?: string;
    Intervention_Loc?: string;
    Auc_Farm_Num?: string;
    Auc_vill_name?: string;
    furtherdescription?: string;
    Indicator?: string;
    Attendance12?: number;
    Attendance22?: number;
    Country_goal?: string;
    Project_donor?: string;
    Facilitator_name?: string;
    hwcrep_species?: string;
    hwcrep_humandeath?: string;
    hwcrep_humaninjury?: string;
    hwcrep_livestocktypes?: string;
    hwcrep_livestockInjuredKilled?: number;
  };
  related_subjects: any[];
  files: Array<{
    id: string;
    comment: string;
    created_at: string;
    updated_at: string;
    updates: Array<{
      message: string;
      time: string;
      text: string;
      user: {
        username: string;
        first_name: string;
        last_name: string;
        id: string;
        content_type: string;
      };
      type: string;
    }>;
    url: string;
    images?: {
      original: string;
      icon: string;
      thumbnail: string;
      large: string;
      xlarge: string;
    };
    filename: string;
    file_type: string;
    icon_url: string;
  }>;
  patrols: any[];
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
  
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const humanizeEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPriorityColorScheme = (priority: number) => {
    if (priority >= 300) return 'red';
    if (priority >= 200) return 'orange';
    if (priority >= 100) return 'yellow';
    return 'green';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const toggleFileExpansion = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onOpen();
  };

  // Combine and sort notes and files by time
  const activities = [
    ...data.notes.map(note => ({
      type: 'note' as const,
      id: note.id,
      text: note.text,
      created_at: note.created_at,
      icon_url: null
    })),
    ...data.files.map(file => ({
      type: 'file' as const,
      id: file.id,
      filename: file.filename,
      created_at: file.created_at,
      icon_url: file.icon_url,
      images: file.images,
      file_type: file.file_type
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter out empty event_details fields
  const eventDetailsEntries = Object.entries(data.event_details)
    .filter(([key, value]) => 
      key !== 'updates' && 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      !(Array.isArray(value) && value.length === 0)
    );

  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="lg"
        boxShadow="xl"
        maxW="600px"
        maxH="80vh"
        overflowY="auto"
        border="1px"
        borderColor={borderColor}
      >
        {/* Header with Close Button */}
        <HStack justify="space-between" p={4} borderBottom="1px" borderColor={borderColor}>
          <Text fontSize="lg" fontWeight="bold">Event Details</Text>
          <IconButton
            aria-label="Close popup"
            icon={<CloseIcon />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </HStack>

        {/* Two Column Layout */}
        <Grid templateColumns="120px 1fr" gap={4} p={4}>
          {/* Left Column */}
          <VStack spacing={4} align="stretch">
            {/* Icon */}
            <Box>
              <Image
                src={data.image_url}
                alt="Event Icon"
                boxSize="60px"
                borderRadius="md"
                fallbackSrc="https://via.placeholder.com/60"
              />
            </Box>

            {/* Details Label */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color={textColor}>
                DETAILS
              </Text>
            </Box>

            {/* Activity Label */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color={textColor}>
                ACTIVITY
              </Text>
            </Box>
          </VStack>

          {/* Right Column */}
          <VStack spacing={4} align="stretch">
            {/* Header Section */}
            <VStack align="stretch" spacing={2}>
              <Heading size="md">{humanizeEventType(data.event_type)}</Heading>
              <VStack align="flex-start" spacing={1}>
                <Text fontSize="sm" color={textColor}>
                  Created: {formatDate(data.created_at)}
                </Text>
              </VStack>
            </VStack>

            <Divider />

            {/* Details Section */}
            <VStack align="stretch" spacing={3}>
              {/* Basic Info */}
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color={textColor}>
                    REPORTED BY
                  </Text>
                  <Text fontSize="sm">{data.reported_by?.name}</Text>
                </HStack>
                {data.location ? <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color={textColor}>
                    LOCATION
                  </Text>
                  <Text fontSize="sm">
                    {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)}
                  </Text>
                </HStack> : null}
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="bold" color={textColor}>
                    TIME
                  </Text>
                  <Text fontSize="sm">{formatDate(data.time)}</Text>
                </HStack>
              </VStack>

              {/* Event Details */}
              {eventDetailsEntries.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Event Details
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {eventDetailsEntries.map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="xs" fontWeight="bold" color={textColor} textTransform="uppercase">
                            {key.replace(/_/g, ' ')}
                          </Text>
                          <Text fontSize="sm" textAlign="right" maxW="200px">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>

            <Divider />

            {/* Activity Section */}
            <VStack align="stretch" spacing={3}>
              {activities.length === 0 ? (
                <Text fontSize="sm" color={textColor} fontStyle="italic">
                  No activity recorded
                </Text>
              ) : (
                activities.map((activity) => (
                  <Box key={activity.id} p={3} bg={headerBg} borderRadius="md">
                    <HStack spacing={3} align="flex-start">
                      <Image
                        src={activity.icon_url}
                        alt="Activity icon"
                        boxSize="24px"
                        borderRadius="sm"
                        fallbackSrc="https://via.placeholder.com/24"
                      />
                      <VStack align="stretch" flex={1} spacing={2}>
                        <HStack justify="space-between">
                          <Badge variant="outline" size="sm">
                            {activity.type.toUpperCase()}
                          </Badge>
                          <Text fontSize="xs" color={textColor}>
                            {formatDate(activity.created_at)}
                          </Text>
                        </HStack>
                        
                        {activity.type === 'note' && (
                          <>
                            <Text fontSize="sm">
                              {expandedNotes.has(activity.id) 
                                ? activity.text 
                                : truncateText(activity.text)
                              }
                            </Text>
                            {activity.text.length > 50 && (
                              <Button
                                size="xs"
                                variant="ghost"
                                leftIcon={expandedNotes.has(activity.id) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                onClick={() => toggleNoteExpansion(activity.id)}
                              >
                                {expandedNotes.has(activity.id) ? 'Show Less' : 'Show More'}
                              </Button>
                                                          )}
                          </>
                        )}
                        
                        {activity.type === 'file' && (
                          <>
                            <Text fontSize="sm">
                              {expandedFiles.has(activity.id) 
                                ? activity.filename 
                                : truncateText(activity.filename)
                              }
                            </Text>
                            <HStack spacing={2}>
                              {activity.filename.length > 50 && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={expandedFiles.has(activity.id) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                  onClick={() => toggleFileExpansion(activity.id)}
                                >
                                  {expandedFiles.has(activity.id) ? 'Show Less' : 'Show More'}
                                </Button>
                              )}
                              {activity.file_type === 'image' && activity.images?.original && (
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => openImageModal(activity.images!.original)}
                                >
                                  View Image
                                </Button>
                              )}
                            </HStack>
                            <Collapse in={expandedFiles.has(activity.id)}>
                              {activity.file_type === 'image' && activity.images?.thumbnail && (
                                <Image
                                  src={activity.images.thumbnail}
                                  alt={activity.filename}
                                  maxW="150px"
                                  borderRadius="md"
                                  cursor="pointer"
                                  onClick={() => openImageModal(activity.images!.original)}
                                />
                              )}
                            </Collapse>
                          </>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </VStack>
        </Grid>

        {/* Footer */}
        <Box p={4} borderTop="1px" borderColor={borderColor} textAlign="center">
          <Text fontSize="xs" color={textColor}>
            UUID: {earthRangerUuid} | Serial: {data.serial_number}
          </Text>
        </Box>
      </Box>

      {/* Image Modal */}
      <Modal isOpen={isOpen} onClose={onModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Image
              src={selectedImage}
              alt="Full size image"
              w="100%"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
