import {
    Modal,
    ModalContent,
    ModalOverlay,
    Button,
    Flex,
    Input,
    Heading,
    Text,
    FormLabel,
    FormControl,
    ModalCloseButton,
    ModalBody,
    useBreakpointValue,
    Textarea,
  } from "@chakra-ui/react";
  import React, { useState } from "react";
  import { useDispatch } from "react-redux";
  import { inviteMember } from "../store/organizationSlice";
import { AppDispatch } from "../store";
  
  interface Props {
    isOpen: boolean;
    onClose: () => void;
    orgKey: string; 
    organizationName: string;
  }
  
  type ModalPosition = "absolute" | "fixed";
  
  export default function InviteMember({ isOpen, onClose, orgKey, organizationName }: Props) {
    const modalPosition = useBreakpointValue<ModalPosition>({
      base: "absolute",
      md: "fixed",
    });
    const modalTop = useBreakpointValue({ base: "20%", md: "7%" });
    const modalRight = useBreakpointValue({ base: "5%", md: "7%" });
    const modalTransform = useBreakpointValue({
      base: "translate(-50%, -50%)",
      md: "none",
    });
  
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    
    const dispatch = useDispatch<AppDispatch>();
  
    const handleInvite = () => {
      if (email && message) {
        dispatch(inviteMember({ orgKey, email, message }));
        onClose();
      }
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered={modalPosition === "absolute"}>
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "90vw", md: "50vw" }}
          bg="white"
          position={modalPosition}
          top={modalTop}
          right={modalRight}
          transform={modalTransform}
          p={5}
        >
          <ModalCloseButton />
          <ModalBody p={0}>
            <Flex flex={1} direction="column" p={4}>
              <Flex gap="12px" bg="whiteAlpha.700" w="100%" flexDirection="column" p="0" borderRadius="5px">
                <Flex gap="14px" flexDirection="column" alignItems="start">
                  <Heading size="lg" color="gray.900" whiteSpace="nowrap">
                    Invite Member to {organizationName}
                  </Heading>
                  <Text color="gray.800" fontSize="16px">
                    Enter the email of the person you want to invite and include a custom message.
                  </Text>
                </Flex>
  
                <Flex mb="6px" flexDirection="column" alignItems="center">
                  <Flex gap="20px" alignSelf="stretch" flexDirection="column">
                    {/* Organization Name (non-editable) */}
                    <FormControl mb="8px" isReadOnly>
                      <FormLabel htmlFor="organizationName" color="black" fontWeight={"bold"}>
                        Organization Name
                      </FormLabel>
                      <Input
                        id="organizationName"
                        value={organizationName}
                        isReadOnly
                        bg="gray.100"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.500"
                      />
                    </FormControl>
  
                    {/* Invitee Email */}
                    <FormControl mb="8px">
                      <FormLabel htmlFor="email" color="black" fontWeight={"bold"}>
                        Invitee Email
                      </FormLabel>
                      <Input
                        id="email"
                        placeholder="Invitee Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.500"
                      />
                    </FormControl>
  
                    {/* Custom Message */}
                    <FormControl mb="8px">
                      <FormLabel htmlFor="message" color="black" fontWeight={"bold"}>
                        Custom Message
                      </FormLabel>
                      <Textarea
                        id="message"
                        placeholder="Custom Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        size="lg"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.500"
                        _focus={{ borderColor: "green.500" }}
                        height="150px"
                        resize="vertical"
                        />
                    </FormControl>
  
                    <Flex justifyContent="flex-end" gap="20px">
                      <Button
                        backgroundColor="darkorange"
                        _hover={{ backgroundColor: "dark_orange.800" }}
                        color="white"
                        w={{ base: "auto", md: "15%" }}
                        borderRadius="5px"
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        backgroundColor="dark_green.800"
                        _hover={{ backgroundColor: "light_green.400" }}
                        color="white"
                        w={{ base: "auto", md: "25%" }}
                        borderRadius="5px"
                        disabled={!email || !message}
                        onClick={handleInvite}
                      >
                        Invite
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
    );
  }
  
