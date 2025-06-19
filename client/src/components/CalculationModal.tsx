import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  Search, 
  Star, 
  Clock, 
  Calculator, 
  Heart, 
  Brain, 
  Pill, 
  Stethoscope,
  Activity,
  Scale,
  Droplet,
  Wind,
  Syringe,
  Thermometer,
  Microscope,
  Bone,
  Eye,
  Ear,
  User,
  ArrowLeft,
  Apple,
  Bug,
  X as XIcon
} from 'lucide-react';
import { calculations } from '../lib/calculations/definitions';
import { Calculation, UnitSystem, CalculationResult as OrigCalculationResult } from '../lib/calculations/types';

export interface Specialty {
  id: string;
  name: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

export const specialties: Specialty[] = [
  { 
    id: 'cardiology', 
    name: 'Cardiology', 
    icon: <Heart className="w-5 h-5" />, 
    color: 'text-red-500',
    description: 'Cardiac risk scores and heart function calculations'
  },
  { 
    id: 'nephrology', 
    name: 'Nephrology', 
    icon: <Droplet className="w-5 h-5" />, 
    color: 'text-blue-500',
    description: 'Kidney function and renal calculations'
  },
  { 
    id: 'gastroenterology', 
    name: 'Gastroenterology', 
    icon: <Apple className="w-5 h-5" />, 
    color: 'text-yellow-500',
    description: 'GI and liver-related calculations'
  },
  { 
    id: 'pulmonology', 
    name: 'Pulmonology', 
    icon: <Wind className="w-5 h-5" />, 
    color: 'text-green-500',
    description: 'Lung function and respiratory calculations'
  },
  { 
    id: 'hematology', 
    name: 'Hematology', 
    icon: <Droplet className="w-5 h-5" />, 
    color: 'text-red-600',
    description: 'Blood disorders and hematologic calculations'
  },
  { 
    id: 'endocrinology', 
    name: 'Endocrinology', 
    icon: <Pill className="w-5 h-5" />, 
    color: 'text-purple-500',
    description: 'Hormonal and metabolic calculations'
  },
  { 
    id: 'neurology', 
    name: 'Neurology', 
    icon: <Brain className="w-5 h-5" />, 
    color: 'text-indigo-500',
    description: 'Neurological assessment and scoring'
  },
  { 
    id: 'rheumatology', 
    name: 'Rheumatology', 
    icon: <Bone className="w-5 h-5" />, 
    color: 'text-orange-500',
    description: 'Rheumatic disease scoring and assessment'
  },
  { 
    id: 'infectious-disease', 
    name: 'Infectious Disease', 
    icon: <Bug className="w-5 h-5" />, 
    color: 'text-teal-500',
    description: 'Infection risk and treatment calculations'
  },
  { 
    id: 'critical-care', 
    name: 'Critical Care', 
    icon: <Activity className="w-5 h-5" />, 
    color: 'text-pink-500',
    description: 'ICU scoring and critical care calculations'
  },
  { 
    id: 'general', 
    name: 'General', 
    icon: <Calculator className="w-5 h-5" />, 
    color: 'text-gray-500',
    description: 'Common medical calculations and conversions'
  }
];

// Sort specialties alphabetically by name, but always put 'General' last
const sortedSpecialties = [
  ...specialties
    .filter(s => s.id !== 'general')
    .sort((a, b) => a.name.localeCompare(b.name)),
  specialties.find(s => s.id === 'general')
].filter(Boolean);

export type CalculationResult = Omit<OrigCalculationResult, 'value'> & { value: number | string };

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: CalculationResult) => void;
}

export function CalculationModal({ isOpen, onClose, onResult }: CalculationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<{ value: any; unit: string; interpretation?: string } | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('US');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentCalculations, setRecentCalculations] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  // Load favorites and recent calculations from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('calculationFavorites');
    const savedRecent = localStorage.getItem('recentCalculations');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecent) setRecentCalculations(JSON.parse(savedRecent));
  }, []);

  // Save favorites and recent calculations to localStorage
  useEffect(() => {
    localStorage.setItem('calculationFavorites', JSON.stringify(favorites));
    localStorage.setItem('recentCalculations', JSON.stringify(recentCalculations));
  }, [favorites, recentCalculations]);

  const toggleFavorite = (calculationId: string) => {
    setFavorites(prev => 
      prev.includes(calculationId)
        ? prev.filter(id => id !== calculationId)
        : [...prev, calculationId]
    );
  };

  const addToRecent = (calculationId: string) => {
    setRecentCalculations(prev => {
      const filtered = prev.filter(id => id !== calculationId);
      return [calculationId, ...filtered].slice(0, 5);
    });
  };

  const handleCalculationSelect = (calculation: Calculation) => {
    setSelectedCalculation(calculation);
    setInputValues({});
    setResult(null);
  };

  const handleInputChange = (name: string, value: any) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  const calculateResult = () => {
    if (!selectedCalculation) return;
    
    try {
      const calculatedValue = selectedCalculation.formula(inputValues);
      const interpretation = selectedCalculation.interpretation?.(calculatedValue);
      setResult({ value: calculatedValue, unit: selectedCalculation.unit, interpretation });
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const handleResultSelect = () => {
    if (result && selectedCalculation) {
      let valueToPass: number | string = result.value;
      if (typeof valueToPass !== 'number' && typeof valueToPass !== 'string') {
        // For Framingham, pass the risk as a number if possible, else string
        if (
          selectedCalculation.id === 'framingham-risk' &&
          valueToPass &&
          typeof valueToPass === 'object' &&
          'risk' in valueToPass
        ) {
          const riskNum = parseFloat((valueToPass as any).risk.replace(/[^\d.]/g, ''));
          valueToPass = isNaN(riskNum) ? (valueToPass as any).risk : riskNum;
        } else {
          valueToPass = JSON.stringify(valueToPass);
        }
      }
      onResult({
        name: selectedCalculation.name,
        value: valueToPass,
        unit: result.unit
      });
      addToRecent(selectedCalculation.id);
      onClose();
    }
  };

  const filteredCalculations = calculations.filter(calc => {
    const matchesSearch = calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         calc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || calc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const favoriteCalculations = calculations.filter(calc => favorites.includes(calc.id));
  const recentCalculationsList = calculations.filter(calc => recentCalculations.includes(calc.id));

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex">
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              {sortedSpecialties.map(specialty => {
                if (!specialty) return null;
                return (
                  <button
                    key={specialty.id}
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                      selectedSpecialty === specialty.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className={specialty.color}>{specialty.icon}</span>
                    <span>{specialty.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full z-10 border border-gray-200 transition-shadow shadow"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>

            {/* Top Bar */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {(selectedSpecialty || selectedCalculation) && (
                    <button
                      onClick={() => {
                        setSelectedSpecialty(null);
                        setSelectedCalculation(null);
                        setInputValues({});
                        setResult(null);
                      }}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Home</span>
                    </button>
                  )}
                  <div className="flex-1 max-w-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search calculations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 ml-4">
                  <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      showFavorites ? 'bg-yellow-50 text-yellow-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${showFavorites ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                    <span>Favorites</span>
                  </button>
                  <button
                    onClick={() => setShowRecent(!showRecent)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      showRecent ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Clock className={`w-5 h-5 ${showRecent ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span>Recent</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setUnitSystem('US')}
                      className={`px-3 py-1 rounded ${
                        unitSystem === 'US' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      US
                    </button>
                    <button
                      onClick={() => setUnitSystem('SI')}
                      className={`px-3 py-1 rounded ${
                        unitSystem === 'SI' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      SI
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {!selectedSpecialty && !selectedCalculation ? (
                // Landing Page View
                <div className="space-y-8">
                  {/* Welcome Section */}
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Medical Calculations</h1>
                    <p className="mt-2 text-gray-600">Select a calculation from your favorites or recent history, or search above.</p>
                  </div>

                  {/* Favorites Section */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                      Favorite Calculations
                    </h2>
                    {favoriteCalculations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteCalculations.map(calc => (
                          <div
                            key={calc.id}
                            onClick={() => handleCalculationSelect(calc)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                          >
                            <h3 className="font-medium">{calc.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic ml-2">No favorites yet.</p>
                    )}
                  </div>

                  {/* Recent Calculations Section */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="w-5 h-5 text-blue-400 mr-2" />
                      Recent Calculations
                    </h2>
                    {recentCalculationsList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentCalculationsList.map(calc => (
                          <div
                            key={calc.id}
                            onClick={() => handleCalculationSelect(calc)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                          >
                            <h3 className="font-medium">{calc.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic ml-2">No recent calculations yet.</p>
                    )}
                  </div>
                </div>
              ) : selectedCalculation ? (
                // Calculation View
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">{selectedCalculation.name}</h2>
                    <button
                      onClick={() => toggleFavorite(selectedCalculation.id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          favorites.includes(selectedCalculation.id)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">{selectedCalculation.description}</p>

                  <div className="space-y-4">
                    {selectedCalculation.inputs.map(input => (
                      <div key={input.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {input.label}
                        </label>
                        {input.type === 'number' ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={inputValues[input.id] || ''}
                              onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Enter ${input.label.toLowerCase()}`}
                              onWheel={e => e.currentTarget.blur()}
                            />
                            {input.unit && (
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {input.unit}
                              </span>
                            )}
                          </div>
                        ) : input.type === 'select' ? (
                          <select
                            value={inputValues[input.id] || ''}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select {input.label}</option>
                            {input.options?.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="checkbox"
                            checked={inputValues[input.id] || false}
                            onChange={(e) => handleInputChange(input.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      onClick={calculateResult}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Calculate
                    </button>

                    {result && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Result</h3>
                            <p className="text-2xl font-semibold mt-1">
                              {typeof result.value === 'number'
                                ? `${result.value.toFixed(2)} ${result.unit}`
                                : selectedCalculation?.id === 'framingham-risk'
                                  ? (
                                    <>
                                      <span>Points: {result.value.totalPoints}</span><br />
                                      <span>10-year CVD Risk: {result.value.risk}%</span><br />
                                      <span>Heart Age: {result.value.heartAge}</span>
                                    </>
                                  )
                                  : JSON.stringify(result.value)}
                            </p>
                          </div>
                          <button
                            onClick={handleResultSelect}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Use Result
                          </button>
                        </div>
                        {result.interpretation && (
                          <p className="mt-2 text-gray-600">{result.interpretation}</p>
                        )}
                        {/* Show FIB-4 or Framingham chart if relevant */}
                        {selectedCalculation?.id === 'fib4' && (
                          <img
                            src="/fib4-chart.png"
                            alt="FIB-4 Age-Specific Chart"
                            className="my-4 rounded shadow max-w-full"
                          />
                        )}
                        {selectedCalculation?.id === 'framingham-risk' && (
                          <img
                            src="/framingham-statin-chart.png"
                            alt="Statin Recommendation Chart"
                            className="my-4 rounded shadow max-w-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Specialty View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCalculations.map(calc => (
                    <div
                      key={calc.id}
                      onClick={() => handleCalculationSelect(calc)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
                    >
                      <h3 className="font-medium">{calc.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}