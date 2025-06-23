import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles } from 'lucide-react';
import { TemplateContent } from '@/lib/sectionLibrary';
import { getSectionById } from '@/lib/sectionLibrary';

interface NotePreviewProps {
  templateContent: TemplateContent;
}

export function NotePreview({ templateContent }: NotePreviewProps) {
  const { sections, metadata } = templateContent;
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const enabledSections = sortedSections.filter(section => section.isEnabled);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'patient-info': 'bg-blue-100 text-blue-800',
      'history': 'bg-green-100 text-green-800',
      'examination': 'bg-orange-100 text-orange-800',
      'results': 'bg-purple-100 text-purple-800',
      'assessment': 'bg-red-100 text-red-800',
      'plan': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Template Header */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {metadata.name || 'Untitled Template'}
              </h2>
              <p className="text-purple-100 text-sm font-normal">
                Template Preview
              </p>
            </div>
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {metadata.category}
            </Badge>
            {metadata.specialty && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {metadata.specialty}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {enabledSections.length} sections
            </Badge>
          </div>
          {metadata.description && (
            <p className="text-purple-100 text-sm mt-2">{metadata.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Template Sections */}
      <div className="space-y-4">
        {enabledSections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No sections in template</h3>
              <p className="text-sm">Add sections to see the preview</p>
            </CardContent>
          </Card>
        ) : (
          enabledSections.map((section, index) => {
            const sectionDef = getSectionById(section.sectionId);
            if (!sectionDef) return null;

            const Icon = sectionDef.icon;
            const displayContent = section.customContent || sectionDef.defaultContent || '';

            return (
              <Card key={section.id} className="border-l-4 border-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="flex items-center justify-center w-7 h-7 bg-purple-500 text-white text-sm font-bold rounded-full">
                      {index + 1}
                    </span>
                    <Icon className="w-5 h-5 text-purple-600" />
                    <span>{sectionDef.name}</span>
                    <Badge variant="outline" className={getCategoryColor(sectionDef.category)}>
                      {sectionDef.category}
                    </Badge>
                    {sectionDef.isRequired && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 ml-10">{sectionDef.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="ml-10">
                    {displayContent ? (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-xs font-medium text-purple-800 mb-2 uppercase tracking-wide">
                          Default Content
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {displayContent}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                          No Default Content
                        </div>
                        <div className="text-sm text-gray-500 italic">
                          This section will be empty when the template is used
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Template Summary */}
      <Card className="border-t-4 border-t-indigo-500">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total sections:</span>
              <span className="font-medium">{sections.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Enabled sections:</span>
              <span className="font-medium">{enabledSections.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Sections with content:</span>
              <span className="font-medium">
                {enabledSections.filter(s => {
                  const sectionDef = getSectionById(s.sectionId);
                  return s.customContent || sectionDef?.defaultContent;
                }).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}