import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Copy, 
  FileText, 
  Stethoscope,
  Globe,
  Plus,
  X,
  Upload,
  Save,
  Download,
  AlertCircle,
  Check,
  Trash2,
  RefreshCw,
  ChevronDown,
  Settings
} from 'lucide-react';
import { MedicationSection } from '@/components/MedicationSection';
import { ChiefComplaintSection, ChiefComplaintData } from '@/components/ChiefComplaintSection';
import { LabImageUpload } from '@/components/LabImageUpload';
import { MedicationData, SelectedMedication } from '@/lib/medicationUtils';

interface AllergiesData {
  hasAllergies: boolean;
  allergiesList: string[];
}

interface SocialHistoryData {
  smoking: {
    status: boolean;
    details: string;
  };
  alcohol: {
    status: boolean;
    details: string;
  };
  drugs: {
    status: boolean;
    details: string;
  };
}

function ReviewOfSystems() {
  // Basic state
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<"admission" | "progress" | "consultation" | null>(null);
  const [admissionType, setAdmissionType] = useState<"general" | "icu">("general");
  const [progressType, setProgressType] = useState<"general" | "icu">("general");
  
  // Custom text preservation
  const [hasUserEditedNote, setHasUserEditedNote] = useState(false);
  const [userNoteContent, setUserNoteContent] = useState("");
  
  const [medications, setMedications] = useState<MedicationData>({ 
    homeMedications: [], 
    hospitalMedications: [] 
  });
  
  const [allergies, setAllergies] = useState<AllergiesData>({ hasAllergies: false, allergiesList: [] });
  const [socialHistory, setSocialHistory] = useState<SocialHistoryData>({
    smoking: { status: false, details: "" },
    alcohol: { status: false, details: "" },
    drugs: { status: false, details: "" }
  });
  
  const [chiefComplaint, setChiefComplaint] = useState<ChiefComplaintData>({
    selectedTemplate: "",
    customComplaint: "",
    presentingSymptoms: "",
    onsetDuration: "",
    associatedSymptoms: "",
    aggravatingFactors: "",
    relievingFactors: "",
    previousTreatment: ""
  });

  const [selectedRosSystems, setSelectedRosSystems] = useState<Set<string>>(new Set());
  const [selectedPeSystems, setSelectedPeSystems] = useState<Set<string>>(new Set());
  const [rosSystemModes, setRosSystemModes] = useState<Record<string, "detailed" | "concise">>({});
  const [newAllergy, setNewAllergy] = useState("");
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Handle note text changes to preserve user edits
  const handleNoteChange = (newText: string) => {
    setNote(newText);
    setHasUserEditedNote(true);
    setUserNoteContent(newText);
  };

  // Generate note only when user hasn't edited it
  useEffect(() => {
    if (hasUserEditedNote) return;
    
    if (noteType === null) {
      const instructionText = language === 'fr' 
        ? 'Sélectionnez un type de note (Admission, Évolution ou Consultation) pour commencer à générer votre note clinique.'
        : 'Select a note type (Admission, Progress, or Consultation) to start generating your clinical note.';
      setNote(instructionText);
      return;
    }

    // Generate basic note structure
    let basicNote = "";
    
    if (noteType === "admission") {
      if (language === 'fr') {
        basicNote = `MOTIF D'ADMISSION :\n[Entrer le motif d'admission]\n\n`;
        basicNote += `ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]\n\n`;
        
        // Add allergies if present
        if (allergies.hasAllergies && allergies.allergiesList.length > 0) {
          basicNote += `ALLERGIES :\n${allergies.allergiesList.join(', ')}\n\n`;
        } else {
          basicNote += `ALLERGIES :\n[Aucune allergie connue]\n\n`;
        }
        
        // Add social history
        let socialText = "HISTOIRE SOCIALE :\n";
        if (socialHistory.smoking.status) {
          socialText += `Tabagisme: ${socialHistory.smoking.details}\n`;
        }
        if (socialHistory.alcohol.status) {
          socialText += `Alcool: ${socialHistory.alcohol.details}\n`;
        }
        if (socialHistory.drugs.status) {
          socialText += `Drogues: ${socialHistory.drugs.details}\n`;
        }
        if (!socialHistory.smoking.status && !socialHistory.alcohol.status && !socialHistory.drugs.status) {
          socialText += "[Entrer l'histoire sociale]\n";
        }
        basicNote += `${socialText}\n`;
        
        // Add medications
        if (medications.homeMedications.length > 0) {
          basicNote += `MÉDICAMENTS À DOMICILE :\n${medications.homeMedications.map(med => `- ${med.name}`).join('\n')}\n\n`;
        } else {
          basicNote += `MÉDICAMENTS À DOMICILE :\n[Aucun médicament à domicile]\n\n`;
        }
        
        if (medications.hospitalMedications.length > 0) {
          basicNote += `MÉDICAMENTS HOSPITALIERS :\n${medications.hospitalMedications.map(med => `- ${med.name}`).join('\n')}\n\n`;
        } else {
          basicNote += `MÉDICAMENTS HOSPITALIERS :\n[Aucun médicament hospitalier]\n\n`;
        }
        
        basicNote += `HISTOIRE DE LA MALADIE ACTUELLE :\n[Entrer l'HMA]`;
      } else {
        basicNote = `REASON FOR ADMISSION:\n[Enter reason for admission]\n\n`;
        basicNote += `PAST MEDICAL HISTORY:\n[Enter past medical history]\n\n`;
        
        // Add allergies if present
        if (allergies.hasAllergies && allergies.allergiesList.length > 0) {
          basicNote += `ALLERGIES:\n${allergies.allergiesList.join(', ')}\n\n`;
        } else {
          basicNote += `ALLERGIES:\nNKDA (No Known Drug Allergies)\n\n`;
        }
        
        // Add social history
        let socialText = "SOCIAL HISTORY:\n";
        if (socialHistory.smoking.status) {
          socialText += `Smoking: ${socialHistory.smoking.details}\n`;
        }
        if (socialHistory.alcohol.status) {
          socialText += `Alcohol: ${socialHistory.alcohol.details}\n`;
        }
        if (socialHistory.drugs.status) {
          socialText += `Drugs: ${socialHistory.drugs.details}\n`;
        }
        if (!socialHistory.smoking.status && !socialHistory.alcohol.status && !socialHistory.drugs.status) {
          socialText += "[Enter social history]\n";
        }
        basicNote += `${socialText}\n`;
        
        // Add medications
        if (medications.homeMedications.length > 0) {
          basicNote += `HOME MEDICATIONS:\n${medications.homeMedications.map(med => `- ${med.name}`).join('\n')}\n\n`;
        } else {
          basicNote += `HOME MEDICATIONS:\n[No home medications]\n\n`;
        }
        
        if (medications.hospitalMedications.length > 0) {
          basicNote += `HOSPITAL MEDICATIONS:\n${medications.hospitalMedications.map(med => `- ${med.name}`).join('\n')}\n\n`;
        } else {
          basicNote += `HOSPITAL MEDICATIONS:\n[No hospital medications]\n\n`;
        }
        
        basicNote += `HISTORY OF PRESENTING ILLNESS:\n[Enter HPI]`;
      }
    }
    
    setNote(basicNote);
  }, [noteType, language, allergies, socialHistory, medications, hasUserEditedNote]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note);
      toast({
        title: language === 'fr' ? "Copié!" : "Copied!",
        description: language === 'fr' ? "La note a été copiée dans le presse-papiers." : "Note copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.allergiesList.includes(newAllergy.trim())) {
      setAllergies(prev => ({
        hasAllergies: true,
        allergiesList: [...prev.allergiesList, newAllergy.trim()]
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    setAllergies(prev => {
      const newList = prev.allergiesList.filter(allergy => allergy !== allergyToRemove);
      return {
        hasAllergies: newList.length > 0,
        allergiesList: newList
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="text-white w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Arinote</h1>
                <p className="text-sm text-gray-500">
                  {language === 'fr' ? 'Générateur de notes médicales' : 'Medical Note Generator'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'Français' : 'English'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Note Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{language === 'fr' ? 'Type de Note' : 'Note Type'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={noteType || ""} onValueChange={(value) => setNoteType(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admission" id="admission" />
                    <Label htmlFor="admission">{language === 'fr' ? 'Note d\'admission' : 'Admission Note'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="progress" id="progress" />
                    <Label htmlFor="progress">{language === 'fr' ? 'Note d\'évolution' : 'Progress Note'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="consultation" id="consultation" />
                    <Label htmlFor="consultation">{language === 'fr' ? 'Note de consultation' : 'Consultation Note'}</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Allergies Section */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Allergies' : 'Allergies'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-allergies"
                    checked={allergies.hasAllergies}
                    onCheckedChange={(checked) => setAllergies(prev => ({ ...prev, hasAllergies: !!checked }))}
                  />
                  <Label htmlFor="has-allergies">
                    {language === 'fr' ? 'Le patient a des allergies connues' : 'Patient has known allergies'}
                  </Label>
                </div>
                
                {allergies.hasAllergies && (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder={language === 'fr' ? 'Entrer une allergie...' : 'Enter allergy...'}
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      />
                      <Button onClick={addAllergy} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {allergies.allergiesList.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{allergy}</span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeAllergy(allergy)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social History Section */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Histoire Sociale' : 'Social History'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="smoking"
                      checked={socialHistory.smoking.status}
                      onCheckedChange={(checked) => setSocialHistory(prev => ({ 
                        ...prev, 
                        smoking: { ...prev.smoking, status: !!checked }
                      }))}
                    />
                    <Label htmlFor="smoking">{language === 'fr' ? 'Tabagisme' : 'Smoking'}</Label>
                  </div>
                  {socialHistory.smoking.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails (ex: 1 paquet/jour depuis 10 ans)' : 'Details (e.g., 1 pack/day for 10 years)'}
                      value={socialHistory.smoking.details}
                      onChange={(e) => setSocialHistory(prev => ({ 
                        ...prev, 
                        smoking: { ...prev.smoking, details: e.target.value }
                      }))}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="alcohol"
                      checked={socialHistory.alcohol.status}
                      onCheckedChange={(checked) => setSocialHistory(prev => ({ 
                        ...prev, 
                        alcohol: { ...prev.alcohol, status: !!checked }
                      }))}
                    />
                    <Label htmlFor="alcohol">{language === 'fr' ? 'Alcool' : 'Alcohol'}</Label>
                  </div>
                  {socialHistory.alcohol.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails (ex: 2-3 verres/semaine)' : 'Details (e.g., 2-3 drinks/week)'}
                      value={socialHistory.alcohol.details}
                      onChange={(e) => setSocialHistory(prev => ({ 
                        ...prev, 
                        alcohol: { ...prev.alcohol, details: e.target.value }
                      }))}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="drugs"
                      checked={socialHistory.drugs.status}
                      onCheckedChange={(checked) => setSocialHistory(prev => ({ 
                        ...prev, 
                        drugs: { ...prev.drugs, status: !!checked }
                      }))}
                    />
                    <Label htmlFor="drugs">{language === 'fr' ? 'Drogues' : 'Drugs'}</Label>
                  </div>
                  {socialHistory.drugs.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails' : 'Details'}
                      value={socialHistory.drugs.details}
                      onChange={(e) => setSocialHistory(prev => ({ 
                        ...prev, 
                        drugs: { ...prev.drugs, details: e.target.value }
                      }))}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medications Section */}
            <MedicationSection 
              medications={medications}
              onMedicationsChange={setMedications}
            />

            {/* Lab Image Upload Section */}
            <LabImageUpload onLabValuesExtracted={() => {}} />
          </div>

          {/* Right Panel - Generated Note */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>{language === 'fr' ? 'Note Générée' : 'Generated Note'}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {hasUserEditedNote && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHasUserEditedNote(false);
                          setUserNoteContent("");
                        }}
                        className="flex items-center space-x-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{language === 'fr' ? 'Réinitialiser' : 'Reset'}</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Copier' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
                {hasUserEditedNote && (
                  <div className="flex items-center space-x-2 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {language === 'fr' 
                        ? 'Note modifiée manuellement - les changements de configuration ne seront pas appliqués automatiquement'
                        : 'Note manually edited - configuration changes will not be applied automatically'
                      }
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder={language === 'fr' ? 'La note générée apparaîtra ici...' : 'Generated note will appear here...'}
                  className="min-h-[600px] font-mono text-sm resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewOfSystems;