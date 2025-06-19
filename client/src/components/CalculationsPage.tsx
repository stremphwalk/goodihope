import React, { useState } from 'react';
import { Calculator, Star } from 'lucide-react';
import { calculations } from '../lib/calculations/definitions';
import { specialties } from './CalculationModal'; // Reuse the specialties array
import type { Calculation } from '../lib/calculations/types';
import type { Specialty } from './CalculationModal';

export function CalculationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('calculationFavorites') || '[]')
  );

  const toggleFavorite = (id: string) => {
    let updatedFavorites;
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(fav => fav !== id);
    } else {
      updatedFavorites = [...favorites, id];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('calculationFavorites', JSON.stringify(updatedFavorites));
  };

  // Sort specialties as in CalculationModal
  const sortedSpecialties = [
    ...specialties.filter((s: Specialty) => s.id !== 'general').sort((a: Specialty, b: Specialty) => a.name.localeCompare(b.name)),
    specialties.find((s: Specialty) => s.id === 'general')
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center mb-2">
          <Calculator className="w-7 h-7 text-gray-500 mr-2" />
          Medical Calculations
        </h1>
        <p className="text-gray-600">Browse, search, and favorite calculations. Click the star to add to your favorites. Favorites sync with the calculation popup window.</p>
      </div>
      <div className="mb-6 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Search all calculations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-10">
        {sortedSpecialties.map((specialty: Specialty) => {
          if (!specialty) return null;
          const specialtyCalcs = calculations
            .filter((calc: Calculation) => calc.specialty === specialty.id)
            .filter((calc: Calculation) =>
              calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              calc.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
          if (specialtyCalcs.length === 0) return null;
          return (
            <div key={specialty.id}>
              <div className="flex items-center mb-3">
                <span className={specialty.color}>{specialty.icon}</span>
                <span className="ml-2 text-xl font-semibold">{specialty.name}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialtyCalcs.map(calc => (
                  <div
                    key={calc.id}
                    className="p-4 border border-gray-200 rounded-lg flex items-start justify-between hover:border-blue-500 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{calc.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(calc.id)}
                      className="ml-2"
                      aria-label={favorites.includes(calc.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-5 h-5 ${favorites.includes(calc.id) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 