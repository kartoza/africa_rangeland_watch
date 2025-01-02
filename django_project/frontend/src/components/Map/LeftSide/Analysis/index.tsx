import React, { useEffect, useState, useRef } from 'react';
import { Accordion, Box, Button, HStack } from "@chakra-ui/react";
import { Layer } from '../../../../store/layerSlice';
import { Community, Landscape } from '../../../../store/landscapeSlice';
import { AnalysisData } from "../../DataTypes";
import LeftSideLoading from "../Loading";
import AnalysisLandscapeSelector from "./AnalysisLandscapeSelector";
import AnalysisTypeSelector from "./AnalysisTypeSelector";
import { TemporalResolution, Types } from "../../fixtures/analysis";
import AnalysisTemporalResolutionSelector
  from "./AnalysisTemporalResolutionSelector";
import AnalysisVariableSelector from "./AnalysisVariableSelector";
import AnalysisReferencePeriod from "./AnalysisReferencePeriod";
import AnalysisVariableBySpatialSelector
  from "./AnalysisVariableBySpatialSelector";
import AnalysisLandscapeGeometrySelector
  from "./AnalysisLandscapeGeometrySelector";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store";
import { doAnalysis } from "../../../../store/analysisSlice";
import AnalysisCustomGeometrySelector from "./AnalysisCustomGeometrySelector";


interface Props {
  landscapes?: Landscape[];
  layers?: Layer[];
}

enum MapAnalysisInteraction {
  NO_INTERACTION,
  LANDSCAPE_SELECTOR,
  CUSTOM_GEOMETRY_DRAWING
}

/** Layer Checkbox component of map. */
export default function Analysis({ landscapes, layers }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<AnalysisData>(
    { analysisType: Types.BASELINE }
  );
  const [communitySelected, setCommunitySelected] = useState<Community | null>(null);
  const { loading } = useSelector((state: RootState) => state.analysis);
  const [mapInteraction, setMapInteraction] = useState(MapAnalysisInteraction.NO_INTERACTION);
  const [geom, setGeom] = useState(null);

  /** When data changed */
  const triggerAnalysis = () => {
    dispatch(doAnalysis(data))
  }

  useEffect(() => {
    setData({
      ...data,
      community: communitySelected?.id ? '' + communitySelected?.id : null,
      latitude: communitySelected?.latitude ? communitySelected?.latitude : null,
      longitude: communitySelected?.longitude ? communitySelected?.longitude : null
    })
  }, [communitySelected]);

  useEffect(() => {
    if (data.landscape && data.analysisType === Types.BASELINE) {
      setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
    } else if (data.landscape && data.analysisType === Types.TEMPORAL) {
      if (data.temporalResolution === TemporalResolution.ANNUAL && data.period?.year && data.comparisonPeriod?.year) {
        setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
      } else if (data.temporalResolution === TemporalResolution.QUARTERLY && data.period?.year 
        && data.period?.quarter && data.comparisonPeriod?.year && data.comparisonPeriod?.quarter) {
          setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
      } else {
        setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
      }
    } else if (data.landscape && data.analysisType === Types.SPATIAL) {
      if (mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR && (geom === null || data.variable === null)) {
        setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
      }
    }
  }, [data])

  if (!landscapes || !layers) {
    return <LeftSideLoading/>
  }

  let dataError = true;
  if (data.landscape && data.analysisType === Types.BASELINE) {
    dataError = false
  } else if (
    data.landscape && data.analysisType === Types.TEMPORAL && data.variable
  ) {
    if (data.temporalResolution === TemporalResolution.ANNUAL && data.period?.year && data.comparisonPeriod?.year) {
      dataError = false
    } else if (data.temporalResolution === TemporalResolution.QUARTERLY && data.period?.year 
      && data.period?.quarter && data.comparisonPeriod?.year && data.comparisonPeriod?.quarter) {
      dataError = false
    }
  } else if (
    data.landscape && data.analysisType === Types.SPATIAL && data.variable && geom
  ) {
    dataError = false
  }
  let disableSubmit = !!dataError;
  if (!data.community) {
    disableSubmit = true
  }
  if (loading) {
    disableSubmit = true;
  }

  return (
    <Box fontSize='13px'>
      <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5]}>
        {/* 1) Select landscape */}
        <AnalysisLandscapeSelector
          data={data}
          landscapes={landscapes}
          onSelected={(value) => setData({
            ...data,
            landscape: value
          })}
        />
        <AnalysisLandscapeGeometrySelector
          landscape={landscapes.find(landscape => landscape.name === data.landscape)}
          enableSelection={mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR}
          onSelected={(value) => setCommunitySelected(value)}
        />
        <AnalysisCustomGeometrySelector
          isDrawing={mapInteraction === MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING}
          onSelected={(geometry) => setGeom(geometry)}
        />

        {/* 2) Analysis type */}
        {
          data.landscape &&
          <AnalysisTypeSelector
            data={data}
            onSelected={(value) => setData({
              ...data,
              analysisType: value
            })}
          />
        }
        {/* 3) Select temporal resolution */}
        {
          data.analysisType === Types.TEMPORAL &&
          <AnalysisTemporalResolutionSelector
            data={data}
            onSelected={(value) => setData({
              ...data,
              temporalResolution: value
            })}
          />
        }
        {/* 3) Select variable for spatial*/}
        {
          data.analysisType === Types.SPATIAL &&
          <AnalysisVariableBySpatialSelector
            data={data}
            onSelected={(value) => setData({
              ...data,
              variable: value
            })}
          />
        }
        {/* Draw buttons for spatial */}
        {
          data.analysisType === Types.SPATIAL && data.variable &&
          <Box mb={4} color={'red'}>
            Draw a reference area
          </Box>
        }
        {
          data.analysisType === Types.SPATIAL && data.variable && mapInteraction !== MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING && (
            <HStack
              wrap="wrap" gap={8} alignItems='center' justifyContent='center'>
              <Button
                size="xs"
                borderRadius={4}
                paddingX={4}
                bg='dark_green.800'
                color="white"
                _hover={{ opacity: 0.8 }}
                onClick={() => {
                  setMapInteraction(MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING)
                }}
                minWidth={120}
              >
                Draw
              </Button>
            </HStack>       
          )
        }
        {
          data.analysisType === Types.SPATIAL && data.variable && mapInteraction === MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING && (
            <HStack
              wrap="wrap" gap={8} alignItems='center' justifyContent='center'>
              <Button
                size="xs"
                borderRadius={4}
                paddingX={4}
                borderColor='dark_green.800'
                color="dark_green.800"
                _hover={{ bg: "dark_green.800", color: "white" }}
                variant="outline"
                onClick={() => {
                  setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
                }}
                minWidth={120}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                borderRadius={4}
                paddingX={4}
                bg='dark_green.800'
                color="white"
                _hover={{ opacity: 0.8 }}
                onClick={() => {
                  setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
                }}
                minWidth={120}
              >
                Finish Drawing
              </Button>
            </HStack>
          )
        }
        {/* 4) Select variable for temporal */}
        {
          data.temporalResolution && data.analysisType === Types.TEMPORAL &&
          <AnalysisVariableSelector
            data={data}
            layers={layers}
            onSelected={(value) => setData({
              ...data,
              variable: value
            })}
          />
        }
        {/* 5) Select temporal resolution */}
        {
          data.variable && data.analysisType === Types.TEMPORAL &&
          <AnalysisReferencePeriod
            title='5) Select reference period'
            value={data.period}
            isQuarter={data.temporalResolution === TemporalResolution.QUARTERLY}
            onSelectedYear={(value: number) => setData({
              ...data,
              period: {
                year: value,
                quarter: data.period?.quarter
              }
            })}
            onSelectedQuarter={(value: number) => setData({
              ...data,
              period: {
                year: data.period?.year,
                quarter: value
              }
            })}
          />
        }
        {/* 6) Select comparison period */}
        {
          data.period?.year && data.analysisType === Types.TEMPORAL &&
          <AnalysisReferencePeriod
            title='6) Select comparison period'
            value={data.comparisonPeriod}
            isQuarter={data.temporalResolution === TemporalResolution.QUARTERLY}
            onSelectedYear={(value: number) => setData({
              ...data,
              comparisonPeriod: {
                year: value,
                quarter: data.comparisonPeriod?.quarter
              }
            })}
            onSelectedQuarter={(value: number) => setData({
              ...data,
              comparisonPeriod: {
                year: data.comparisonPeriod?.year,
                quarter: value
              }
            })}
          />
        }
      </Accordion>
      <Box mt={4} mb={4} marginTop={10}>
        {
          !dataError ?
            <Box mb={4} color={'red'}>
              Click polygons on the
              map {communitySelected ?
              <Box>{communitySelected.name}</Box> : null}
            </Box> :
            null
        }
        <HStack
          wrap="wrap" gap={8} alignItems='center' justifyContent='center'>
          <Button
            size="xs"
            borderRadius={4}
            paddingX={4}
            borderColor='dark_green.800'
            color="dark_green.800"
            _hover={{ bg: "dark_green.800", color: "white" }}
            variant="outline"
            disabled={loading}
            onClick={() => {
              setData({ analysisType: Types.BASELINE });
              setCommunitySelected(null);
              setMapInteraction(MapAnalysisInteraction.NO_INTERACTION);
            }}
          >
            Reset Form
          </Button>
          <Button
            size="xs"
            borderRadius={4}
            paddingX={4}
            bg='dark_green.800'
            color="white"
            _hover={{ opacity: 0.8 }}
            disabled={disableSubmit}
            onClick={triggerAnalysis}
          >
            Run Analysis
          </Button>
        </HStack>
      </Box>
    </Box>
  )
}

