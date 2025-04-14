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
import {
  doAnalysis, REFERENCE_LAYER_DIFF_ID, resetAnalysisResult,
  setAnalysis, setAnalysisCustomGeom,
  fetchAnalysisStatus, setMaxWaitAnalysisReached, toggleAnalysisLandscapeCommunity
} from "../../../../store/analysisSlice";
import { AnalysisCustomGeometrySelector } from "./AnalysisCustomGeometrySelector";
import AnalysisUserDefinedLayerSelector from "./AnalysisUserDefinedLayerSelector";
import AnalysisSpatialYearFilter from "./AnalysisSpatialYearFilter";
import BaselineDateRangeSelector from './BaselineDateRangeSelector';
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
  const setData = (data: AnalysisData) => {
    dispatch(setAnalysis(data))
  }
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
  const data = analysis.analysisData;
  const analysisTaskId = useSelector((state: RootState) => state.analysis.analysisTaskId);
  const analysisTaskStatus = useSelector((state: RootState) => state.analysis.analysisTaskStatus);
  const analysisTaskStartTime = useSelector((state: RootState) => state.analysis.analysisTaskStartTime);

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
        geometrySelectorRef?.current?.drawLayer(session.analysisState.reference_layer, session.analysisState.reference_layer_id);
        // trigger relative layer diff
        dispatch(doAnalysis({
          ...session.analysisState,
          locations: null
        }))
      }
      // pop stored state
      clearAnalysisState()
    }
    if(!loadingSession && session?.lastPage !== '/'){
      saveSession('/map', { activity: "Visited Analysis Page"});
    }
  }, [loadingSession, data]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (analysisTaskId && (analysisTaskStatus === 'PENDING' || analysisTaskStatus === 'RUNNING')) {
      interval = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedTime = currentTime - analysisTaskStartTime;
        if (elapsedTime > mapConfig.max_wait_analysis_run_time) {
          clearInterval(interval);
          dispatch(setMaxWaitAnalysisReached());
        } else {
          dispatch(fetchAnalysisStatus({taskId: analysisTaskId}));
        }
      }, 1000);
    }

    if (analysisTaskStatus === 'COMPLETED' || analysisTaskStatus === 'FAILED') {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analysisTaskId, analysisTaskStatus, analysisTaskStartTime])

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
        quarter: data.temporalResolution == 'Quarterly' ? data.comparisonPeriod?.quarter : data.analysisType == 'Temporal' ? [] : null,
        month: data.temporalResolution == 'Monthly' ? data.comparisonPeriod?.month : data.analysisType == 'Temporal' ? [] : null
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
      } else if (data.temporalResolution === TemporalResolution.MONTHLY && data.period?.year 
        && data.period?.month && data.comparisonPeriod?.year && data.comparisonPeriod?.month) {
          setMapInteraction(MapAnalysisInteraction.LANDSCAPE_SELECTOR)
      } else {
        setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
      }
      saveSession('/map', { activity: "Visited Analysis Page"}, data);
    } else if (data.landscape && data.analysisType === Types.SPATIAL) {
      if (mapInteraction === MapAnalysisInteraction.NO_INTERACTION && data.reference_layer && data.variable && (data.locations === null || data.locations.length === 0)) {
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
    } else if (data.temporalResolution === TemporalResolution.MONTHLY && data.period?.year 
      && data.period?.month && data.comparisonPeriod?.year && data.comparisonPeriod?.month) {
      dataError = false
    }
  } else if (
    data.landscape && data.analysisType === Types.SPATIAL && data.variable && data.reference_layer
  ) {
    dataError = false
  }
  let disableSubmit = !!dataError;
  if (!data.locations && !data.custom_geom) {
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
          hasUserDefinedLayer={layers.some(layer => layer.group === 'user-defined')}
        />
        <AnalysisLandscapeGeometrySelector
          landscape={landscapes.find(landscape => landscape.name === data.landscape)}
          enableSelection={mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR && data.landscape !== 'user-defined'}
          featureIds={data.locations?.map((location) => location.communityFeatureId)}
          onSelected={(value) => {
            // dispatch(setAnalysisLandscapeCommunity(value))
            dispatch(toggleAnalysisLandscapeCommunity(value))
          }
          }
        />
        <AnalysisCustomGeometrySelector
          ref={geometrySelectorRef}
          isDrawing={mapInteraction === MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING}
          onSelected={(geometry, area, selected_id) => {
            if (area > mapConfig.spatial_reference_layer_max_area) {
              console.warn('Area is bigger than configuration', area)
              // reset the geom selector
              setGeomError(true)
              setMapInteraction(MapAnalysisInteraction.CUSTOM_GEOMETRY_DRAWING)
            } else if (geometry !== null) {
              setGeomError(false)
              dispatch(setAnalysisCustomGeom({
                  reference_layer: geometry,
                  reference_layer_id: selected_id
              }))
            }
          }}
        />
        { data.landscape === 'user-defined' &&
          <AnalysisUserDefinedLayerSelector layers={layers}
            enableSelection={mapInteraction === MapAnalysisInteraction.LANDSCAPE_SELECTOR && data.landscape === 'user-defined'}
            onSelected={(geometry, latitude, longitude, userDefinedFeatureName, userDefinedFeatureId) => {
              setData({
                ...data,
                locations: null,
                custom_geom: geometry,
                userDefinedFeatureId: userDefinedFeatureId,
                userDefinedFeatureName: userDefinedFeatureName
              })
            }}
            featureId={data.userDefinedFeatureId}
          />
        }

        {/* 2) Analysis type */}
        {
          data.landscape &&
          <AnalysisTypeSelector
            data={data}
            onSelected={(value) => setData({
              ...data,
              analysisType: value,
              baselineStartDate: null,
              baselineEndDate: null,
            })}
          />
        }
        {/* (Optional) Baseline Date Range selector */}
        {
          data.landscape && data.analysisType === Types.BASELINE && (
            <Box mb={4}>
              <BaselineDateRangeSelector startDate={data.baselineStartDate} endDate={data.baselineEndDate}
                onChange={(name, value) => {
                  if (name === 'startDate') {
                    setData({
                      ...data,
                      baselineStartDate: value
                    })
                  } else {
                    setData({
                      ...data,
                      baselineEndDate: value
                    })
                  }
                }}
              />
            </Box>
          )
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
        {/* 4) Select year range filter for spatial*/}
        {
          data.analysisType === Types.SPATIAL && data.variable &&
          <AnalysisSpatialYearFilter
            initialStartYear={data.spatialStartYear}
            initialEndYear={data.spatialEndYear}
            onYearChange={(startYear, endYear) => {
              // set spatial year filter and reset results
              setData({
                ...data,
                locations: null,
                custom_geom: null,
                userDefinedFeatureId: null,
                userDefinedFeatureName: null,
                spatialStartYear: startYear,
                spatialEndYear: endYear
              })
              dispatch(resetAnalysisResult())
              setMapInteraction(MapAnalysisInteraction.NO_INTERACTION)
            }}
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
                    reference_layer_id: null,
                    locations: null,
                    custom_geom: null,
                    userDefinedFeatureId: null,
                    userDefinedFeatureName: null
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
          data.analysisType === Types.SPATIAL && data.variable && data.reference_layer && loading && (data.locations === null || data.locations.length === 0) &&
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
            isMonthly={data.temporalResolution === TemporalResolution.MONTHLY}
            onSelectedYear={(value: number) => setData({
              ...data,
              period: {
                year: value,
                quarter: data.period?.quarter,
                month: data.period?.month
              }
            })}
            onSelectedQuarter={(value: number) => setData({
              ...data,
              period: {
                year: data.period?.year,
                quarter: value,
                month: null
              }
            })}
            onSelectedMonth={(value: number) => setData({
              ...data,
              period: {
                year: data.period?.year,
                quarter: null,
                month: value
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
            isMonthly={data.temporalResolution === TemporalResolution.MONTHLY}
            multiple={true}
            onSelectedYear={(value: number) => setData({
              ...data,
              comparisonPeriod: {
                year: value,
                quarter: data.comparisonPeriod?.quarter,
                month: data.comparisonPeriod?.month
              }
            })}
            onSelectedQuarter={(value: number) => setData({
              ...data,
              comparisonPeriod: {
                year: data.comparisonPeriod?.year,
                quarter: value,
                month: null
              }
            })}
            onSelectedMonth={(value: number) => setData({
              ...data,
              comparisonPeriod: {
                year: data.comparisonPeriod?.year,
                quarter: null,
                month: value
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
              map {data?.locations ?
                <Box>{data?.locations?.map(location => location.communityName).join(', ')}</Box>:
              data?.userDefinedFeatureName ? 
              <Box>{data?.userDefinedFeatureName}</Box> : null}
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
