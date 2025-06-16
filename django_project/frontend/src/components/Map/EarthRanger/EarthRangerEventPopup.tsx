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
  Collapse,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Portal,
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
  isOpen: boolean;
  position: { x: number; y: number };
}

export default function EarthRangerEventPopup({ 
  data, 
  earthRangerUuid, 
  onClose, 
  isOpen,
  position 
}: Props) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const { isOpen: isImageModalOpen, onOpen: onImageModalOpen, onClose: onImageModalClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Add this helper function at the top of your component
  const getProxiedImageUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    
    try {
      const urlObj = new URL(originalUrl);
      // Remove the base URL and leading slash to get the path
      const pathWithoutLeadingSlash = urlObj.pathname.substring(1).replace("api/v1.0/", "");
      
      // Use your Django API endpoint
      return `/api/earth-ranger/proxy-image/${pathWithoutLeadingSlash}`;
    } catch (error) {
      console.error('Error parsing image URL:', error);
      return ''; // Return empty string for fallback
    }
  };

  // Add error handling for images
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // With this:
  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(imageUrl);
      return newSet;
    });
  };

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
    onImageModalOpen();
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

  // Calculate position to ensure popup stays within viewport
  const getPopupPosition = () => {
    const popupWidth = 400;
    const popupHeight = 400; // estimated
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = position.x - (popupWidth / 2); // Center horizontally
    let top = position.y + 10; // 10px below click point
    
    // Adjust if popup would go off-screen
    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) left = viewportWidth - popupWidth - 10;
    if (top + popupHeight > viewportHeight - 10) top = position.y - popupHeight - 10; // Show above if no room below
    
    return { left, top };
  };

  const popupPosition = getPopupPosition();

  if (!isOpen) return null;

  return (
    <>
      <Portal>
        {/* Backdrop */}
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={1400}
          onClick={onClose}
        />
        
        {/* Popup */}
        <Box
          position="fixed"
          top={`${popupPosition.top}px`}
          left={`${popupPosition.left}px`}
          zIndex={1500}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="xl"
          maxW="600px"
          // overflowY="auto"
          // maxH="40vh"
          border="1px"
          borderColor={borderColor}
        >
          {/* Arrow pointing up to click location */}
          <Box
            position="absolute"
            top="-8px"
            left="50%"
            transform="translateX(-50%)"
            width="0"
            height="0"
            borderLeft="8px solid transparent"
            borderRight="8px solid transparent"
            borderBottom={`8px solid ${borderColor}`}
          />
          <Box
            position="absolute"
            top="-7px"
            left="50%"
            transform="translateX(-50%)"
            width="0"
            height="0"
            borderLeft="8px solid transparent"
            borderRight="8px solid transparent"
            borderBottom={`8px solid ${bgColor}`}
          />

          {/* Header with Close Button */}
          <HStack justify="space-between" p={4} borderBottom="1px" borderColor={borderColor}>
            <HStack spacing={3}>
              <Image
                src={data.image_url}
                alt="Event Icon"
                boxSize="32px"
                borderRadius="md"
                fallbackSrc="https://via.placeholder.com/32"
              />
              <Text color={textColor} fontSize="lg" fontWeight="bold">Event Details</Text>
            </HStack>
            <IconButton
              aria-label="Close popup"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </HStack>

          {/* Single Column Content */}
          <VStack 
            spacing={4} 
            p={4} 
            align="stretch"
            overflowY="auto"
            maxH="40vh"
          >
            {/* Header Section */}
            <VStack align="stretch" spacing={2}>
              <Heading size="md" color={textColor}>{humanizeEventType(data.event_type)}</Heading>
              <HStack spacing={2}>
                <Text color={textColor} fontSize="sm">
                  Created: {formatDate(data.created_at)}
                </Text>
                <Badge colorScheme={getPriorityColorScheme(data.priority)} variant="solid">
                  {data.priority_label}
                </Badge>
              </HStack>
            </VStack>

            <Divider />

            {/* Details Section */}
            <VStack align="stretch" spacing={3}>
              <Text color={textColor} fontSize="sm" fontWeight="bold">
                DETAILS
              </Text>
              
              {/* Basic Info */}
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text color={textColor} fontSize="xs" fontWeight="bold">
                    REPORTED BY
                  </Text>
                  <Text color={textColor} fontSize="sm">{data.reported_by?.name}</Text>
                </HStack>
                {data.location ? <HStack justify="space-between">
                  <Text color={textColor} fontSize="xs" fontWeight="bold">
                    LOCATION
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)}
                  </Text>
                </HStack> : null}
                <HStack justify="space-between">
                  <Text color={textColor} fontSize="xs" fontWeight="bold">
                    TIME
                  </Text>
                  <Text color={textColor} fontSize="sm">{formatDate(data.time)}</Text>
                </HStack>
              </VStack>

              {/* Event Details */}
              {eventDetailsEntries.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Text color={textColor} fontSize="sm" fontWeight="bold" mb={2}>
                      Event Details
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {eventDetailsEntries.map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text color={textColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
                            {key.replace(/_/g, ' ')}
                          </Text>
                          <Text color={textColor} fontSize="sm" textAlign="right" maxW="300px">
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
              <Text color={textColor} fontSize="sm" fontWeight="bold">
                ACTIVITY
              </Text>
              
              {activities.length === 0 ? (
                <Text color={textColor} fontSize="sm" fontStyle="italic">
                  No activity recorded
                </Text>
              ) : (
                                activities.map((activity) => (
                  <Box key={activity.id} p={3} bg={headerBg} borderRadius="md">
                    <HStack spacing={3} align="flex-start">
                      {/* <Image
                        src={activity.icon_url}
                        alt="Activity icon"
                        boxSize="24px"
                        borderRadius="sm"
                        fallbackSrc="https://via.placeholder.com/24"
                      /> */}
                      <VStack align="stretch" flex={1} spacing={2}>
                        <HStack justify="space-between">
                          <Badge variant="outline" size="sm">
                            {activity.type.toUpperCase()}
                          </Badge>
                          <Text color={textColor} fontSize="xs">
                            {formatDate(activity.created_at)}
                          </Text>
                        </HStack>
                        
                        {activity.type === 'note' && (
                          <>
                            <Text color={textColor} fontSize="sm">
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
                            <HStack >
                              <Text fontSize="sm" color={textColor}>
                                {expandedFiles.has(activity.id) 
                                  ? activity.filename 
                                  : truncateText(activity.filename)
                                }
                              </Text>
                              <Button
                                size="xs"
                                variant="ghost"
                                leftIcon={expandedFiles.has(activity.id) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                onClick={() => toggleFileExpansion(activity.id)}
                              >
                                {expandedFiles.has(activity.id) ? 'See Preview' : 'Close Preview'}
                              </Button>
                            </HStack>
                            <Collapse in={expandedFiles.has(activity.id)}>
                              {activity.file_type === 'image' && activity.images?.large && (
                                <>
                                  {!imageErrors.has(getProxiedImageUrl(activity.images.large)) ? (
                                    <Image
                                      src={getProxiedImageUrl(activity.images.large)}
                                      alt={activity.filename}
                                      maxW="200px"
                                      borderRadius="md"
                                      cursor="pointer"
                                      // onClick={() => openImageModal(getProxiedImageUrl(activity.images!.large))}
                                      onError={() => handleImageError(getProxiedImageUrl(activity.images!.thumbnail))}
                                      fallbackSrc="https://via.placeholder.com/200?text=Image+Not+Available"
                                    />
                                  ) : (
                                    <Box
                                      maxW="200px"
                                      h="100px"
                                      bg="gray.100"
                                      borderRadius="md"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Text fontSize="xs" color="gray.500">Image not available</Text>
                                    </Box>
                                  )}
                                </>
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

          {/* Footer */}
          <Box p={4} borderTop="1px" borderColor={borderColor} textAlign="center">
            <Text color={textColor} fontSize="xs">
              UUID: {earthRangerUuid} | Serial: {data.serial_number}
            </Text>
          </Box>
        </Box>
      </Portal>

      {/* Image Modal */}
      <Modal isOpen={isImageModalOpen} onClose={onImageModalClose} size="xl">
        <ModalContent bg="white" zIndex={999999}>
          <ModalHeader bg="white" color="black">Image Preview</ModalHeader>
          <ModalCloseButton color="black" />
          <ModalBody pb={6} bg="white" zIndex={999999}>
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

