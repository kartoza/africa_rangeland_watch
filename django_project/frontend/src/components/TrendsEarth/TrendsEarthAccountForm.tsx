// coding=utf-8
/**
 * TrendsEarthAccountForm.tsx
 * Form for saving / deleting Trends.Earth credentials.
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { AppDispatch, RootState } from '../../store';
import {
  fetchTrendsEarthSettings,
  saveTrendsEarthSettings,
  deleteTrendsEarthSettings,
  clearTrendsEarthError,
} from '../../store/analysisSlice';

const TrendsEarthAccountForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    trendsEarthConfigured,
    trendsEarthEmail,
    trendsEarthLoading,
    trendsEarthError,
  } = useSelector((state: RootState) => state.analysis);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchTrendsEarthSettings());
  }, [dispatch]);

  useEffect(() => {
    if (trendsEarthEmail) {
      setEmail(trendsEarthEmail);
    }
  }, [trendsEarthEmail]);

  const handleSave = async () => {
    setSaveSuccess(false);
    dispatch(clearTrendsEarthError());
    const result = await dispatch(
      saveTrendsEarthSettings({ email, password })
    );
    if (saveTrendsEarthSettings.fulfilled.match(result)) {
      setPassword('');
      setSaveSuccess(true);
    }
  };

  const handleDelete = async () => {
    setSaveSuccess(false);
    dispatch(clearTrendsEarthError());
    const result = await dispatch(deleteTrendsEarthSettings());
    if (deleteTrendsEarthSettings.fulfilled.match(result)) {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <Box>
      <Text fontWeight="bold" fontSize="lg" mb={4} color="black">
        Trends.Earth Account
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Enter your Trends.Earth credentials to enable Trends.Earth
        analysis layers. Your password is only used to obtain an
        authentication token and is never stored.
      </Text>

      {trendsEarthConfigured && (
        <Alert status="success" mb={4} borderRadius="md">
          <AlertIcon />
          Connected as <strong>&nbsp;{trendsEarthEmail}</strong>
        </Alert>
      )}

      {saveSuccess && !trendsEarthError && (
        <Alert status="success" mb={4} borderRadius="md">
          <AlertIcon />
          Credentials saved successfully.
        </Alert>
      )}

      {trendsEarthError && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {trendsEarthError}
        </Alert>
      )}

      <FormControl mb={4}>
        <FormLabel color="black">Email</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          color="black"
          borderColor="gray.300"
        />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel color="black">Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            trendsEarthConfigured
              ? 'Leave blank to keep current token'
              : 'Enter password'
          }
          color="black"
          borderColor="gray.300"
        />
      </FormControl>

      <Flex gap={3}>
        <Button
          colorScheme="green"
          onClick={handleSave}
          isLoading={trendsEarthLoading}
          isDisabled={!email}
          bg="dark_green.800"
          _hover={{ bg: 'light_green.400' }}
          color="white"
        >
          {trendsEarthConfigured ? 'Update Credentials' : 'Save Credentials'}
        </Button>

        {trendsEarthConfigured && (
          <>
            <Divider orientation="vertical" />
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleDelete}
              isLoading={trendsEarthLoading}
            >
              Remove Credentials
            </Button>
          </>
        )}
      </Flex>

      {trendsEarthLoading && (
        <Flex align="center" mt={3} gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="gray.500">
            Verifying credentials with Trends.Earth…
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default TrendsEarthAccountForm;
