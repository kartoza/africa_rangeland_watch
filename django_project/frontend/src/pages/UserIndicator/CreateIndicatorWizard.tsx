import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  VStack,
  HStack,
  Progress,
  Heading,
  Text,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepSeparator,
  useSteps,
  Flex
} from '@chakra-ui/react';
import Helmet from "react-helmet";
import axios from 'axios';
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import "../../styles/index.css";
import { AppDispatch } from "../../store";
import RenderStep1 from "./Step1";
import RenderStep2 from "./Step2";
import RenderStep3 from "./Step3";
import { resetForm, setLoading, FileWithId, UploadedFile } from "../../store/userIndicatorSlice";
import { useNavigate } from "react-router-dom";


const CreateIndicatorWizard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { formData, loading, error, uploadedFiles, uploadStatus } = useSelector((state: any) => state.userIndicator);

  useEffect(() => {
    dispatch(resetForm());
  }, [])

  const validateStep1 = () => {
    // required fields
    const requiredFields = [
      'name',
      'analysisTypes'
    ]
    let isValid = true;
    requiredFields.forEach(element => {
      if (!formData[element] || formData[element].length === 0) {
        isValid = false;
      }
    });
    return isValid;
  }

  const validateStep2 = () => {
    if (!formData.geeAssetID && !formData.sessionID) {
      return false;
    }
    // add validation to new uploaded asset
    if (uploadedFiles.length > 0) {
      let isAllUploaded = true;
      uploadedFiles.forEach((file: FileWithId) => {
        if (uploadStatus[file.id] !== 'completed') {
          isAllUploaded = false;
        }
      });
      if (!isAllUploaded) {
        return false;
      }
    }

    return true;
  }

  const validateStep3 = () => {
    if (formData.files) {
      let isValid = true;
      formData.files.forEach((file: UploadedFile) => {
        if (!file.startDate || !file.endDate) {
          isValid = false;
        }
      });
      return isValid;
    }
    return true;
  }

  const steps = [
    { title: 'Detail', description: 'Indicator Detail', validateFn: validateStep1 },
    { title: 'Choose Asset', description: 'Choose or Upload asset files', validateFn: validateStep2 },
    { title: 'Configuration', description: 'Configure the indicator', validateFn: validateStep3 }
  ];

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      if (!steps[activeStep].validateFn()) {
        toast({
          title: 'Validation Error',
          description: `Please complete the step ${activeStep + 1}.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
          containerStyle: {
            color: "white",
          },
        });
        return;
      }
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!steps[activeStep].validateFn()) {
      toast({
        title: 'Validation Error',
        description: `Please complete the step ${activeStep + 1} before submitting.`,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          color: "white",
        },
      });
      return;
    }

    dispatch(setLoading(true));
    let submittedData = {...formData};
    let uploadedFiles = [];
    for (const file of formData.files) {
      uploadedFiles.push({
        uploadItemID: file.uploadItemID,
        fileName: file.fileName,
        startDate: file.startDate ? new Date(file.startDate).toISOString() : undefined,
        endDate: file.endDate ? new Date(file.endDate).toISOString() : undefined
      });
    }
    submittedData.files = uploadedFiles;
    const axiosPromise = axios.post('/frontend-api/user-indicator/', submittedData);

    toast.promise(axiosPromise, {
        'success': {
            'title': 'A new indicator created successfully',
            'description': 'The new indicator has been created successfully.',
            'position': 'top-right',
            'containerStyle': {
                'color': "white",
            },
        },
        'error': {
            'title': 'Error creating indicator',
            'description': 'There was an error creating the new indicator.',
            'position': 'top-right',
            'containerStyle': {
                'color': "white",
            },
        },
        'loading': {
            'title': 'Submitting forms...',
            'description': 'Please wait while we create the new indicator.',
            'position': 'top-right',
            'containerStyle': {
                'color': "white",
            },
        }
    });

    axiosPromise.then((response) => {
        dispatch(resetForm());
        // redirect back to list
        navigate('/user-indicator');
    }).catch((error) => {
        console.error('Error submitting data:', error);
        if (error.response && error.response.data && error.response.data.error) {
            let errorMsg = error.response.data.error;
            setTimeout(() => {
                toast({
                    title: 'Error creating indicator',
                    description: errorMsg,
                    status: 'error',
                    position: 'top-right',
                    duration: 9000,
                    isClosable: true,
                    containerStyle: {
                        color: "white",
                    },
                });
            }, 1500);                
        }
    }).finally(() => {
        dispatch(setLoading(false));
    });
  };

  const renderCurrentStep = () => {
    switch (activeStep) {
      case 0:
        return <RenderStep1 />;
      case 1:
        return <RenderStep2 />;
      case 2:
        return <RenderStep3 />;
      default:
        return <RenderStep1 />;
    }
  };

  return (
    <>
        <Helmet>
            <title>Create a new indicator</title>
            <meta name="description" content="Create a new user indicator." />
        </Helmet>
        
        <Header />
        <Box bg="white" w="100%">
            <Flex direction={{ base: "column", md: "row" }} gap="30px" alignItems="start">
                {/* Sidebar */}
                <Sidebar display={{ base: "none", md: "flex" }} />
            
                {/* Main Content */}
                <Box bg="white" flex="1" width={{ base: "auto", md: "auto" }} overflow={"hidden"} p={6}>
                    <Heading size="lg" color="black">
                        Create a new indicator
                    </Heading>
                    <Card>
                        <CardHeader>
                            <VStack spacing={4}>
                                <Text color="gray.600" textAlign="center">
                                    Complete the following steps to create a new indicator
                                </Text>
                                
                                {/* Progress Bar */}
                                <Box w="100%">
                                    <Progress 
                                        value={(activeStep + 1) * (100 / steps.length)}
                                        colorScheme="dark_green"
                                        size="lg" 
                                        borderRadius="md"
                                    />
                                <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                                    Step {activeStep + 1} of {steps.length}
                                </Text>
                                </Box>

                                {/* Stepper */}
                                <Stepper size="md" index={activeStep} w="100%" colorScheme="dark_green">
                                    {steps.map((step, index) => (
                                        <Step key={index}>
                                            <StepIndicator>
                                                <StepStatus
                                                    complete={<StepIcon />}
                                                    incomplete={<StepNumber />}
                                                    active={<StepNumber />}
                                                />
                                            </StepIndicator>

                                            <Box flexShrink="0">
                                                <StepTitle>{step.title}</StepTitle>
                                            </Box>

                                            <StepSeparator />
                                        </Step>
                                    ))}
                                </Stepper>
                            </VStack>
                        </CardHeader>

                        <CardBody>
                            <Box minH="400px">
                                {renderCurrentStep()}
                            </Box>

                            {/* Navigation Buttons */}
                            <HStack justify="space-between" mt={8}>
                                <Button
                                    onClick={handlePrevious}
                                    isDisabled={activeStep === 0 || loading}
                                    variant="outline"
                                    colorScheme="green"
                                    _hover={{ backgroundColor: "dark_green.800", color: "white" }}
                                    fontWeight={700}
                                    w={{ base: "100%", md: "auto" }}
                                    h={10}
                                    borderRadius="5px"
                                    transition="all 0.3s ease-in-out"
                                >
                                    Previous
                                </Button>

                                <HStack>
                                {activeStep < steps.length - 1 ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={loading}
                                        variant="solid"
                                        colorScheme="green"
                                        backgroundColor="dark_green.800"
                                        _hover={{ backgroundColor: "light_green.400" }}
                                        fontWeight={700}
                                        w={{ base: "100%", md: "auto" }}
                                        h={10}
                                        color="white"
                                        borderRadius="5px"
                                        transition="all 0.3s ease-in-out"
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        variant="solid"
                                        colorScheme="green"
                                        backgroundColor="dark_green.800"
                                        _hover={{ backgroundColor: "light_green.400" }}
                                        fontWeight={700}
                                        w={{ base: "100%", md: "auto" }}
                                        h={10}
                                        color="white"
                                        borderRadius="5px"
                                        transition="all 0.3s ease-in-out"
                                    >
                                        Submit
                                    </Button>
                                )}
                                </HStack>
                            </HStack>
                        </CardBody>
                    </Card>
                </Box>
            </Flex>
        </Box>
        
        
    </>
  );
};

export default CreateIndicatorWizard;