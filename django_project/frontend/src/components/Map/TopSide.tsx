import React from 'react';
import { Box, IconButton } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

interface Props {
  toggleClicked: () => void;
}

/** Top side component of map. */
export default function TopSide({ toggleClicked }: Props) {
  return (
    <Box padding={4}>
      <IconButton
        onClick={toggleClicked}
        minWidth={2}
        height={4}
        width={2}
        marginRight={4}
        icon={<HamburgerIcon/>}
        aria-label="Open Sidebar"
      />
    </Box>
  )
}

