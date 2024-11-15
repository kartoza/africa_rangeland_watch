import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import { Box } from "@chakra-ui/react";
import { LeftSide } from "../../components/Map/LeftSide";
import { MapLibre } from "../../components/Map/MapLibre";
import TopSide from "../../components/Map/TopSide";
import { SelectOption } from "../../components/Map/DataTypes";
import { Landscapes } from "../../components/Map/fixtures/analysis";

/** Map page **/
export default function MapPage() {
  const leftSideRef = useRef(null);
  const mapLibreRef = useRef(null);

  // Landscapes
  const [landscapes, setLandscapes] = useState<Array<SelectOption> | null>(null);

  // TODO:
  //  Fetch the data here
  useEffect(() => {
    setLandscapes(Landscapes)
  }, []);

  return (
    <>
      <Helmet>
        <title>Map | Africa Rangeland Watch | Sustainable Management</title>
        <meta
          name="description"
          content="Explore the Africa Rangeland Watch to understand and monitor the impact of sustainable rangeland management. Access maps, dashboards, and more."/>
      </Helmet>
      <Box
        h='100vh'
        w="100vw"
        display='flex'
        flexDirection='column'
      >
        {/* Header */}
        <Header/>
        <Box flexGrow={1} display='flex' minHeight={0}>
          <LeftSide
            ref={leftSideRef}
            onLayerChecked={layer => {
              mapLibreRef?.current.renderLayer(layer)
            }}
            onLayerUnchecked={layer => {
              mapLibreRef?.current.removeLayer(layer)
            }}
            landscapes={landscapes}
          />
          <Box
            flexGrow={1}
            display='flex'
            flexDirection='column'
          >
            <TopSide
              toggleClicked={() => {
                leftSideRef?.current.toggle()
              }}
            />
            <MapLibre ref={mapLibreRef}/>
          </Box>
        </Box>
      </Box>
    </>
  );
}
