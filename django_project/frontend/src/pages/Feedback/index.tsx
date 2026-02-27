import React, { useState, useEffect } from 'react';
import Helmet from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  Link,
} from '@chakra-ui/react';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/SideBar';
import { AppDispatch, RootState } from '../../store';
import { submitFeedback, resetFeedbackState } from '../../store/feedbackSlice';

const Feedback: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading, error, success, message } = useSelector(
    (state: RootState) => state.feedback
  );

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get user's name and email with intelligent fallback
  // Priority: username > "first_name last_name" > email username part
  const userName = user?.username || 
                  `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 
                  user?.email?.split('@')[0] || 
                  '';
  const userEmail = user?.email || '';

  useEffect(() => {
    // Handle success
    if (success) {
      toast({
        title: 'Feedback Submitted',
        description: message || 'Thank you for your feedback!',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          backgroundColor: '#00634b',
          color: 'white',
        },
      });
      
      // Reset state immediately to prevent re-triggering on navigation back
      dispatch(resetFeedbackState());
      
      // Redirect
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
  }, [success, message, toast, navigate, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    setValidationError('');
    
    if (!feedbackMessage.trim()) {
      setValidationError('Please enter your feedback message.');
      return;
    }
    
    if (feedbackMessage.trim().length < 3) {
      setValidationError('Feedback message must be at least 3 characters long.');
      return;
    }
    
    if (feedbackMessage.trim().length > 500) {
      setValidationError('Feedback message cannot exceed 500 characters.');
      return;
    }
    
    // Set submitting flag to keep button disabled through success state
    setSubmitting(true);
    
    // Submit feedback
    dispatch(submitFeedback(feedbackMessage.trim()));
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <Box>
      <Helmet>
        <title>Feedback - Africa Rangeland Watch</title>
      </Helmet>
      <Header />
      <Box bg="white" w="100%" overflow={"hidden"}>
        <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
          <Sidebar display={{ base: "none", md: "flex" }} />
          
          <Box
            flex="1"
            ml={{ base: "35px", md: "0px" }}
            mt={{ base: "15px", md: "20px" }}
            width={{ base: "85%", md: "auto" }}
            overflow={"auto"}
          >
            <Heading size="lg" mb={6} color="black">
              Share Your Feedback
            </Heading>
            
            <Text color="gray.600" mb={6}>
              We value your input! Please share your thoughts, suggestions, or concerns about Africa Rangeland Watch.
            </Text>

            {error && (
              <Alert status="error" borderRadius="md" mb={6}>
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {validationError && (
              <Alert status="warning" borderRadius="md" mb={6}>
                <AlertIcon />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit} bg="gray.50" p={6} borderRadius="md" boxShadow="md" mb={6}>
              <VStack spacing={5} align="stretch">
                <FormControl isRequired isReadOnly>
                  <FormLabel fontWeight="semibold">Your Name</FormLabel>
                  <Input
                    value={userName}
                    isReadOnly
                    bg="gray.100"
                    cursor="not-allowed"
                  />
                </FormControl>

                <FormControl isRequired isReadOnly>
                  <FormLabel fontWeight="semibold">Your Email</FormLabel>
                  <Input
                    type="email"
                    value={userEmail}
                    isReadOnly
                    bg="gray.100"
                    cursor="not-allowed"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Your Feedback</FormLabel>
                  <Textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    rows={8}
                    resize="vertical"
                    isDisabled={loading || submitting}
                    maxLength={500}
                  />
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="sm" color="gray.500">
                      Minimum 3 characters, maximum 500 characters
                    </Text>
                    <Text 
                      fontSize="sm" 
                      color={feedbackMessage.length > 500 ? "red.500" : "gray.500"}
                      fontWeight={feedbackMessage.length > 500 ? "semibold" : "normal"}
                    >
                      {feedbackMessage.length}/500
                    </Text>
                  </Flex>
                </FormControl>

                <Flex gap={3} justify="flex-end" pt={2}>
                  <Button
                    leftIcon={<FaTimes />}
                    onClick={handleCancel}
                    isDisabled={loading || submitting}
                    backgroundColor="darkorange"
                    _hover={{ backgroundColor: "dark_orange.800" }}
                    color="white"
                    w="auto"
                    borderRadius="5px"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    leftIcon={<FaPaperPlane />}
                    isLoading={loading || submitting}
                    loadingText="Submitting..."
                    backgroundColor="dark_green.800"
                    _hover={{ backgroundColor: "light_green.400" }}
                    color="white"
                    w="auto"
                    borderRadius="5px"
                  >
                    Submit Feedback
                  </Button>
                </Flex>
              </VStack>
            </Box>

            <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.500">
              <Text fontSize="sm" color="gray.700">
                <strong>Note:</strong> For technical support issues or bug reports, please use the{' '}
                <Link href="/support" color="blue.500" fontWeight="semibold">
                  Support System
                </Link>{' '}
                instead.
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Feedback;
