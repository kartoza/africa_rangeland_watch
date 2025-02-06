import React, { useEffect, useState, useRef } from 'react';
import { Accordion, Box, Button, HStack, Spinner, Text, useToast } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
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
import { AppDispatch, RootState } from "../../../../store";
import { doAnalysis, REFERENCE_LAYER_DIFF_ID, resetAnalysisResult } from "../../../../store/analysisSlice";
import { AnalysisCustomGeometrySelector } from "./AnalysisCustomGeometrySelector";
import { LayerCheckboxProps } from '../Layers';
import { useSession } from '../../../../sessionProvider';
import { saveAnalysis } from '../../../../store/userAnalysisSlice';


interface Props extends LayerCheckboxProps {
  landscapes?: Landscape[];
  layers?: Layer[];
}

enum MapAnalysisInteraction {
  NO_INTERACTION,
  LANDSCAPE_SELECTOR,
  CUSTOM_GEOMETRY_DRAWING
}

function checkPropertyEqualsXAndOthersNull<T>(
  obj: T,
  keyToCheck: keyof T,
  valueToMatch: unknown
): boolean {
  return Object.entries(obj).every(([key, value]) => {
    if (key === keyToCheck) {
      return value === valueToMatch;
    }
    return value === null || value === undefined;
  });
}


/** Layer Checkbox component of map. */
export default function Analysis({ landscapes, layers, onLayerChecked, onLayerUnchecked }: Props) {
  const { session, saveSession, loadingSession, loadSession, clearAnalysisState } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<AnalysisData>(
    { analysisType: Types.BASELINE }
  );
  const { loading, referenceLayerDiff } = useSelector((state: RootState) => state.analysis);
  const { mapConfig } = useSelector((state: RootState) => state.mapConfig);
  const [mapInteraction, setMapInteraction] = useState(MapAnalysisInteraction.NO_INTERACTION);
  const [isGeomError, setGeomError] = useState(false);
  const geometrySelectorRef = useRef(null);
  const toast = useToast();
  const saveAnalysisFlag = useSelector(
    (state: RootState) => state.analysis.saveAnalysisFlag
  );
  const savedAnalysisFlag = useSelector(
    (state: RootState) => state.userAnalysis.savedAnalysisFlag
  );
   const analysis = useSelector((state: RootState) => state.analysis);


  const handleSaveAnalysis = () => {
    if (data && analysis) {
      dispatch(saveAnalysis(analysis.analysis))
    }
  };

  useEffect(() => {
    if(savedAnalysisFlag){
      toast({
        title: "Analysis results saved!",
        description: "You will find your results on the analysis results page in the profile area.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          backgroundColor: "#00634b",
          color: "white",
        },
      });
    }
  }, [savedAnalysisFlag]);

  useEffect(() => {
    // load saved session once
    loadSession()
  }, [])

  useEffect(() => {
    if (session && session?.analysisState && checkPropertyEqualsXAndOthersNull(data, 'analysisType', Types.BASELINE)) {
      setData(session.analysisState)
      if (session.analysisState.analysisType === Types.SPATIAL && session.analysisState.reference_layer) {
        // draw reference layer for spatial analysis
        geometrySelectorRef?.current?.drawLayer({
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'geometry': session.analysisState.reference_layer
          }]
        });
        // trigger relative layer diff
        dispatch(doAnalysis({
          ...session.analysisState,
          latitude: null,
          longitude: null
        }))
      }
      // pop stored state
      clearAnalysisState()
    }
    if(!loadingSession && session?.lastPage !== '/'){
      saveSession('/map', { activity: "Visited Analysis Page"});
    }
  }, [loadingSession, data]);
  

  /** When data changed */
  const triggerAnalysis = () => {
    dispatch(resetAnalysisResult(data.analysisType))
    if (data.analysisType !== 'Spatial') {
      // remove polygon for reference layer diff
      geometrySelectorRef?.current?.removeLayer();
    }
    const newData = {
      ...data,
      comparisonPeriod: {
        year: data.comparisonPeriod?.year,
        quarter: data.temporalResolution == 'Quarterly' ? data.comparisonPeriod?.quarter : []
      },
    }
    dispatch(doAnalysis(newData))
  }

  useEffect(() => {
    if (data.landscape && data.analysisType === Types.BASELINE) {
      setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
      saveSession('/map', { activity: "Visited Analysis Page"}, data);
    } else if (data.landscape && data.analysisType === Types.TEMPORAL) {
      if (data.temporalResolution === TemporalResolution.ANNUAL && data.period?.year && data.comparisonPeriod?.year) {
        setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR);
      } else if (data.temporalResolution === TemporalResolution.QUARTERLY && data.period?.year 
        && data.period?.quarter && data.comparisonPeriod?.year && data.comparisonPeriod?.quarter) {
          setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
      } else {
        setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
      }
      saveSession('/map', { activity: "Visited Analysis Page"}, data);
    } else if (data.landscape && data.analysisType === Types.SPATIAL) {
      if (mapInteraction === MapAnalysisInteraction.NO_INTERACTION && data.reference_layer && data.variable && data.latitude === null && data.longitude === null) {
        // trigger relative layer diff
        dispatch(doAnalysis(data))
      } else if (mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR && !data.reference_layer) {
        setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
      }
      saveSession('/map', { activity: "Visited Analysis Page"}, data);
    }
        
  }, [mapInteraction, data])

  useEffect(() => {
    if (referenceLayerDiff !== null) {
      onLayerChecked(referenceLayerDiff)
      setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
    } else {
      const _layer: Layer = {
        'id': REFERENCE_LAYER_DIFF_ID,
        'uuid': REFERENCE_LAYER_DIFF_ID,
        'name': REFERENCE_LAYER_DIFF_ID,
        'group': 'spatial_analysis',
        'type': 'raster',
        'url': null
      }
      onLayerUnchecked(_layer, true)
    }
  }, [referenceLayerDiff])

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
    data.landscape && data.analysisType === Types.SPATIAL && data.variable && data.reference_layer
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
          featureId={data.communityFeatureId}
          enableSelection={mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR}
          onSelected={(value) => {
            setData({
              ...data,
              community: value?.id ? '' + value?.id : null,
              latitude: value?.latitude ? value?.latitude : null,
              longitude: value?.longitude ? value?.longitude : null,
              communityName: value?.name ? value?.name : null,
              communityFeatureId: value?.featureId ? value?.featureId : null
            })
          }
          }
        />
        <AnalysisCustomGeometrySelector
          ref={geometrySelectorRef}
          isDrawing={mapInteraction === MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING}
          onSelected={(geometry, area) => {
            if (area > mapConfig.spatial_reference_layer_max_area) {
              console.warn('Area is bigger than configuration', area)
              // reset the geom selector
              setGeomError(true)
              setMapInteraction(MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING)
            } else if (geometry !== null) {
              setGeomError(false)
              setData({
                ...data,
                reference_layer: geometry['features'][0]['geometry']
              })
            }
          }}
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
          <Box mb={4} color={'green'}>
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
                  setData({
                    ...data,
                    reference_layer: null,
                    community: null,
                    latitude: null,
                    longitude: null,
                    communityName: null,
                    communityFeatureId: null
                  })
                  setMapInteraction(MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING)
                  dispatch(resetAnalysisResult())
                }}
                disabled={loading}
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
                  setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
                }}
                minWidth={120}
              >
                Finish Drawing
              </Button>
              { isGeomError && 
                <Box mb={4} color={'red'}>
                  Area too big - smaller please
                </Box>
              }
            </HStack>
          )
        }
        {
          data.analysisType === Types.SPATIAL && data.variable && data.reference_layer && loading && data.latitude === null && data.longitude === null &&
          <HStack mt={4} color={'red'}
            wrap="wrap" gap={2} alignItems='center' justifyContent='center'>
            <Spinner size="xs"/>
            <Text color={'green'}>Generating % difference in {data.variable}</Text>
          </HStack>
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
            multiple={true}
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
            <Box mb={4} color={'green'}>
              Click polygons on the
              map {data?.communityName ?
              <Box>{data?.communityName}</Box> : null}
            </Box> :
            null
        }
        <HStack wrap="wrap" gap={8} alignItems="center" justifyContent="center">
        <Button
          size="xs"
          borderRadius={4}
          paddingX={4}
          borderColor="dark_green.800"
          color="dark_green.800"
          _hover={{ bg: "dark_green.800", color: "white" }}
          variant="outline"
          disabled={loading}
          onClick={() => {
            setData({ analysisType: Types.BASELINE });
            setMapInteraction(MapAnalysisInteraction.NO_INTERACTION);
            geometrySelectorRef?.current?.removeLayer();
            dispatch(resetAnalysisResult());
            saveSession('/map', { activity: "Visited Analysis Page"}, { analysisType: Types.BASELINE });
          }}
        >
          Reset Form
        </Button>
        <Button
          size="xs"
          borderRadius={4}
          paddingX={4}
          bg="dark_green.800"
          color="white"
          _hover={{ opacity: 0.8 }}
          disabled={disableSubmit}
          onClick={triggerAnalysis}
        >
          Run Analysis
        </Button>
        <Button
          size="xs"
          borderRadius={4}
          paddingX={4}
          bg="dark_green.800"
          color="white"
          _hover={{ opacity: 0.8 }}
          disabled={!saveAnalysisFlag}
          onClick={handleSaveAnalysis}
        >
          Save Results
        </Button>
      </HStack>

      </Box>
    </Box>
  )
}
