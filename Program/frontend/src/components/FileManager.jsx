import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Input,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Center
} from '@chakra-ui/react'
import { DeleteIcon, DownloadIcon, AddIcon, ViewIcon } from '@chakra-ui/icons'
import axios from 'axios'
import FileViewer from './FileViewer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function FileManager() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [viewerFile, setViewerFile] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const fileInputRef = useRef(null)
  const toast = useToast()
  
  const dragBg = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/files`)
      setFiles(response.data)
    } catch (error) {
      toast({
        title: 'Error fetching files',
        status: 'error',
        duration: 3000,
      })
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axios.post(`${API_URL}/upload`, formData)
      fetchFiles()
      toast({
        title: 'File uploaded successfully',
        description: file.name,
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error uploading file',
        description: file.name,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files)
    for (const file of files) {
      await uploadFile(file)
    }
    event.target.value = null
  }

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`${API_URL}/files/${filename}`)
      fetchFiles()
      toast({
        title: 'File deleted successfully',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Error deleting file',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`${API_URL}/download/${filename}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast({
        title: 'Error downloading file',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleView = (file) => {
    setViewerFile(file)
    onOpen()
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await uploadFile(file)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="2xl">Files</Text>
        <Button
          as="label"
          leftIcon={<AddIcon />}
          colorScheme="blue"
          cursor="pointer"
        >
          Upload Files
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleUpload}
          />
        </Button>
      </HStack>

      {/* Drag and Drop Zone */}
      <Box
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        border="2px dashed"
        borderColor={isDragging ? 'blue.400' : borderColor}
        borderRadius="lg"
        p={8}
        bg={isDragging ? dragBg : 'transparent'}
        transition="all 0.2s"
      >
        <Center>
          <VStack spacing={2}>
            <AddIcon boxSize={8} color={isDragging ? 'blue.500' : 'gray.400'} />
            <Text color={isDragging ? 'blue.500' : 'gray.500'}>
              Drag and drop files here or click the upload button
            </Text>
          </VStack>
        </Center>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Size</Th>
              <Th>Type</Th>
              <Th>Modified</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {files.map((file) => (
              <Tr key={file.name} _hover={{ bg: hoverBg }}>
                <Td>{file.name}</Td>
                <Td>{formatFileSize(file.size)}</Td>
                <Td>{file.mimeType || file.type}</Td>
                <Td>{new Date(file.modified * 1000).toLocaleString()}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="View file"
                      icon={<ViewIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleView(file)}
                    />
                    <IconButton
                      aria-label="Download file"
                      icon={<DownloadIcon />}
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleDownload(file.name)}
                    />
                    <IconButton
                      aria-label="Delete file"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(file.name)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* File Viewer Modal */}
      <FileViewer
        isOpen={isOpen}
        onClose={onClose}
        file={viewerFile}
      />
    </VStack>
  )
}