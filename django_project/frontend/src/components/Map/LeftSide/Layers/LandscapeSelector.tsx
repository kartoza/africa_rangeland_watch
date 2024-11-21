import React from 'react';
import { Box, Select } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store";
import { Landscape, setSelectedLandscape } from '../../../../store/landscapeSlice';


interface Props {
  landscapes?: Landscape[];
}

/** Layer Checkbox component of map. */
export default function LandscapeSelector({ landscapes }: Props) {
  const dispatch = useDispatch<AppDispatch>();

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
        onChange={evt => dispatch(setSelectedLandscape(parseInt(evt.target.value)))}
      >
        {
          landscapes.map(landscape => {
            return <option
              key={landscape.id}
              value={landscape.id}
            >
              {landscape.name}
            </option>
          })
        }
      </Select>
    </Box>
  )
}

