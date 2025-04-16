import React, {useEffect, useState} from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  VStack,
  chakra,
  Collapse,
  Button,
  useCheckbox,
  UseCheckboxProps,
  Flex,
  IconButton
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon, DragHandleIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Layer } from '../../../store/layerSlice';
import { hasSource } from "../utils";


const ScrollableContainer = chakra(Box, {
  baseStyle: {
    maxHeight: "60vh",
    overflowY: "auto",
    pr: 2,
  },
});


/* Custom Checkbox with Eyes Icon for visibility toggle */
interface CustomCheckboxProps extends UseCheckboxProps {
    label?: string;
}

const CustomEyeCheckbox: React.FC<CustomCheckboxProps> = (props) => {
    const { state, getInputProps, getCheckboxProps, htmlProps } = useCheckbox(props);
    
    return (
      <chakra.label
        display="flex"
        alignItems="center"
        gridColumnGap={2}
        {...htmlProps}
      >
        <input {...getInputProps()} hidden />
        <Flex
          alignItems="center"
          justifyContent="center"
          border="0px solid"
          w={20}
          h={20}
          rounded="md"
          _hover={{
            borderColor: "var(--chakra-colors-green-600)",
          }}
          _focus={{
            boxShadow: "outline",
          }}
          {...getCheckboxProps()}
        >
          {state.isChecked ? (
            <ViewIcon color="var(--chakra-colors-green-500)" w={16} h={16} />
          ) : (
            <ViewOffIcon color="var(--chakra-colors-gray-400)" w={16} h={16} />
          )}
        </Flex>
        {props.label && <Box><b>{props.label}</b></Box>}
      </chakra.label>
    );
};
  

/* Draggable Legend Item */
interface LegendItemProps {
    item: Layer;
    onChecked?: (checked: boolean) => void;
}

const LegendItem = ({ item, onChecked }: LegendItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 1 : 0,
      opacity: isDragging ? 0.8 : 1,
    };
  
    const metadata = item.metadata;
    let colors: string[] = []
    if (metadata?.colors) {
        const step = 100 / (metadata.colors.length - 1);
        colors = metadata.colors.map((color, int) => {
        return `${color} ${step * int}%`
        })
    }

    return (
      <Box
        ref={setNodeRef}
        style={style}
        w="100%"
        bg="white"
        borderWidth="1px"
        borderColor="var(--chakra-colors-gray-200)"
        borderRadius="var(--chakra-radii-md)"
        boxShadow={isDragging ? 'var(--chakra-radii-md)' : 'var(--chakra-radii-sm)'}
        p={4}
      >
        <Flex align="center" justify="space-between">
          <IconButton
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
            icon={<DragHandleIcon />}
            variant="ghost"
            size="sm"
            cursor="grab"
          />
            <Box className="Card" flex={1}>
            <CustomEyeCheckbox 
              defaultChecked={true} 
              label={metadata?.unit ? `${item.name} (${metadata?.unit})` : `${item.name}`} 
              onChange={(e) => onChecked && onChecked(e.target.checked)} 
            />
            {
              metadata ?
              <div className='LegendColorWrapper'>
                <div className='LegendValue'>
                <div>{metadata.minValue}</div>
                <div>{metadata.maxValue}</div>
                </div>
                <div
                className='LegendColor'
                style={
                  colors ? {
                  background: `linear-gradient(90deg, ${colors.join(',')})`
                  } : {}
                }/>
              </div> : null
            }
            </Box>
        </Flex>
      </Box>
    );
}


/* Scrollable List Card with drag and drop items */
type ScrollableListCardProps = {
  initialItems: Layer[];
  map: maplibregl.Map | null;
};

const ScrollableListCard: React.FC<ScrollableListCardProps> = ({ initialItems, map }) => {
    const [show, setShow] = useState(true)
    const handleToggle = () => setShow(!show)
    const [items, setItems] = useState<Layer[]>(initialItems);
    
    const doMoveLayer = (layer: Layer, beforeLayer?: Layer) => {
      if (map) {
        const ID = `layer-${layer.id}`
        if (hasSource(map, ID)) {
          if (beforeLayer) {
            const beforeID = `layer-${beforeLayer.id}`
            map.moveLayer(ID, beforeID)
          } else {
            map.moveLayer(ID)
          }          
        }
      }
    }
    
    const toggleLayer = (layer: Layer) => {
      if (map) {
        const ID = `layer-${layer.id}`
        if (hasSource(map, ID)) {
          const visibility = map.getLayoutProperty(ID, 'visibility')
          if (visibility === 'visible' || visibility === undefined) {
            map.setLayoutProperty(ID, 'visibility', 'none')
          } else {
            map.setLayoutProperty(ID, 'visibility', 'visible')
          }
        }
      }
    }

    useEffect(() => {
        setItems(initialItems);
    } , [initialItems]);

    // Set up sensors for dragging
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    // Handle the end of a drag event
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (over && active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          if (oldIndex > newIndex) {
            // move up
            if (newIndex === 0) {
              // set to top
              doMoveLayer(items[oldIndex]);
            } else {
              doMoveLayer(items[oldIndex], items[newIndex]);
            }            
          } else {
            // move down
            if (oldIndex === 0) {
              // set to top
              doMoveLayer(items[newIndex]);
            } else {
              doMoveLayer(items[newIndex], items[oldIndex]);
            }            
          }

          return arrayMove(items, oldIndex, newIndex);
        });
      }
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Card borderRadius="xl" pt={4} pb={4} pl={10} pr={10} bg={"white"} boxShadow="md">
          <CardBody>
            <Heading size="md" mb={4} mt={4}>
                <Button onClick={handleToggle} mb={4} fontSize="1rem" fontWeight={600} color='var(--chakra-colors-green-600)'
                    leftIcon={ !show ? <ChevronRightIcon /> : <ChevronLeftIcon /> }
                >
                    Legends
                </Button>
                
            </Heading>
            <Collapse in={show} animateOpacity>
                <ScrollableContainer>
                    <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                      <VStack spacing={1} align="stretch">
                          {items.map((item) => (
                              <Box
                                  key={item.id}
                                  p={3}
                              >
                                  <LegendItem item={item} onChecked={(checked: boolean) => toggleLayer(item)} />
                              </Box>
                          ))}
                      </VStack>
                    </SortableContext>
                </ScrollableContainer>
            </Collapse>
          </CardBody>
        </Card>
      </DndContext>
      
    );
};

export default ScrollableListCard;
