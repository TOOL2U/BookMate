'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Copy, 
  Check, 
  AlertTriangle,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  generateAppsScriptTemplate,
  getDeploymentInstructions,
  getSecurityWarnings,
  type AppsScriptTemplateOptions
} from '@/lib/templates/apps-script-template';

interface AppsScriptTemplateCardProps {
  scriptSecret: string;
  sheetId?: string;
  companyName?: string;
  className?: string;
}

export default function AppsScriptTemplateCard({
  scriptSecret,
  sheetId,
  companyName,
  className = ''
}: AppsScriptTemplateCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  // Generate the script template
  const scriptCode = generateAppsScriptTemplate({
    scriptSecret,
    sheetId,
    companyName
  });

  const instructions = getDeploymentInstructions();
  const warnings = getSecurityWarnings();

  // Copy script to clipboard
  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy script:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-bg-card border border-border-card rounded-xl2 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-yellow/10 rounded-xl2 border border-yellow/20">
          <FileCode className="w-6 h-6 text-yellow" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bebasNeue uppercase text-text-primary tracking-wide mb-2">
            Apps Script Template Generator
          </h2>
          <p className="text-text-secondary font-aileron text-sm">
            Pre-configured Google Apps Script code for {companyName || 'this account'}. 
            Copy and paste this into your Google Sheet&apos;s script editor.
          </p>
        </div>
      </div>

      {/* Security Warnings */}
      <div className="bg-yellow/10 border border-yellow/20 rounded-xl2 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow font-aileron mb-2">
              Security Notice
            </h3>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-xs text-text-secondary font-aileron">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Deployment Instructions */}
      <div className="mb-6">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between w-full p-4 bg-black/30 rounded-xl border border-border-card hover:bg-black/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-yellow" />
            <span className="font-aileron font-semibold text-text-primary">
              Deployment Instructions
            </span>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        {showInstructions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 p-4 bg-black/20 rounded-xl border border-border-card"
          >
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-yellow/20 text-yellow text-sm font-semibold font-aileron flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-text-secondary font-aileron pt-0.5">
                    {instruction}
                  </span>
                </li>
              ))}
            </ol>

            {/* Quick Link to Google Apps Script Docs */}
            <div className="mt-4 pt-4 border-t border-border-card">
              <a
                href="https://developers.google.com/apps-script/guides/web"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-yellow hover:text-yellow/80 font-aileron transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Google Apps Script Documentation
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* Script Code */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-2 text-text-primary hover:text-yellow transition-colors font-aileron font-semibold"
          >
            <Code className="w-5 h-5" />
            <span>Generated Script</span>
            {showCode ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleCopyScript}
            className="flex items-center gap-2 px-4 py-2 bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 text-yellow rounded-xl2 transition-all duration-200 font-aileron font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Script
              </>
            )}
          </button>
        </div>

        {showCode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative"
          >
            <pre className="bg-black/40 border border-border-card rounded-xl2 p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
              <code className="text-sm text-text-secondary font-mono leading-relaxed">
                {scriptCode}
              </code>
            </pre>

            {/* Line count indicator */}
            <div className="mt-2 text-xs text-text-secondary font-aileron text-right">
              {scriptCode.split('\n').length} lines of code
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-border-card grid grid-cols-2 gap-4">
        <div className="p-3 bg-black/20 rounded-xl border border-border-card">
          <div className="text-xs text-text-secondary font-aileron mb-1">Secret Length</div>
          <div className="text-lg font-semibold text-text-primary font-aileron">
            {scriptSecret.length} characters
          </div>
        </div>

        <div className="p-3 bg-black/20 rounded-xl border border-border-card">
          <div className="text-xs text-text-secondary font-aileron mb-1">Template Version</div>
          <div className="text-lg font-semibold text-text-primary font-aileron">
            v1.0.0
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl2">
        <p className="text-sm text-text-secondary font-aileron">
          <span className="font-semibold text-blue-400">💡 Pro Tip:</span> After deploying, 
          test the script by running the <code className="px-1.5 py-0.5 bg-black/40 rounded text-xs">testScript()</code> function 
          in the Apps Script editor to verify everything is configured correctly.
        </p>
      </div>
    </motion.div>
  );
}
