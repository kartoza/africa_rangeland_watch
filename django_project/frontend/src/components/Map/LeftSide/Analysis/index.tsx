import React, { useEffect, useState } from 'react';
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


interface Props {
  landscapes?: Landscape[];
  layers?: Layer[];
}

/** Layer Checkbox component of map. */
export default function Analysis({ landscapes, layers }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<AnalysisData>(
    { analysisType: Types.BASELINE }
  );
  const [communitySelected, setCommunitySelected] = useState<Community | null>(null);
  const { loading } = useSelector((state: RootState) => state.analysis);

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

  if (!landscapes || !layers) {
    return <LeftSideLoading/>
  }

  let dataError = true;
  if (data.landscape && data.analysisType === Types.BASELINE) {
    dataError = false
  } else if (
    data.landscape && data.analysisType === Types.TEMPORAL && data.variable && data.temporalResolution === TemporalResolution.ANNUAL && data.period?.year && data.comparisonPeriod?.year
  ) {
    dataError = false
  } else if (
    data.landscape && data.analysisType === Types.SPATIAL && data.variable
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
          onSelected={(value) => setCommunitySelected(value)}
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
      <Box mt={4} mb={4}>
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

