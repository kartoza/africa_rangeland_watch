import React, { useState } from 'react';
import {
  Box,
  Grid,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  IconButton,
  Heading,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Input
} from '@chakra-ui/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { FiSave, FiDownload, FiEdit2, FiCheck, FiSlash, FiArrowUpCircle } from 'react-icons/fi';
import {
    Widget,
    WidgetType,
    widgetConstraints,
    GridSize,
    WidgetHeight,
    heightConfig,
    chartData,
    sampleTextContent,
    tableData 
} from './types';
import SortableWidgetItem from './SortableWidgetItem';
import { testWidgetData } from './fixtures'; // Import test data for 
import { Item } from '../../store/mockUserAnalysisSlice';
import ItemSelector from './ItemSelector';
import { content } from 'html2canvas/dist/types/css/property-descriptors/content';
import { add } from 'date-fns';

// Main Dashboard Component
const DynamicDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType>('chart');
  const [isScrolled, setIsScrolled] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('Dynamic Dashboard');
  const [isEditingDashboardTitle, setIsEditingDashboardTitle] = useState(false);
  const [editDashboardTitle, setEditDashboardTitle] = useState(dashboardTitle);
  const toast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle scroll detection for header shadow
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load widgets data
  React.useEffect(() => {
    loadConfiguration(testWidgetData);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = (item: Item) => {
    let summaryAdded = '';
    let newWidgets: Widget[] = [];
    const analysisResult = item.analysis_results || {};
    const data = analysisResult.data || {};
    if (!data) {
      toast({
        title: 'No Data Available',
        description: 'The selected analysis result does not contain any data.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // analyisis type
    const analysisType = data.analysisType;
    if (analysisType === 'Baseline') {
      const constraints = widgetConstraints['table'];
      // add table widget
      newWidgets.push({
        id: item.id + '-table-new',
        type: 'table',
        title: item.name || 'Baseline Analysis',
        size: constraints.minWidth,
        height: constraints.recommendedHeight,
        data: analysisResult,
        content: null
      })
      summaryAdded = '1 table widget';
    } else if (analysisType === 'Spatial') {
      const chartConstraint = widgetConstraints['chart'];
      const mapConstraint = widgetConstraints['map'];
      // add chart widget
      newWidgets.push({
        id: item.id + '-chart-new',
        type: 'chart',
        title: item.name || 'Spatial Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: analysisResult,
        content: null,
        config: {}
      });
      const rasterOutputList = item.raster_output_list || [];
      if (rasterOutputList.length > 0) {
        // add map widget
        newWidgets.push({
          id: `${item.id}-map-new`,
          type: 'map',
          title: item.name ? `Map ${item.name}` : 'Spatial Analysis Map',
          size: mapConstraint.minWidth,
          height: mapConstraint.recommendedHeight,
          data: rasterOutputList[0],
          content: null,
          config: {}
        });
        summaryAdded = '2 widgets';
      } else {
        summaryAdded = '1 widget';
      }
    } else if (analysisType === 'Temporal') {
      const chartConstraint = widgetConstraints['chart'];
      const mapConstraint = widgetConstraints['map'];
      // add chart widgets
      newWidgets.push({
        id: item.id + '-barchart-new',
        type: 'chart',
        title: item.name || 'Temporal Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: analysisResult,
        content: null,
        config: {
          'chartType': 'bar',
        }
      });
      newWidgets.push({
        id: item.id + '-linechart-new',
        type: 'chart',
        title: item.name || 'Temporal Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: analysisResult,
        content: null,
        config: {
          'chartType': 'line',
        }
      });
      summaryAdded = '2 widgets';
      // add map widget for each raster output
      const rasterOutputList = item.raster_output_list || [];
      if (rasterOutputList.length > 0) {
        rasterOutputList.forEach((raster, index) => {
          newWidgets.push({
            id: `${item.id}-map-${index}-new`,
            type: 'map',
            title: raster.name || `Map ${index + 1}`,
            size: mapConstraint.minWidth,
            height: mapConstraint.recommendedHeight,
            data: raster,
            content: null,
            config: {}
          });
        });
        summaryAdded += ` and ${rasterOutputList.length} map widget${rasterOutputList.length > 1 ? 's' : ''}`;
      }
    }

    setWidgets((prev) => [...prev, ...newWidgets]);

    toast({
      title: 'Widget Added',
      description: `${summaryAdded} have been added to your dashboard.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });

    // Scroll to the new widget after a brief delay
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
    
    toast({
      title: 'Widget Removed',
      description: 'Widget has been removed from your dashboard.',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const changeSizeWidget = (id: string, size: GridSize) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        if (widget.id === id) {
          const constraints = widgetConstraints[widget.type];
          // Validate size constraints
          const validSize = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, size));
          return { ...widget, size: validSize as GridSize };
        }
        return widget;
      })
    );
  };

  const changeHeightWidget = (id: string, height: WidgetHeight) => {
    setWidgets((prev) =>
      prev.map((widget) => {
        if (widget.id === id) {
          const constraints = widgetConstraints[widget.type];
          const heights: WidgetHeight[] = ['small', 'medium', 'large', 'xlarge'];
          const minIndex = heights.indexOf(constraints.minHeight);
          const maxIndex = heights.indexOf(constraints.maxHeight);
          const heightIndex = heights.indexOf(height);
          
          // Validate height constraints
          if (heightIndex >= minIndex && heightIndex <= maxIndex) {
            return { ...widget, height };
          }
        }
        return widget;
      })
    );
  };

  const changeContentWidget = (id: string, content: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, content } : widget
      )
    );
  };

  const changeTitleWidget = (id: string, title: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, title } : widget
      )
    );
  };

  // Dashboard title editing functions
  const handleDashboardTitleSave = () => {
    if (editDashboardTitle.trim()) {
      setDashboardTitle(editDashboardTitle.trim());
      setIsEditingDashboardTitle(false);
    }
  };

  const handleDashboardTitleCancel = () => {
    setEditDashboardTitle(dashboardTitle);
    setIsEditingDashboardTitle(false);
  };

  const handleDashboardTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDashboardTitleSave();
    } else if (e.key === 'Escape') {
      handleDashboardTitleCancel();
    }
  };

  // Load configuration function
  const loadConfiguration = (config: any) => {
    if (!config || !config.widgets || !Array.isArray(config.widgets)) {
      toast({
        title: 'Invalid Configuration',
        description: 'The provided configuration is invalid or missing widgets.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // map widgets and sort by order
    const newWidgets = config.widgets.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((widget: any) => {
      const constraints = widgetConstraints[widget.type as WidgetType];
      return {
        id: widget.id || Date.now().toString(),
        type: widget.type,
        title: widget.title || 'New Widget',
        size: Math.max(constraints.minWidth, Math.min(constraints.maxWidth, widget.size || constraints.minWidth)) as GridSize,
        height: widget.height || constraints.recommendedHeight,
        data: widget.data,
        content: widget.content || null,
        config: widget.config || null,
      };
    });
    setWidgets(newWidgets);
    setDashboardTitle(config.dashboardTitle || 'Dynamic Dashboard');
    setIsEditingDashboardTitle(false);
    setEditDashboardTitle(config.dashboardTitle || 'Dynamic Dashboard');
    toast({
      title: 'Configuration Loaded',
      description: 'Dashboard configuration has been successfully loaded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    console.log('Loaded Configuration:', config);
  };

  // Save configuration function
  const saveConfiguration = () => {
    const config = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      dashboardTitle: dashboardTitle,
      widgets: widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        size: widget.size,
        height: widget.height,
        content: widget.content || null,
        data: widget.data || null,
        hasData: !!widget.data,
        config: widget.config || null
      })),
      metadata: {
        totalWidgets: widgets.length,
        totalColumns: totalColumns,
        averageHeight: parseFloat(averageHeight.toFixed(1))
      }
    };

    // Convert to JSON string
    const configJson = JSON.stringify(config, null, 2);
    
    // Log to console for debugging
    console.log('Dashboard Configuration:', config);
    
    // Create blob and download
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Configuration Saved',
      description: 'Dashboard configuration has been downloaded as JSON file.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    return config;
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Calculate grid stats
  const totalColumns = widgets.reduce((sum, widget) => sum + widget.size, 0);
  const averageHeight = widgets.length > 0 ? 
  widgets.reduce((sum, widget) => sum + heightConfig[widget.height].rows, 0) / widgets.length : 0;

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* Sticky Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg="gray.50"
        borderBottom={isScrolled ? "1px solid" : "none"}
        borderColor="gray.200"
        shadow={isScrolled ? "sm" : "none"}
        transition="all 0.2s"
        pt={6}
        pb={4}
        px={6}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            {isEditingDashboardTitle ? (
              <HStack spacing={2}>
                <Input
                  value={editDashboardTitle}
                  onChange={(e) => setEditDashboardTitle(e.target.value)}
                  onKeyDown={handleDashboardTitleKeyPress}
                  size="md"
                  fontSize="lg"
                  fontWeight="bold"
                  w="250px"
                  autoFocus
                />
                <IconButton
                  icon={<FiCheck size={16} />}
                  size="sm"
                  colorScheme="green"
                  aria-label="Save dashboard title"
                  onClick={handleDashboardTitleSave}
                />
                <IconButton
                  icon={<FiSlash size={16} />}
                  size="sm"
                  variant="ghost"
                  aria-label="Cancel edit"
                  onClick={handleDashboardTitleCancel}
                />
              </HStack>
            ) : (
              <HStack spacing={2}>
                <Heading size="lg" color="black">{dashboardTitle}</Heading>
                <IconButton
                  icon={<FiEdit2 size={16} />}
                  size="sm"
                  variant="ghost"
                  aria-label="Edit dashboard title"
                  onClick={() => setIsEditingDashboardTitle(true)}
                  opacity={0.6}
                  _hover={{ opacity: 1 }}
                />
              </HStack>
            )}
          </VStack>
          <HStack spacing={3}>
            <Menu>
              <MenuButton
                as={Button}
                leftIcon={<FiSave size={16} />}
                size="sm"
                variant="outline"
                colorScheme="green"
              >
                Save Config
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiDownload size={16} />} onClick={saveConfiguration}>
                  Download as JSON File
                </MenuItem>
              </MenuList>
            </Menu>
            <ItemSelector
              onItemSelect={(item: Item) => {
                addWidget(item);
              }}
              title="Choose an Analysis Result"
              placeholder="Select an analysis result to be added as a widget"
            />
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box px={6} pb={6}>
        <VStack spacing={6} align="stretch">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <Grid templateColumns="repeat(4, 1fr)" gap={4} w="full">
                {widgets.map((widget) => (
                  <SortableWidgetItem
                    key={widget.id}
                    widget={widget}
                    onRemove={removeWidget}
                    onSizeChange={changeSizeWidget}
                    onHeightChange={changeHeightWidget}
                    onContentChange={changeContentWidget}
                    onTitleChange={changeTitleWidget}
                  />
                ))}
              </Grid>
            </SortableContext>
          </DndContext>

          {widgets.length === 0 && (
            <Box
              textAlign="center"
              py={20}
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              bg="white"
            >
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No widgets in your dashboard
                </Text>
                <Text color="gray.400">
                  Add widgets using the controls above to get started
                </Text>
              </VStack>
            </Box>
          )}

        </VStack>
      </Box>

      {/* Scroll to Top Button */}
      {isScrolled && (
        <IconButton
          position="fixed"
          bottom={6}
          right={6}
          color="green"
          bg={"white"}
          borderRadius="full"
          size="md"
          shadow="md"
          aria-label="Scroll to top"
          icon={<FiArrowUpCircle size={20} />}
          onClick={scrollToTop}
          zIndex={20}
          _hover={{ transform: 'scale(1.1)' }}
          transition="all 0.2s"
        />
      )}
    </Box>
  );
}
export default DynamicDashboard;
