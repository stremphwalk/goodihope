import { useState, useEffect } from 'react'
import { SmartOptionsModal } from './SmartOptionsModal'
import { SmartOptionsParser, type SmartOption as BaseSmartOption } from '../lib/smartOptionsParser'

interface SmartOption extends BaseSmartOption {
  selectedIndex: number;
  position: { x: number; y: number };
}

interface SmartOptionsWorkflow {
  expansionId: string
  content: string
  phrase: any
  currentOptions: BaseSmartOption[]
  currentOptionIndex: number
  selections: Record<string, string>
}

export function SmartOptionsManager() {
  const [workflow, setWorkflow] = useState<SmartOptionsWorkflow | null>(null)
  const [currentOption, setCurrentOption] = useState<SmartOption | null>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!window.electronAPI) return

    // Listen for smart options requests from main process
    window.electronAPI.onShowSmartOptions((data: any) => {
      handleSmartOptionsRequest(data)
    })

    return () => {
      window.electronAPI.removeAllListeners('show-smart-options')
    }
  }, [])

  const handleSmartOptionsRequest = async (data: {
    expansionId: string
    content: string
    phrase: any
  }) => {
    // Parse the content to extract all smart options
    const parsed = SmartOptionsParser.parseContent(data.content)
    
    if (parsed.smartOptions.length === 0) {
      // No interactive options, complete immediately
      window.electronAPI.completeSmartOptions(data.expansionId, [])
      return
    }

    // Get current cursor position
    const position = await window.electronAPI.getCursorPosition()
    setCursorPosition(position)

    // Start the workflow
    const newWorkflow: SmartOptionsWorkflow = {
      expansionId: data.expansionId,
      content: data.content,
      phrase: data.phrase,
      currentOptions: parsed.smartOptions,
      currentOptionIndex: 0,
      selections: {}
    }

    setWorkflow(newWorkflow)
    showNextOption(newWorkflow)
  }

  const showNextOption = (currentWorkflow: SmartOptionsWorkflow) => {
    if (currentWorkflow.currentOptionIndex >= currentWorkflow.currentOptions.length) {
      // All options completed, finalize expansion
      completeWorkflow(currentWorkflow)
      return
    }

    const option = currentWorkflow.currentOptions[currentWorkflow.currentOptionIndex]
    setCurrentOption({
      ...option,
      selectedIndex: 0,
      position: cursorPosition
    } as SmartOption)
  }

  const handleOptionSelect = (optionId: string, selectedValue: string) => {
    if (!workflow) return

    // Store the selection
    const updatedSelections = {
      ...workflow.selections,
      [optionId]: selectedValue
    }

    // Move to next option
    const updatedWorkflow = {
      ...workflow,
      selections: updatedSelections,
      currentOptionIndex: workflow.currentOptionIndex + 1
    }

    setWorkflow(updatedWorkflow)
    setCurrentOption(null)

    // Show next option after a brief delay for smooth UX
    setTimeout(() => {
      showNextOption(updatedWorkflow)
    }, 100)
  }

  const handleCancel = () => {
    if (workflow) {
      window.electronAPI.cancelSmartOptions(workflow.expansionId)
    }
    resetWorkflow()
  }

  const completeWorkflow = (completedWorkflow: SmartOptionsWorkflow) => {
    // Convert selections to the format expected by the main process
    const selections = Object.entries(completedWorkflow.selections).map(([optionId, selectedValue]) => ({
      optionId,
      selectedValue
    }))

    // Send selections to main process
    window.electronAPI.completeSmartOptions(completedWorkflow.expansionId, selections)
    
    resetWorkflow()
  }

  const resetWorkflow = () => {
    setWorkflow(null)
    setCurrentOption(null)
  }

  return (
    <>
      {currentOption && (
        <SmartOptionsModal
          option={currentOption}
          onSelect={handleOptionSelect}
          onCancel={handleCancel}
        />
      )}
      
      {workflow && (
        <div className="fixed top-4 right-4 z-50">
          <div className="glass-morphism rounded-lg p-3 text-sm">
            <div className="text-gray-600 mb-1">Smart Options Progress</div>
            <div className="text-blue-600 font-medium">
              {workflow.currentOptionIndex} of {workflow.currentOptions.length} completed
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {workflow.phrase.trigger} expansion
            </div>
          </div>
        </div>
      )}
    </>
  )
}