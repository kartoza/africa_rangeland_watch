import React, {useState, useRef, useEffect} from 'react';
import {
  Box,
  GridItem,
  Text,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Checkbox,
  Spinner,
} from '@chakra-ui/react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import axios from 'axios';
import { CSS } from '@dnd-kit/utilities';
import { FiSettings, FiX, FiInfo, FiEdit2, FiSlash, FiCheck, FiDownload, FiAlertCircle } from 'react-icons/fi';
import {DragHandleIcon} from '@chakra-ui/icons';
import ChartWidget from './ChartWidget';
import TableWidget from './TableWidget';
import MapWidget from './MapWidget';
import TextWidget from './TextWidget';
import {
    Widget,
    GridSize,
    WidgetHeight,
    heightConfig,
    widgetConstraints
 } from '../../store/dashboardSlice';
 import EditableWrapper from '../EditableWrapper';
 import AnalysisInfo from './AnalysisInfo';
 import { downloadPDF } from '../../utils/downloadPDF';
import { downloadCog } from '../../utils/api';


// Sortable Widget Item Component
const SortableWidgetItem: React.FC<{
  widget: Widget;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, size: GridSize) => void;
  onHeightChange: (id: string, height: WidgetHeight) => void;
  onContentChange: (id: string, content: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onConfigChange: (id: string, config: any) => void;
  isEditable?: boolean;
}> = ({ widget, onRemove, onSizeChange, onHeightChange, 
  onContentChange, onTitleChange, onConfigChange, isEditable }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });
  const [updatedWidget, setUpdatedWidget] = useState(widget);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(widget.title);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const config = heightConfig[widget.height];
  const constraints = widgetConstraints[widget.type];
  const [downloadLoading, setDownloadLoading] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);


  // Periodic fetch function
  const fetchWidgetStatus = async () => {
    try {
      const response = await axios.get(`/dashboards/widgets/${updatedWidget.id}/`);
      
      if (isMountedRef.current) {
        const newWidgetData = response.data;
        setUpdatedWidget(newWidgetData);
        
        // Check if status is no longer RUNNING
        if (newWidgetData.data?.status !== 'RUNNING') {
          stopPeriodicFetch();
        }
      }
    } catch (error) {
      console.error('Error fetching widget status:', error);
      // Continue polling even on error, but you might want to implement retry logic
    }
  };

  // Start periodic fetch
  const startPeriodicFetch = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Fetch immediately
    fetchWidgetStatus();
    
    // Then set up periodic fetching every 5 seconds
    intervalRef.current = setInterval(fetchWidgetStatus, 5000);
  };

  // Stop periodic fetch
  const stopPeriodicFetch = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Effect to handle periodic fetching based on status
  useEffect(() => {
    if (updatedWidget.data?.status === 'RUNNING') {
      startPeriodicFetch();
    } else {
      stopPeriodicFetch();
    }

    // Cleanup on unmount
    return () => {
      stopPeriodicFetch();
    };
  }, [updatedWidget.data?.status]);

  // Update widget when prop changes
  useEffect(() => {
    setUpdatedWidget(widget);
  }, [widget]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopPeriodicFetch();
    };
  }, []);

  const handleTitleSave = () => {
    if (editTitle.trim()) {
      onTitleChange(widget.id, editTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setEditTitle(widget.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widgetId={widget.id} data={updatedWidget.data} height={widget.height} config={widget.config} />;
      case 'table':
        return <TableWidget widgetId={widget.id} data={updatedWidget.data} height={widget.height} />;
      case 'map':
        return <MapWidget widgetId={widget.id} data={updatedWidget.data} height={widget.height} config={widget.config} />;
      case 'text':
        return (
          <TextWidget 
            content={widget.content} 
            height={widget.height}
            onContentChange={(content) => onContentChange(widget.id, content)}
          />
        );
      default:
        return <Text>Unknown widget type</Text>;
    }
  };

  const getValidSizes = (): GridSize[] => {
    const sizes: GridSize[] = [];
    for (let i = constraints.minWidth; i <= constraints.maxWidth; i++) {
      sizes.push(i as GridSize);
    }
    return sizes;
  };

  const getValidHeights = (): WidgetHeight[] => {
    const heights: WidgetHeight[] = ['small', 'medium', 'large', 'xlarge'];
    const minIndex = heights.indexOf(constraints.minHeight);
    const maxIndex = heights.indexOf(constraints.maxHeight);
    return heights.slice(minIndex, maxIndex + 1);
  };

  return (
    <GridItem colSpan={widget.size} ref={setNodeRef} style={style}>
      <Card
        bg={bgColor}
        borderColor={borderColor}
        borderWidth="1px"
        h="full"
        minH={config.minH}
        maxH={config.maxH}
        shadow="sm"
        _hover={{ shadow: 'md' }}
        transition="all 0.2s"
        overflow="visible"
        position="relative"
        ref={cardRef}
      >
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <HStack overflowX={'hidden'}>
              <EditableWrapper isEditable={isEditable}>
                <Box
                  {...attributes}
                  {...listeners}
                  cursor="grab"
                  _active={{ cursor: 'grabbing' }}
                  pl={1}
                  pr={1}
                  pt={2}
                  pb={2}
                  borderRadius="md"
                  _hover={{ bg: 'gray.100' }}
                >
                  <DragHandleIcon />
                </Box>
              </EditableWrapper>
              <VStack align="start" spacing={0}>
                {isEditingTitle ? (
                  <HStack spacing={1}>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={handleTitleKeyPress}
                      size="sm"
                      fontSize="sm"
                      fontWeight="semibold"
                      w="150px"
                      autoFocus
                    />
                    <IconButton
                      icon={<FiCheck size={12} />}
                      size="xs"
                      colorScheme="green"
                      aria-label="Save title"
                      onClick={handleTitleSave}
                    />
                    <IconButton
                      icon={<FiSlash size={12} />}
                      size="xs"
                      variant="ghost"
                      aria-label="Cancel edit"
                      onClick={handleTitleCancel}
                    />
                  </HStack>
                ) : (
                  <HStack spacing={1}>
                    <Heading size="sm" color="black" minH={'40px'} display={'flex'} alignItems={'center'}>{widget.title}</Heading>
                    <EditableWrapper isEditable={isEditable}>
                      <IconButton
                        icon={<FiEdit2 size={12} />}
                        size="xs"
                        variant="ghost"
                        aria-label="Edit title"
                        onClick={() => setIsEditingTitle(true)}
                        opacity={0.6}
                        _hover={{ opacity: 1 }}
                      />
                    </EditableWrapper>
                  </HStack>
                )}
              </VStack>
            </HStack>
            <HStack spacing={1} id="widget-actions">
              {widget.type === 'map' && (
                <>
                  {updatedWidget.data.status === 'RUNNING' && (
                    <Box 
                      bg="blue.100" 
                      p={2} 
                      borderRadius="md" 
                      display="flex" 
                      alignItems="center" 
                      gap={2}
                      mb={2}
                    >
                      <Spinner size="sm" color="blue.500" />
                      <Text fontSize="sm" color="blue.700">
                        Generating TIFF
                      </Text>
                    </Box>
                  )}
                  {updatedWidget.data.status === 'FAILED' && (
                    <Box 
                      bg="red.100" 
                      p={2} 
                      borderRadius="md" 
                      display="flex" 
                      alignItems="center" 
                      gap={2}
                      mb={2}
                    >
                      <FiAlertCircle/>
                      <Text fontSize="sm" color="green.700">
                        Failed to generate TIFF
                      </Text>
                    </Box>
                  )}
                </>
              )}

              { widget.type !== 'text' ? <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiInfo size={16} />}
                  size="sm"
                  variant="ghost"
                  aria-label="Widget information"
                />
                <MenuList 
                  maxW="320px" 
                  p={0} 
                  zIndex={1000}
                  boxShadow="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                >
                  <AnalysisInfo data={updatedWidget.data} />
                </MenuList>
              </Menu> : null}
              { widget.type !== 'text' && !isEditable && (
                <IconButton
                  icon={<FiDownload size={12} />}
                  size="xs"
                  variant="ghost"
                  aria-label="Download"
                  onClick={() => {
                    const analysisData = updatedWidget.data.data || updatedWidget.data.analysis;
                    if (widget.type === 'map') {
                      setDownloadLoading(true);
                      downloadCog(updatedWidget.data.id)
                        .then(() => setDownloadLoading(false))
                        .catch(() => setDownloadLoading(false));
                      return;
                    }

                    setDownloadLoading(true);
                    const exportAnalysis = {
                      analysisType: analysisData?.analysisType,
                      temporalResolution: analysisData?.temporalResolution,
                      variable: analysisData?.variable,
                    };
                    downloadPDF(cardRef, exportAnalysis, 'BaselineTableContainer', ['widget-actions'])
                      .then(() => setDownloadLoading(false))
                      .catch(() => setDownloadLoading(false));
                  }}
                  opacity={0.6}
                  _hover={{ opacity: 1 }}
                  disabled={downloadLoading}
                />
              )}              
              <EditableWrapper isEditable={isEditable}>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiSettings size={16} />}
                    size="sm"
                    variant="ghost"
                    aria-label="Widget settings"
                  />
                  <MenuList>
                    <Text px={3} py={2} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Width
                    </Text>
                    {getValidSizes().map((size) => (
                      <MenuItem 
                        key={size} 
                        onClick={() => onSizeChange(widget.id, size)}
                        bg={widget.size === size ? 'green.50' : 'transparent'}
                        color={widget.size === size ? 'green.600' : 'inherit'}
                      >
                        {size === 1 ? 'Small' : size === 2 ? 'Medium' : size === 3 ? 'Large' : 'Extra Large'} ({size} column{size > 1 ? 's' : ''})
                      </MenuItem>
                    ))}
                    <Text px={3} py={2} pt={4} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Height
                    </Text>
                    {getValidHeights().map((height) => (
                      <MenuItem 
                        key={height} 
                        onClick={() => onHeightChange(widget.id, height)}
                        bg={widget.height === height ? 'green.50' : 'transparent'}
                        color={widget.height === height ? 'green.600' : 'inherit'}
                      >
                        {height.charAt(0).toUpperCase() + height.slice(1)} ({heightConfig[height].minH})
                      </MenuItem>
                    ))}
                    <Text px={3} py={2} pt={4} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Layers
                    </Text>
                      <MenuItem 
                        key={'earth-ranger'} 
                        closeOnSelect={false}
                      >
                        <Checkbox
                          isChecked={widget.config?.earth_ranger === true}
                          onChange={(e) => {
                            onConfigChange(widget.id, { ...widget.config, earth_ranger: e.target.checked });
                          }}
                        >
                          Earth Ranger
                        </Checkbox>
                      </MenuItem>
                  </MenuList>
                </Menu>
                <IconButton
                  icon={<FiX size={16} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  aria-label="Remove widget"
                  onClick={() => onRemove(widget.id)}
                />
              </EditableWrapper>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody pt={0} overflow="hidden" flex={1} position="relative">
          {renderWidgetContent()}
        </CardBody>
      </Card>
    </GridItem>
  );
};

export default SortableWidgetItem;
