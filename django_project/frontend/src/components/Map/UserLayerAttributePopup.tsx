import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Portal,
  useColorModeValue
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

interface UserLayerAttributePopupProps {
  properties: Record<string, any>;
  position: { x: number; y: number };
  isOpen: boolean;
  onClose: () => void;
  layerName?: string;
}

// Attribute name mappings - supports multiple variations
const ATTRIBUTE_MAPPINGS = {
  name: ['Name', 'name', 'NAME', 'feature_name', 'title', 'label'],
  size: ['Size', 'size', 'SIZE', 'area', 'Area', 'AREA', 'area_ha', 'hectares'],
  donor: ['Donor', 'donor', 'DONOR', 'partner', 'Partner', 'funder'],
  activity: ['Activity', 'activity', 'ACTIVITY', 'type', 'Type', 'activity_type'],
  project: ['Project', 'project', 'PROJECT', 'project_name', 'ProjectName']
};

const POPUP_WIDTH = 350;
const POPUP_MAX_HEIGHT = 250;
const EDGE_PADDING = 10;
const ARROW_OFFSET = 15;

/**
 * Find an attribute value from properties using possible name variations
 */
const findAttribute = (
  props: Record<string, any>,
  possibleNames: string[]
): any => {
  for (const name of possibleNames) {
    const key = Object.keys(props).find(
      k => k.toLowerCase() === name.toLowerCase()
    );
    if (key && props[key] !== null && props[key] !== undefined && props[key] !== '') {
      return props[key];
    }
  }
  return null;
};

/**
 * Format attribute value for display
 */
const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return 'N/A';

  // Format size/area with hectares unit
  if (key.toLowerCase() === 'size' && typeof value === 'number') {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ha`;
  }

  // Format numbers with thousand separators
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // Convert objects to JSON string
  if (typeof value === 'object') return JSON.stringify(value);

  // Truncate long strings
  const stringValue = String(value);
  const MAX_LENGTH = 100;
  if (stringValue.length > MAX_LENGTH) {
    return stringValue.substring(0, MAX_LENGTH) + '...';
  }

  return stringValue;
};

/**
 * Calculate popup position to keep it within viewport bounds
 */
const getPopupPosition = (
  clickPosition: { x: number; y: number }
): { left: number; top: number; showArrowAbove: boolean } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = clickPosition.x - (POPUP_WIDTH / 2);
  let top = clickPosition.y + ARROW_OFFSET;
  let showArrowAbove = false;

  // Keep within horizontal bounds
  if (left < EDGE_PADDING) left = EDGE_PADDING;
  if (left + POPUP_WIDTH > viewportWidth - EDGE_PADDING) {
    left = viewportWidth - POPUP_WIDTH - EDGE_PADDING;
  }

  // Check if popup would go off bottom of screen
  if (top + POPUP_MAX_HEIGHT > viewportHeight - EDGE_PADDING) {
    top = clickPosition.y - POPUP_MAX_HEIGHT - ARROW_OFFSET;
    showArrowAbove = true;
  }

  // Ensure not off top of screen
  if (top < EDGE_PADDING) top = EDGE_PADDING;

  return { left, top, showArrowAbove };
};

export default function UserLayerAttributePopup({
  properties,
  position,
  isOpen,
  onClose,
  layerName
}: UserLayerAttributePopupProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract attributes using flexible matching
  const nameValue = findAttribute(properties, ATTRIBUTE_MAPPINGS.name);
  const sizeValue = findAttribute(properties, ATTRIBUTE_MAPPINGS.size);
  const donorValue = findAttribute(properties, ATTRIBUTE_MAPPINGS.donor);
  const activityValue = findAttribute(properties, ATTRIBUTE_MAPPINGS.activity);
  const projectValue = findAttribute(properties, ATTRIBUTE_MAPPINGS.project);

  // Calculate position
  const popupPosition = getPopupPosition(position);

  // Attributes to display
  const attributes = [
    { label: 'Size', value: sizeValue, key: 'size' },
    { label: 'Donor', value: donorValue, key: 'donor' },
    { label: 'Activity', value: activityValue, key: 'activity' },
    { label: 'Project', value: projectValue, key: 'project' }
  ];

  return (
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
        aria-label="Close popup backdrop"
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
        w={`${POPUP_WIDTH}px`}
        maxH={`${POPUP_MAX_HEIGHT}px`}
        border="1px"
        borderColor={borderColor}
        role="dialog"
        aria-labelledby="popup-title"
      >
        {/* Arrow pointing to click location */}
        {popupPosition.showArrowAbove ? (
          // Arrow pointing down (popup above click)
          <>
            <Box
              position="absolute"
              bottom="-8px"
              left="50%"
              transform="translateX(-50%)"
              width="0"
              height="0"
              borderLeft="8px solid transparent"
              borderRight="8px solid transparent"
              borderTop={`8px solid ${borderColor}`}
            />
            <Box
              position="absolute"
              bottom="-7px"
              left="50%"
              transform="translateX(-50%)"
              width="0"
              height="0"
              borderLeft="8px solid transparent"
              borderRight="8px solid transparent"
              borderTop={`8px solid ${bgColor}`}
            />
          </>
        ) : (
          // Arrow pointing up (popup below click)
          <>
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
          </>
        )}

        {/* Header */}
        <HStack
          justify="space-between"
          p={3}
          bg={headerBg}
          borderTopRadius="lg"
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Text
            id="popup-title"
            color={textColor}
            fontSize="md"
            fontWeight="bold"
            noOfLines={1}
          >
            {nameValue ? formatValue('name', nameValue) : (layerName || 'Polygon Attributes')}
          </Text>
          <IconButton
            aria-label="Close popup"
            icon={<CloseIcon />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </HStack>

        {/* Content */}
        <VStack spacing={2} p={4} align="stretch">
          {attributes.map((attr) => (
            <HStack key={attr.key} justify="space-between" spacing={3}>
              <Text
                color={labelColor}
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                minW="80px"
              >
                {attr.label}
              </Text>
              <Text
                color={textColor}
                fontSize="sm"
                textAlign="right"
                flex={1}
                noOfLines={2}
              >
                {formatValue(attr.key, attr.value)}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Portal>
  );
}
