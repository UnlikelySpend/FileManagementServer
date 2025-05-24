import { useState, useEffect, useRef, useCallback } from 'react'
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
  Center,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  InputGroup,
  InputLeftElement,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Image,
  Wrap,
  WrapItem,
  Card,
  CardBody,
  Spinner,
  Badge,
  Tooltip
} from '@chakra-ui/react'
import { 
  DeleteIcon, 
  DownloadIcon, 
  AddIcon, 
  ViewIcon, 
  SearchIcon,
  ChevronRightIcon,
  CopyIcon,
  DragHandleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  AttachmentIcon,
  ChevronLeftIcon,
  ChevronDownIcon
} from '@chakra-ui/icons'
import { FaFolder, FaFile, FaImage } from 'react-icons/fa'
import axios from 'axios'
import FileViewer from './FileViewer'
import RecentFiles from './RecentFiles'
import RecycleBin from './RecycleBin'
import FolderBookmarks from './FolderBookmarks'
import AdvancedSearch from './AdvancedSearch'
import { useClipboard } from '../contexts/ClipboardContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function EnhancedFileManager() {
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [viewerFile, setViewerFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [loading, setLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [activeFilters, setActiveFilters] = useState(null)
  
  const { isOpen: isViewerOpen, onOpen: onViewerOpen, onClose: onViewerClose } = useDisclosure()
  const { isOpen: isFolderOpen, onOpen: onFolderOpen, onClose: onFolderClose } = useDisclosure()
  const { isOpen: isOperationOpen, onOpen: onOperationOpen, onClose: onOperationClose } = useDisclosure()
  const { isOpen: isAdvancedSearchOpen, onOpen: onAdvancedSearchOpen, onClose: onAdvancedSearchClose } = useDisclosure()
  
  const [newFolderName, setNewFolderName] = useState('')
  const [operation, setOperation] = useState({ type: '', destination: '' })
  
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const toast = useToast()
  const { clipboard, copyFiles, cutFiles, canPaste, hasClipboardContent } = useClipboard()
  
  const dragBg = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const selectedBg = useColorModeValue('blue.100', 'blue.800')

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      if (isSearchMode && activeFilters) {
        // Use advanced search
        const response = await axios.get(`${API_URL}/search`, {
          params: activeFilters
        })
        setSearchResults(response.data.files)
        setFiles(response.data.files)
      } else {
        // Use regular file listing
        const response = await axios.get(`${API_URL}/files`, {
          params: {
            path: currentPath,
            search: searchQuery,
            sort_by: sortBy,
            sort_order: sortOrder
          }
        })
        setFiles(response.data.files)
        setBreadcrumbs(response.data.breadcrumbs)
      }
    } catch (error) {
      toast({
        title: 'Error fetching files',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }, [currentPath, searchQuery, sortBy, sortOrder, isSearchMode, activeFilters, toast])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault()
            selectAll()
            break
          case 'c':
            if (selectedFiles.size > 0) {
              e.preventDefault()
              copyFiles(Array.from(selectedFiles), currentPath)
            }
            break
          case 'x':
            if (selectedFiles.size > 0) {
              e.preventDefault()
              cutFiles(Array.from(selectedFiles), currentPath)
            }
            break
          case 'v':
            if (canPaste(currentPath)) {
              e.preventDefault()
              handlePaste()
            }
            break
          case 'Delete':
            if (selectedFiles.size > 0) {
              e.preventDefault()
              handleBulkDelete()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedFiles, currentPath, canPaste])

  const handleFileUpload = async (files) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        await axios.post(`${API_URL}/upload?path=${currentPath}`, formData)
        toast({
          title: 'File uploaded',
          description: `${file.name} uploaded successfully`,
          status: 'success',
          duration: 2000,
        })
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error.message,
          status: 'error',
          duration: 3000,
        })
      }
    }
    fetchFiles()
  }

  const handleFolderUpload = async (files) => {
    if (files.length === 0) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/upload-folder?path=${currentPath}`, formData)
      toast({
        title: 'Folder uploaded',
        description: response.data.message,
        status: 'success',
        duration: 3000,
      })
      fetchFiles()
    } catch (error) {
      toast({
        title: 'Folder upload failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleDelete = async (filePath) => {
    try {
      await axios.delete(`${API_URL}/files/${filePath}`)
      toast({
        title: 'File deleted',
        status: 'success',
        duration: 2000,
      })
      fetchFiles()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return

    try {
      const response = await axios.post(`${API_URL}/files/bulk-delete`, {
        files: Array.from(selectedFiles)
      })
      
      toast({
        title: 'Files deleted',
        description: response.data.message,
        status: 'success',
        duration: 2000,
      })
      
      setSelectedFiles(new Set())
      fetchFiles()
    } catch (error) {
      toast({
        title: 'Bulk delete failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleDownload = (filePath) => {
    window.open(`${API_URL}/download/${filePath}`, '_blank')
  }

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return

    const files = Array.from(selectedFiles).join(',')
    window.open(`${API_URL}/files/download-multiple?files=${encodeURIComponent(files)}`, '_blank')
  }

  const handleView = (file) => {
    setViewerFile(file)
    onViewerOpen()
  }

  const handleFileSelect = (file) => {
    setViewerFile(file)
    onViewerOpen()
  }

  const handleFolderNavigate = (folderPath) => {
    setCurrentPath(folderPath)
    setSelectedFiles(new Set())
    setIsSearchMode(false) // Exit search mode when navigating
    setActiveFilters(null)
  }

  const handleAdvancedSearch = (filters) => {
    setActiveFilters(filters)
    setIsSearchMode(true)
    setCurrentPath('') // Clear current path for search
    setSelectedFiles(new Set())
  }

  const clearSearch = () => {
    setIsSearchMode(false)
    setActiveFilters(null)
    setSearchResults([])
    setSearchQuery('')
    setSelectedFiles(new Set())
  }

  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath)
    setSelectedFiles(new Set())
  }

  const navigateToBreadcrumb = (index) => {
    const newPath = breadcrumbs.slice(0, index + 1).join('/')
    setCurrentPath(newPath)
    setSelectedFiles(new Set())
  }

  const toggleFileSelection = (filePath) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath)
    } else {
      newSelection.add(filePath)
    }
    setSelectedFiles(newSelection)
  }

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)))
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      await axios.post(`${API_URL}/folders`, {
        name: newFolderName,
        path: currentPath
      })
      
      toast({
        title: 'Folder created',
        status: 'success',
        duration: 2000,
      })
      
      setNewFolderName('')
      onFolderClose()
      fetchFiles()
    } catch (error) {
      toast({
        title: 'Failed to create folder',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handlePaste = async () => {
    if (!canPaste(currentPath)) return

    try {
      const response = await axios.post(`${API_URL}/files/operation`, {
        files: clipboard.files,
        operation: clipboard.operation === 'cut' ? 'move' : 'copy',
        destination: currentPath
      })
      
      toast({
        title: 'Paste completed',
        description: response.data.message,
        status: 'success',
        duration: 2000,
      })
      
      fetchFiles()
      setSelectedFiles(new Set())
    } catch (error) {
      toast({
        title: 'Paste failed',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleOperation = (type) => {
    if (selectedFiles.size === 0) return
    setOperation({ type, destination: currentPath })
    onOperationOpen()
  }

  const executeOperation = async () => {
    try {
      const response = await axios.post(`${API_URL}/files/operation`, {
        files: Array.from(selectedFiles),
        operation: operation.type,
        destination: operation.destination
      })
      
      toast({
        title: 'Operation completed',
        description: response.data.message,
        status: 'success',
        duration: 2000,
      })
      
      setSelectedFiles(new Set())
      onOperationClose()
      fetchFiles()
    } catch (error) {
      toast({
        title: 'Operation failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getFileIcon = (file) => {
    if (file.type === 'directory') return <FaFolder />
    if (file.isImage) return <FaImage />
    return <FaFile />
  }

  return (
    <HStack spacing={4} align="stretch" h="full">
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <VStack spacing={4} align="stretch" h="100%" minH="600px">
          <FolderBookmarks 
            currentPath={currentPath}
            onFolderNavigate={handleFolderNavigate}
          />
          <RecentFiles 
            onFileSelect={handleFileSelect}
            onFolderNavigate={handleFolderNavigate}
          />
          <RecycleBin onRefresh={fetchFiles} />
        </VStack>
      )}
      
      {/* Sidebar Toggle */}
      <Box>
        <Tooltip label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}>
          <IconButton
            icon={sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="sm"
            aria-label="Toggle sidebar"
          />
        </Tooltip>
      </Box>

      {/* Main Content */}
      <VStack spacing={4} align="stretch" flex="1" h="full">
        {/* Header */}
        <HStack spacing={4}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} maxW="150px">
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="modified">Modified</option>
        </Select>
        
        <IconButton
          icon={sortOrder === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          aria-label="Toggle sort order"
        />
        
        <Button
          leftIcon={<SearchIcon />}
          onClick={onAdvancedSearchOpen}
          colorScheme="purple"
          variant="outline"
        >
          Advanced Search
        </Button>
        
        {isSearchMode && (
          <Button
            onClick={clearSearch}
            colorScheme="gray"
            variant="outline"
          >
            Clear Search
          </Button>
        )}
        
        <Button
          leftIcon={<AddIcon />}
          onClick={onFolderOpen}
          colorScheme="blue"
          variant="outline"
        >
          New Folder
        </Button>
        
        <Input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          display="none"
          multiple
        />
        <Button
          leftIcon={<AddIcon />}
          onClick={() => fileInputRef.current?.click()}
          colorScheme="blue"
        >
          Upload Files
        </Button>
        
        <Input
          type="file"
          ref={folderInputRef}
          onChange={(e) => handleFolderUpload(e.target.files)}
          display="none"
          webkitdirectory="true"
          multiple
        />
        <Button
          leftIcon={<AddIcon />}
          onClick={() => folderInputRef.current?.click()}
          colorScheme="green"
          variant="outline"
        >
          Upload Folder
        </Button>
        
        {canPaste(currentPath) && (
          <Button
            leftIcon={<AttachmentIcon />}
            onClick={handlePaste}
            colorScheme="purple"
            variant="outline"
          >
            Paste ({clipboard.files.length})
          </Button>
        )}
        
        {selectedFiles.size > 0 && (
          <>
            <Button
              leftIcon={<DownloadIcon />}
              onClick={handleBulkDownload}
              variant="outline"
            >
              Download as ZIP ({selectedFiles.size})
            </Button>
            <Button
              leftIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              colorScheme="red"
              variant="outline"
            >
              Delete ({selectedFiles.size})
            </Button>
            <Menu>
              <MenuButton as={Button} variant="outline">
                More Actions
              </MenuButton>
              <MenuList>
                <MenuItem icon={<CopyIcon />} onClick={() => copyFiles(Array.from(selectedFiles), currentPath)}>
                  Copy
                </MenuItem>
                <MenuItem icon={<DragHandleIcon />} onClick={() => cutFiles(Array.from(selectedFiles), currentPath)}>
                  Cut
                </MenuItem>
              </MenuList>
            </Menu>
          </>
        )}
      </HStack>

      {/* Breadcrumbs or Search Results Header */}
      {isSearchMode ? (
        <Box>
          <HStack spacing={4} mb={2}>
            <Text fontWeight="bold" fontSize="lg">
              Search Results
            </Text>
            {activeFilters && (
              <Badge colorScheme="blue">
                {files.length} file{files.length !== 1 ? 's' : ''} found
              </Badge>
            )}
          </HStack>
          {activeFilters && (
            <HStack spacing={2} flexWrap="wrap">
              {activeFilters.query && (
                <Badge variant="outline">Query: "{activeFilters.query}"</Badge>
              )}
              {activeFilters.file_type && (
                <Badge variant="outline" colorScheme="purple">
                  Type: {activeFilters.file_type}
                </Badge>
              )}
              {activeFilters.min_size > 0 && (
                <Badge variant="outline" colorScheme="green">
                  Min: {Math.round(activeFilters.min_size / (1024 * 1024))}MB
                </Badge>
              )}
              {activeFilters.max_size > 0 && (
                <Badge variant="outline" colorScheme="red">
                  Max: {Math.round(activeFilters.max_size / (1024 * 1024))}MB
                </Badge>
              )}
              {activeFilters.date_from && (
                <Badge variant="outline" colorScheme="orange">
                  From: {activeFilters.date_from}
                </Badge>
              )}
              {activeFilters.date_to && (
                <Badge variant="outline" colorScheme="orange">
                  To: {activeFilters.date_to}
                </Badge>
              )}
              {!activeFilters.recursive && (
                <Badge variant="outline" colorScheme="gray">
                  Current folder only
                </Badge>
              )}
            </HStack>
          )}
        </Box>
      ) : (
        <Breadcrumb separator={<ChevronRightIcon color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => setCurrentPath('')}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink onClick={() => navigateToBreadcrumb(index)}>
                {crumb}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}

      {/* File List */}
      <Box
        flex="1"
        borderWidth={2}
        borderColor={isDragging ? 'blue.400' : borderColor}
        borderStyle="dashed"
        borderRadius="md"
        bg={isDragging ? dragBg : 'transparent'}
        p={4}
        overflowY="auto"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <Center h="200px">
            <Spinner size="xl" />
          </Center>
        ) : files.length === 0 ? (
          <Center h="200px">
            <VStack>
              <Text fontSize="lg" color="gray.500">
                {searchQuery ? 'No files found' : 'No files in this folder'}
              </Text>
              <Text fontSize="sm" color="gray.400">
                Drag and drop files here or click the upload button
              </Text>
            </VStack>
          </Center>
        ) : viewMode === 'list' ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="40px">
                  <Checkbox
                    isChecked={selectedFiles.size === files.length && files.length > 0}
                    isIndeterminate={selectedFiles.size > 0 && selectedFiles.size < files.length}
                    onChange={selectAll}
                  />
                </Th>
                <Th>Name</Th>
                <Th>Size</Th>
                <Th>Modified</Th>
                <Th width="200px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {files.map((file) => (
                <Tr
                  key={file.path}
                  _hover={{ bg: hoverBg }}
                  bg={selectedFiles.has(file.path) ? selectedBg : 'transparent'}
                  cursor={file.type === 'directory' ? 'pointer' : 'default'}
                >
                  <Td>
                    <Checkbox
                      isChecked={selectedFiles.has(file.path)}
                      onChange={() => toggleFileSelection(file.path)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Td>
                  <Td
                    onClick={() => file.type === 'directory' && navigateToFolder(file.path)}
                  >
                    <HStack>
                      {getFileIcon(file)}
                      <Text>{file.name}</Text>
                      {file.isImage && (
                        <Badge colorScheme="purple" size="sm">Image</Badge>
                      )}
                    </HStack>
                  </Td>
                  <Td>{formatFileSize(file.size)}</Td>
                  <Td>{formatDate(file.modified)}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Tooltip label={file.type === 'directory' ? "View Folder Contents" : "View File"}>
                        <IconButton
                          icon={<ViewIcon />}
                          size="sm"
                          onClick={() => file.type === 'directory' ? navigateToFolder(file.path) : handleView(file)}
                          aria-label={file.type === 'directory' ? "View folder" : "View file"}
                        />
                      </Tooltip>
                      <Tooltip label={file.type === 'directory' ? "Download Folder as ZIP" : "Download File"}>
                        <IconButton
                          icon={<DownloadIcon />}
                          size="sm"
                          onClick={() => handleDownload(file.path)}
                          aria-label={file.type === 'directory' ? "Download folder" : "Download file"}
                        />
                      </Tooltip>
                      <Tooltip label="Delete">
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(file.path)}
                          aria-label="Delete file"
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Wrap spacing={4}>
            {files.map((file) => (
              <WrapItem key={file.path}>
                <Card
                  w="150px"
                  cursor={file.type === 'directory' ? 'pointer' : 'default'}
                  onClick={() => file.type === 'directory' && navigateToFolder(file.path)}
                  borderWidth={selectedFiles.has(file.path) ? 2 : 0}
                  borderColor="blue.500"
                >
                  <CardBody>
                    <VStack>
                      <Checkbox
                        isChecked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {file.isImage ? (
                        <Image
                          src={`${API_URL}/files/${file.path}/thumbnail?size=100`}
                          alt={file.name}
                          boxSize="100px"
                          objectFit="cover"
                        />
                      ) : (
                        <Box fontSize="4xl">{getFileIcon(file)}</Box>
                      )}
                      <Text fontSize="sm" noOfLines={2}>
                        {file.name}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Box>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewer
          isOpen={isViewerOpen}
          onClose={onViewerClose}
          file={viewerFile}
          onSave={fetchFiles}
        />
      )}

      {/* Create Folder Modal */}
      <Modal isOpen={isFolderOpen} onClose={onFolderClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Folder</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Folder Name</FormLabel>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFolderClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateFolder}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* File Operation Modal */}
      <Modal isOpen={isOperationOpen} onClose={onOperationClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{operation.type === 'copy' ? 'Copy' : 'Move'} Files</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Destination Path</FormLabel>
              <Input
                value={operation.destination}
                onChange={(e) => setOperation({ ...operation, destination: e.target.value })}
                placeholder="Enter destination path"
              />
            </FormControl>
            <Text mt={2} fontSize="sm" color="gray.500">
              {selectedFiles.size} file(s) selected
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onOperationClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={executeOperation}>
              {operation.type === 'copy' ? 'Copy' : 'Move'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={isAdvancedSearchOpen}
        onClose={onAdvancedSearchClose}
        onSearch={handleAdvancedSearch}
        currentPath={currentPath}
      />
      </VStack>
    </HStack>
  )
}