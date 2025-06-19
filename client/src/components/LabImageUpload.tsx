import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, Loader2, CheckCircle, X, FileImage, Clipboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface LabValue {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  category: string;
  timestamp?: string;
}

interface LabImageUploadProps {
  onLabValuesExtracted: (labValues: LabValue[]) => void;
}

export function LabImageUpload({ onLabValuesExtracted }: LabImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [extractedValues, setExtractedValues] = useState<LabValue[]>([]);
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

    setIsUploading(true);
    setProcessingProgress({ current: 0, total: files.length });

    toast({
      title: language === 'fr' ? 'Traitement en cours' : 'Processing Started',
      description: language === 'fr' 
        ? `Extraction de ${files.length} image(s) en arrière-plan. Vous pouvez continuer à utiliser l'application.`
        : `Extracting ${files.length} image(s) in background. You can continue using the application.`,
    });
    
    // Process files in background without blocking UI
    processFilesInBackground(files);
  };

  const processFilesInBackground = async (files: File[]) => {
    try {
      const allLabValues: LabValue[] = [];
      const imageDataUrls: string[] = [];
      
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress({ current: i + 1, total: files.length });
        
        // Convert file to base64
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        imageDataUrls.push(base64Image);

        try {
          // Send to backend for OCR processing
          const response = await fetch('/api/extract-lab-values', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image
            })
          });

          if (!response.ok) {
            console.error(`Failed to process image ${i + 1}`);
            continue; // Skip failed image and continue with others
          }

          const data = await response.json();
          
          if (data.labValues && data.labValues.length > 0) {
            allLabValues.push(...data.labValues);
          }
        } catch (error) {
          console.error(`Error processing file ${i + 1}:`, error);
          continue; // Skip failed image and continue with others
        }
      }
      
      // Update state with all processed images and extracted values
      setUploadedImages(prev => [...prev, ...imageDataUrls]);
      setExtractedValues(prev => [...prev, ...allLabValues]);
      
      if (allLabValues.length > 0) {
        onLabValuesExtracted(allLabValues);
        
        const source = files.length === 1 && files[0].name === 'image.png' 
          ? (language === 'fr' ? 'du presse-papiers' : 'from clipboard')
          : (language === 'fr' ? `de ${files.length} image${files.length > 1 ? 's' : ''}` : `from ${files.length} image${files.length > 1 ? 's' : ''}`);
        
        toast({
          title: language === 'fr' ? 'Extraction terminée' : 'Extraction Complete',
          description: language === 'fr' 
            ? `${allLabValues.length} valeurs extraites. Consultez la section des données de laboratoire.` 
            : `${allLabValues.length} values extracted. Check the lab data section.`,
        });
      } else {
        toast({
          title: language === 'fr' ? 'Extraction terminée' : 'Extraction Complete',
          description: language === 'fr' 
            ? 'Aucune valeur de laboratoire détectée dans les images.' 
            : 'No lab values detected in the images.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Erreur lors du traitement des fichiers' : 'Error processing files',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    await processFiles(files);

    // Clear the input value to allow re-selection of the same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files: File[] = [];
      
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'clipboard-image.png', { type });
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
            ? 'Le presse-papiers ne contient pas d\'image. Copiez une capture d\'écran et réessayez.' 
            : 'Clipboard does not contain an image. Copy a screenshot and try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' 
          ? 'Impossible d\'accéder au presse-papiers. Utilisez Ctrl+V ou glissez-déposez l\'image.' 
          : 'Cannot access clipboard. Use Ctrl+V or drag and drop the image.',
        variant: 'destructive'
      });
    }
  };

  const handleClearImages = () => {
    setUploadedImages([]);
    setExtractedValues([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    if (newImages.length === 0) {
      setExtractedValues([]);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {language === 'fr' ? 'Télécharger des images de laboratoire' : 'Upload Lab Images'}
            </h4>
          </div>

          {uploadedImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="space-y-4">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Sélectionnez ou collez des captures d\'écran de vos résultats de laboratoire'
                    : 'Select or paste screenshots of your lab results'
                  }
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-600" />
                        {language === 'fr' ? 'Traitement...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {language === 'fr' ? 'Sélectionner' : 'Select Files'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePasteFromClipboard}
                    disabled={isUploading}
                  >
                    <Clipboard className="mr-2 h-4 w-4" />
                    {language === 'fr' ? 'Coller' : 'Paste'}
                  </Button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Ou utilisez Ctrl+V pour coller directement'
                    : 'Or use Ctrl+V to paste directly'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Progress indicator during processing */}
              {isUploading && processingProgress.total > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {language === 'fr' 
                          ? `Traitement de l'image ${processingProgress.current} sur ${processingProgress.total}...`
                          : `Processing image ${processingProgress.current} of ${processingProgress.total}...`
                        }
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      alt={`Lab results ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-lg border shadow-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {language === 'fr' ? 'Ajouter plus' : 'Add More'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearImages}
                  disabled={isUploading}
                  size="sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  {language === 'fr' ? 'Tout effacer' : 'Clear All'}
                </Button>
              </div>

              {/* Success indicator */}
              {extractedValues.length > 0 && !isUploading && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {language === 'fr' 
                        ? `${extractedValues.length} valeurs extraites de ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
                        : `${extractedValues.length} values extracted from ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}