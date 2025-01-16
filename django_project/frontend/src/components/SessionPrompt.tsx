import React, { useEffect, useState } from 'react';
import { useSession } from '../sessionProvider';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

type ModalPosition = "absolute" | "fixed";

const SessionPrompt: React.FC = () => {
  const { session, saveSession, loadSession, loadingSession, hasPromptBeenOpened, setHasPromptBeenOpened } = useSession();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Load session only once when component is mounted
  useEffect(() => {
    if (isAuthenticated && !session && loadingSession) {
      loadSession();
    }
  }, [isAuthenticated, session, loadingSession, loadSession]);

  // Open modal when session is loaded and authenticated, and loading is false
  useEffect(() => {
    if (isAuthenticated && !hasPromptBeenOpened && session && !loadingSession) {
      setIsOpen(true); // Open the modal
      setHasPromptBeenOpened(true);
    }
  }, [isAuthenticated, loadingSession, hasPromptBeenOpened]);

  // Close modal if session is not found or loading is false
  useEffect(() => {
    if (!loadingSession && !session && isOpen) {
      setIsOpen(false);
    }
  }, [loadingSession, session, isOpen]);

  const handleResume = () => {
    if (session?.lastPage && session?.lastPage !== '/') {
      navigate(session.lastPage);
    }
    setIsOpen(false);
  };

  const handleNewSession = () => {
    setIsOpen(false);
    setHasPromptBeenOpened(true);
    saveSession(location.pathname, { activity: "Reset session"}, {});
    if(location.pathname != '/')
      navigate('/');
  };

  const modalPosition = useBreakpointValue<ModalPosition>({
    base: "absolute",
    md: "fixed",
  });
  const modalTop = useBreakpointValue({ base: "20%", md: "25%" });
  const modalRight = useBreakpointValue({ base: "5%", md: "38%" });
  const modalTransform = useBreakpointValue({
    base: "translate(-50%, -50%)",
    md: "none",
  });

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalOverlay />
      <ModalContent
        bg="white"
        position={modalPosition}
        top={modalTop}
        right={modalRight}
        transform={modalTransform}
      >
        <ModalHeader>Resume Your Session</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <p>Would you like to resume your last session?</p>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            backgroundColor="dark_orange.800"
            _hover={{ backgroundColor: "light_orange.400" }}
            fontWeight={700}
            color="white.a700"
            w="50%"
            borderRadius="4px"
            mr={3}
            onClick={handleResume}
          >
            Resume
          </Button>
          <Button
            backgroundColor="dark_green.800"
            _hover={{ backgroundColor: "light_green.400" }}
            fontWeight={700}
            color="white.a700"
            borderRadius="4px"
            onClick={handleNewSession}
          >
            Start New
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SessionPrompt;