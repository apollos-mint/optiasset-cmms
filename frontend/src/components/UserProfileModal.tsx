import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, Trash2, X, Check, AlertCircle, Settings, Sun, Moon, Laptop, ShieldCheck, Maximize2 } from 'lucide-react';
import { AvatarLightboxModal } from './AvatarLightboxModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfilePhoto, theme, setTheme } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.foto_perfil || null);
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(user?.foto_perfil || null);
      setHasChanged(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user?.foto_perfil]);

  if (!isOpen) return null;

  // Optimizar y redimensionar imagen en el navegador a 256x256 cuadrado
  const processAndCropImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo seleccionado no es una imagen válida.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const targetSize = 256;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('No se pudo inicializar el procesador gráfico.'));
              return;
            }

            // Recorte cuadrado centrado
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen seleccionada.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Máximo 10 MB para el archivo original
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('La imagen supera el límite permitido de 10 MB.');
      return;
    }

    try {
      const croppedBase64 = await processAndCropImage(file);
      setPreviewUrl(croppedBase64);
      setHasChanged(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la imagen.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setHasChanged(true);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfilePhoto(previewUrl);
      setSuccessMsg('Foto de perfil actualizada exitosamente.');
      setHasChanged(false);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la foto de perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      style={{ 
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '500px', 
          width: '100%',
          maxHeight: 'min(90vh, 700px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-color)',
          overflow: 'hidden',
          margin: 'auto'
        }}
      >
        {/* Header (fijo arriba) */}
        <div className="modal-header" style={{ flexShrink: 0, borderBottom: '1px solid var(--border-color)', padding: '1.25rem 1.5rem', background: 'var(--bg-primary)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} style={{ color: 'var(--color-primary)' }} /> Configuración de Perfil y Sistema
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {user?.nombre} &bull; <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{user?.rol}</span>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Body (con scroll vertical garantizado) */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--color-danger)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--color-success)', borderRadius: '8px', color: 'var(--color-success)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sección 1: Foto de Perfil (Cambiar Foto) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-title)', alignSelf: 'flex-start' }}>
              Foto de Perfil
            </span>

            <div style={{ position: 'relative', width: '105px', height: '105px' }}>
              <div
                onClick={() => setIsLightboxOpen(true)}
                title="Clic para expandir y ver foto completa"
                style={{
                  width: '105px',
                  height: '105px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                className="user-profile-modal-avatar"
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Vista previa" 
                    style={{ 
                      width: '105px', 
                      height: '105px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: '3px solid var(--color-primary)', 
                      boxShadow: '0 6px 18px rgba(236, 119, 0, 0.3)',
                      display: 'block'
                    }} 
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '105px', 
                      height: '105px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '2.5rem', 
                      fontWeight: 800, 
                      color: '#ffffff',
                      boxShadow: '0 6px 18px rgba(236, 119, 0, 0.3)',
                      border: '3px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {user?.nombre ? user.nombre.substring(0, 1).toUpperCase() : 'U'}
                  </div>
                )}
                <div 
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(1, 30, 65, 0.85)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--color-primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                  }}
                  title="Expandir imagen"
                >
                  <Maximize2 size={11} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  color: 'var(--color-primary)',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Seleccionar foto"
              >
                <Camera size={15} />
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              style={{ display: 'none' }} 
            />

            {/* Botones de acción para foto */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  fontSize: '0.8rem', 
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px'
                }}
              >
                <Upload size={14} /> Subir Foto
              </button>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.8rem', 
                    padding: '0.45rem 0.9rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--color-danger)',
                    borderRadius: '8px'
                  }}
                >
                  <Trash2 size={14} /> Quitar
                </button>
              )}
            </div>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Formatos admitidos: JPG, PNG, WEBP (recorte cuadrado automático).
            </span>

            {hasChanged && (
              <div style={{ background: 'rgba(236, 119, 0, 0.12)', border: '1px solid var(--color-primary)', borderRadius: '6px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>● Nueva foto seleccionada. Presiona "Guardar Cambios" abajo para aplicar.</span>
              </div>
            )}
          </div>

          {/* Sección 2: Apariencia y Modo de Pantalla (Claro / Oscuro / Sistema) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-title)' }}>
                Apariencia del Sistema
              </span>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Selecciona la modalidad de contraste e iluminación para la plataforma.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {[
                { value: 'light', label: 'Claro', icon: Sun, desc: 'Fondo blanco nítido' },
                { value: 'dark', label: 'Oscuro', icon: Moon, desc: 'Azul nocturno corporativo' },
                { value: 'system', label: 'Sistema', icon: Laptop, desc: 'Sincronizado con SO' }
              ].map(opt => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value as any)}
                    style={{
                      background: active 
                        ? 'linear-gradient(135deg, rgba(236, 119, 0, 0.15) 0%, rgba(236, 119, 0, 0.25) 100%)' 
                        : 'var(--bg-primary)',
                      border: active ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                      padding: '0.75rem 0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all var(--transition-fast)',
                      boxShadow: active ? '0 4px 14px rgba(236, 119, 0, 0.25)' : 'none'
                    }}
                  >
                    <Icon size={20} style={{ color: active ? 'var(--color-primary)' : 'inherit' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 500 }}>{opt.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección 3: Datos de la Cuenta */}
          <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Usuario:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>@{user?.nombre_usuario}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rol de Acceso:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{user?.rol}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Firma Digital:</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={13} /> Sesión Verificada
              </span>
            </div>
          </div>
        </div>

        {/* Footer (fijo y visible en todo momento) */}
        <div 
          className="modal-footer" 
          style={{ 
            flexShrink: 0, 
            borderTop: '1px solid var(--border-color)', 
            padding: '1rem 1.5rem', 
            background: 'var(--bg-primary)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={saving}
            style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
          >
            Cerrar
          </button>

          <button 
            type="button" 
            onClick={handleSave} 
            disabled={!hasChanged || saving}
            className={`btn ${hasChanged ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem 1.25rem',
              cursor: !hasChanged || saving ? 'not-allowed' : 'pointer',
              opacity: !hasChanged ? 0.5 : 1,
              boxShadow: hasChanged ? '0 4px 14px rgba(236, 119, 0, 0.35)' : 'none'
            }}
          >
            {saving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Check size={16} /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      <AvatarLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        user={user ? { ...user, foto_perfil: previewUrl } : null}
      />
    </div>
  );
};
