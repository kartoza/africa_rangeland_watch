import React from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, VStack,
  useBreakpointValue,
  useToast,
 } from "@chakra-ui/react";

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldPassword: string, newPassword: string) => void;
};

type ModalPosition = "absolute" | "fixed";

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [repeatNewPassword, setRepeatNewPassword] = React.useState("");
  const toast = useToast();

  const handleSubmit = () => {
    if (newPassword !== repeatNewPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please ensure the new and repeat passwords are the same',
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
        containerStyle: {
          color: "white",
        },
      });
      return;
    }

    onSubmit(oldPassword, newPassword);
    setOldPassword("");
    setNewPassword("");
    setRepeatNewPassword("");
    onClose();
  };

  const modalPosition = useBreakpointValue<ModalPosition>({
    base: "absolute",
    md: "fixed",
  });
  const modalTop = useBreakpointValue({ base: "20%", md: "7%" });
  const modalRight = useBreakpointValue({ base: "5%", md: "35%" });
  const modalTransform = useBreakpointValue({
    base: "translate(-50%, -50%)",
    md: "none",
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        bg="white"
        position={modalPosition}
        top={modalTop}
        right={modalRight}
        transform={modalTransform}
      >
        <ModalHeader>Change Password</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <Input
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              placeholder="Repeat New Password"
              type="password"
              value={repeatNewPassword}
              onChange={(e) => setRepeatNewPassword(e.target.value)}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            backgroundColor="dark_green.800"
            _hover={{ backgroundColor: "light_green.400" }}
            fontWeight={700}
            w="50%"
            color="white.a700"
            borderRadius="4px"
            mr={3}
            onClick={handleSubmit}
          >
            Update
          </Button>
          <Button 
            variant="ghost"
            borderRadius="4px"
            onClick={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChangePasswordModal;
