import React, {useState} from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  chakra,
  Collapse,
  Button,
  HStack,
  useCheckbox,
  UseCheckboxProps,
  Flex
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon, DragHandleIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

import { Layer } from '../../../store/layerSlice';


type ScrollableListCardProps = {
  items: Layer[];
};

const ScrollableContainer = chakra(Box, {
  baseStyle: {
    maxHeight: "60vh",
    overflowY: "auto",
    pr: 2,
  },
});


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
  


const LegendItem = ({ item }: { item: Layer }) => {
    const metadata = item.metadata;
    let colors: string[] = []
    if (metadata?.colors) {
        const step = 100 / (metadata.colors.length - 1);
        colors = metadata.colors.map((color, int) => {
        return `${color} ${step * int}%`
        })
    }
    return (
        <div className="Card">
        <CustomEyeCheckbox defaultChecked={true} label={metadata?.unit ? `${item.name} (${metadata?.unit})` : `${item.name}`} />
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
        </div>
    )
}


const ScrollableListCard: React.FC<ScrollableListCardProps> = ({ items }) => {
    const [show, setShow] = useState(true)
    const handleToggle = () => setShow(!show)
  
  return (
    <Card borderRadius="xl" pt={4} pb={4} pl={10} pr={10} bg={"white"} boxShadow="md">
      <CardBody>
        <Heading size="md" mb={4}>
            <Button onClick={handleToggle} mb={4} fontSize="1rem" fontWeight={600} color='var(--chakra-colors-green-600)'
                leftIcon={ !show ? <ChevronRightIcon /> : <ChevronLeftIcon /> }
            >
                Legends
            </Button>
            
        </Heading>
        <Collapse in={show} animateOpacity>
            <ScrollableContainer>
                <VStack spacing={3} align="stretch">
                    {items.map((item) => (
                        <Box
                            key={item.id}
                            p={3}
                            borderWidth="1px"
                        >
                            <HStack spacing={4}>
                                <Box>
                                    <DragHandleIcon color="gray.500" />
                                </Box>
                                <Box flex={1}>
                                    <LegendItem item={item} />
                                </Box>
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            </ScrollableContainer>
        </Collapse>
      </CardBody>
    </Card>
  );
};

export default ScrollableListCard;
