import React, { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import { Box } from "@chakra-ui/react";
import { LeftSide } from "../../components/Map/LeftSide";
import { MapLibre } from "../../components/Map/MapLibre";
import TopSide from "../../components/Map/TopSide";
import RightSide from "../../components/Map/RightSide";
import EarthRanger from "../../components/Map/EarthRanger"

/** Map page **/
export default function MapPage() {
  const leftSideRef = useRef(null);
  const mapLibreRef = useRef(null);
  const [showEarthRanger, setShowEarthRanger] = useState(false);

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
        <Box flexGrow={1} display='flex' minHeight={0} position={'relative'}>
          <LeftSide
            ref={leftSideRef}
            onLayerChecked={layer => {
              if ((layer.group as string) === 'earth-ranger') {
                setShowEarthRanger(true);
              } else {
                mapLibreRef?.current.renderLayer(layer);
              }
            }}
            onLayerUnchecked={(layer, isRemoveSource?) => {
              if ((layer.group as string) === 'earth-ranger') {
                setShowEarthRanger(false);
              } else {
                mapLibreRef?.current.removeLayer(layer, isRemoveSource);
              }
            }}
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
            <EarthRanger isVisible={showEarthRanger} />
            <MapLibre ref={mapLibreRef}/>
          </Box>
          <RightSide/>
        </Box>
      </Box>
    </>
  );
}
