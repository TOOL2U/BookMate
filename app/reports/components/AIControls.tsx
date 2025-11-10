'use client';

import { useState } from 'react';
import { Sparkles, Building2, Target } from 'lucide-react';
import { OrganizationProfile } from '@/lib/reports/templates';

interface AIControlsProps {
  tone: 'standard' | 'investor' | 'internal' | 'founder' | 'simple';
  onToneChange: (tone: AIControlsProps['tone']) => void;
  organizationProfile?: OrganizationProfile;
  onProfileChange: (profile: OrganizationProfile) => void;
}

export default function AIControls({
  tone,
  onToneChange,
  organizationProfile,
  onProfileChange,
}: AIControlsProps) {
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profile, setProfile] = useState<OrganizationProfile>(
    organizationProfile || {
      businessName: '',
      sector: '',
      keyProperties: [],
      goals: [],
    }
  );

  const handleSaveProfile = () => {
    onProfileChange(profile);
    setShowProfileEditor(false);
  };

  const toneOptions = [
    { value: 'standard', label: 'Standard / Neutral', description: 'Professional, balanced tone' },
    { value: 'investor', label: 'Investor Update', description: 'Focus on growth and ROI' },
    { value: 'internal', label: 'Internal Finance', description: 'Technical and detailed' },
    { value: 'founder', label: 'Founder Summary', description: 'Strategic and action-oriented' },
    { value: 'simple', label: 'Simple / Non-Technical', description: 'Plain language, no jargon' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* AI Tone Selector */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2 font-aileron">
          <Sparkles className="w-4 h-4 text-yellow" />
          AI Narrative Tone
        </label>
        <select
          value={tone}
          onChange={(e) => onToneChange(e.target.value as AIControlsProps['tone'])}
          className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
        >
          {toneOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-tertiary mt-1 font-aileron">
          {toneOptions.find(o => o.value === tone)?.description}
        </p>
      </div>

      {/* Organization Profile */}
      <div>
        <button
          onClick={() => setShowProfileEditor(true)}
          className="w-full bg-bg-app hover:bg-black border border-border-card hover:border-yellow/30 text-text-primary px-4 py-3 rounded-xl2 transition-all duration-200 flex items-center justify-between font-aileron"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Organization Context</span>
          </div>
          <span className="text-xs text-text-secondary">
            {organizationProfile?.businessName ? 'Configured' : 'Optional'}
          </span>
        </button>
      </div>

      {/* Organization Profile Editor */}
      {showProfileEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-card border border-border-card rounded-xl2 p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-bebasNeue uppercase text-text-primary mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-yellow" />
              Organization Context
            </h3>
            <p className="text-sm text-text-secondary mb-6 font-aileron">
              Help AI provide more relevant insights by adding context about your business. This information is used only for narrative context and does not alter any financial calculations.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  placeholder="e.g., Acme Property Management"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Sector/Industry
                </label>
                <input
                  type="text"
                  value={profile.sector || ''}
                  onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                  placeholder="e.g., Commercial Real Estate"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Key Properties/Projects
                </label>
                <input
                  type="text"
                  value={profile.keyProperties?.join(', ') || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    keyProperties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Downtown Office Tower, Riverside Apartments"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
                <p className="text-xs text-text-tertiary mt-1">Separate multiple properties with commas</p>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <Target className="w-4 h-4" />
                  Business Goals
                </label>
                <textarea
                  value={profile.goals?.join('\n') || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    goals: e.target.value.split('\n').filter(Boolean)
                  })}
                  placeholder="e.g., Optimize cash runway&#10;Maximize ROI on property X&#10;Reduce operating expenses by 10%"
                  rows={4}
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 resize-none"
                />
                <p className="text-xs text-text-tertiary mt-1">One goal per line</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProfileEditor(false);
                  setProfile(organizationProfile || {
                    businessName: '',
                    sector: '',
                    keyProperties: [],
                    goals: [],
                  });
                }}
                className="flex-1 bg-bg-app border border-border-card text-text-secondary px-4 py-2 rounded-xl2 hover:bg-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-yellow text-black px-4 py-2 rounded-xl2 font-medium hover:bg-yellow/90 transition-colors"
              >
                Save Context
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
