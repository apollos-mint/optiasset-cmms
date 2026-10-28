import React, { useState } from 'react';
import { Usuario } from '../types';
import { 
  X, 
  Building2, 
  Briefcase, 
  Cake, 
  Shield, 
  UserCheck, 
  UserX, 
  Lock, 
  ZoomIn, 
  Calendar,
  Maximize2
} from 'lucide-react';
import { AvatarLightboxModal } from './AvatarLightboxModal';

interface UserVisitorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
}

export const UserVisitorProfileModal: React.FC<UserVisitorProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !user) return null;

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
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: 'min(90vh, 720px)',
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
        {/* Header */}
        <div
          className="modal-header"
          style={{
            flexShrink: 0,
            borderBottom: '1px solid var(--border-color)',
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Lock size={13} /> Ficha de Empleado &bull; Solo Lectura
            </div>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-title)' }}>
              Perfil del Colaborador
            </h3>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Tarjeta de Avatar y Nombre */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              background: 'linear-gradient(180deg, rgba(236, 119, 0, 0.08) 0%, rgba(1, 30, 65, 0.15) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(236, 119, 0, 0.2)',
              position: 'relative'
            }}
          >
            {/* Avatar Interactivo con Clic para 150% */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              title="Clic para ver fotografía ampliada al 150%"
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              className="visitor-avatar-zoom-container"
            >
              {user.foto_perfil ? (
                <img
                  src={user.foto_perfil}
                  alt={user.nombre}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--color-primary)',
                    display: 'block'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    border: '3px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Badge indicativo de Zoom 150% */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '3px 7px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  border: '1.5px solid #011e41',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}
              >
                <ZoomIn size={11} /> 150%
              </div>
            </div>

            <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)' }}>
                {user.nombre}
              </h4>
              <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.15rem' }}>
                @{user.nombre_usuario}
              </div>
            </div>

            <div
              onClick={() => setIsLightboxOpen(true)}
              style={{
                marginTop: '0.5rem',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.65rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}
            >
              <Maximize2 size={11} /> Clic en la foto para ver ampliada al 150%
            </div>
          </div>

          {/* Tabla / Lista de Datos del Trabajador (Solo Lectura) */}
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}
          >
            {/* Departamento */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <Building2 size={16} color="var(--color-primary)" />
                <span>Departamento:</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.85rem', textAlign: 'right' }}>
                {user.departamento || 'No especificado'}
              </div>
            </div>

            {/* Cargo */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <Briefcase size={16} color="var(--color-primary)" />
                <span>Cargo:</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.85rem', textAlign: 'right' }}>
                {user.cargo || user.rol || 'No especificado'}
              </div>
            </div>

            {/* Cumpleaños */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <Cake size={16} color="#ec4899" />
                <span>Cumpleaños:</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span>{user.cumpleanos || 'No especificado'}</span>
              </div>
            </div>

            {/* Rol de Acceso */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <Shield size={16} color="#60a5fa" />
                <span>Rol de Acceso:</span>
              </div>
              <div>
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {user.rol}
                </span>
              </div>
            </div>

            {/* Estado de Cuenta */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <span>Estado:</span>
              </div>
              <div>
                {user.activo ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    <UserCheck size={12} /> Activo en Nómina
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    <UserX size={12} /> Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aviso inmutable de Modo de Solo Lectura */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Lock size={15} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
            <span>
              <strong>Modo Consulta Exclusivo:</strong> Estás visualizando la ficha de otro usuario. Por políticas de seguridad y privacidad, no está permitido modificar sus datos.
            </span>
          </div>
        </div>

        {/* Footer */}
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
            boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.25)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ borderRadius: '8px', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
          >
            Cerrar Ficha
          </button>

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem 1.25rem'
            }}
          >
            <ZoomIn size={16} /> Ver Foto al 150%
          </button>
        </div>
      </div>

      {/* Submodal para ampliar la foto al 150% */}
      <AvatarLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialZoom={1.5}
        user={user}
      />
    </div>
  );
};
