'use client';

/**
 * Create Account Form Component
 * 
 * Client component for the create account form with validation
 */

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createAccountAction } from './actions';
import AppsScriptTemplateCard from '@/components/admin/AppsScriptTemplateCard';

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-yellow hover:bg-yellow/90 text-black font-semibold rounded-xl2 shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-aileron"
    >
      {pending ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-black"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Creating Account...
        </>
      ) : (
        'Create Account'
      )}
    </button>
  );
}

/**
 * Form field component with label and error display
 */
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  helpText,
  error,
  required = true,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-text-primary mb-2 font-aileron">
        {label}
        {required && <span className="text-yellow ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full px-3 py-2 bg-black border border-border-card rounded-xl2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all font-aileron"
      />
      {helpText && (
        <p className="mt-1 text-xs text-text-secondary font-aileron">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-yellow font-aileron">{error}</p>
      )}
    </div>
  );
}

/**
 * Main form component
 */
export default function CreateAccountForm() {
  const [state, formAction] = useActionState(createAccountAction, null);
  
  // Track form values to show/hide template generator
  const [formValues, setFormValues] = useState({
    companyName: '',
    sheetId: '',
    scriptSecret: ''
  });

  // Update form values on change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Check if we should show the template generator
  const showTemplateGenerator = formValues.scriptSecret.length >= 10;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
      {/* General Error */}
      {state?.errors?.general && (
        <div className="rounded-xl2 bg-yellow/10 border border-yellow/20 p-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-yellow"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow font-aileron">
                Error creating account
              </h3>
              <p className="mt-1 text-sm text-text-secondary font-aileron">
                {state.errors.general}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company Name */}
      <FormField
        label="Company Name"
        name="companyName"
        placeholder="e.g., Acme Property Management"
        helpText="The name of the client's company"
        error={state?.errors?.companyName}
        onChange={handleInputChange}
      />

      {/* User Email */}
      <FormField
        label="User Email"
        name="userEmail"
        type="email"
        placeholder="e.g., john@acmeproperty.com"
        helpText="Primary email address for this account"
        error={state?.errors?.userEmail}
      />

      {/* Sheet ID */}
      <FormField
        label="Google Sheets ID"
        name="sheetId"
        placeholder="e.g., 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
        helpText="The ID from the Google Sheets URL (between /d/ and /edit)"
        error={state?.errors?.sheetId}
        onChange={handleInputChange}
      />

      {/* Script URL */}
      <FormField
        label="Apps Script WebApp URL"
        name="scriptUrl"
        type="url"
        placeholder="https://script.google.com/macros/s/AKfycbw.../exec"
        helpText="The deployed WebApp URL from Apps Script"
        error={state?.errors?.scriptUrl}
      />

      {/* Script Secret */}
      <FormField
        label="Apps Script Secret"
        name="scriptSecret"
        type="password"
        placeholder="Enter unique secret (e.g., secret_abc123)"
        helpText="The authentication secret configured in the Apps Script"
        error={state?.errors?.scriptSecret}
        onChange={handleInputChange}
      />

      {/* Submit Button */}
      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>

    {/* Apps Script Template Generator */}
    {showTemplateGenerator && (
      <AppsScriptTemplateCard
        scriptSecret={formValues.scriptSecret}
        sheetId={formValues.sheetId || undefined}
        companyName={formValues.companyName || undefined}
      />
    )}
  </div>
  );
}
