/* src/components/Map/LeftSide/Layers/index.tsx */

import React, { useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store";
import { Layer, setSelectedNrtLayer } from "../../../../store/layerSlice";
import { Landscape } from "../../../../store/landscapeSlice";
import { GroupName } from "../../DataTypes";
import LayerCheckbox from "./LayerCheckbox";
import LandscapeSelector from "./LandscapeSelector";
import LeftSideLoading from "../Loading";
import CogDownloadButton from "./LayerDownloadButton";

/* ---------- type aliases (unchanged) ------------------------------------ */
export interface LayerCheckboxProps {
  onLayerChecked: (layer: Layer) => void;
  onLayerUnchecked: (layer: Layer, isRemoveSource?: boolean) => void;
}
export interface Props extends LayerCheckboxProps {
  landscapes?: Landscape[];
  layers?: Layer[];
}

export enum ToastStatus {
  Success = "success",
  Error = "error",
}

/* ---------- component --------------------------------------------------- */
export default function Layers({
  landscapes,
  layers,
  onLayerChecked,
  onLayerUnchecked,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { selected: selectedLandscape } = useSelector(
    (s: RootState) => s.landscape
  );
  const selectedNrt = useSelector((s: RootState) => s.layer.selectedNrt);
  const toast = useToast();

  const [exportTasks, setExportTasks] = useState<Record<string, string>>({});

  /* ---------------- helpers -------------------------------------------- */
  const handleNrtLayerChecked = (layer: Layer) => {
    const copy = { ...layer };
    if (selectedLandscape && selectedLandscape.urls[layer.id] !== undefined) {
      copy.url = selectedLandscape.urls[layer.id];
    }
    dispatch(setSelectedNrtLayer(layer));
    onLayerChecked(copy);
  };

  const showToast = (
    title: string,
    body: string,
    status: ToastStatus
  ) =>
    toast({
      position: "top-right",
      duration: 5000,
      isClosable: true,
      render: () => (
        <Box
          color="white"
          p={3}
          borderRadius="md"
          bg={status === ToastStatus.Success ? "#00634b" : "#c53030"}
          boxShadow="md"
        >
          <strong>{title}</strong>
          <div>{body}</div>
        </Box>
      ),
    });

  const triggerExport = async (layer: Layer) => {
    try {
      const res = await fetch(`/nrt-layer/${layer.id}/export/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken":
            document.cookie.match(/csrftoken=([\w-]+)/)?.[1] || "",
        },
        body: JSON.stringify({ landscape_id: selectedLandscape?.id }),
      });
      if (!res.ok) throw new Error("Export endpoint returned error");

      const { task_id } = await res.json();
      setExportTasks((prev) => ({ ...prev, [layer.id]: task_id }));

      showToast("Export started!", "COG export task has been queued.", ToastStatus.Success);
    } catch (err) {
      showToast(
        "Export failed",
        "Unable to start COG export task.",
        ToastStatus.Error
      );
    }
  };

  /* ---------------- render --------------------------------------------- */
  return (
    <Accordion allowMultiple defaultIndex={[0, 1]}>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
              Baseline (Average)
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel
          pb={4}
          fontSize='13px'
        >
          {
            layers ?
              layers?.filter(
                layer => layer.group === GroupName.BaselineGroup
              ).map(
                layer => <LayerCheckbox
                  key={layer.id}
                  layer={layer}
                  onToggle={(checked) => checked ? onLayerChecked(layer) : onLayerUnchecked(layer)}
                />
              ) :
              <LeftSideLoading/>
          }
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
              EarthRanger
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel
          pb={4}
          fontSize='13px'
        >
          {
            layers ?
              layers?.filter(
                layer => layer.group === GroupName.EarthRangerGroup
              ).map(
                layer => <LayerCheckbox
                  key={layer.id}
                  layer={layer}
                  onToggle={(checked) => checked ? onLayerChecked(layer) : onLayerUnchecked(layer)}
                />
              ) :
              <LeftSideLoading/>
          }
        </AccordionPanel>
      </AccordionItem>

      {/* Near-real time --------------------------------------------------- */}
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight="bold" fontSize="13px">
              Near-real time
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4} fontSize="13px">
          <Box mb={4}>Average for past 30&nbsp;days</Box>
          <Box mb={4}>
            <LandscapeSelector landscapes={landscapes} />
          </Box>

          {layers && selectedLandscape ? (
            layers
              .filter((l) => l.group === GroupName.NearRealtimeGroup)
              .map((layer) => (
                <Box
                  key={layer.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  pl={2}
                >
                  <LayerCheckbox
                    layer={layer}
                    onToggle={(checked) =>
                      checked
                        ? handleNrtLayerChecked(layer)
                        : onLayerUnchecked(layer)
                    }
                  />

                  {selectedNrt?.id === layer.id && (
                    <Box display="flex" gap={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => triggerExport(layer)}
                      >
                        Generate
                      </Button>

                      <CogDownloadButton
                        layerId={layer.id}
                        landscapeId={selectedLandscape.id.toString()}
                        taskId={exportTasks[layer.id]}
                        downloadUrl={selectedLandscape.urls[layer.id]}
                        isSelected
                      />
                    </Box>
                  )}
                </Box>
              ))
          ) : layers ? null : (
            <LeftSideLoading />
          )}
        </AccordionPanel>
      </AccordionItem>

      {/* User-defined ----------------------------------------------------- */}
      {layers?.some((l) => l.group === GroupName.UserDefinedGroup) && (
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="13px">
                User Defined
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} fontSize="13px">
            {layers ? (
              layers
                .filter((l) => l.group === GroupName.UserDefinedGroup)
                .map((layer) => (
                  <LayerCheckbox
                    key={layer.id}
                    layer={layer}
                    onToggle={(checked) =>
                      checked ? onLayerChecked(layer) : onLayerUnchecked(layer)
                    }
                  />
                ))
            ) : (
              <LeftSideLoading />
            )}
          </AccordionPanel>
        </AccordionItem>
      )}
    </Accordion>
  );
}
