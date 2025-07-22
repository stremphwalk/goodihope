import { useState, useEffect } from 'react'
import { DatePickerModal } from './DatePickerModal'
import { CalculatorModal } from './CalculatorModal'

interface SpecialFunctionRequest {
  expansionId: string
  functionType: 'date' | 'calc'
  position: { x: number; y: number }
}

export function SpecialFunctionsManager() {
  const [currentRequest, setCurrentRequest] = useState<SpecialFunctionRequest | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return

    // Listen for special function requests
    const handleSpecialFunctionRequest = (data: {
      expansionId: string
      content: string
      phrase: any
    }) => {
      handleSpecialFunction(data)
    }

    // We'll intercept smart options events and check for special functions
    window.electronAPI.onShowSmartOptions(handleSpecialFunctionRequest)

    return () => {
      window.electronAPI.removeAllListeners('show-smart-options')
    }
  }, [])

  const handleSpecialFunction = async (data: {
    expansionId: string
    content: string
    phrase: any
  }) => {
    // Check for special function syntax
    const dateMatch = data.content.match(/\[\[DATE\]\]/)
    const calcMatch = data.content.match(/\[\[CALC\]\]/)
    
    if (!dateMatch && !calcMatch) {
      // No special functions found, let other handlers process it
      return
    }

    // Get current cursor position
    const position = await window.electronAPI.getCursorPosition()

    // Handle the first special function found
    if (dateMatch) {
      setCurrentRequest({
        expansionId: data.expansionId,
        functionType: 'date',
        position
      })
    } else if (calcMatch) {
      setCurrentRequest({
        expansionId: data.expansionId,
        functionType: 'calc',
        position
      })
    }
  }

  const handleDateSelect = (date: string) => {
    if (!currentRequest) return

    // Create a selection that replaces [[DATE]] with the selected date
    const selections = [{
      optionId: 'special-function-date',
      selectedValue: date
    }]

    window.electronAPI.completeSmartOptions(currentRequest.expansionId, selections)
    setCurrentRequest(null)
  }

  const handleCalculationComplete = (result: string) => {
    if (!currentRequest) return

    // Create a selection that replaces [[CALC]] with the calculation result
    const selections = [{
      optionId: 'special-function-calc',
      selectedValue: result
    }]

    window.electronAPI.completeSmartOptions(currentRequest.expansionId, selections)
    setCurrentRequest(null)
  }

  const handleCancel = () => {
    if (currentRequest) {
      window.electronAPI.cancelSmartOptions(currentRequest.expansionId)
    }
    setCurrentRequest(null)
  }

  return (
    <>
      <DatePickerModal
        isVisible={currentRequest?.functionType === 'date'}
        position={currentRequest?.position || { x: 0, y: 0 }}
        onDateSelect={handleDateSelect}
        onCancel={handleCancel}
      />
      
      <CalculatorModal
        isVisible={currentRequest?.functionType === 'calc'}
        position={currentRequest?.position || { x: 0, y: 0 }}
        onCalculationComplete={handleCalculationComplete}
        onCancel={handleCancel}
      />
      
      {/* Special Functions Status Indicator */}
      {currentRequest && (
        <div className="fixed top-4 left-4 z-50">
          <div className="glass-morphism rounded-lg p-3 text-sm">
            <div className="text-gray-600 mb-1">Special Function Active</div>
            <div className="text-blue-600 font-medium">
              {currentRequest.functionType === 'date' ? 'Date Picker' : 'Calculator'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Press Esc to cancel
            </div>
          </div>
        </div>
      )}
    </>
  )
}