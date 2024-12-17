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
  const { session, loadSession, loading, hasPromptBeenOpened, setHasPromptBeenOpened } = useSession();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Load session only once when component is mounted
  useEffect(() => {
    if (isAuthenticated && !session && loading) {
      loadSession();
    }
  }, [isAuthenticated, session, loading, loadSession]);

  // Open modal when session is loaded and authenticated, and loading is false
  useEffect(() => {
    if (isAuthenticated && !hasPromptBeenOpened && session && !loading) {
      setIsOpen(true); // Open the modal
      setHasPromptBeenOpened(true); // Mark prompt as opened
    }
  }, [isAuthenticated, session, loading, hasPromptBeenOpened, setHasPromptBeenOpened]);

  // Close modal if session is not found or loading is false
  useEffect(() => {
    if (!loading && !session && isOpen) {
      console.log('Session not found, closing modal');
      setIsOpen(false); // Close modal if session is not found
    }
  }, [loading, session, isOpen]);



  const handleResume = () => {
    console.log('Resuming session', session?.lastPage);
    if (session?.lastPage && session?.lastPage !== '/') {
      navigate(session.lastPage)
    }
    setIsOpen(false);
    setIsOpen(false);
  };

  const handleNewSession = () => {
    console.log('Starting a new session');
    navigate('/');
    setIsOpen(false);
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
