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
  useColorModeValue,
  Center,
  VStack,
  HStack,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tag,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { DownloadIcon } from '@chakra-ui/icons'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function FileViewer({ isOpen, onClose, file, onSave }) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [fileData, setFileData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (file && isOpen) {
      loadFileContent()
      setMediaError(false)
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

  const getFileType = () => {
    if (!file) return 'unknown'
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeType = fileData?.mimeType || ''
    
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf'
    if (fileData?.type === 'text') return 'text'
    
    // Check by extension for media files
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv']
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
    
    if (videoExtensions.includes(extension)) return 'video'
    if (audioExtensions.includes(extension)) return 'audio'
    
    return 'unknown'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Center minH="200px">
          <Spinner size="lg" />
        </Center>
      )
    }

    if (!file) return null

    const fileType = getFileType()
    const fileUrl = `${API_URL}/download/${file.path}`

    switch (fileType) {
      case 'text':
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

      case 'image':
        return (
          <Center>
            <VStack spacing={4}>
              {fileData?.content ? (
                <Image
                  src={`data:${fileData.mimeType};base64,${fileData.content}`}
                  alt={file.name}
                  maxH="500px"
                  objectFit="contain"
                />
              ) : (
                <Image
                  src={fileUrl}
                  alt={file.name}
                  maxH="500px"
                  objectFit="contain"
                  onError={() => setMediaError(true)}
                />
              )}
              <HStack>
                <Tag size="sm">Image</Tag>
                {file.size && <Tag size="sm">{formatFileSize(file.size)}</Tag>}
              </HStack>
            </VStack>
          </Center>
        )

      case 'video':
        return (
          <Center>
            <VStack spacing={4}>
              {mediaError ? (
                <Alert status="warning">
                  <AlertIcon />
                  Video preview not available. Browser may not support this format.
                </Alert>
              ) : (
                <video
                  controls
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                  onError={() => setMediaError(true)}
                >
                  <source src={fileUrl} />
                  Your browser does not support the video tag.
                </video>
              )}
              <HStack>
                <Tag size="sm" colorScheme="red">Video</Tag>
                {file.size && <Tag size="sm">{formatFileSize(file.size)}</Tag>}
              </HStack>
            </VStack>
          </Center>
        )

      case 'audio':
        return (
          <Center>
            <VStack spacing={4}>
              {mediaError ? (
                <Alert status="warning">
                  <AlertIcon />
                  Audio preview not available. Browser may not support this format.
                </Alert>
              ) : (
                <Box w="100%" maxW="400px">
                  <audio
                    controls
                    style={{ width: '100%' }}
                    onError={() => setMediaError(true)}
                  >
                    <source src={fileUrl} />
                    Your browser does not support the audio tag.
                  </audio>
                </Box>
              )}
              <HStack>
                <Tag size="sm" colorScheme="purple">Audio</Tag>
                {file.size && <Tag size="sm">{formatFileSize(file.size)}</Tag>}
              </HStack>
            </VStack>
          </Center>
        )

      case 'pdf':
        return (
          <Center>
            <VStack spacing={4}>
              <Box w="100%" h="500px" border="1px" borderColor={borderColor}>
                <iframe
                  src={`${fileUrl}#toolbar=1`}
                  width="100%"
                  height="100%"
                  title={file.name}
                  onError={() => setMediaError(true)}
                />
              </Box>
              <HStack>
                <Tag size="sm" colorScheme="orange">PDF</Tag>
                {file.size && <Tag size="sm">{formatFileSize(file.size)}</Tag>}
                <Button
                  size="sm"
                  leftIcon={<DownloadIcon />}
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Download
                </Button>
              </HStack>
            </VStack>
          </Center>
        )

      default:
        return (
          <Center minH="200px">
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                Preview not available for this file type
              </Alert>
              <HStack>
                <Tag size="sm">{fileData?.mimeType || 'Unknown'}</Tag>
                {file.size && <Tag size="sm">{formatFileSize(file.size)}</Tag>}
                <Button
                  size="sm"
                  leftIcon={<DownloadIcon />}
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Download
                </Button>
              </HStack>
            </VStack>
          </Center>
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
          {getFileType() === 'text' && fileData?.editable && (
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