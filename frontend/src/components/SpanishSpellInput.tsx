import React from 'react';
import { SpanishSpellAssistant } from './SpanishSpellAssistant';

interface SpanishSpellTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (val: string) => void;
  label?: string;
  assistantLabel?: string;
  showPreview?: boolean;
}

export const SpanishSpellTextarea: React.FC<SpanishSpellTextareaProps> = ({
  value,
  onValueChange,
  label,
  assistantLabel,
  showPreview = true,
  className = 'form-input',
  rows = 3,
  ...props
}) => {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="form-label">{label}</label>}
      <textarea
        className={className}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        spellCheck={true}
        lang="es"
        {...props}
      />
      <SpanishSpellAssistant 
        text={value} 
        onChange={onValueChange} 
        label={assistantLabel}
        showPreview={showPreview}
      />
    </div>
  );
};

interface SpanishSpellInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (val: string) => void;
  label?: string;
  assistantLabel?: string;
}

export const SpanishSpellInput: React.FC<SpanishSpellInputProps> = ({
  value,
  onValueChange,
  label,
  assistantLabel,
  className = 'form-input',
  ...props
}) => {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="form-label">{label}</label>}
      <input
        type="text"
        className={className}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        spellCheck={true}
        lang="es"
        {...props}
      />
      <SpanishSpellAssistant 
        text={value} 
        onChange={onValueChange} 
        label={assistantLabel}
        showPreview={false}
      />
    </div>
  );
};
