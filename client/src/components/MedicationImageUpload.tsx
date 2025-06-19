import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, Clipboard, Loader2, CheckCircle, X, Pill, Camera, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { createMedication, sortMedicationsByImportance, type SelectedMedication, type ExtractedMedication, categorizeMedication } from '@/lib/medicationUtils';

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
      event.preventDefault();
      
      if (!event.clipboardData) return;
      
      const items = Array.from(event.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));
      
      if (imageItems.length === 0) {
        toast({
          title: language === 'fr' ? 'Aucune image trouvée' : 'No image found',
          description: language === 'fr' 
            ? 'Le presse-papiers ne contient pas d\'image. Copiez une capture d\'écran et réessayez.' 
            : 'Clipboard does not contain an image. Copy a screenshot and try again.',
          variant: 'destructive'
        });
        return;
      }
      
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
    };

    // Add event listener for paste
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [language, toast]);

  const processFiles = async (files: File[]) => {
    // Validate all files before processing
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Veuillez sélectionner uniquement des images' : 'Please select only image files',
        variant: 'destructive'
      });
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Certaines images sont trop volumineuses (max 5MB)' : 'Some images are too large (max 5MB)',
        variant: 'destructive'
      });
      return;
    }

    setProcessingProgress({ current: 0, total: files.length });
    
    try {
      const allMedications: ExtractedMedication[] = [];
      const imageDataUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress({ current: i + 1, total: files.length });

        // Convert to base64 for display
        const base64 = await fileToBase64(file);
        const dataUrl = `data:${file.type};base64,${base64}`;
        imageDataUrls.push(dataUrl);

        // Extract medications from image
        const response = await fetch('/api/medications/extract-from-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            mediaType: file.type
          }),
        });
        
        if (!response.ok) {
          console.error(`Failed to process image ${i + 1}`);
          continue; // Skip failed image and continue with others
        }
        
        const medications: ExtractedMedication[] = await response.json();
        allMedications.push(...medications);
      }

      // Remove duplicates based on medication name
      const uniqueMedications = allMedications.filter((med, index, arr) => 
        arr.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase()) === index
      );

      setUploadedImages(imageDataUrls);
      setExtractedMedications(uniqueMedications);
      
      // Convert extracted medications to SelectedMedication format and pass to parent
      if (uniqueMedications.length > 0) {
        const selectedMedications = uniqueMedications.map(med => ({
          id: crypto.randomUUID(),
          name: med.name.charAt(0).toUpperCase() + med.name.slice(1).toLowerCase(),
          category: categorizeMedication(med.name),
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          isCustom: false,
          isDiscontinued: false,
          addedAt: Date.now()
        }));
        
        onMedicationsExtracted(selectedMedications, true);
        
        toast({
          title: language === 'fr' ? 'Extraction terminée' : 'Extraction Complete',
          description: language === 'fr'
            ? `${uniqueMedications.length} médicament(s) ajouté(s) à la section médicaments.`
            : `${uniqueMedications.length} medication(s) added to medications section.`,
        });
      } else {
        toast({
          title: language === 'fr' ? 'Extraction terminée' : 'Extraction Complete',
          description: language === 'fr' 
            ? 'Aucun médicament n\'a été trouvé dans les images.'
            : 'No medications were found in the images.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error processing medication images:', error);
      toast({
        title: language === 'fr' ? 'Erreur de traitement' : 'Processing Error',
        description: language === 'fr' ? 'Erreur lors du traitement des images' : 'Error processing images',
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
      medication.dosage = med.dosage;
      medication.frequency = med.frequency;
      return medication;
    });

    const sortedMedications = sortMedicationsByImportance(selectedMedications);
    onMedicationsExtracted(sortedMedications, true);
    
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
          {processingProgress.total > 0 && (
            <p className="text-xs text-gray-600">
              {language === 'fr' 
                ? `Image ${processingProgress.current} sur ${processingProgress.total}`
                : `Image ${processingProgress.current} of ${processingProgress.total}`}
            </p>
          )}
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