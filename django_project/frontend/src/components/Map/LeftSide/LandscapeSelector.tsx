import React, { useEffect, useState } from 'react';
import { SelectOption } from "../DataTypes";
import { Box, Select } from "@chakra-ui/react";


interface Props {
  landscapes?: SelectOption[];
}

/** Layer Checkbox component of map. */
export default function LandscapeSelector({ landscapes }: Props) {
  const [landscape, setLandscape] = useState<string | null>(null);

  /** Landscape changed */
  useEffect(() => {
    if (landscape) {
      // TODO:
      //  Handle the process when landscape changed
    }
  }, [landscape]);

  if (!landscapes) {
    return null
  }

  return (
    <Box>
      <b>Zoom to landscape</b>
      <Select
        fontSize='13px'
        height='2rem'
        placeholder="Select a value"
        onChange={evt => setLandscape(evt.target.value)}
      >
        {
          landscapes.map(landscape => {
            return <option value={landscape.value}>{landscape.label}</option>
          })
        }
      </Select>
    </Box>
  )
}

