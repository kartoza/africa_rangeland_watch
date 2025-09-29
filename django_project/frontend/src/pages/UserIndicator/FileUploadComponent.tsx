import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Progress,
  Badge,
  Input,
  Flex,
  Heading,
  useColorModeValue,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { 
  DndContext, 
  useDndMonitor, 
  useDroppable
} from '@dnd-kit/core';
import { Upload, X, Check, AlertCircle, File as FileIcon, Play } from 'lucide-react';
import { AppDispatch } from "../../store";
import {
  setSessionID,
  FileWithId,
  SignedUrlResponse,
  removeFile as removeFileAction,
  startUpload as startUploadAction,
  setUploadProgress,
  setFileAttributes,
  setUploadCompleted,
  setUploadError,
  addFiles as addFilesAction
} from "../../store/userIndicatorSlice";


// Types
interface FileValidationError {
  file: string;
  error: string;
}


interface FileItemProps {
  file: FileWithId;
  index: number;
  progress: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  hasSession: boolean;
  retryCount?: number;
  onRemove: () => void;
  onUpload: () => void;
  onResume?: () => void;
  onPause?: () => void;
}

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

// Constants
const MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB max
const ALLOWED_TYPES = ['image/tiff'];

const FileUploadComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, loading, uploadedFiles, uploadProgress, uploadStatus } = useSelector((state: any) => state.userIndicator);
  const files = useRef(new Map<string, File>());
  const toast = useToast();

  useEffect(() => {
    return () => {
      files.current.clear();
    };
  }, []);

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }
    
    const isValidType = ALLOWED_TYPES.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace(/\*/g, ''));
      }
      return file.type === type;
    });
    
    if (!isValidType) {
      return 'File type not allowed';
    }
    
    return null;
  };

  // Get signed URL for uploads
  const getSignedUrl = async (
    fileName: string, 
    contentType: string, 
    uploadType: 'simple' = 'simple',
    sessionID: string | null,
    contentLength: number | null
  ): Promise<SignedUrlResponse> => {
    try {
      const endpoint = '/frontend-api/user-indicator/get-signed-url/';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            "Content-Type": "application/json",
            "X-CSRFToken": document.cookie.match(/csrftoken=([\w-]+)/)?.[1] || "",
        },
        body: JSON.stringify({
          fileName,
          contentType,
          uploadType,
          sessionID,
          contentLength
        })
      });
      
      if (!response.ok) throw new Error('Failed to get signed URL');
      
      const data: SignedUrlResponse = await response.json();
      if (!sessionID) {
        dispatch(setSessionID(data.sessionID));
      }
      return data;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  };

  const uploadFileSimple = async (file: FileWithId, sessionID: string): Promise<void> => {
    const binaryFile = files.current.get(file.id);
    if (!binaryFile) {
      alert('File not found for upload');
      return;
    }
    
    try {
      dispatch(startUploadAction(file.id));
      
      // Get simple signed URL
      const signedUrl = await getSignedUrl(file.name, file.type, 'simple', sessionID, file.size);
      
      // set deleteUrl to files state
      dispatch(setFileAttributes({
        fileId: file.id,
        deleteUrl: signedUrl.deleteUrl,
        uploadItemID: signedUrl.uploadItemID
      }));

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          dispatch(setUploadProgress({ fileId: file.id, progress }));
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          dispatch(setUploadCompleted(file.id));
          toast({
            title: 'Upload completed',
            description: `${file.name} uploaded successfully`,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
            containerStyle: {
              color: "white",
            },
          });
        } else {
            console.error('Upload error:', xhr.responseText || xhr.statusText);
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('Upload error:', xhr.responseText || xhr.statusText);
        throw new Error('Upload failed');
      });
      
      // Start upload
      xhr.open('PUT', signedUrl.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(binaryFile);

    } catch (error) {
      console.error('Simple upload error:', error);
      dispatch(setUploadError(file.id));
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${file.name}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          color: "white",
        },
      });
    }
  };

  // Handle file addition
  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileWithId[] = [];
    const errors: FileValidationError[] = [];
    
    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push({ file: file.name, error });
      } else {
        const fileWithId: FileWithId = {
          id: `${file.name}-${file.lastModified}-${Date.now()}`,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
          size: file.size
        }
        validFiles.push(fileWithId);
        files.current.set(fileWithId.id, file);
      }
    });
    
    if (errors.length > 0) {
      toast({
        title: 'Some files were rejected',
        description: errors.map(e => `${e.file}: ${e.error}`).join(', '),
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          color: "white",
        },
      });
    }

    dispatch(addFilesAction(validFiles));
  }, [toast]);

  // Handle file removal
  const removeFile = (index: number): void => {
    const file = uploadedFiles[index];

    if (file.deleteUrl) {
      // Optionally, send a request to delete the uploaded file from the server
      fetch(file.deleteUrl, { method: 'DELETE' })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to delete file on server');
          }
        })
        .catch(error => {
          console.error('Error deleting file on server:', error);
        });
    }

    if (files.current.has(file.id)) {
      files.current.delete(file.id);
    }

    dispatch(removeFileAction(index));
  };

  // Main upload function - chooses between simple and resumable based on file size
  const uploadFile = async (file: FileWithId): Promise<void> => {
    await uploadFileSimple(file, formData.sessionID);
  };

  // Start upload for a specific file
  const startUpload = (file: FileWithId): void => {
    uploadFile(file);
  };

  // Upload all files
  const uploadAllFiles = (): void => {
    uploadedFiles.forEach((file: FileWithId) => {
      if (!uploadStatus[file.id] || uploadStatus[file.id] === 'error') {
        uploadFile(file);
      }
    });
  };

  return (
    <Box maxW="2xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <DndContext onDragEnd={() => {}}>
          <FileDropzone onFilesAdded={addFiles} />
          
          {uploadedFiles.length > 0 && (
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Files to Upload</Heading>
                <Button
                  leftIcon={<Upload size={16} />}
                  colorScheme="blue"
                  onClick={uploadAllFiles}
                  size="sm"
                >
                  Upload All
                </Button>
              </Flex>
              
              <Divider />
              
              <VStack spacing={3} align="stretch">
                {uploadedFiles.map((file: FileWithId, index: number) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    index={index}
                    progress={uploadProgress[file.id] || 0}
                    status={uploadStatus[file.id]}
                    hasSession={false}
                    onRemove={() => removeFile(index)}
                    onUpload={() => startUpload(file)}
                  />
                ))}
              </VStack>
            </VStack>
          )}
        </DndContext>
      </VStack>
    </Box>
  );
};

// Dropzone component
const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { setNodeRef } = useDroppable({ id: 'file-dropzone' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const dragBorderColor = useColorModeValue('blue.400', 'blue.300');
  const dragBgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('gray.400', 'gray.500');

  useDndMonitor({
    onDragOver: (event) => {
      if (event.over?.id === 'file-dropzone') {
        setIsDragOver(true);
      }
    },
    onDragEnd: () => {
      setIsDragOver(false);
    }
  });

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFilesAdded(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesAdded(files);
      e.target.value = ''; // Reset input
    }
  };

  const openFileDialog = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      ref={setNodeRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      border="2px dashed"
      borderColor={isDragOver ? dragBorderColor : borderColor}
      bg={isDragOver ? dragBgColor : 'transparent'}
      borderRadius="lg"
      p={8}
      textAlign="center"
      transition="all 0.2s"
      transform={isDragOver ? 'scale(1.02)' : 'scale(1)'}
      _hover={{
        borderColor: hoverBorderColor,
        cursor: 'pointer'
      }}
      onClick={openFileDialog}
    >
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        display="none"
        accept={ALLOWED_TYPES.join(',')}
      />
      
      <VStack spacing={4}>
        <Upload 
          size={48} 
          color={isDragOver ? 'var(--chakra-colors-blue-500)' : iconColor}
        />
        
        <VStack spacing={2}>
          <Text fontSize="lg" fontWeight="medium" color={textColor}>
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </Text>
          <Text fontSize="sm" color={textColor}>
            or{' '}
            <Text as="span" color="blue.500" fontWeight="medium" cursor="pointer">
              browse files
            </Text>
          </Text>
        </VStack>
        
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.400">
            Supported: TIFF images
          </Text>
          <Text fontSize="xs" color="gray.400">
            Max size: 1000MB per file
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

// Individual file item component
const FileItem: React.FC<FileItemProps> = ({ 
  file, 
  index, 
  progress, 
  status, 
  hasSession,
  retryCount = 0,
  onRemove, 
  onUpload,
  onResume,
  onPause
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (): React.ReactNode => {
    switch (status) {
      case 'uploading':
        return (
          <Box
            w={4}
            h={4}
            border="2px solid"
            borderColor="blue.500"
            borderTopColor="transparent"
            borderRadius="full"
            animation="spin 1s linear infinite"
          />
        );
      case 'completed':
        return <Check size={16} color="var(--chakra-colors-green-500)" />;
      case 'error':
        return <AlertCircle size={16} color="var(--chakra-colors-red-500)" />;
      default:
        return <FileIcon size={16} color="var(--chakra-colors-gray-400)" />;
    }
  };

  const getStatusBadge = (): React.ReactNode => {
    switch (status) {
      case 'uploading':
        return <Badge colorScheme="blue" variant="subtle">Uploading</Badge>;
      case 'completed':
        return <Badge colorScheme="green" variant="subtle">Completed</Badge>;
      case 'error':
        return <Badge colorScheme="red" variant="subtle">Error</Badge>;
      case 'paused':
        return <Badge colorScheme="orange" variant="subtle">Paused</Badge>;
      default:
        return <Badge colorScheme="gray" variant="subtle">Pending</Badge>;
    }
  };

  const getBgColor = (): string => {
    switch (status) {
      case 'uploading':
        return 'blue.50';
      case 'completed':
        return 'green.50';
      case 'error':
        return 'red.50';
      default:
        return 'gray.50';
    }
  };

  return (
    <Box
      p={4}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      bg={getBgColor()}
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={3} flex={1} minW={0}>
          {getStatusIcon()}
          
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="medium" noOfLines={1} color={"gray.500"}>
              {file.name}
            </Text>
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.500">
                {formatFileSize(file.size)}
              </Text>
              {getStatusBadge()}
            </HStack>
          </VStack>
        </HStack>
        
        <HStack spacing={2}>
          {status === 'uploading' && (
            <>
              <Text fontSize="xs" color="gray.600" minW="12" ml={2}>
                {Math.round(progress)}%
              </Text>
            </>
          )}
          
          {status === 'paused' && onResume && (
            <IconButton
              aria-label="Resume upload"
              icon={<Play size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={onResume}
            />
          )}
          
          {status === 'error' && hasSession && onResume && (
            <IconButton
              aria-label="Retry upload"
              icon={<Play size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="orange"
              onClick={onResume}
            />
          )}
          
          {!status && (
            <IconButton
              aria-label="Upload file"
              icon={<Play size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={onUpload}
            />
          )}
          
          <IconButton
            aria-label="Remove file"
            icon={<X size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onRemove}
          />
        </HStack>
      </Flex>
      
      {status === 'uploading' && (
        <Box mt={3}>
          <Progress
            value={progress}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
            hasStripe
            isAnimated
          />
        </Box>
      )}
    </Box>
  );
};

export default FileUploadComponent;