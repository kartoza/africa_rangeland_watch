import React from 'react';
import { Box, Checkbox } from "@chakra-ui/react";
import { Layer } from "../DataTypes";


interface Props {
  layer: Layer;
  onToggle: (checked: boolean) => void;
}

/** Layer Checkbox component of map. */
export default function LayerCheckbox({ layer, onToggle }: Props) {
  return (
    <Box paddingY={1}>
      <Checkbox
        _checked={{
          "& .chakra-checkbox__control": {
            background: "white",
            borderColor: "dark_green.800",
            color: "dark_green.800"
          },
          "& .chakra-checkbox__control:hover": {
            color: "white",
            background: "dark_green.800",
            borderColor: "dark_green.800",
          }
        }}
        sx={{
          "& .chakra-checkbox__label": {
            fontSize: "13px !important",
          }
        }}
        onChange={(evt) => {
          onToggle(evt.target.checked)
        }}
      >
        {layer.name}
      </Checkbox>
    </Box>
  )
}

