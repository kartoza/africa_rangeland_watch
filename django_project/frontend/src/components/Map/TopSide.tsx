import React from 'react';
import { Box, Icon, Flex, Spacer, Tooltip } from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { HamburgerIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from "../../store";
import DatasetUploader from '../DatasetUploader';
import { selectIsLoggedIn } from "../../store/authSlice";
import { fetchLayers } from '../../store/layerSlice';

interface Props {
  toggleClicked: () => void;
}

/** Top side component of map. */
export default function TopSide({ toggleClicked }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsLoggedIn);
  const navigate = useNavigate();

  return (
    <Box
      paddingX={4}
      display={"flex"}
      alignItems={'center'}
      height='51px'
      boxSizing='border-box'
    >
      <Flex align="center" height="100%" flexGrow={1}>
        <Box
          as="button"
          onClick={toggleClicked}
          minWidth={4}
          height={6}
          width={6}
          border='1px solid #ddd'
          borderRadius={0}
          marginRight={4}
          _hover={{ backgroundColor: '#eee' }}
        >
          <HamburgerIcon />
        </Box>

        <Spacer />
        
        {/* New Icon for navigating to Uploaded Resources */}
        {isAuthenticated && (
          <Tooltip label="View your uploads" aria-label="View your uploads">
            <Box
              as="span"
              onClick={() => navigate('/uploaded-resources')}
              cursor="pointer"
              marginRight={4}
              _hover={{ color: "blue.500" }}
            >
              <Icon as={ExternalLinkIcon} w={5} h={5} />
            </Box>
          </Tooltip>
        )}

        
        {isAuthenticated && <DatasetUploader onSuccessUpload={() => {
          dispatch(fetchLayers())
        }} />}
      </Flex>
    </Box>
  );
}
