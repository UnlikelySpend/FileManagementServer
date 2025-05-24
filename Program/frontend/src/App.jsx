import { Box, useColorMode, Button, Heading, Flex } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'
import EnhancedFileManager from './components/EnhancedFileManager'

function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <Button
      onClick={toggleColorMode}
      size="md"
      variant="ghost"
    >
      {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Box minH="100vh" p={4}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">File Management System</Heading>
          <ThemeToggle />
        </Flex>
        <EnhancedFileManager />
      </Box>
    </BrowserRouter>
  )
}

export default App 