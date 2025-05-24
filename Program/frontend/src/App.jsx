import { 
  Box, 
  useColorMode, 
  Heading, 
  Flex, 
  HStack, 
  Text, 
  useColorModeValue,
  Switch,
  VStack,
  Select,
  useToast,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton
} from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { SunIcon, MoonIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { useState, useEffect } from 'react'
import EnhancedFileManager from './components/EnhancedFileManager'
import { ClipboardProvider } from './contexts/ClipboardContext'

function ThemeControls() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('theme-color') || 'blue'
  })
  const toast = useToast()

  const themes = {
    blue: { name: 'Ocean Blue', color: 'blue', icon: '🌊' },
    green: { name: 'Forest Green', color: 'green', icon: '🌿' },
    purple: { name: 'Royal Purple', color: 'purple', icon: '💜' },
    orange: { name: 'Sunset Orange', color: 'orange', icon: '🌅' },
    pink: { name: 'Cherry Blossom', color: 'pink', icon: '🌸' },
    teal: { name: 'Tropical Teal', color: 'teal', icon: '🐚' }
  }

  const changeThemeColor = (newColor) => {
    setThemeColor(newColor)
    localStorage.setItem('theme-color', newColor)
    
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement
    const colors = {
      blue: { primary: '#3182CE', secondary: '#63B3ED', accent: '#BEE3F8' },
      green: { primary: '#38A169', secondary: '#68D391', accent: '#C6F6D5' },
      purple: { primary: '#805AD5', secondary: '#B794F6', accent: '#E9D8FD' },
      orange: { primary: '#DD6B20', secondary: '#F6AD55', accent: '#FED7AA' },
      pink: { primary: '#D53F8C', secondary: '#F687B3', accent: '#FED7E2' },
      teal: { primary: '#319795', secondary: '#4FD1C7', accent: '#B2F5EA' }
    }
    
    if (colors[newColor]) {
      root.style.setProperty('--theme-primary', colors[newColor].primary)
      root.style.setProperty('--theme-secondary', colors[newColor].secondary)
      root.style.setProperty('--theme-accent', colors[newColor].accent)
    }
    
    toast({
      title: `Theme changed to ${themes[newColor].name}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  useEffect(() => {
    // Apply saved theme on load
    changeThemeColor(themeColor)
  }, [themeColor])
  
  return (
    <VStack spacing={3} align="stretch">
      {/* Dark/Light Mode Toggle */}
      <VStack spacing={2}>
        <HStack spacing={3} align="center">
          <SunIcon 
            color={colorMode === 'light' ? 'orange.400' : 'gray.400'} 
            boxSize={4}
          />
          <Box position="relative">
            <Switch
              size="lg"
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
              colorScheme={themeColor}
              css={{
                '& .chakra-switch__track': {
                  background: colorMode === 'light' ? '#FED7D7' : '#2D3748',
                  _checked: {
                    background: `var(--theme-primary)`,
                  },
                },
                '& .chakra-switch__thumb': {
                  background: colorMode === 'light' ? '#FBB6CE' : `var(--theme-secondary)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }
              }}
            />
          </Box>
          <MoonIcon 
            color={colorMode === 'dark' ? 'purple.300' : 'gray.400'} 
            boxSize={4}
          />
        </HStack>
        <Text 
          fontSize="xs" 
          color={useColorModeValue('gray.600', 'gray.400')}
          fontWeight="medium"
        >
          {colorMode === 'light' ? 'Light Mode' : 'Dark Mode'}
        </Text>
      </VStack>

      {/* Theme Color Selector */}
      <VStack spacing={2}>
        <Text 
          fontSize="xs" 
          color={useColorModeValue('gray.600', 'gray.400')}
          fontWeight="medium"
        >
          Theme Color
        </Text>
        <Menu>
          <MenuButton 
            as={Button} 
            rightIcon={<ChevronDownIcon />}
            size="sm"
            colorScheme={themeColor}
            variant="outline"
            minW="120px"
          >
            {themes[themeColor].icon} {themes[themeColor].name}
          </MenuButton>
          <MenuList>
            {Object.entries(themes).map(([key, theme]) => (
              <MenuItem 
                key={key}
                onClick={() => changeThemeColor(key)}
                bg={themeColor === key ? `${theme.color}.50` : 'transparent'}
                _dark={{
                  bg: themeColor === key ? `${theme.color}.900` : 'transparent'
                }}
              >
                <HStack>
                  <Text fontSize="lg">{theme.icon}</Text>
                  <Text>{theme.name}</Text>
                </HStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </VStack>
    </VStack>
  )
}

function App() {
  // Initialize CSS custom properties on mount
  useEffect(() => {
    const root = document.documentElement
    if (!root.style.getPropertyValue('--theme-primary')) {
      // Set default blue theme
      root.style.setProperty('--theme-primary', '#3182CE')
      root.style.setProperty('--theme-secondary', '#63B3ED')
      root.style.setProperty('--theme-accent', '#BEE3F8')
    }
  }, [])

  return (
    <BrowserRouter>
      <ClipboardProvider>
        <Box minH="100vh" p={4}>
          <Flex justify="space-between" align="flex-start" mb={6}>
            <Heading size="lg" color="blue.500">
              🗂️ File Management System
            </Heading>
            <ThemeControls />
          </Flex>
          <EnhancedFileManager />
        </Box>
      </ClipboardProvider>
    </BrowserRouter>
  )
}

export default App 