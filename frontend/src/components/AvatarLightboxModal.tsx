import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Shield } from 'lucide-react';

interface AvatarLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialZoom?: number;
  user: {
    nombre: string;
    nombre_usuario?: string;
    rol?: string;
    foto_perfil?: string | null;
  } | null;
}

export const AvatarLightboxModal: React.FC<AvatarLightboxModalProps> = ({
  isOpen,
  onClose,
  initialZoom = 1,
  user
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);

  // Reset zoom on open/close or user change
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(initialZoom);
    }
  }, [isOpen, user, initialZoom]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user.foto_perfil) return;
    const link = document.createElement('a');
    link.href = user.foto_perfil;
    link.download = `avatar_${user.nombre_usuario || user.nombre.replace(/\s+/g, '_').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasPhoto = Boolean(user.foto_perfil);

  return (
    <div
      className="avatar-lightbox-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'avatarFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Floating Control Bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 10
        }}
      >
        {hasPhoto && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.3rem 0.5rem',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              title="Alejar (-)"
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomLevel <= 0.75 ? 'rgba(255,255,255,0.3)' : '#ffffff',
                cursor: zoomLevel <= 0.75 ? 'not-allowed' : 'pointer',
                padding: '0.35rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ZoomOut size={18} />
            </button>

            <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, minWidth: '42px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              title="Acercar (+)"
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomLevel >= 3 ? 'rgba(255,255,255,0.3)' : '#ffffff',
                cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
                padding: '0.35rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ZoomIn size={18} />
            </button>

            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                title="Restablecer tamaño (100%)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff9233',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RotateCcw size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title="Descargar fotografía"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={17} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          title="Cerrar vista expandida (Esc)"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.8)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Display Container */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '92vw',
          maxHeight: '84vh',
          position: 'relative'
        }}
      >
        {hasPhoto ? (
          <div
            style={{
              overflow: 'hidden',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 3px rgba(236, 119, 0, 0.65)',
              background: '#011e41',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease-out',
              transform: `scale(${zoomLevel})`
            }}
          >
            <img
              src={user.foto_perfil!}
              alt={`Avatar de ${user.nombre}`}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '480px',
                maxHeight: '60vh',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none'
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.2)',
              color: '#ffffff'
            }}
          >
            <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1 }}>
              {user.nombre ? user.nombre.substring(0, 1).toUpperCase() : 'U'}
            </span>
          </div>
        )}

        {/* User Details Pill Below Image */}
        <div
          style={{
            marginTop: '1.25rem',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '0.85rem 1.5rem',
            textAlign: 'center',
            maxWidth: '440px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
              {user.nombre}
            </h3>
            {user.nombre_usuario && (
              <span style={{ color: '#ff9233', fontSize: '0.85rem', fontWeight: 700 }}>
                @{user.nombre_usuario}
              </span>
            )}
          </div>

          {user.rol && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
              <Shield size={13} color="#60a5fa" />
              <span>{user.rol}</span>
            </div>
          )}

          {!hasPhoto && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              (Este usuario aún no ha subido una fotografía personalizada)
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes avatarFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
