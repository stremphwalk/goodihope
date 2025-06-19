import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Stethoscope, 
  Copy,
  Trash2,
  FileText,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReviewOfSystems() {
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const copyNote = () => {
    navigator.clipboard.writeText(note);
    toast({
      title: language === 'fr' ? "Note copiée" : "Note copied",
      description: language === 'fr' ? "La note a été copiée dans le presse-papiers" : "Note has been copied to clipboard",
    });
  };

  const resetForm = () => {
    setNote("");
    toast({
      title: language === 'fr' ? "Formulaire réinitialisé" : "Form reset",
      description: language === 'fr' ? "Tous les champs ont été effacés" : "All fields have been cleared",
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
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Languages className="w-4 h-4 text-gray-500" />
              <div className="flex border rounded-lg">
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-r-lg transition-colors ${
                    language === 'fr' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setLanguage('fr')}
                >
                  FR
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          
          {/* Left Panel - Controls */}
          <div className="w-1/3">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'fr' ? 'Configuration' : 'Configuration'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {language === 'fr' 
                    ? 'Interface simplifiée pour les notes médicales' 
                    : 'Simplified interface for medical notes'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Note Preview */}
          <div className="w-2/3">
            <Card className="h-full flex flex-col">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-white w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">
                      {language === 'fr' ? 'Aperçu de la note' : 'Note Preview'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={copyNote} className="text-white/80 hover:text-white h-8 w-8">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={resetForm} className="text-white/80 hover:text-white h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  {language === 'fr' ? 'Rédigez votre note médicale' : 'Write your medical note'}
                </p>
              </div>
              <CardContent className="p-6 flex-1">
                <Textarea
                  className="w-full h-full resize-none text-sm leading-relaxed min-h-[500px]"
                  placeholder={language === 'fr' 
                    ? 'Commencez à taper votre note médicale ici...' 
                    : 'Start typing your medical note here...'
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </CardContent>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {language === 'fr' ? 'Caractères' : 'Characters'}: {note.length}
                  </span>
                  <span className="text-gray-500">
                    {language === 'fr' ? 'Interface simplifiée' : 'Simplified interface'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}