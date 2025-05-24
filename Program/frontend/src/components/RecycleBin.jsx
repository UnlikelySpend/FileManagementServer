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
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react'
import { DeleteIcon, RepeatIcon, ViewIcon } from '@chakra-ui/icons'
import { FaTrash, FaFolder, FaFile, FaImage } from 'react-icons/fa'
import axios from 'axios'
import { useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RecycleBin({ onRefresh }) {
  const [recycleBinItems, setRecycleBinItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()
  const toast = useToast()
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const fetchRecycleBin = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/recycle-bin`)
      setRecycleBinItems(response.data.items)
    } catch (error) {
      console.error('Error fetching recycle bin:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecycleBin()
  }, [])

  const restoreItem = async (item) => {
    try {
      await axios.post(`${API_URL}/recycle-bin/restore`, {
        recycled_name: item.recycled_name
      })
      
      toast({
        title: 'File restored',
        description: `${item.original_name} has been restored`,
        status: 'success',
        duration: 3000,
      })
      
      fetchRecycleBin()
      onRefresh?.() // Refresh main file list
    } catch (error) {
      toast({
        title: 'Restore failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const permanentlyDelete = async (item) => {
    try {
      await axios.delete(`${API_URL}/recycle-bin/${item.recycled_name}`)
      
      toast({
        title: 'File permanently deleted',
        description: `${item.original_name} has been permanently deleted`,
        status: 'warning',
        duration: 3000,
      })
      
      fetchRecycleBin()
      onClose()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
      return <FaImage color="#9F7AEA" />
    }
    return <FaFile color="#4A5568" />
  }

  const openDeleteDialog = (item) => {
    setSelectedItem(item)
    onOpen()
  }

  return (
    <>
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
              <FaTrash color="var(--theme-primary)" />
              <Text fontWeight="bold" fontSize="lg">Recycle Bin</Text>
            </HStack>
            <Tooltip label="Refresh recycle bin">
              <IconButton
                icon={<RepeatIcon />}
                size="sm"
                variant="ghost"
                onClick={fetchRecycleBin}
                aria-label="Refresh recycle bin"
              />
            </Tooltip>
          </HStack>

          <Box flex="1" overflowY="auto">
            {loading ? (
              <Center h="200px">
                <Spinner />
              </Center>
            ) : recycleBinItems.length === 0 ? (
              <Center h="200px">
                <VStack>
                  <Text color={textColor} fontSize="sm">
                    Recycle bin is empty
                  </Text>
                  <Text color={textColor} fontSize="xs">
                    Deleted files will appear here
                  </Text>
                </VStack>
              </Center>
            ) : (
              <List spacing={2}>
                {recycleBinItems.map((item, index) => (
                  <ListItem key={`${item.recycled_name}-${index}`}>
                    <Box
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="transparent"
                      _hover={{ bg: hoverBg, borderColor: borderColor }}
                    >
                      <VStack align="start" spacing={2}>
                        <HStack>
                          {item.type === 'directory' ? (
                            <FaFolder color="#E2A308" />
                          ) : (
                            getFileIcon(item.original_name)
                          )}
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                              {item.original_name}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                              Deleted {formatDate(item.deleted_at)}
                            </Text>
                            {item.type === 'directory' && (
                              <Badge size="sm" colorScheme="blue">Folder</Badge>
                            )}
                          </VStack>
                        </HStack>
                        
                        <HStack spacing={2} w="100%">
                          <Tooltip label="Restore file">
                            <IconButton
                              icon={<RepeatIcon />}
                              size="xs"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => restoreItem(item)}
                              aria-label="Restore file"
                            />
                          </Tooltip>
                          <Tooltip label="Delete permanently">
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => openDeleteDialog(item)}
                              aria-label="Delete permanently"
                            />
                          </Tooltip>
                        </HStack>
                      </VStack>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {recycleBinItems.length > 0 && (
            <Text fontSize="xs" color={textColor} textAlign="center">
              {recycleBinItems.length} item{recycleBinItems.length !== 1 ? 's' : ''} in recycle bin
            </Text>
          )}
        </VStack>
      </Box>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Permanently Delete File
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to permanently delete "{selectedItem?.original_name}"? 
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => permanentlyDelete(selectedItem)} 
                ml={3}
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}