import { createContext, useContext, useState } from 'react'
import { useToast } from '@chakra-ui/react'

const ClipboardContext = createContext()

export const useClipboard = () => {
  const context = useContext(ClipboardContext)
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider')
  }
  return context
}

export const ClipboardProvider = ({ children }) => {
  const [clipboard, setClipboard] = useState({
    files: [],
    operation: null, // 'copy' or 'cut'
    source: null
  })
  const toast = useToast()

  const copyFiles = (files, sourcePath) => {
    const fileArray = Array.isArray(files) ? files : [files]
    setClipboard({
      files: fileArray,
      operation: 'copy',
      source: sourcePath
    })
    
    toast({
      title: 'Files copied',
      description: `${fileArray.length} file(s) copied to clipboard`,
      status: 'info',
      duration: 2000,
    })
  }

  const cutFiles = (files, sourcePath) => {
    const fileArray = Array.isArray(files) ? files : [files]
    setClipboard({
      files: fileArray,
      operation: 'cut',
      source: sourcePath
    })
    
    toast({
      title: 'Files cut',
      description: `${fileArray.length} file(s) cut to clipboard`,
      status: 'info',
      duration: 2000,
    })
  }

  const clearClipboard = () => {
    setClipboard({
      files: [],
      operation: null,
      source: null
    })
  }

  const hasClipboardContent = () => {
    return clipboard.files.length > 0 && clipboard.operation !== null
  }

  const canPaste = (currentPath) => {
    return hasClipboardContent() && clipboard.source !== currentPath
  }

  return (
    <ClipboardContext.Provider value={{
      clipboard,
      copyFiles,
      cutFiles,
      clearClipboard,
      hasClipboardContent,
      canPaste
    }}>
      {children}
    </ClipboardContext.Provider>
  )
}