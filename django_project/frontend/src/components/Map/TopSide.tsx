import React from 'react';
import { Box, IconButton } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

interface Props {
  toggleClicked: () => void;
}

/** Top side component of map. */
export default function TopSide({ toggleClicked }: Props) {
  return (
    <Box paddingX={4} height='52px' display={"flex"} alignItems={'center'}>
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
    </Box>
  )
}

