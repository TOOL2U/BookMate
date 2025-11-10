'use client';

import { useState, useEffect } from 'react';
import { ReportTemplate } from '@/lib/reports/templates';
import { Save, Trash2, Plus, Check } from 'lucide-react';

interface TemplateSelectorProps {
  onApplyTemplate: (template: ReportTemplate) => void;
  onSaveTemplate: (template: Partial<ReportTemplate>) => void;
  currentConfig?: Partial<ReportTemplate>;
}

export default function TemplateSelector({
  onApplyTemplate,
  onSaveTemplate,
  currentConfig,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/reports/templates?workspace=default');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template.id);
    onApplyTemplate(template);
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      const newTemplate = {
        name: newTemplateName,
        description: newTemplateDesc || undefined,
        type: 'custom' as const,
        ...currentConfig,
      };

      const response = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        const created = await response.json();
        setTemplates([...templates, created]);
        setShowSaveDialog(false);
        setNewTemplateName('');
        setNewTemplateDesc('');
        onSaveTemplate(created);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/reports/templates?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        if (selectedTemplate === id) {
          setSelectedTemplate(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
          Choose Template
        </label>
        <select
          value={selectedTemplate || ''}
          onChange={(e) => {
            const template = templates.find(t => t.id === e.target.value);
            if (template) handleApplyTemplate(template);
          }}
          className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
          disabled={isLoading}
        >
          <option value="">Select a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} {template.type !== 'custom' && '(Default)'}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="bg-bg-app/60 border border-border-card rounded-xl2 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <p className="font-medium text-text-primary font-aileron">
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </p>
              </div>
              {templates.find(t => t.id === selectedTemplate)?.description && (
                <p className="text-sm text-text-secondary mt-1">
                  {templates.find(t => t.id === selectedTemplate)?.description}
                </p>
              )}
            </div>
            {templates.find(t => t.id === selectedTemplate)?.type === 'custom' && (
              <button
                onClick={() => handleDeleteTemplate(selectedTemplate)}
                className="text-red-500 hover:text-red-400 transition-colors"
                title="Delete template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Template Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="w-full bg-bg-app hover:bg-black border border-border-card hover:border-yellow/30 text-text-primary px-4 py-3 rounded-xl2 transition-all duration-200 flex items-center justify-center gap-2 font-aileron"
      >
        <Save className="w-4 h-4" />
        Save Current as Template
      </button>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-xl2 p-6 max-w-md w-full">
            <h3 className="text-xl font-bebasNeue uppercase text-text-primary mb-4">
              Save as Template
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Investor Update"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Describe when to use this template..."
                  rows={3}
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewTemplateName('');
                  setNewTemplateDesc('');
                }}
                className="flex-1 bg-bg-app border border-border-card text-text-secondary px-4 py-2 rounded-xl2 hover:bg-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-1 bg-yellow text-black px-4 py-2 rounded-xl2 font-medium hover:bg-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
