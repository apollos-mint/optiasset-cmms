import React, { useState, useMemo } from 'react';
import { 
  checkSpanishText, 
  applySuggestion, 
  applyAllSuggestions, 
  SpellSuggestion 
} from '../services/spanishSpellcheck.service';
import { Check, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SpanishSpellAssistantProps {
  text: string;
  onChange: (newText: string) => void;
  label?: string;
  showPreview?: boolean;
}

export const SpanishSpellAssistant: React.FC<SpanishSpellAssistantProps> = ({
  text,
  onChange,
  label = 'Asistente de Ortografía en Español',
  showPreview = true
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const suggestions: SpellSuggestion[] = useMemo(() => {
    return checkSpanishText(text);
  }, [text]);

  if (!text || text.trim().length === 0) {
    return null;
  }

  const handleFixOne = (sug: SpellSuggestion, replacement: string) => {
    const updated = applySuggestion(text, sug, replacement);
    onChange(updated);
  };

  const handleFixAll = () => {
    const updated = applyAllSuggestions(text, suggestions);
    onChange(updated);
  };

  if (suggestions.length === 0) {
    return (
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.725rem',
          color: '#10b981',
          padding: '0.2rem 0.5rem',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: '4px',
          marginTop: '0.35rem'
        }}
      >
        <Check size={12} />
        <span>Texto verificado en español: sin faltas detectadas</span>
      </div>
    );
  }

  return (
    <div 
      style={{
        marginTop: '0.45rem',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        fontSize: '0.8rem'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <AlertCircle size={14} color="#ef4444" />
          <span style={{ fontWeight: 700, color: '#ef4444' }}>
            {suggestions.length} {suggestions.length === 1 ? 'posible error ortográfico' : 'posibles errores ortográficos'} detectados
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            ({label})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {suggestions.length > 1 && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                padding: '0.15rem 0.5rem',
                fontSize: '0.7rem',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleFixAll();
              }}
              title="Corregir todas las sugerencias de una vez"
            >
              <Sparkles size={11} />
              <span>Corregir Todos</span>
            </button>
          )}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Visual highlight preview */}
          {showPreview && (
            <div 
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                fontSize: '0.78rem',
                lineHeight: '1.4',
                color: 'var(--text-secondary)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Vista previa con resaltado:
              </span>
              <HighlightedText text={text} suggestions={suggestions} />
            </div>
          )}

          {/* List of suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
            {suggestions.map((sug, idx) => (
              <div 
                key={`${sug.word}-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  gap: '0.4rem',
                  fontSize: '0.775rem'
                }}
              >
                {/* Palabra mal escrita resaltada en rojo */}
                <span 
                  style={{
                    color: '#ef4444',
                    fontWeight: 700,
                    textDecoration: 'underline wavy #ef4444'
                  }}
                  title={sug.explanation}
                >
                  {sug.word}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>➔</span>

                {/* Botones de sugerencias para reemplazo directo */}
                <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                  {sug.suggestions.map((cand) => (
                    <button
                      key={cand}
                      type="button"
                      style={{
                        background: 'rgba(236, 119, 0, 0.15)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        borderRadius: '3px',
                        padding: '0.1rem 0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 119, 0, 0.15)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onClick={() => handleFixOne(sug, cand)}
                      title={`Reemplazar "${sug.word}" por "${cand}"`}
                    >
                      {cand}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente auxiliar para renderizar texto con palabras dudosas resaltadas en rojo con subrayado ondulado.
 */
export const HighlightedText: React.FC<{ text: string; suggestions: SpellSuggestion[] }> = ({
  text,
  suggestions
}) => {
  if (!suggestions || suggestions.length === 0) return <span>{text}</span>;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // Asegurar orden por startIndex
  const sorted = [...suggestions].sort((a, b) => a.startIndex - b.startIndex);

  sorted.forEach((sug, i) => {
    // Texto normal antes del error
    if (sug.startIndex > lastIndex) {
      elements.push(
        <span key={`normal-${lastIndex}`}>
          {text.substring(lastIndex, sug.startIndex)}
        </span>
      );
    }

    // Palabra mal escrita resaltada en rojo
    elements.push(
      <span
        key={`error-${i}`}
        style={{
          color: '#ef4444',
          fontWeight: 700,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          padding: '0.05rem 0.2rem',
          borderRadius: '3px',
          textDecoration: 'underline wavy #ef4444',
          cursor: 'help'
        }}
        title={`"${sug.word}": sugerido -> ${sug.suggestions.join(', ')} (${sug.explanation})`}
      >
        {sug.word}
      </span>
    );

    lastIndex = sug.endIndex;
  });

  // Resto del texto
  if (lastIndex < text.length) {
    elements.push(
      <span key={`normal-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <span>{elements}</span>;
};
