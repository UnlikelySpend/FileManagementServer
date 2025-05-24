import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Tooltip,
  List,
  ListItem,
  useColorModeValue,
  Button,
  useToast,
  Spinner,
  Center,
  Badge
} from '@chakra-ui/react'
import { ViewIcon, DeleteIcon, TimeIcon } from '@chakra-ui/icons'
import { FaFolder, FaFile, FaImage } from 'react-icons/fa'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RecentFiles({ onFileSelect, onFolderNavigate }) {
  const [recentFiles, setRecentFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const fetchRecentFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/recent-files`)
      setRecentFiles(response.data.recent_files || [])
    } catch (error) {
      console.error('Error fetching recent files:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentFiles()
  }, [])

  const clearRecentFiles = async () => {
    try {
      await axios.delete(`${API_URL}/recent-files`)
      setRecentFiles([])
      toast({
        title: 'Recent files cleared',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Failed to clear recent files',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getFileIcon = (fileType) => {
    if (fileType === 'directory') return <FaFolder color="#E2A308" />
    if (fileType === 'image') return <FaImage color="#9F7AEA" />
    return <FaFile color="#4A5568" />
  }

  const handleFileClick = (file) => {
    if (file.type === 'directory') {
      onFolderNavigate(file.path)
    } else {
      onFileSelect(file)
    }
  }

  return (
    <Box
      w="300px"
      h="100%"
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      bg={useColorModeValue('white', 'gray.800')}
    >
      <VStack spacing={4} align="stretch" h="100%">
        <HStack justify="space-between">
          <HStack>
            <TimeIcon color="var(--theme-primary)" />
            <Text fontWeight="bold" fontSize="lg">Recent Files</Text>
          </HStack>
          {recentFiles.length > 0 && (
            <Tooltip label="Clear all recent files">
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                onClick={clearRecentFiles}
                aria-label="Clear recent files"
              />
            </Tooltip>
          )}
        </HStack>

        <Box flex="1" overflowY="auto">
          {loading ? (
            <Center h="200px">
              <Spinner />
            </Center>
          ) : recentFiles.length === 0 ? (
            <Center h="200px">
              <VStack>
                <Text color={textColor} fontSize="sm">
                  No recent files
                </Text>
                <Text color={textColor} fontSize="xs">
                  Files you view will appear here
                </Text>
              </VStack>
            </Center>
          ) : (
            <List spacing={2}>
              {recentFiles.map((file, index) => (
                <ListItem key={`${file.path}-${index}`}>
                  <Box
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <VStack align="start" spacing={2}>
                      <HStack>
                        {getFileIcon(file.type)}
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {file.name}
                          </Text>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color={textColor}>
                              {formatTimeAgo(file.accessed_at)}
                            </Text>
                            {file.type === 'directory' && (
                              <Badge size="sm" colorScheme="blue">Folder</Badge>
                            )}
                            {file.type === 'image' && (
                              <Badge size="sm" colorScheme="purple">Image</Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {recentFiles.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={fetchRecentFiles}
          >
            Refresh
          </Button>
        )}
      </VStack>
    </Box>
  )
}