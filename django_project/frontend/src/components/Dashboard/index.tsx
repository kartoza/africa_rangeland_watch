import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { FiPlus, FiSave, FiDownload, FiEdit2, FiCheck, FiSlash, FiArrowUpCircle } from 'react-icons/fi';
import { AppDispatch, RootState } from "../../store";
import {
    Widget,
    WidgetType,
    widgetConstraints,
    GridSize,
    WidgetHeight,
    heightConfig,
    fetchDashboardByUuid,
    saveDashboardByUuid
} from '../../store/dashboardSlice';
import SortableWidgetItem from './SortableWidgetItem';
import { Item } from '../../store/userAnalysisSearchSlice';
import ItemSelector from './ItemSelector';
import EditableWrapper from '../EditableWrapper';

// Main Dashboard Component
const DynamicDashboard: React.FC<{
  uuid?: string;
  isEditable?: boolean;
}> = ({uuid, isEditable}) => {
  const itemSelectorRef = useRef(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('Dynamic Dashboard');
  const [isEditingDashboardTitle, setIsEditingDashboardTitle] = useState(false);
  const [editDashboardTitle, setEditDashboardTitle] = useState(dashboardTitle);
  const toast = useToast();
  const currentDashboard = useSelector(
    (state: RootState) => state.dashboard.currentDashboard
  );
  const dashboardLoading = useSelector(
    (state: RootState) => state.dashboard.loading
  );
  console.log(widgets);

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
    dispatch(fetchDashboardByUuid(uuid))
  }, []);

  React.useEffect(() => {
    if (currentDashboard) {
      loadConfiguration(currentDashboard);
    }
  }, [currentDashboard]);

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

  const mapWidgetTitle = (name: string) => {
    if (name.endsWith('.tif')) {
      return name.replace('.tif', '').replaceAll('_', ' ');
    }
  }

  const addWidget = (item: Item) => {
    let summaryAdded = '';
    let newWidgets: Widget[] = [];
    const analysisResult = item.analysis_results || {};
    const data = analysisResult.data || {};

    const addTemporalChart = (analysisData: any) => {
      const chartConstraint = widgetConstraints['chart'];
      const mapConstraint = widgetConstraints['map'];
      // add chart widgets
      newWidgets.push({
        id: item.id + '-barchart-new',
        type: 'chart',
        title: item.name || 'Temporal Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: analysisData,
        content: null,
        config: {
          'chartType': 'bar',
        },
        analysis_result_id: item.id,
      });
      newWidgets.push({
        id: item.id + '-linechart-new',
        type: 'chart',
        title: item.name || 'Temporal Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: analysisData,
        content: null,
        config: {
          'chartType': 'line',
        },
        analysis_result_id: item.id,
      });
      summaryAdded = summaryAdded === '1 widget' ? '3 widgets' : '4 widgets';
      // add map widget for each raster output
      const rasterOutputList = item.raster_output_list || [];
      if (rasterOutputList.length > 0) {
        rasterOutputList.forEach((raster, index) => {
          newWidgets.push({
            id: `${item.id}-map-${index}-new`,
            type: 'map',
            title: mapWidgetTitle(raster.name) || `Map ${index + 1}`,
            size: mapConstraint.minWidth,
            height: mapConstraint.recommendedHeight,
            data: raster,
            content: null,
            config: {
              "raster_output_idx": index
            },
            analysis_result_id: item.id,
          });
        });
        summaryAdded += ` and ${rasterOutputList.length} map widget${rasterOutputList.length > 1 ? 's' : ''}`;
      }
    }

    if (!data) {
      toast({
        title: 'No Data Available',
        description: 'The selected analysis result does not contain any data.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          color: "white",
        },
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
        content: null,
        analysis_result_id: item.id,
      })
      summaryAdded = '1 table widget';
    } else if (analysisType === 'Spatial') {
      const newAnalysis = JSON.parse(JSON.stringify(analysisResult));
      newAnalysis.results.spatial.data = analysisResult.data;
      newAnalysis.results.temporal.data = analysisResult.data;
      newAnalysis.results.temporal.data = {
        ...newAnalysis.results.temporal.data,
        analysisType: 'Temporal'
      } 

      const chartConstraint = widgetConstraints['chart'];
      const mapConstraint = widgetConstraints['map'];
      // add chart widget
      newWidgets.push({
        id: item.id + '-chart-new',
        type: 'chart',
        title: item.name || 'Spatial Analysis',
        size: chartConstraint.minWidth,
        height: chartConstraint.recommendedHeight,
        data: newAnalysis.results.spatial,
        content: null,
        config: {},
        analysis_result_id: item.id,
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
          config: {
            "raster_output_idx": 0, // Default to first raster output
          },
          analysis_result_id: item.id,
        });
        summaryAdded = '2 widgets';
      } else {
        summaryAdded = '1 widget';
      }

      addTemporalChart(newAnalysis.results.temporal);
    } else if (analysisType === 'Temporal') {
      addTemporalChart(analysisResult);
    }

    setWidgets((prev) => [...prev, ...newWidgets]);

    toast({
      title: 'Widget Added',
      description: `${summaryAdded} have been added to your dashboard.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: "top-right",
      containerStyle: {
        backgroundColor: "#00634b",
        color: "white",
      },
    });

    // Scroll to the new widget after a brief delay
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const addTextWidget = () => {
    const widgetId = `text-widget-${widgets.length + 1}-new`;   
    const constraints = widgetConstraints['text'];
    const newWidget: Widget = {
      id: widgetId,
      type: 'text',
      title: 'New Text Widget',
      size: constraints.minWidth,
      height: constraints.recommendedHeight,
      content: '',
      data: null,
      config: null,
      analysis_result_id: null,
    };
    
    setWidgets((prev) => [...prev, newWidget]);
    
    toast({
      title: 'Text Widget Added',
      description: 'A new text widget has been added to your dashboard.',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: "top-right",
      containerStyle: {
        backgroundColor: "#00634b",
        color: "white",
      },
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
      position: "top-right",
      containerStyle: {
        color: "white",
      },
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

  const changeConfigWidget = (id: string, config: any) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, config } : widget
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
        position: "top-right",
        containerStyle: {
          color: "white",
        },
      });
      return;
    }
    // map widgets (should be ordered from the API)
    const newWidgets = config.widgets.map((widget: any) => {
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
        analysis_result_id: widget.analysis_result_id || null,
        last_updated: widget.last_updated || new Date().toISOString(),
      };
    });
    setWidgets(newWidgets);
    setDashboardTitle(config.title || 'Dashboard');
    setIsEditingDashboardTitle(false);
    setEditDashboardTitle(config.title || 'Dynamic Dashboard');
  };

  // Save configuration function
  const saveConfiguration = async () => {
    const config = {
      version: '1.0',
      last_updated: new Date().toISOString(),
      title: dashboardTitle,
      widgets: widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        size: widget.size,
        height: widget.height,
        content: widget.content || null,
        data: null as any,
        hasData: !!widget.data,
        config: widget.config,
        analysis_result_id: widget.analysis_result_id
      })),
      metadata: {
        totalWidgets: widgets.length,
        totalColumns: totalColumns,
        averageHeight: parseFloat(averageHeight.toFixed(1))
      }
    };

    const resultAction = await dispatch(saveDashboardByUuid({uuid, data: config}));

    if (saveDashboardByUuid.fulfilled.match(resultAction)) {
        toast({
          title: 'Configuration Saved',
          description: 'Dashboard configuration has been saved!',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: "top-right",
          containerStyle: {
            backgroundColor: "#00634b",
            color: "white",
          },
        });
    }

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
                <EditableWrapper isEditable={isEditable}>
                  <IconButton
                    icon={<FiEdit2 size={16} />}
                    size="sm"
                    variant="ghost"
                    aria-label="Edit dashboard title"
                    onClick={() => setIsEditingDashboardTitle(true)}
                    opacity={0.6}
                    _hover={{ opacity: 1 }}
                  />
                </EditableWrapper>                
              </HStack>
            )}
          </VStack>
          <HStack spacing={3}>
            <EditableWrapper isEditable={isEditable}>
              <Button
                size="sm"
                leftIcon={<FiSave size={16} />}
                variant="outline"
                colorScheme="green"
                onClick={saveConfiguration}
                isLoading={dashboardLoading}
              >Save Dashboard</Button>
              <Menu>
                <MenuButton
                  as={Button}
                  leftIcon={<FiPlus size={16} />}
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                >
                  Add Widget
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => itemSelectorRef.current?.open()}>
                    From Analysis Result
                  </MenuItem>
                  <MenuItem onClick={addTextWidget}>
                    Add Text Widget
                  </MenuItem>
                </MenuList>
              </Menu>
              <ItemSelector
                onItemSelect={(item: Item) => {
                  addWidget(item);
                }}
                title="Choose an Analysis Result"
                placeholder="Select an analysis result to be added as a widget"
                ref={itemSelectorRef}
              />
            </EditableWrapper>
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
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy} disabled={!isEditable}>
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
                    onConfigChange={changeConfigWidget}
                    isEditable={isEditable}
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
