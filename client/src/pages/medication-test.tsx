import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicationAutoComplete } from '@/components/MedicationAutoComplete';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MedicationTest() {
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const { t, language } = useLanguage();

  const handleMedicationAdd = (medicationName: string) => {
    // Prevent duplicates
    if (!selectedMedications.includes(medicationName)) {
      setSelectedMedications([...selectedMedications, medicationName]);
    }
  };

  const handleMedicationRemove = (medicationName: string) => {
    setSelectedMedications(selectedMedications.filter(med => med !== medicationName));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {language === 'fr' ? 'Test de saisie automatique des médicaments' : 'Medication Auto-Complete Test'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'fr' 
            ? 'Testez la fonction de recherche automatique avec de vraies données pharmaceutiques'
            : 'Test the auto-complete functionality with real pharmaceutical data'
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'fr' ? 'Recherche de médicaments' : 'Medication Search'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MedicationAutoComplete
            onMedicationAdd={handleMedicationAdd}
            selectedMedications={selectedMedications}
            onMedicationRemove={handleMedicationRemove}
          />
        </CardContent>
      </Card>

      {selectedMedications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {language === 'fr' ? 'Résultats de test' : 'Test Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'fr' 
                  ? `${selectedMedications.length} médicament(s) sélectionné(s)`
                  : `${selectedMedications.length} medication(s) selected`
                }
              </p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(selectedMedications, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {language === 'fr' ? 'Instructions de test' : 'Testing Instructions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              {language === 'fr' 
                ? '1. Commencez à taper le nom d\'un médicament (par exemple: "aspirin", "ibuprofen", "metformin")'
                : '1. Start typing a medication name (e.g., "aspirin", "ibuprofen", "metformin")'
              }
            </p>
            <p>
              {language === 'fr'
                ? '2. Les suggestions apparaîtront après avoir tapé au moins 2 caractères'
                : '2. Suggestions will appear after typing at least 2 characters'
              }
            </p>
            <p>
              {language === 'fr'
                ? '3. Cliquez sur une suggestion pour l\'ajouter à votre liste'
                : '3. Click on a suggestion to add it to your list'
              }
            </p>
            <p>
              {language === 'fr'
                ? '4. Les données proviennent de la base de données RxNorm du NIH (National Library of Medicine)'
                : '4. Data comes from the NIH RxNorm database (National Library of Medicine)'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}