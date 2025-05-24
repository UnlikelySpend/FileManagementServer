import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Text,
  Divider,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'

export default function AdvancedSearch({ isOpen, onClose, onSearch, currentPath }) {
  const [filters, setFilters] = useState({
    query: '',
    file_type: '',
    min_size: 0,
    max_size: 0,
    date_from: '',
    date_to: '',
    path: currentPath || '',
    recursive: true,
    sort_by: 'name',
    sort_order: 'asc'
  })

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = () => {
    // Clean up empty values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => 
        value !== '' && value !== 0 && value !== false
      )
    )
    
    onSearch(cleanedFilters)
    onClose()
  }

  const resetFilters = () => {
    setFilters({
      query: '',
      file_type: '',
      min_size: 0,
      max_size: 0,
      date_from: '',
      date_to: '',
      path: currentPath || '',
      recursive: true,
      sort_by: 'name',
      sort_order: 'asc'
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Advanced Search</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Search Query */}
            <FormControl>
              <FormLabel>Search Query</FormLabel>
              <Input
                placeholder="Enter filename or keyword"
                value={filters.query}
                onChange={(e) => handleInputChange('query', e.target.value)}
              />
            </FormControl>

            <Divider />

            {/* File Type Filter */}
            <FormControl>
              <FormLabel>File Type</FormLabel>
              <Select
                placeholder="All file types"
                value={filters.file_type}
                onChange={(e) => handleInputChange('file_type', e.target.value)}
              >
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
                <option value="archive">Archives</option>
              </Select>
            </FormControl>

            {/* Size Filters */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">File Size</Text>
              <HStack>
                <FormControl>
                  <FormLabel fontSize="sm">Min Size (MB)</FormLabel>
                  <NumberInput
                    min={0}
                    value={filters.min_size / (1024 * 1024)}
                    onChange={(valueString, valueNumber) => 
                      handleInputChange('min_size', Math.round((valueNumber || 0) * 1024 * 1024))
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Max Size (MB)</FormLabel>
                  <NumberInput
                    min={0}
                    value={filters.max_size / (1024 * 1024)}
                    onChange={(valueString, valueNumber) => 
                      handleInputChange('max_size', Math.round((valueNumber || 0) * 1024 * 1024))
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>
              {(filters.min_size > 0 || filters.max_size > 0) && (
                <HStack>
                  {filters.min_size > 0 && (
                    <Badge colorScheme="blue">
                      Min: {formatFileSize(filters.min_size)}
                    </Badge>
                  )}
                  {filters.max_size > 0 && (
                    <Badge colorScheme="blue">
                      Max: {formatFileSize(filters.max_size)}
                    </Badge>
                  )}
                </HStack>
              )}
            </VStack>

            <Divider />

            {/* Date Filters */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">Modified Date</Text>
              <HStack>
                <FormControl>
                  <FormLabel fontSize="sm">From</FormLabel>
                  <Input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleInputChange('date_from', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">To</FormLabel>
                  <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleInputChange('date_to', e.target.value)}
                  />
                </FormControl>
              </HStack>
            </VStack>

            <Divider />

            {/* Search Location */}
            <FormControl>
              <FormLabel>Search Location</FormLabel>
              <Input
                placeholder="/ (root folder)"
                value={filters.path}
                onChange={(e) => handleInputChange('path', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <HStack justify="space-between">
                <FormLabel htmlFor="recursive" mb="0">
                  Search in subdirectories
                </FormLabel>
                <Switch
                  id="recursive"
                  isChecked={filters.recursive}
                  onChange={(e) => handleInputChange('recursive', e.target.checked)}
                />
              </HStack>
            </FormControl>

            <Divider />

            {/* Sort Options */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">Sort Results</Text>
              <HStack>
                <FormControl>
                  <FormLabel fontSize="sm">Sort By</FormLabel>
                  <Select
                    value={filters.sort_by}
                    onChange={(e) => handleInputChange('sort_by', e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="modified">Modified</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Order</FormLabel>
                  <Select
                    value={filters.sort_order}
                    onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={resetFilters}>
            Reset
          </Button>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSearch}>
            Search
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}