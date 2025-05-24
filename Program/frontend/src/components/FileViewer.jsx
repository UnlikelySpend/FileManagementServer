import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  Image,
  Text,
  useToast,
  Spinner,
  Box,
  useColorModeValue
} from '@chakra-ui/react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function FileViewer({ isOpen, onClose, file, onSave }) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [fileData, setFileData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (file && isOpen) {
      loadFileContent()
    }
  }, [file, isOpen])

  const loadFileContent = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/files/${file.path}/content`)
      setFileData(response.data)
      if (response.data.type === 'text') {
        setContent(response.data.content)
        setOriginalContent(response.data.content)
      }
    } catch (error) {
      toast({
        title: 'Error loading file',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/files/${file.path}/content`, {
        content: content
      })
      setOriginalContent(content)
      setIsEditing(false)
      toast({
        title: 'File saved',
        status: 'success',
        duration: 2000,
      })
      if (onSave) onSave()
    } catch (error) {
      toast({
        title: 'Error saving file',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleCancel = () => {
    setContent(originalContent)
    setIsEditing(false)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="lg" />
        </Box>
      )
    }

    if (!fileData) return null

    if (fileData.type === 'text') {
      return (
        <Box>
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minH="400px"
              fontFamily="monospace"
              fontSize="sm"
              bg={bgColor}
              borderColor={borderColor}
            />
          ) : (
            <Box
              as="pre"
              p={4}
              bg={bgColor}
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              overflowX="auto"
              fontFamily="monospace"
              fontSize="sm"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {content}
            </Box>
          )}
        </Box>
      )
    } else if (fileData.mimeType && fileData.mimeType.startsWith('image/')) {
      return (
        <Box display="flex" justifyContent="center">
          <Image
            src={`data:${fileData.mimeType};base64,${fileData.content}`}
            alt={file.name}
            maxH="500px"
            objectFit="contain"
          />
        </Box>
      )
    } else {
      return (
        <Text color="gray.500">
          Preview not available for this file type ({fileData.mimeType || 'unknown'})
        </Text>
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>{file?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {renderContent()}
        </ModalBody>
        <ModalFooter>
          {fileData?.editable && (
            <>
              {isEditing ? (
                <>
                  <Button colorScheme="green" mr={3} onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" ml={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}