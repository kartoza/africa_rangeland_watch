import React, { useRef } from "react";
import { 
  AlertDialog, 
  AlertDialogOverlay, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogBody, 
  AlertDialogFooter, 
  Button 
} from "@chakra-ui/react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone."
}) => {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay bg="rgba(0, 0, 0, 0.4)">
        <AlertDialogContent bg="white">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>
            {description}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button 
              backgroundColor="gray.400"
              _hover={{ backgroundColor: "gray.500" }}
              color="white"
              w="auto"
              borderRadius="5px"
              ref={cancelRef} 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red"
              variant="solid"
              backgroundColor="red.500"
              _hover={{ backgroundColor: "red.600" }}
              color="white"
              width="auto"
              borderRadius="5px"
              onClick={onConfirm} 
              ml={3}
            >
              Yes, Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmDeleteDialog;
