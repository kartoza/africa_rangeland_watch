import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box
} from "@chakra-ui/react";


/** Layers component of map. */
export default function Layers() {
  return (
    <Accordion allowMultiple>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold'>
              Baseline (Average)
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          Layers
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold'>
              Near-real time
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          Average for pas 30 days
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

