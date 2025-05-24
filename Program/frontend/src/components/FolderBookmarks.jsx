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
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, StarIcon, ViewIcon } from '@chakra-ui/icons'
import { FaFolder, FaBookmark } from 'react-icons/fa'
import { useRef } from 'react'

export default function FolderBookmarks({ currentPath, onFolderNavigate }) {
  const [bookmarks, setBookmarks] = useState([])
  const [bookmarkName, setBookmarkName] = useState('')
  const [selectedBookmark, setSelectedBookmark] = useState(null)
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef()
  const toast = useToast()
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('folder-bookmarks')
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks))
      } catch (error) {
        console.error('Error loading bookmarks:', error)
        setBookmarks([])
      }
    }
  }, [])

  // Save bookmarks to localStorage
  const saveBookmarks = (newBookmarks) => {
    localStorage.setItem('folder-bookmarks', JSON.stringify(newBookmarks))
    setBookmarks(newBookmarks)
  }

  const addBookmark = () => {
    if (!bookmarkName.trim()) {
      toast({
        title: 'Please enter a bookmark name',
        status: 'warning',
        duration: 2000,
      })
      return
    }

    // Check if bookmark already exists
    const existingBookmark = bookmarks.find(b => b.path === currentPath)
    if (existingBookmark) {
      toast({
        title: 'Bookmark already exists',
        description: `This folder is already bookmarked as "${existingBookmark.name}"`,
        status: 'info',
        duration: 3000,
      })
      onAddClose()
      return
    }

    const newBookmark = {
      id: Date.now().toString(),
      name: bookmarkName.trim(),
      path: currentPath,
      created: new Date().toISOString()
    }

    const newBookmarks = [...bookmarks, newBookmark]
    saveBookmarks(newBookmarks)
    
    toast({
      title: 'Bookmark added',
      description: `Added "${bookmarkName}" to bookmarks`,
      status: 'success',
      duration: 2000,
    })
    
    setBookmarkName('')
    onAddClose()
  }

  const removeBookmark = (bookmark) => {
    const newBookmarks = bookmarks.filter(b => b.id !== bookmark.id)
    saveBookmarks(newBookmarks)
    
    toast({
      title: 'Bookmark removed',
      description: `Removed "${bookmark.name}" from bookmarks`,
      status: 'success',
      duration: 2000,
    })
    
    onDeleteClose()
  }

  const openAddDialog = () => {
    if (!currentPath) {
      toast({
        title: 'Cannot bookmark root folder',
        description: 'Navigate to a subfolder to create a bookmark',
        status: 'warning',
        duration: 3000,
      })
      return
    }
    
    // Suggest a name based on the current path
    const folderName = currentPath.split('/').pop() || 'Folder'
    setBookmarkName(folderName)
    onAddOpen()
  }

  const openDeleteDialog = (bookmark) => {
    setSelectedBookmark(bookmark)
    onDeleteOpen()
  }

  const navigateToBookmark = (bookmark) => {
    onFolderNavigate(bookmark.path)
    toast({
      title: 'Navigated to bookmark',
      description: bookmark.name,
      status: 'info',
      duration: 1500,
    })
  }

  return (
    <>
      <Box
        w="100%"
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="md"
        p={4}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FaBookmark color="var(--theme-primary)" />
              <Text fontWeight="bold" fontSize="lg">Bookmarks</Text>
            </HStack>
            <Tooltip label="Add current folder to bookmarks">
              <IconButton
                icon={<AddIcon />}
                size="sm"
                variant="ghost"
                onClick={openAddDialog}
                aria-label="Add bookmark"
                isDisabled={!currentPath}
              />
            </Tooltip>
          </HStack>

          <Box maxH="300px" overflowY="auto">
            {bookmarks.length === 0 ? (
              <Box textAlign="center" py={8}>
                <VStack spacing={2}>
                  <Text color={textColor} fontSize="sm">
                    No bookmarks yet
                  </Text>
                  <Text color={textColor} fontSize="xs">
                    Navigate to a folder and click + to bookmark it
                  </Text>
                </VStack>
              </Box>
            ) : (
              <List spacing={2}>
                {bookmarks.map((bookmark) => (
                  <ListItem key={bookmark.id}>
                    <Box
                      p={3}
                      borderRadius="md"
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                      onClick={() => navigateToBookmark(bookmark)}
                      border="1px solid"
                      borderColor={currentPath === bookmark.path ? 'var(--theme-primary)' : 'transparent'}
                    >
                      <HStack justify="space-between">
                        <HStack flex="1">
                          <FaFolder color="#E2A308" />
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                              {bookmark.name}
                            </Text>
                            <Text fontSize="xs" color={textColor} noOfLines={1}>
                              {bookmark.path || '/'}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack spacing={1}>
                          <Tooltip label="Navigate to folder">
                            <IconButton
                              icon={<ViewIcon />}
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigateToBookmark(bookmark)
                              }}
                              aria-label="Navigate to folder"
                            />
                          </Tooltip>
                          <Tooltip label="Remove bookmark">
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(bookmark)
                              }}
                              aria-label="Remove bookmark"
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {bookmarks.length > 0 && (
            <Text fontSize="xs" color={textColor} textAlign="center">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Add Bookmark Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Bookmark</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Bookmark Name</FormLabel>
                <Input
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                  placeholder="Enter bookmark name"
                  onKeyPress={(e) => e.key === 'Enter' && addBookmark()}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Folder Path</FormLabel>
                <Input
                  value={currentPath || '/'}
                  isReadOnly
                  bg={useColorModeValue('gray.100', 'gray.700')}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={addBookmark}>
              Add Bookmark
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Bookmark Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Bookmark
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove the bookmark "{selectedBookmark?.name}"?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => removeBookmark(selectedBookmark)} 
                ml={3}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}