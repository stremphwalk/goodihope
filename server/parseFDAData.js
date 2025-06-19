import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse the comprehensive FDA drug database and extract medication information
function parseFDADrugDatabase() {
  console.log('Loading FDA drug database...');
  
  const filePath = path.join(__dirname, '../attached_assets/drug-drugsfda-0001-of-0001.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const fdaData = JSON.parse(rawData);
  
  console.log(`Processing ${fdaData.results.length} drug applications...`);
  
  const medications = new Map(); // Use Map to avoid duplicates
  
  fdaData.results.forEach((drugApplication, index) => {
    if (index % 1000 === 0) {
      console.log(`Processing application ${index}...`);
    }
    
    if (drugApplication.products) {
      drugApplication.products.forEach(product => {
        if (product.brand_name && product.active_ingredients && product.active_ingredients.length > 0) {
          // Get the brand name
          const brandName = product.brand_name.trim().toUpperCase();
          
          // Get primary active ingredient as generic name
          const primaryIngredient = product.active_ingredients[0].name.trim().toUpperCase();
          
          // Create unique ID
          const id = `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${primaryIngredient.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          
          // Only add if we haven't seen this exact combination
          if (!medications.has(id)) {
            medications.set(id, {
              brandName: brandName,
              genericName: primaryIngredient,
              id: id,
              strength: product.active_ingredients[0].strength || null,
              dosageForm: product.dosage_form || null,
              route: product.route || null
            });
          }
          
          // Also add generic name as searchable if it's different from brand name
          if (primaryIngredient !== brandName) {
            const genericId = `${primaryIngredient.toLowerCase().replace(/[^a-z0-9]/g, '_')}_generic`;
            if (!medications.has(genericId)) {
              medications.set(genericId, {
                brandName: primaryIngredient,
                genericName: primaryIngredient,
                id: genericId,
                strength: product.active_ingredients[0].strength || null,
                dosageForm: product.dosage_form || null,
                route: product.route || null
              });
            }
          }
        }
      });
    }
  });
  
  const medicationArray = Array.from(medications.values());
  console.log(`Extracted ${medicationArray.length} unique medications`);
  
  // Generate TypeScript file
  const tsContent = `// FDA Drug Database - Comprehensive authentic pharmaceutical data
// Generated from official FDA drug database with ${medicationArray.length} medications

interface MedicationData {
  brandName: string;
  genericName: string;
  id: string;
  strength?: string | null;
  dosageForm?: string | null;
  route?: string | null;
}

export const fdaMedications: MedicationData[] = ${JSON.stringify(medicationArray, null, 2)};

// Function to search medications
export function searchMedications(query: string, limit: number = 10): MedicationData[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (searchTerm.length < 2) {
    return [];
  }
  
  const results: MedicationData[] = [];
  const seen = new Set<string>();
  
  // Search for matches in brand names and generic names
  for (const medication of fdaMedications) {
    const brandMatch = medication.brandName.toLowerCase().includes(searchTerm);
    const genericMatch = medication.genericName.toLowerCase().includes(searchTerm);
    
    if ((brandMatch || genericMatch) && !seen.has(medication.id)) {
      results.push(medication);
      seen.add(medication.id);
      
      if (results.length >= limit) {
        break;
      }
    }
  }
  
  return results;
}
`;
  
  // Write to TypeScript file
  const outputPath = path.join(__dirname, 'medicationData.ts');
  fs.writeFileSync(outputPath, tsContent);
  
  console.log(`Generated comprehensive medication database at ${outputPath}`);
  console.log(`Total medications: ${medicationArray.length}`);
  
  // Show some examples
  console.log('\nSample medications:');
  medicationArray.slice(0, 10).forEach(med => {
    console.log(`- ${med.brandName} (${med.genericName})`);
  });
}

// Run the parser
try {
  parseFDADrugDatabase();
} catch (error) {
  console.error('Error parsing FDA database:', error);
}