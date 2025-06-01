import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Textarea
} from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';
import { WidgetHeight, heightConfig } from '../../store/dashboardSlice';


// Text Widget Component
const TextWidget: React.FC<{ 
  content: string; 
  height: WidgetHeight; 
  onContentChange?: (content: string) => void;
}> = ({ content, height, onContentChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  
  const config = heightConfig[height];
  const textHeight = height === 'small' ? '120px' : height === 'medium' ? '200px' : height === 'large' ? '300px' : '400px';

  const handleSave = () => {
    setIsEditing(false);
    // Call the parent component's callback to update the widget content
    if (onContentChange) {
      onContentChange(editContent);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  // Simple markdown-like text rendering
  const renderText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('## ')) {
        return <Text key={index} fontSize="md" fontWeight="bold" color="gray.700" mt={index > 0 ? 3 : 0} mb={1}>{line.substring(3)}</Text>;
      }
      if (line.startsWith('# ')) {
        return <Text key={index} fontSize="lg" fontWeight="bold" color="gray.800" mt={index > 0 ? 4 : 0} mb={2}>{line.substring(2)}</Text>;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <Text key={index} fontSize="sm" mb={1} color="black">
            {parts.map((part, i) => (
              i % 2 === 1 ? <Text as="span" key={i} fontWeight="bold" color="black">{part}</Text> : part
            ))}
          </Text>
        );
      }
      
      // Handle italic text
      if (line.includes('*') && !line.startsWith('*')) {
        const parts = line.split('*');
        return (
          <Text key={index} fontSize="sm" mb={1} color="black">
            {parts.map((part, i) => (
              i % 2 === 1 ? <Text as="span" key={i} fontStyle="italic" color="black">{part}</Text> : part
            ))}
          </Text>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('- ')) {
        return <Text key={index} fontSize="sm" mb={1} pl={4} color="black">• {line.substring(2)}</Text>;
      }
      
      // Handle numbered lists
      if (/^\d+\. /.test(line)) {
        return <Text key={index} fontSize="sm" mb={1} pl={4} color="black">{line}</Text>;
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <Box key={index} h={2} />;
      }
      
      // Regular text
      return <Text key={index} fontSize="sm" mb={1} color="black">{line}</Text>;
    });
  };

  return (
    <VStack spacing={0} align="stretch" h="full">
      {!isEditing ? (
        <>
          <Box 
            h={textHeight} 
            overflowY="auto" 
            p={3} 
            bg="gray.50" 
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            position="relative"
            _hover={{ borderColor: 'gray.300' }}
          >
            <Box pr={2}>
              {renderText(editContent)}
            </Box>
            <IconButton
              position="absolute"
              top={2}
              right={2}
              size="xs"
              variant="ghost"
              icon={<FiSettings size={12} />}
              aria-label="Edit text"
              onClick={() => setIsEditing(true)}
              opacity={0.7}
              _hover={{ opacity: 1, bg: 'white' }}
            />
          </Box>
        </>
      ) : (
        <VStack spacing={2} align="stretch" h="full">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            h={textHeight}
            resize="none"
            fontSize="sm"
            fontFamily="mono"
            placeholder="Enter your text content here... 

Supported formatting:
# Large Header
## Medium Header
**Bold Text**
*Italic Text*
- Bullet points
1. Numbered lists"
          />
          <HStack spacing={2}>
            <Button size="xs" colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
            <Button size="xs" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default TextWidget;
