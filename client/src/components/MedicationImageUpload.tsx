import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, Clipboard, Loader2, CheckCircle, X, Pill, Camera, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { createMedication, sortMedicationsByImportance, type SelectedMedication, type ExtractedMedication, categorizeMedication } from '@/lib/medicationUtils';
import { Progress } from '@/components/ui/progress';

interface ProcessingResult {
  file: string;
  success: boolean;
  error?: string;
  count: number;
  suggestions?: string[];
  extractionMethod?: string;
}

interface MedicationImageUploadProps {
  onMedicationsExtracted: (medications: SelectedMedication[], isHome: boolean) => void;
}

export function MedicationImageUpload({ onMedicationsExtracted }: MedicationImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [extractedMedications, setExtractedMedications] = useState<ExtractedMedication[]>([]);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  // Handle clipboard paste events
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) return;
      
      const items = Array.from(event.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));
      
      // Determine if clipboard contains plain text
      const hasPlainText = event.clipboardData.types.includes('text/plain');
      // Only prevent default if we have image content and *no* plain text
      if (imageItems.length > 0 && !hasPlainText) {
        event.preventDefault();
        
        // Convert clipboard items to files for processing
        const files: File[] = [];
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
        
        if (files.length > 0) {
          await processFiles(files);
        }
      } else {
        // Check if we're pasting into a textarea - if so, don't show error for text paste
        const activeElement = document.activeElement;
        const isTextarea = activeElement?.tagName === 'TEXTAREA' || 
                          activeElement?.tagName === 'INPUT' ||
                          (activeElement && (activeElement as HTMLElement).contentEditable === 'true');
        
        if (!isTextarea) {
          toast({
            title: language === 'fr' ? 'Aucune image trouvée' : 'No image found',
            description: language === 'fr' 
              ? 'Le presse-papiers ne contient pas d\'image. Copiez une capture d\'écran et réessayez.' 
              : 'Clipboard does not contain an image. Copy a screenshot and try again.',
            variant: 'destructive'
          });
        }
      }
    };

    // Add event listener for paste
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [language, toast]);

  const processFiles = async (files: File[]) => {
    // Enhanced validation with detailed feedback
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: language === 'fr' ? 'Erreur de format' : 'Format Error',
        description: language === 'fr' 
          ? `${invalidFiles.length} fichier(s) non-image(s) détecté(s). Formats supportés: JPG, PNG, WEBP, GIF`
          : `${invalidFiles.length} non-image file(s) detected. Supported formats: JPG, PNG, WEBP, GIF`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file sizes with specific feedback
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const oversizedNames = oversizedFiles.map(f => f.name).join(', ');
      toast({
        title: language === 'fr' ? 'Fichiers trop volumineux' : 'Files Too Large',
        description: language === 'fr' 
          ? `Ces fichiers dépassent 5MB: ${oversizedNames}` 
          : `These files exceed 5MB: ${oversizedNames}`,
        variant: 'destructive'
      });
      return;
    }

    // Check image dimensions and quality
    const lowQualityFiles: File[] = [];
    for (const file of files) {
      try {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = url;
        });
        URL.revokeObjectURL(url);
        
        // Warn about very small images (likely poor OCR quality)
        if (img.width < 300 || img.height < 300) {
          lowQualityFiles.push(file);
        }
      } catch (error) {
        console.warn(`Could not check dimensions for ${file.name}:`, error);
      }
    }

    if (lowQualityFiles.length > 0) {
      toast({
        title: language === 'fr' ? 'Qualité d\'image faible' : 'Low Image Quality',
        description: language === 'fr'
          ? `${lowQualityFiles.length} image(s) de petite taille détectée(s). La qualité d'extraction pourrait être réduite.`
          : `${lowQualityFiles.length} small image(s) detected. Extraction quality may be reduced.`,
        variant: 'default'
      });
    }

    setProcessingProgress({ current: 0, total: files.length });
    const allMedications: ExtractedMedication[] = [];
    const imageDataUrls: string[] = [];
    const processedResults: ProcessingResult[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress({ current: i + 1, total: files.length });

        try {
          console.log(`Processing image ${i + 1}/${files.length}: ${file.name}`);
          
          // Convert to base64 for display
          const base64 = await fileToBase64(file);
          const dataUrl = `data:${file.type};base64,${base64}`;
          imageDataUrls.push(dataUrl);

          // Extract medications from image with timeout and retry
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch('/api/medications/extract-from-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              mediaType: file.type
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to process image ${i + 1}:`, response.status, errorText);
            processedResults.push({
              file: file.name,
              success: false,
              error: `HTTP ${response.status}`,
              count: 0
            });
            continue;
          }
          
          const result = await response.json();
          const medications: ExtractedMedication[] = result.medications || result;
          
          // Check if server indicated no medications found with suggestions
          if (result.success === false && result.suggestions) {
            processedResults.push({
              file: file.name,
              success: false,
              error: result.debug || 'No medications found',
              count: 0,
              suggestions: result.suggestions
            });
            continue;
          }
          
          // Validate extracted medications
          const validMedications = medications.filter(med => 
            med.name && 
            med.name.trim().length > 1 && 
            !/^\d+$/.test(med.name.trim()) &&
            med.name.length < 100 // Reasonable medication name length
          );
          
          allMedications.push(...validMedications);
          processedResults.push({
            file: file.name,
            success: true,
            count: validMedications.length,
            extractionMethod: result.extractionMethod || 'Unknown'
          });
          
          console.log(`Image ${i + 1} processed: ${validMedications.length} medications found`);
          
        } catch (error) {
          console.error(`Error processing image ${i + 1} (${file.name}):`, error);
          
          let errorMessage = 'Unknown error';
          let suggestions: string[] = [];
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = 'Timeout';
              suggestions = ['Try with a smaller image', 'Check your internet connection'];
            } else {
              errorMessage = error.message;
              // Try to parse error response for suggestions
              try {
                const errorResponse = JSON.parse(error.message);
                if (errorResponse.suggestions) {
                  suggestions = errorResponse.suggestions;
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
          
          processedResults.push({
            file: file.name,
            success: false,
            error: errorMessage,
            count: 0,
            suggestions: suggestions.length > 0 ? suggestions : undefined
          });
        }
      }

      // Remove duplicates based on medication name (case-insensitive)
      const uniqueMedications = allMedications.filter((med, index, arr) => 
        arr.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase()) === index
      );

      setUploadedImages(imageDataUrls);
      setExtractedMedications(uniqueMedications);
      
      // Provide detailed feedback about processing results
      const successCount = processedResults.filter(r => r.success).length;
      const failureCount = processedResults.filter(r => !r.success).length;
      const totalMedications = uniqueMedications.length;
      
      if (totalMedications > 0) {
        // Convert extracted medications to SelectedMedication format and pass to parent
        const selectedMedications = uniqueMedications.map(med => ({
          id: crypto.randomUUID(),
          name: med.name ? med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase() : '',
          category: categorizeMedication(med.name),
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          isCustom: false,
          isDiscontinued: false,
          addedAt: Date.now()
        }));
        
        const sortedMedications = sortMedicationsByImportance(selectedMedications);
        onMedicationsExtracted(sortedMedications, false);
        
        let description = '';
        if (language === 'fr') {
          description = `${totalMedications} médicament(s) extrait(s) de ${successCount}/${files.length} image(s)`;
          if (failureCount > 0) {
            description += `. ${failureCount} image(s) non traitée(s)`;
          }
        } else {
          description = `${totalMedications} medication(s) extracted from ${successCount}/${files.length} image(s)`;
          if (failureCount > 0) {
            description += `. ${failureCount} image(s) failed`;
          }
        }
        
        toast({
          title: language === 'fr' ? 'Extraction terminée' : 'Extraction Complete',
          description: description,
        });
      } else {
        const failedImages = processedResults.filter(r => !r.success);
        let description = language === 'fr' 
          ? 'Aucun médicament trouvé dans les images.'
          : 'No medications found in the images.';
          
        // Check if we have detailed suggestions from the server
        const lastResult = processedResults[processedResults.length - 1];
        if (lastResult && lastResult.suggestions) {
          description = language === 'fr' 
            ? 'Suggestions pour améliorer la détection :'
            : 'Suggestions to improve detection:';
          description += '\n• ' + lastResult.suggestions.slice(0, 3).join('\n• ');
        } else if (failedImages.length > 0) {
          description += language === 'fr'
            ? ` ${failedImages.length} image(s) n'ont pas pu être traitées.`
            : ` ${failedImages.length} image(s) could not be processed.`;
        }
        
        toast({
          title: language === 'fr' ? 'Aucun médicament trouvé' : 'No Medications Found',
          description: description,
          variant: 'destructive',
          duration: 8000 // Longer duration for helpful suggestions
        });
      }
      
      // Log detailed results for debugging
      console.log('Processing summary:');
      processedResults.forEach(result => {
        console.log(`- ${result.file}: ${result.success ? `✓ ${result.count} medications` : `✗ ${result.error}`}`);
      });
      
    } catch (error) {
      console.error('Error processing medication images:', error);
      toast({
        title: language === 'fr' ? 'Erreur de traitement' : 'Processing Error',
        description: language === 'fr' 
          ? 'Erreur lors du traitement des images. Vérifiez que les images contiennent du texte lisible.'
          : 'Error processing images. Please ensure images contain readable text.',
        variant: 'destructive'
      });
    } finally {
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const addAllMedications = () => {
    if (extractedMedications.length === 0) return;

    const selectedMedications = extractedMedications.map(med => {
      const medication = createMedication(med.name, false);
      medication.dosage = med.dosage ?? '';
      medication.frequency = med.frequency ?? '';
      return medication;
    });

        const sortedMedications = sortMedicationsByImportance(selectedMedications);
    onMedicationsExtracted(sortedMedications, false);
    
    // Clear the extracted medications and images
    setExtractedMedications([]);
    setUploadedImages([]);
    
    toast({
      title: language === 'fr' ? 'Médicaments ajoutés' : 'Medications Added',
      description: language === 'fr' 
        ? `${selectedMedications.length} médicament(s) ajouté(s) à la liste`
        : `${selectedMedications.length} medication(s) added to list`,
    });
  };

  const removeMedication = (index: number) => {
    setExtractedMedications(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setExtractedMedications([]);
    setUploadedImages([]);
  };

  const handlePasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files: File[] = [];
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        await processFiles(files);
      } else {
        toast({
          title: language === 'fr' ? 'Aucune image trouvée' : 'No image found',
          description: language === 'fr' 
            ? 'Le presse-papiers ne contient pas d\'image.'
            : 'Clipboard does not contain an image.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' 
          ? 'Impossible d\'accéder au presse-papiers.'
          : 'Unable to access clipboard.',
        variant: 'destructive'
      });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-blue-500');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500');
    
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;

    const newImages = [...uploadedImages];
    const [movedImage] = newImages.splice(sourceIndex, 1);
    newImages.splice(targetIndex, 0, movedImage);
    setUploadedImages(newImages);

    const newMedications = [...extractedMedications];
    const [movedMedication] = newMedications.splice(sourceIndex, 1);
    newMedications.splice(targetIndex, 0, movedMedication);
    setExtractedMedications(newMedications);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium">
            {language === 'fr' ? 'Télécharger une image' : 'Upload Image'}
          </h4>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePasteClick}
            className="flex items-center gap-2"
          >
            <Clipboard className="h-4 w-4" />
            {language === 'fr' ? 'Coller' : 'Paste'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {language === 'fr' ? 'Parcourir' : 'Browse'}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Processing Status */}
      {processingProgress.total > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {language === 'fr' ? 'Traitement en cours...' : 'Processing...'}
            </span>
          </div>
          <Progress value={(processingProgress.current / processingProgress.total) * 100} className="w-full mb-2" />
          <p className="text-xs text-gray-600">
            {language === 'fr' 
              ? `Image ${processingProgress.current} sur ${processingProgress.total}`
              : `Image ${processingProgress.current} of ${processingProgress.total}`}
          </p>
        </div>
      )}

      {/* Extracted Medications */}
      {extractedMedications.length > 0 && (
        <div className="pt-4 border-t text-left">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {language === 'fr' ? 'Médicaments extraits' : 'Extracted Medications'}
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                {language === 'fr' ? 'Effacer' : 'Clear'}
              </Button>
              <Button
                size="sm"
                onClick={addAllMedications}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {language === 'fr' ? 'Ajouter Tout' : 'Add All'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {extractedMedications.map((med, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <div>
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && <span className="text-sm text-gray-600 ml-2">{med.dosage}</span>}
                    {med.frequency && <Badge variant="secondary" className="ml-2 text-xs">{med.frequency}</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedication(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileImage className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">
                {language === 'fr' ? 'Images téléchargées' : 'Uploaded Images'}
              </h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {uploadedImages.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className="relative group cursor-move rounded-lg border-2 border-dashed border-gray-200 p-2 hover:border-blue-500 transition-colors"
              >
                <img
                  src={image}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-32 object-contain rounded"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <span className="text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {language === 'fr' ? 'Cliquez pour réorganiser' : 'Click to reorder'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}