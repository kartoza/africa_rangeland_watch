import React, {useState} from 'react';
import { Box, IconButton, Button, Flex, Spacer } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import DatasetUploader from '../DatasetUploader';

interface Props {
  toggleClicked: () => void;
}

/** Top side component of map. */
export default function TopSide({ toggleClicked }: Props) {
  return (
    <Box
      paddingX={4}
      display={"flex"}
      alignItems={'center'}
      height='51px'
      boxSizing='border-box'
    >
      <Flex align="center" height="100%" flexGrow={1}>
        <IconButton
          onClick={toggleClicked}
          minWidth={4}
          height={6}
          width={6}
          border='1px solid #ddd'
          borderRadius={0}
          marginRight={4}
          icon={<HamburgerIcon/>}
          aria-label="Open Sidebar"
          _hover={{
            backgroundColor: '#eee'
          }}
        />
        <Spacer />
        <DatasetUploader />
      </Flex>
    </Box>
  )
}

