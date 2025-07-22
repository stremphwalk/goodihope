import { useState, useEffect } from 'react'

interface CalculatorModalProps {
  isVisible: boolean
  position: { x: number; y: number }
  onCalculationComplete: (result: string) => void
  onCancel: () => void
}

export function CalculatorModal({ 
  isVisible, 
  position, 
  onCalculationComplete, 
  onCancel 
}: CalculatorModalProps) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForNewValue, setWaitingForNewValue] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Reset calculator when opened
      setDisplay('0')
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(false)
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      
      const key = event.key
      
      if (key >= '0' && key <= '9') {
        handleNumber(key)
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperation(key)
      } else if (key === 'Enter' || key === '=') {
        handleEquals()
      } else if (key === 'Escape') {
        onCancel()
      } else if (key === 'Backspace') {
        handleClear()
      } else if (key === '.') {
        handleDecimal()
      } else if (key === 'c' || key === 'C') {
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, display, previousValue, operation, waitingForNewValue])

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num)
      setWaitingForNewValue(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForNewValue(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '*':
        return firstValue * secondValue
      case '/':
        return firstValue / secondValue
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForNewValue(true)
    }
  }

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.')
      setWaitingForNewValue(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForNewValue(false)
  }

  const handleInsert = () => {
    onCalculationComplete(display)
  }

  if (!isVisible) return null

  const modalStyle = {
    position: 'fixed' as const,
    left: position.x,
    top: position.y + 25,
    zIndex: 10000,
  }

  const buttonClass = "w-full h-12 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
  const numberButtonClass = `${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-900`
  const operatorButtonClass = `${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`
  const actionButtonClass = `${buttonClass} bg-gray-600 hover:bg-gray-700 text-white`

  return (
    <div style={modalStyle} className="animate-slide-up">
      <div className="glass-morphism rounded-lg shadow-xl border border-white/20 w-72">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Calculator</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Display */}
          <div className="mb-4">
            <div className="bg-gray-900 text-white p-4 rounded-lg text-right text-2xl font-mono min-h-[60px] flex items-center justify-end">
              {display}
            </div>
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {/* Row 1 */}
            <button onClick={handleClear} className={actionButtonClass}>
              C
            </button>
            <button onClick={() => {}} className={`${actionButtonClass} opacity-50 cursor-not-allowed`}>
              ±
            </button>
            <button onClick={() => {}} className={`${actionButtonClass} opacity-50 cursor-not-allowed`}>
              %
            </button>
            <button onClick={() => handleOperation('/')} className={operatorButtonClass}>
              ÷
            </button>

            {/* Row 2 */}
            <button onClick={() => handleNumber('7')} className={numberButtonClass}>
              7
            </button>
            <button onClick={() => handleNumber('8')} className={numberButtonClass}>
              8
            </button>
            <button onClick={() => handleNumber('9')} className={numberButtonClass}>
              9
            </button>
            <button onClick={() => handleOperation('*')} className={operatorButtonClass}>
              ×
            </button>

            {/* Row 3 */}
            <button onClick={() => handleNumber('4')} className={numberButtonClass}>
              4
            </button>
            <button onClick={() => handleNumber('5')} className={numberButtonClass}>
              5
            </button>
            <button onClick={() => handleNumber('6')} className={numberButtonClass}>
              6
            </button>
            <button onClick={() => handleOperation('-')} className={operatorButtonClass}>
              −
            </button>

            {/* Row 4 */}
            <button onClick={() => handleNumber('1')} className={numberButtonClass}>
              1
            </button>
            <button onClick={() => handleNumber('2')} className={numberButtonClass}>
              2
            </button>
            <button onClick={() => handleNumber('3')} className={numberButtonClass}>
              3
            </button>
            <button onClick={() => handleOperation('+')} className={operatorButtonClass}>
              +
            </button>

            {/* Row 5 */}
            <button onClick={() => handleNumber('0')} className={`${numberButtonClass} col-span-2`}>
              0
            </button>
            <button onClick={handleDecimal} className={numberButtonClass}>
              .
            </button>
            <button onClick={handleEquals} className={operatorButtonClass}>
              =
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Esc to cancel • Enter for =
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInsert}
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Insert Result
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}