import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useDisclosure,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiPlus } from 'react-icons/fi';
import { AppDispatch, RootState } from "../../store";
import { Item, setSearchTerm, resetItems, fetchItems, loadMoreItems, clearError } from '../../store/mockUserAnalysisSlice';


interface ItemSelectorProps {
  onItemSelect: (item: Item) => void;
  title?: string;
  placeholder?: string;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
  onItemSelect,
  title = "Select an Item",
  placeholder = "Choose an item from the list"
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    items, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    currentPage, 
    totalItems,
    searchTerm 
  } = useSelector((state: RootState) => state.mockUserAnalysis);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  
  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Handle search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      dispatch(setSearchTerm(debouncedSearchTerm));
      dispatch(resetItems());
      dispatch(fetchItems({ page: 1, limit: 10, search: debouncedSearchTerm }));
    }
  }, [debouncedSearchTerm, searchTerm, dispatch]);

  // Initial data fetch
  useEffect(() => {
    if (isOpen && items.length === 0 && !loading) {
      dispatch(fetchItems({ page: 1, limit: 10, search: searchTerm }));
    }
  }, [isOpen, items.length, loading, searchTerm, dispatch]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Hide body scrollbar
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Infinite scroll callback
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      dispatch(loadMoreItems({ 
        page: currentPage + 1, 
        limit: 10, 
        search: searchTerm 
      }));
    }
  }, [dispatch, currentPage, hasMore, loadingMore, loading, searchTerm]);

  // Set up intersection observer
  useEffect(() => {
    if (!isOpen) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, handleLoadMore]);

  const handleOkClick = () => {
    const selectedItem = items.find(item => item.id === selectedItemId);
    if (selectedItem) {
      onItemSelect(selectedItem);
      onClose();
      setSelectedItemId('');
    }
  };

  const handleCancel = () => {
    setSelectedItemId('');
    setLocalSearchTerm('');
    onClose();
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(resetItems());
    dispatch(fetchItems({ page: 1, limit: 10, search: searchTerm }));
  };

  const displayDateTime = (item: Item) => {
    if (!item.created_at) return '-';
    
    const date = new Date(item.created_at);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box>
      <Button
        onClick={onOpen}
        leftIcon={<FiPlus size={16} />}
        size="sm"
        variant="outline"
        colorScheme="green"
      >
        Add Widget
      </Button>

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={handleCancel}
        size="md"
        blockScrollOnMount={true}
        preserveScrollBarGap={true}
        >
        <DrawerOverlay />
        <DrawerContent bg={"white"}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Text fontSize="lg" fontWeight="semibold" color={"black"}>
              {title}
            </Text>
            {totalItems > 0 && (
              <Text fontSize="sm" color="gray.600" fontWeight="normal">
                {items.length} of {totalItems} items
              </Text>
            )}
          </DrawerHeader>

          <DrawerBody display="flex" flexDirection="column">
            <VStack align="stretch" spacing={4} flex="1" h="100%">
              <Text color="gray.600" fontSize="sm">
                {placeholder}
              </Text>
              
              {/* Error State */}
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Error!</AlertTitle>
                    <AlertDescription>
                      {error}
                      <Button 
                        size="sm" 
                        colorScheme="red" 
                        variant="outline" 
                        ml={2}
                        onClick={handleRetry}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Search Bar */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search items..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  focusBorderColor="green.400"
                />
              </InputGroup>

              {/* Initial Loading State */}
              {loading && items.length === 0 && (
                <Flex justify="center" align="center" py={8}>
                  <VStack spacing={3}>
                    <Spinner size="lg" color="green.500" />
                    <Text color="gray.600">Loading items...</Text>
                  </VStack>
                </Flex>
              )}
              
              {/* Items List */}
              {!loading && items.length === 0 && (
                <Text color="gray.500" textAlign="center" py={8}>
                  {searchTerm ? 'No items found matching your search.' : 'No items available.'}
                </Text>
              )}

              {items.length > 0 && (
                <Box flex="1" overflowY="auto" minH="0">
                  <RadioGroup value={selectedItemId} onChange={setSelectedItemId}>
                    <Stack spacing={3}>
                      {items.map((item) => (
                        <Box
                          key={item.id}
                          p={3}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          _hover={{ borderColor: 'green.300', bg: 'gray.50' }}
                          cursor="pointer"
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <Radio value={item.id} colorScheme="green">
                            <VStack align="start" spacing={1} ml={2}>
                              <Text fontWeight="medium" color={"black"}>{item.name}</Text>
                              {item.description && (
                                <Text fontSize="sm" color="gray.600">
                                  {item.description}
                                </Text>
                              )}
                              <Text fontSize="sm" color="green.500" fontWeight="medium">
                                {displayDateTime(item)}
                              </Text>
                            </VStack>
                          </Radio>
                        </Box>
                      ))}
                    </Stack>
                  </RadioGroup>

                  {/* Loading More Indicator */}
                  {hasMore && (
                    <Center py={4} ref={loadingRef}>
                      {loadingMore ? (
                        <VStack spacing={2}>
                          <Spinner size="md" color="green.500" />
                          <Text fontSize="sm" color="gray.600">Loading more...</Text>
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Scroll for more items
                        </Text>
                      )}
                    </Center>
                  )}

                  {/* End of Results */}
                  {!hasMore && items.length > 0 && (
                    <Center py={4}>
                      <Text fontSize="sm" color="gray.500">
                        End of results
                      </Text>
                    </Center>
                  )}
                </Box>
              )}
            </VStack>
          </DrawerBody>

          <DrawerFooter borderBottomWidth="1px">
            <Flex gap={3}>
              <Button variant="outline" size="sm" minW={"120px"} colorScheme="green" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                variant={selectedItemId ? "solid" : "outline"}
                minW={"120px"}
                onClick={handleOkClick}
                isDisabled={!selectedItemId || loading}
              >
                OK
              </Button>
            </Flex>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ItemSelector;
