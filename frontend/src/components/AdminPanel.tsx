import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Usuario, Departamento } from '../types';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Edit2, 
  Trash2, 
  Shield, 
  Settings, 
  Eye, 
  EyeOff,
  Home,
  ClipboardList,
  Scale,
  Database,
  Boxes,
  FileBarChart2,
  Users,
  ShieldAlert,
  Search,
  Maximize2,
  Building2,
  UserCheck2,
  Sparkles
} from 'lucide-react';
import { Pagination } from './Pagination';
import { UserVisitorProfileModal } from './UserVisitorProfileModal';
import { UserProfileModal } from './UserProfileModal';
import { SpanishSpellAssistant } from './SpanishSpellAssistant';
import { AdminFeedbackInbox } from './AdminFeedbackInbox';

interface Role {
  id: number;
  nombre: string;
  permisos: Record<string, boolean>;
}

export interface SubmoduleDef {
  id: string;
  nombre: string;
  descripcion: string;
  viewKey: string;
  editKey: string;
}

export interface ModuleDef {
  id: string;
  nombre: string;
  descripcion: string;
  viewKey: string;
  editKey: string;
  legacyKey?: string;
  submodulos: SubmoduleDef[];
  especiales?: { key: string; label: string; desc: string; icon?: string }[];
}

export const MODULOS_SISTEMA: ModuleDef[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    descripcion: 'Mesa corporativa de proyectos, solicitudes directivas y rendimiento.',
    viewKey: 'ver_inicio',
    editKey: 'editar_inicio',
    legacyKey: 'acceder_inicio',
    submodulos: [
      {
        id: 'tickets',
        nombre: 'Mesa de Solicitudes / Tickets PM',
        descripcion: 'Crear, consultar, cambiar estados y coordinar requerimientos interdepartamentales.',
        viewKey: 'ver_tickets',
        editKey: 'editar_tickets',
      },
      {
        id: 'rendimiento',
        nombre: 'Métricas de Rendimiento y KPIs',
        descripcion: 'Supervisión de tiempos de respuesta y avance de tareas del equipo.',
        viewKey: 'ver_rendimiento',
        editKey: 'editar_rendimiento',
      }
    ]
  },
  {
    id: 'operaciones',
    nombre: 'Operaciones (Mantenimiento)',
    descripcion: 'Control de inspecciones vehiculares, taller mecánico y reportes de falla.',
    viewKey: 'ver_operaciones',
    editKey: 'editar_operaciones',
    legacyKey: 'acceder_operaciones',
    submodulos: [
      {
        id: 'checklists',
        nombre: 'Inspecciones Rápidas (Checklists)',
        descripcion: 'Formularios técnicos de salida y retorno vehicular.',
        viewKey: 'ver_checklists',
        editKey: 'editar_checklists'
      },
      {
        id: 'solicitudes',
        nombre: 'Solicitudes de Mantenimiento',
        descripcion: 'Gestión de fallas y conversión a órdenes de trabajo.',
        viewKey: 'ver_solicitudes',
        editKey: 'editar_solicitudes'
      },
      {
        id: 'ordenes',
        nombre: 'Órdenes de Trabajo (OT)',
        descripcion: 'Apertura, asignación mecánica, insumos y cierre de órdenes.',
        viewKey: 'ver_ordenes',
        editKey: 'editar_ordenes'
      },
      {
        id: 'profit',
        nombre: 'Diagnóstico Enterprise ERP',
        descripcion: 'Auditoría y sincronización con servidor SQL Profit.',
        viewKey: 'ver_profit_diagnostics',
        editKey: 'modificar_profit_diagnostics'
      }
    ],
    especiales: [
      { key: 'firmar_checklists', label: 'Firmar Checklists', desc: 'Firma digital de auditoría y conformidad' },
      { key: 'borrar_checklists', label: 'Borrar Checklists', desc: 'Permiso para eliminar inspecciones de flota' },
      { key: 'autorellenar_campos', label: 'Autorellenar Pruebas', desc: 'Llenado aleatorio para pruebas de desarrollo' }
    ]
  },
  {
    id: 'procura',
    nombre: 'Procura e Importaciones',
    descripcion: 'Gestión de expedientes de compra internacional, matriz comparativa de proveedores y proformas.',
    viewKey: 'ver_procura',
    editKey: 'editar_procura',
    legacyKey: 'acceder_procura',
    submodulos: [
      {
        id: 'expedientes',
        nombre: 'Expedientes & Cotizaciones Cara a Cara',
        descripcion: 'Creación de expedientes, importación de proformas y registro de ofertas.',
        viewKey: 'ver_procura_expedientes',
        editKey: 'editar_procura_expedientes'
      },
      {
        id: 'tareas',
        nombre: 'Ruta de Acción & Responsabilidades',
        descripcion: 'Control de tareas pendientes, bloqueos y asignaciones directivas.',
        viewKey: 'ver_procura_tareas',
        editKey: 'editar_procura_tareas'
      }
    ],
    especiales: [
      { key: 'emitir_sello_ceo', label: 'Emitir Sello Ejecutivo (Aprobación CEO)', desc: 'Validación final de compra reservada a Presidencia', icon: '👑' }
    ]
  },
  {
    id: 'catalogos',
    nombre: 'Catálogos Maestros',
    descripcion: 'Inventario de activos de flota, maquinaria pesada y catálogo de partes/repuestos.',
    viewKey: 'ver_catalogos',
    editKey: 'editar_catalogos',
    legacyKey: 'acceder_catalogos',
    submodulos: [
      {
        id: 'activos',
        nombre: 'Activos de Flota y Maquinaria',
        descripcion: 'Fichas maestras de vehículos, placas y seriales.',
        viewKey: 'ver_activos',
        editKey: 'editar_activos'
      },
      {
        id: 'repuestos',
        nombre: 'Catálogo de Repuestos e Insumos',
        descripcion: 'Códigos de parte, precios referenciales y stock.',
        viewKey: 'ver_repuestos',
        editKey: 'editar_repuestos'
      }
    ]
  },
  {
    id: 'almacen',
    nombre: 'Despeje de Almacén',
    descripcion: 'Clasificación de stock de almacén y asignación de destino operativo.',
    viewKey: 'ver_almacen',
    editKey: 'editar_almacen',
    legacyKey: 'acceder_almacen',
    submodulos: [
      {
        id: 'destino_stock',
        nombre: 'Clasificación y Destino de Stock',
        descripcion: 'Seleccionar destino para mantenimiento o desincorporación.',
        viewKey: 'ver_destino_stock',
        editKey: 'editar_almacen'
      }
    ]
  },
  {
    id: 'reportes',
    nombre: 'Filtros y Reportes',
    descripcion: 'Generación de informes de gestión, estadísticas de costos y descargas en PDF.',
    viewKey: 'ver_reportes',
    editKey: 'editar_reportes',
    legacyKey: 'acceder_reportes',
    submodulos: [
      {
        id: 'reportes_generador',
        nombre: 'Buscador y Descargas de Reportes',
        descripcion: 'Exportar informes consolidados y auditoría de órdenes.',
        viewKey: 'ver_reportes_generador',
        editKey: 'editar_reportes'
      }
    ]
  },
  {
    id: 'usuarios',
    nombre: 'Control de Usuarios y Roles',
    descripcion: 'Gestión de personal, asignación de cargos y configuración de permisos.',
    viewKey: 'ver_usuarios',
    editKey: 'editar_usuarios',
    legacyKey: 'acceder_usuarios',
    submodulos: [
      {
        id: 'empleados',
        nombre: 'Directorio de Empleados',
        descripcion: 'Registro, activación/desactivación y reseteo de claves.',
        viewKey: 'ver_empleados',
        editKey: 'editar_empleados'
      },
      {
        id: 'roles',
        nombre: 'Políticas de Roles y Privilegios',
        descripcion: 'Creación y modificación de perfiles de privilegios dinámicos.',
        viewKey: 'ver_roles',
        editKey: 'editar_roles'
      },
      {
        id: 'feedbacks',
        nombre: 'Buzón de Feedbacks Piloto',
        descripcion: 'Supervisión y gestión de observaciones y sugerencias de stakeholders.',
        viewKey: 'ver_feedbacks',
        editKey: 'editar_feedbacks'
      }
    ]
  },
  {
    id: 'auditoria',
    nombre: 'Logs de Auditoría',
    descripcion: 'Bitácora inmutable de eventos del sistema y firmas registradas.',
    viewKey: 'ver_auditoria',
    editKey: 'editar_auditoria',
    legacyKey: 'acceder_auditoria',
    submodulos: [
      {
        id: 'auditoria_logs',
        nombre: 'Bitácora Inmutable de Auditoría',
        descripcion: 'Trazabilidad criptográfica de acciones y logins.',
        viewKey: 'ver_auditoria_logs',
        editKey: 'editar_auditoria'
      }
    ]
  }
];

export const preparePermisosForSave = (rawPerms: Record<string, boolean>): Record<string, boolean> => {
  const p = { ...rawPerms };

  // Regla de consistencia: si Editar está activo, Ver DEBE estar activo
  MODULOS_SISTEMA.forEach(mod => {
    if (p[mod.editKey]) p[mod.viewKey] = true;
    mod.submodulos.forEach(s => {
      if (p[s.editKey]) p[s.viewKey] = true;
    });
  });

  // Cálculo estricto de banderas de acceso legado (true o false explícito sin flags obsoletos)
  p.acceder_inicio = !!(
    p.ver_inicio || p.editar_inicio || 
    p.ver_tickets || p.editar_tickets || 
    p.ver_rendimiento || p.editar_rendimiento
  );

  p.acceder_operaciones = !!(
    p.ver_operaciones || p.editar_operaciones || 
    p.ver_checklists || p.editar_checklists || 
    p.ver_ordenes || p.editar_ordenes || 
    p.ver_solicitudes || p.editar_solicitudes || 
    p.ver_profit_diagnostics || p.modificar_profit_diagnostics
  );

  p.acceder_checklists = !!(p.ver_checklists || p.editar_checklists);
  p.acceder_ordenes = !!(p.ver_ordenes || p.editar_ordenes);
  p.acceder_solicitudes = !!(p.ver_solicitudes || p.editar_solicitudes);
  p.acceder_pm_tickets = !!(p.ver_tickets || p.editar_tickets);
  p.acceder_profit_diagnostics = !!(p.ver_profit_diagnostics || p.modificar_profit_diagnostics);

  p.acceder_procura = !!(
    p.ver_procura || p.editar_procura || 
    p.ver_procura_expedientes || p.editar_procura_expedientes || 
    p.ver_procura_tareas || p.editar_procura_tareas
  );

  p.acceder_catalogos = !!(
    p.ver_catalogos || p.editar_catalogos || 
    p.ver_activos || p.editar_activos || 
    p.ver_repuestos || p.editar_repuestos
  );

  p.acceder_almacen = !!(p.ver_almacen || p.editar_almacen);
  p.acceder_reportes = !!(p.ver_reportes || p.editar_reportes);

  p.acceder_usuarios = !!(
    p.ver_usuarios || p.editar_usuarios || 
    p.ver_empleados || p.editar_empleados || 
    p.ver_roles || p.editar_roles ||
    p.ver_feedbacks || p.editar_feedbacks
  );

  p.acceder_auditoria = !!(
    p.ver_auditoria || p.editar_auditoria || 
    p.ver_auditoria_logs
  );

  return p;
};

interface AdminPanelProps {
  initialTab?: 'usuarios' | 'roles' | 'departamentos' | 'feedback';
  onTabChange?: (tab: 'usuarios' | 'roles' | 'departamentos' | 'feedback') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialTab = 'usuarios', onTabChange }) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles' | 'departamentos' | 'feedback'>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: 'usuarios' | 'roles' | 'departamentos' | 'feedback') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  
  // Lists
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(20);
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesRowsPerPage, setRolesRowsPerPage] = useState(20);
  const [deptsPage, setDeptsPage] = useState(1);
  const [deptsRowsPerPage, setDeptsRowsPerPage] = useState(20);

  // Search state for users and depts
  const [userSearch, setUserSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedVisitorUser, setSelectedVisitorUser] = useState<Usuario | null>(null);
  const [isOwnProfileModalOpen, setIsOwnProfileModalOpen] = useState(false);

  const handleUserClick = (targetUser: Usuario) => {
    if (user && targetUser.id === user.id) {
      setIsOwnProfileModalOpen(true);
    } else {
      setSelectedVisitorUser(targetUser);
    }
  };

  // Reset page to 1 when switching tabs or filtering
  useEffect(() => {
    setUsersPage(1);
    setRolesPage(1);
    setDeptsPage(1);
  }, [activeTab]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  useEffect(() => {
    setDeptsPage(1);
  }, [deptSearch]);

  const filteredUsers = users
    .filter(u => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase().trim();
      return (
        (u.nombre && u.nombre.toLowerCase().includes(q)) ||
        (u.rol && u.rol.toLowerCase().includes(q)) ||
        (u.nombre_usuario && u.nombre_usuario.toLowerCase().includes(q)) ||
        (u.departamento && u.departamento.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '', 'es', { sensitivity: 'base' }));

  const filteredDepts = departments
    .filter(d => {
      if (!deptSearch.trim()) return true;
      const q = deptSearch.toLowerCase().trim();
      return (
        d.nombre.toLowerCase().includes(q) ||
        (d.descripcion && d.descripcion.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  // Modals control
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // User Form States
  const [userId, setUserId] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rolName, setRolName] = useState('Chofer/Operador');
  const [departamentoId, setDepartamentoId] = useState<number | null>(null);
  const [departamentoNombre, setDepartamentoNombre] = useState('');
  const [userPermisos, setUserPermisos] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Role Form States
  const [roleId, setRoleId] = useState<number | null>(null);
  const [roleNombre, setRoleNombre] = useState('');
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});

  // Department Form States
  const [deptId, setDeptId] = useState<number | null>(null);
  const [deptNombre, setDeptNombre] = useState('');
  const [deptDescripcion, setDeptDescripcion] = useState('');
  const [deptPermisos, setDeptPermisos] = useState<Record<string, boolean>>({});

  // Assign Users to Department States
  const [activeDeptForAssign, setActiveDeptForAssign] = useState<Departamento | null>(null);
  const [selectedUserIdsForDept, setSelectedUserIdsForDept] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users
      const usersRes = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!usersRes.ok) {
        const errData = await usersRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error al obtener empleados (Código ${usersRes.status})`);
      }
      setUsers(await usersRes.json());

      // Fetch roles
      const rolesRes = await fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      if (!rolesRes.ok) {
        const errData = await rolesRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error al obtener roles (Código ${rolesRes.status})`);
      }
      const rolesData = await rolesRes.json();
      setRoles(rolesData);
      if (rolesData.length > 0 && !isEdit) {
        setRolName(rolesData[0].nombre);
        setUserPermisos(rolesData[0].permisos || {});
      }

      // Fetch departments
      const deptsRes = await fetch('/api/departamentos', { headers: { Authorization: `Bearer ${token}` } });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al sincronizar usuarios, roles y departamentos con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // ==========================================
  // USUARIOS HANDLERS
  // ==========================================
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = isEdit ? `/api/auth/users/${userId}` : '/api/auth/users';
    const method = isEdit ? 'PUT' : 'POST';
    const preparedPermisos = preparePermisosForSave(userPermisos);
    const payload = isEdit 
      ? { 
          nombre, 
          rol: rolName, 
          permisos: preparedPermisos, 
          contrasena,
          departamento_id: departamentoId ? Number(departamentoId) : null,
          departamento: departamentoNombre || null
        } 
      : { 
          nombre, 
          nombre_usuario: nombreUsuario, 
          contrasena, 
          rol: rolName, 
          permisos: preparedPermisos,
          departamento_id: departamentoId ? Number(departamentoId) : null,
          departamento: departamentoNombre || null
        };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo al procesar el usuario.');

      setShowUserModal(false);
      resetUserForm();
      fetchData();
      window.dispatchEvent(new Event('gactivos_user_updated'));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUserToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/auth/users/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !currentStatus })
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleUserDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar permanentemente a este empleado?')) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleUserEditOpen = (u: Usuario) => {
    setIsEdit(true);
    setUserId(u.id);
    setNombre(u.nombre);
    setNombreUsuario(u.nombre_usuario);
    setContrasena(u.contrasena_plana || '');
    setRolName(u.rol);
    setUserPermisos(u.permisos || {});
    const matchedDept = departments.find(d => d.id === u.departamento_id || d.nombre === u.departamento);
    setDepartamentoId(u.departamento_id ?? (matchedDept ? matchedDept.id : null));
    setDepartamentoNombre(u.departamento || (matchedDept ? matchedDept.nombre : ''));
    setShowUserModal(true);
  };

  const handleUserCreateOpen = () => {
    setIsEdit(false);
    resetUserForm();
    setShowUserModal(true);
  };

  const resetUserForm = () => {
    setUserId('');
    setNombre('');
    setNombreUsuario('');
    setContrasena('');
    setShowPassword(false);
    setDepartamentoId(null);
    setDepartamentoNombre('');
    if (roles.length > 0) {
      setRolName(roles[0].nombre);
      setUserPermisos(roles[0].permisos || {});
    } else {
      setRolName('Chofer/Operador');
      setUserPermisos({});
    }
    setError(null);
  };

  const handleUserRoleChange = (selectedRoleName: string) => {
    setRolName(selectedRoleName);
    const selectedRole = roles.find(r => r.nombre === selectedRoleName);
    if (selectedRole) {
      setUserPermisos(selectedRole.permisos || {});
    }
  };

  const handleUserDeptChange = (deptIdStr: string) => {
    if (!deptIdStr) {
      setDepartamentoId(null);
      setDepartamentoNombre('');
      return;
    }
    const idNum = parseInt(deptIdStr, 10);
    setDepartamentoId(idNum);
    const foundDept = departments.find(d => d.id === idNum);
    if (foundDept) {
      setDepartamentoNombre(foundDept.nombre);
      // Auto-cargar permisos sugeridos del departamento si es usuario nuevo
      if (!isEdit && foundDept.permisos && Object.keys(foundDept.permisos).length > 0) {
        setUserPermisos(prev => ({ ...prev, ...foundDept.permisos }));
      }
    }
  };

  // Cargar manualmente los permisos del departamento seleccionado
  const handleLoadDeptPermisos = () => {
    if (!departamentoId) return;
    const foundDept = departments.find(d => d.id === departamentoId);
    if (foundDept && foundDept.permisos) {
      setUserPermisos(prev => ({ ...prev, ...foundDept.permisos }));
    }
  };

  // ==========================================
  // ROLES HANDLERS
  // ==========================================
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = isEdit ? `/api/roles/${roleId}` : '/api/roles';
    const method = isEdit ? 'PUT' : 'POST';
    const finalPermisos = preparePermisosForSave(permisos);
    const payload = { nombre: roleNombre, permisos: finalPermisos };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el rol.');

      setShowRoleModal(false);
      resetRoleForm();
      fetchData();
      window.dispatchEvent(new Event('gactivos_user_updated'));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRoleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este rol de forma permanente?')) return;
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Rol eliminado con éxito.');
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar rol.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleRoleEditOpen = (r: Role) => {
    setIsEdit(true);
    setRoleId(r.id);
    setRoleNombre(r.nombre);
    setPermisos(r.permisos || {});
    setShowRoleModal(true);
  };

  const handleRoleCreateOpen = () => {
    setIsEdit(false);
    resetRoleForm();
    setShowRoleModal(true);
  };

  const resetRoleForm = () => {
    setRoleId(null);
    setRoleNombre('');
    setPermisos({});
    setError(null);
  };

  // ==========================================
  // DEPARTAMENTOS HANDLERS
  // ==========================================
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = isEdit ? `/api/departamentos/${deptId}` : '/api/departamentos';
    const method = isEdit ? 'PUT' : 'POST';
    const finalPermisos = preparePermisosForSave(deptPermisos);
    const payload = {
      nombre: deptNombre,
      descripcion: deptDescripcion,
      permisos: finalPermisos,
      propagar_a_usuarios: isEdit
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el departamento.');

      setShowDeptModal(false);
      resetDeptForm();
      fetchData();
      window.dispatchEvent(new Event('gactivos_user_updated'));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeptDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este departamento? Los colaboradores quedarán sin asignación pero mantendrán su usuario activo.')) return;
    try {
      const res = await fetch(`/api/departamentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Departamento eliminado.');
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar departamento.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleDeptEditOpen = (d: Departamento) => {
    setIsEdit(true);
    setDeptId(d.id);
    setDeptNombre(d.nombre);
    setDeptDescripcion(d.descripcion || '');
    setDeptPermisos(d.permisos || {});
    setShowDeptModal(true);
  };

  const handleDeptCreateOpen = () => {
    setIsEdit(false);
    resetDeptForm();
    setShowDeptModal(true);
  };

  const resetDeptForm = () => {
    setDeptId(null);
    setDeptNombre('');
    setDeptDescripcion('');
    setDeptPermisos({});
    setError(null);
  };

  const handleOpenAssignUsers = (d: Departamento) => {
    setActiveDeptForAssign(d);
    // Extraer IDs de usuarios que pertenecen a este departamento
    const currentMemberIds = users
      .filter(u => u.departamento_id === d.id || u.departamento === d.nombre)
      .map(u => u.id);
    setSelectedUserIdsForDept(currentMemberIds);
    setAssignSearch('');
    setShowAssignModal(true);
  };

  const toggleUserInDept = (userIdToToggle: string) => {
    setSelectedUserIdsForDept(prev => 
      prev.includes(userIdToToggle)
        ? prev.filter(id => id !== userIdToToggle)
        : [...prev, userIdToToggle]
    );
  };

  const handleSaveDepartmentUsers = async () => {
    if (!activeDeptForAssign) return;
    try {
      const res = await fetch(`/api/departamentos/${activeDeptForAssign.id}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ usuario_ids: selectedUserIdsForDept })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar miembros del departamento.');

      setShowAssignModal(false);
      setActiveDeptForAssign(null);
      fetchData();
      window.dispatchEvent(new Event('gactivos_user_updated'));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ==========================================
  // PERMISSION INTERACTIVE TOGGLE RULES
  // ==========================================
  // Regla clave requerida por el usuario:
  // - Si se activa "Editar", automáticamente se activa "Ver".
  // - Si se desactiva "Ver", automáticamente se desactiva "Editar".
  const togglePermissionPair = (
    key: string,
    isEditType: boolean,
    partnerKey: string,
    setPermsFn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ) => {
    setPermsFn(prev => {
      const currentVal = !!prev[key];
      const nextVal = !currentVal;
      const updated = { ...prev, [key]: nextVal };

      if (isEditType && nextVal) {
        // Al marcar Editar, marcar Ver obligatoriamente
        updated[partnerKey] = true;
      } else if (!isEditType && !nextVal) {
        // Al desmarcar Ver, desmarcar Editar obligatoriamente
        updated[partnerKey] = false;
      }

      return updated;
    });
  };

  // Toggle para todo el módulo padre
  const toggleModuleAll = (
    modulo: ModuleDef,
    targetType: 'ver' | 'editar',
    setPermsFn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ) => {
    setPermsFn(prev => {
      const parentKey = targetType === 'ver' ? modulo.viewKey : modulo.editKey;
      const currentVal = !!prev[parentKey];
      const nextVal = !currentVal;
      const updated = { ...prev, [parentKey]: nextVal };

      if (targetType === 'editar') {
        if (nextVal) {
          updated[modulo.viewKey] = true;
        }
        modulo.submodulos.forEach(sub => {
          updated[sub.editKey] = nextVal;
          if (nextVal) updated[sub.viewKey] = true;
        });
      } else {
        if (!nextVal) {
          updated[modulo.editKey] = false;
        }
        modulo.submodulos.forEach(sub => {
          updated[sub.viewKey] = nextVal;
          if (!nextVal) updated[sub.editKey] = false;
        });
      }

      return updated;
    });
  };

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'inicio': return <Home size={18} color="var(--color-primary)" />;
      case 'operaciones': return <ClipboardList size={18} color="var(--color-primary)" />;
      case 'procura': return <Scale size={18} color="var(--color-primary)" />;
      case 'catalogos': return <Database size={18} color="var(--color-primary)" />;
      case 'almacen': return <Boxes size={18} color="var(--color-primary)" />;
      case 'reportes': return <FileBarChart2 size={18} color="var(--color-primary)" />;
      case 'usuarios': return <Users size={18} color="var(--color-primary)" />;
      case 'auditoria': return <ShieldAlert size={18} color="var(--color-primary)" />;
      default: return <Shield size={18} color="var(--color-primary)" />;
    }
  };

  const renderModuleBadge = (rolePerms: Record<string, boolean>, mod: ModuleDef) => {
    const canEdit = !!rolePerms[mod.editKey] || mod.submodulos.some(s => !!rolePerms[s.editKey]);
    const canView = !!rolePerms[mod.viewKey] || !!rolePerms[mod.legacyKey || ''] || mod.submodulos.some(s => !!rolePerms[s.viewKey]);

    if (canEdit) {
      return (
        <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
          Ver y Editar
        </span>
      );
    }
    if (canView) {
      return (
        <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
          Solo Ver
        </span>
      );
    }
    return (
      <span className="badge badge-neutral" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', opacity: 0.6 }}>
        Bloqueado
      </span>
    );
  };

  // Selector jerárquico de permisos reutilizable
  const renderPermissionsSelector = (
    currentPerms: Record<string, boolean>,
    setPermsFn: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    isRoleAdmin: boolean = false
  ) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        {MODULOS_SISTEMA.map(modulo => {
          const parentCanView = !!currentPerms[modulo.viewKey] || modulo.submodulos.every(s => !!currentPerms[s.viewKey]);
          const parentCanEdit = !!currentPerms[modulo.editKey] || modulo.submodulos.every(s => !!currentPerms[s.editKey]);

          return (
            <div 
              key={modulo.id} 
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            >
              {/* Encabezado del Módulo Padre */}
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                  {getModuleIcon(modulo.id)}
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-title)', display: 'block' }}>
                      {modulo.nombre}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                      {modulo.descripcion}
                    </span>
                  </div>
                </div>

                {/* Controles Maestros del Módulo Padre alineados a la DERECHA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto', flexShrink: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: 700, cursor: isRoleAdmin ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={parentCanView}
                      disabled={isRoleAdmin}
                      onChange={() => toggleModuleAll(modulo, 'ver', setPermsFn)}
                    />
                    <span>Ver Módulo</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-primary)', cursor: isRoleAdmin ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={parentCanEdit}
                      disabled={isRoleAdmin}
                      onChange={() => toggleModuleAll(modulo, 'editar', setPermsFn)}
                    />
                    <span>Editar Módulo</span>
                  </label>
                </div>
              </div>

              {/* Submódulos del Módulo */}
              <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {modulo.submodulos.map(sub => {
                  const subCanView = !!currentPerms[sub.viewKey];
                  const subCanEdit = !!currentPerms[sub.editKey];

                  return (
                    <div 
                      key={sub.id} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ flex: '1 1 250px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block' }}>
                          {sub.nombre}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {sub.descripcion}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 600, cursor: isRoleAdmin ? 'not-allowed' : 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={subCanView}
                            disabled={isRoleAdmin}
                            onChange={() => togglePermissionPair(sub.viewKey, false, sub.editKey, setPermsFn)}
                          />
                          <span>Ver</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-primary)', cursor: isRoleAdmin ? 'not-allowed' : 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={subCanEdit}
                            disabled={isRoleAdmin}
                            onChange={() => togglePermissionPair(sub.editKey, true, sub.viewKey, setPermsFn)}
                          />
                          <span>Editar</span>
                        </label>
                      </div>
                    </div>
                  );
                })}

                {/* Privilegios Especiales del Módulo alineados a la DERECHA */}
                {modulo.especiales && modulo.especiales.length > 0 && (
                  <div style={{ marginTop: '0.35rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {modulo.especiales.map(esp => (
                      <div 
                        key={esp.key} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center', 
                          padding: '0.55rem 0.85rem', 
                          background: esp.key.includes('ceo') ? 'rgba(236, 119, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: esp.key.includes('ceo') ? '1px solid rgba(236, 119, 0, 0.35)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1 }}>
                          <span style={{ fontSize: '1.1rem' }}>{esp.icon}</span>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: esp.key.includes('ceo') ? 'var(--color-primary)' : 'var(--text-title)', display: 'block' }}>
                              {esp.label}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {esp.desc}
                            </span>
                          </div>
                        </div>

                        {/* Botón de activación / checkbox alineado a la DERECHA */}
                        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          <label 
                            htmlFor={`esp-${esp.key}`} 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              fontSize: '0.775rem', 
                              fontWeight: 700, 
                              cursor: isRoleAdmin ? 'not-allowed' : 'pointer',
                              color: esp.key.includes('ceo') ? 'var(--color-primary)' : 'var(--text-title)',
                              margin: 0
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`esp-${esp.key}`}
                              checked={!!currentPerms[esp.key]}
                              disabled={isRoleAdmin}
                              onChange={() => {
                                setPermsFn(prev => ({
                                  ...prev,
                                  [esp.key]: !prev[esp.key]
                                }));
                              }}
                            />
                            <span>{currentPerms[esp.key] ? 'Habilitado' : 'Deshabilitado'}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="view-container">
      {/* Sub-tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          style={{ 
            background: 'none', 
            color: activeTab === 'usuarios' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'usuarios' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700
          }}
          onClick={() => handleTabSwitch('usuarios')}
        >
          Directorio de Empleados
        </button>
        <button 
          className="btn" 
          style={{ 
            background: 'none', 
            color: activeTab === 'roles' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'roles' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700
          }}
          onClick={() => handleTabSwitch('roles')}
        >
          Control de Roles y Privilegios
        </button>
        <button 
          className="btn" 
          style={{ 
            background: 'none', 
            color: activeTab === 'departamentos' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'departamentos' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          onClick={() => handleTabSwitch('departamentos')}
        >
          <Building2 size={16} />
          <span>Departamentos Corporativos</span>
        </button>
        <button 
          className="btn" 
          style={{ 
            background: 'none', 
            color: activeTab === 'feedback' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'feedback' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          onClick={() => handleTabSwitch('feedback')}
        >
          <Sparkles size={16} color="var(--color-primary)" />
          <span>Buzón Feedback Piloto</span>
        </button>
      </div>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-main">
            {activeTab === 'usuarios' 
              ? 'Gestión de Cuentas y Empleados' 
              : activeTab === 'roles' 
                ? 'Políticas de Roles del Sistema' 
                : activeTab === 'departamentos'
                  ? 'Departamentos y Privilegios por Área'
                  : 'Buzón y Evaluación de Feedback Piloto'}
          </h1>
          <p className="subtitle-main">
            {activeTab === 'usuarios' 
              ? 'Administre el acceso, estados de firma y cargos de su equipo operativo.' 
              : activeTab === 'roles' 
                ? 'Defina privilegios detallados y cree roles de acceso personalizados para cada módulo.'
                : activeTab === 'departamentos'
                  ? 'Organice la estructura empresarial, configure permisos de Ver/Editar por sección y asigne colaboradores.'
                  : 'Visualice las observaciones del equipo directivo, gestione su estado y copie la ficha técnica para resolución agéntica.'}
          </p>
        </div>

        {activeTab !== 'feedback' && (
          <button 
            className="btn btn-primary" 
            onClick={
              activeTab === 'usuarios' 
                ? handleUserCreateOpen 
                : activeTab === 'roles' 
                  ? handleRoleCreateOpen 
                  : handleDeptCreateOpen
            }
          >
            {activeTab === 'usuarios' && <UserPlus size={16} />}
            {activeTab === 'roles' && <Shield size={16} />}
            {activeTab === 'departamentos' && <Building2 size={16} />}
            <span>
              {activeTab === 'usuarios' 
                ? 'Nuevo Empleado' 
                : activeTab === 'roles' 
                  ? 'Nuevo Rol' 
                  : 'Nuevo Departamento'}
            </span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {activeTab === 'feedback' ? (
        <AdminFeedbackInbox />
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div className="table-container">
          {activeTab === 'usuarios' ? (
            <>
              {/* Buscador de Usuarios por Nombre o Rol */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px', maxWidth: '440px', position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Buscar usuario por nombre o rol..." 
                    value={userSearch} 
                    onChange={e => setUserSearch(e.target.value)} 
                    style={{ margin: 0, paddingLeft: '2.5rem', paddingRight: userSearch ? '2.2rem' : '1rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        fontSize: '0.85rem'
                      }}
                      title="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
                </div>
              </div>

              <table className="custom-table">
              <thead>
                <tr>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Nombre <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 700 }} title="Orden alfabético descendente (Z a A)">(Z - A ↓)</span>
                    </span>
                  </th>
                  <th>Nombre de Usuario</th>
                  <th>Departamento</th>
                  <th>Rol Técnico / Permiso</th>
                  <th>Estado Firma</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No se encontraron usuarios coincidentes con "{userSearch}".
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice((usersPage - 1) * usersRowsPerPage, usersPage * usersRowsPerPage).map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            onClick={() => handleUserClick(u)}
                            title={user && u.id === user.id ? "Clic para abrir mi perfil" : "Clic para ver ficha del colaborador"}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              position: 'relative',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                            className="admin-table-avatar"
                          >
                            {u.foto_perfil ? (
                              <img
                                src={u.foto_perfil}
                                alt={u.nombre}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid var(--color-primary)',
                                  display: 'block'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #ff9233 0%, #ec7700 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.95rem'
                                }}
                              >
                                {u.nombre.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="table-avatar-badge" title={user && u.id === user.id ? "Abrir perfil" : "Ver ficha"}>
                              <Maximize2 size={9} />
                            </div>
                          </div>
                          <span
                            onClick={() => handleUserClick(u)}
                            style={{ 
                              cursor: 'pointer', 
                              transition: 'color 0.15s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = '')}
                            title={user && u.id === user.id ? "Clic para abrir mi perfil" : "Clic para ver ficha del colaborador"}
                          >
                            {u.nombre}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          onClick={() => handleUserClick(u)}
                          style={{ 
                            cursor: 'pointer', 
                            color: 'var(--color-primary)', 
                            fontWeight: 600, 
                            transition: 'opacity 0.15s ease',
                            userSelect: 'none'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                          title={user && u.id === user.id ? "Clic para abrir mi perfil" : "Clic para ver ficha del colaborador"}
                        >
                          @{u.nombre_usuario}
                        </span>
                      </td>
                      <td>
                        {u.departamento ? (
                          <span 
                            className="badge badge-secondary" 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.35rem', 
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.55rem',
                              background: 'rgba(236, 119, 0, 0.08)',
                              border: '1px solid rgba(236, 119, 0, 0.25)',
                              color: 'var(--text-title)'
                            }}
                          >
                            <Building2 size={12} color="var(--color-primary)" /> {u.departamento}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin asignar</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Shield size={12} /> {u.rol}
                        </span>
                      </td>
                      <td>
                        {u.activo ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserCheck size={12} /> Activo
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserX size={12} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleUserEditOpen(u)} title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className={`btn ${u.activo ? 'btn-secondary' : 'btn-success'}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} 
                            onClick={() => handleUserToggle(u.id, u.activo)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleUserDelete(u.id)} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              totalItems={filteredUsers.length}
              itemsPerPage={usersRowsPerPage}
              setItemsPerPage={setUsersRowsPerPage}
              currentPage={usersPage}
              setCurrentPage={setUsersPage}
            />
            </>
          ) : activeTab === 'roles' ? (
            <>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '170px' }}>Nombre del Rol</th>
                    <th style={{ textAlign: 'center' }}>Inicio</th>
                    <th style={{ textAlign: 'center' }}>Operaciones</th>
                    <th style={{ textAlign: 'center' }}>Procura</th>
                    <th style={{ textAlign: 'center' }}>Catálogos</th>
                    <th style={{ textAlign: 'center' }}>Almacén</th>
                    <th style={{ textAlign: 'center' }}>Reportes</th>
                    <th style={{ textAlign: 'center' }}>Usuarios</th>
                    <th style={{ textAlign: 'center' }}>Auditoría</th>
                    <th style={{ textAlign: 'center', minWidth: '150px' }}>Sellos / Especiales</th>
                    <th style={{ textAlign: 'center', minWidth: '90px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.slice((rolesPage - 1) * rolesRowsPerPage, rolesPage * rolesRowsPerPage).map(r => {
                    const rPerms = r.permisos || {};

                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Shield size={14} color={r.nombre === 'Presidente' || r.nombre === 'Administrador' ? 'var(--color-primary)' : 'var(--text-secondary)'} />
                            <span>{r.nombre}</span>
                          </div>
                        </td>

                        {/* Badges por cada módulo */}
                        {MODULOS_SISTEMA.map(m => (
                          <td key={m.id} style={{ textAlign: 'center' }}>
                            {renderModuleBadge(rPerms, m)}
                          </td>
                        ))}

                        {/* Especiales */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                            {rPerms.emitir_sello_ceo && (
                              <span className="badge badge-warning" style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem' }}>
                                👑 Sello CEO
                              </span>
                            )}
                            {rPerms.firmar_checklists && (
                              <span className="badge badge-success" style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem' }}>
                                ✍️ Firma
                              </span>
                            )}
                            {rPerms.borrar_checklists && (
                              <span className="badge badge-danger" style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem' }}>
                                🗑️ Borrado
                              </span>
                            )}
                            {!rPerms.emitir_sello_ceo && !rPerms.firmar_checklists && !rPerms.borrar_checklists && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>
                            )}
                          </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleRoleEditOpen(r)} title="Editar Permisos">
                              <Settings size={14} />
                            </button>
                            {r.nombre !== 'Administrador' && r.nombre !== 'Presidente' && (
                              <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--color-danger)' }} onClick={() => handleRoleDelete(r.id)} title="Eliminar Rol">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            <Pagination
              totalItems={roles.length}
              itemsPerPage={rolesRowsPerPage}
              setItemsPerPage={setRolesRowsPerPage}
              currentPage={rolesPage}
              setCurrentPage={setRolesPage}
            />
            </>
          ) : (
            <>
              {/* Buscador de Departamentos */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px', maxWidth: '440px', position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Buscar departamento por nombre o descripción..." 
                    value={deptSearch} 
                    onChange={e => setDeptSearch(e.target.value)} 
                    style={{ margin: 0, paddingLeft: '2.5rem', paddingRight: deptSearch ? '2.2rem' : '1rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  {deptSearch && (
                    <button
                      type="button"
                      onClick={() => setDeptSearch('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        fontSize: '0.85rem'
                      }}
                      title="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {filteredDepts.length} {filteredDepts.length === 1 ? 'departamento registrado' : 'departamentos registrados'}
                </div>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Departamento</th>
                    <th style={{ minWidth: '170px' }}>Miembros Vinculados</th>
                    <th style={{ textAlign: 'center' }}>Inicio</th>
                    <th style={{ textAlign: 'center' }}>Operaciones</th>
                    <th style={{ textAlign: 'center' }}>Procura</th>
                    <th style={{ textAlign: 'center' }}>Catálogos</th>
                    <th style={{ textAlign: 'center' }}>Almacén</th>
                    <th style={{ textAlign: 'center' }}>Reportes</th>
                    <th style={{ textAlign: 'center' }}>Usuarios</th>
                    <th style={{ textAlign: 'center' }}>Auditoría</th>
                    <th style={{ textAlign: 'center', minWidth: '110px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepts.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No se encontraron departamentos coincidentes con "{deptSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredDepts.slice((deptsPage - 1) * deptsRowsPerPage, deptsPage * deptsRowsPerPage).map(d => {
                      const dPerms = d.permisos || {};
                      const memberCount = d.total_usuarios || (d.usuarios ? d.usuarios.length : 0);

                      return (
                        <tr key={d.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <Building2 size={16} color="var(--color-primary)" />
                                <span style={{ fontWeight: 800, color: 'var(--text-title)', fontSize: '0.9rem' }}>
                                  {d.nombre}
                                </span>
                              </div>
                              {d.descripcion && (
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.25' }}>
                                  {d.descripcion}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span 
                                className="badge badge-info" 
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', fontWeight: 700 }}
                              >
                                {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                              </span>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                onClick={() => handleOpenAssignUsers(d)}
                                title="Asignar o desvincular empleados de este departamento"
                              >
                                <UserCheck2 size={12} />
                                <span>Asignar</span>
                              </button>
                            </div>
                          </td>

                          {/* Badges por cada módulo */}
                          {MODULOS_SISTEMA.map(m => (
                            <td key={m.id} style={{ textAlign: 'center' }}>
                              {renderModuleBadge(dPerms, m)}
                            </td>
                          ))}

                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem' }} 
                                onClick={() => handleDeptEditOpen(d)} 
                                title="Configurar Privilegios y Datos del Departamento"
                              >
                                <Settings size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem', color: 'var(--color-danger)' }} 
                                onClick={() => handleDeptDelete(d.id)} 
                                title="Eliminar Departamento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredDepts.length}
                itemsPerPage={deptsRowsPerPage}
                setItemsPerPage={setDeptsRowsPerPage}
                currentPage={deptsPage}
                setCurrentPage={setDeptsPage}
              />
            </>
          )}
        </div>
      )}

      {/* Modal for User Creation/Edition */}
      {showUserModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>{isEdit ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      placeholder="Ej: Carlos Mendoza"
                      required 
                    />
                    <SpanishSpellAssistant text={nombre} onChange={setNombre} label="Nombre" />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario (Login)</label>
                    <input type="text" className="form-input" value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)} disabled={isEdit} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {isEdit ? 'Contraseña (Ver / Modificar)' : 'Contraseña'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        className="form-input" 
                        value={contrasena} 
                        onChange={e => setContrasena(e.target.value)} 
                        required={!isEdit} 
                        placeholder={isEdit ? 'Escriba para cambiar clave' : 'Escriba la contraseña'}
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', width: '42px' }}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol del Sistema (Perfil Dinámico)</label>
                    <select className="form-select" value={rolName} onChange={e => handleUserRoleChange(e.target.value)}>
                      {roles.map(r => (
                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Departamento de Adscripción</label>
                      {departamentoId && (
                        <button
                          type="button"
                          onClick={handleLoadDeptPermisos}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Cargar permisos predeterminados de este departamento"
                        >
                          📥 Sincronizar permisos depto
                        </button>
                      )}
                    </div>
                    <select 
                      className="form-select" 
                      value={departamentoId ?? ''} 
                      onChange={e => handleUserDeptChange(e.target.value)}
                    >
                      <option value="">-- Sin Departamento Asignado --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} ({d.total_usuarios || 0} miembros)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-color)', margin: '1.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-info)' }}>
                    Privilegios Individuales del Empleado (Heredados del Rol o Personalizados)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Al cambiar el rol arriba, se restauran los permisos base de dicho rol.
                  </span>
                </div>

                {renderPermissionsSelector(userPermisos, setUserPermisos, false)}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Empleado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Role Creation/Edition */}
      {showRoleModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>{isEdit ? `Editar Privilegios: ${roleNombre}` : 'Crear Rol Personalizado'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowRoleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRoleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Rol</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={roleNombre} 
                    onChange={e => setRoleNombre(e.target.value)} 
                    placeholder="Ej: Supervisor de Taller" 
                    required 
                  />
                  {isEdit && roleNombre === 'Administrador' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)', marginTop: '0.35rem', display: 'block' }}>
                      ⚠️ El rol Administrador cuenta con acceso global a todos los módulos.
                    </span>
                  )}
                </div>

                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--color-info)', fontWeight: 800 }}>
                      Matriz de Privilegios por Módulo y Submódulo
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Asigne permisos específicos de "Ver" (solo lectura) y "Editar" (crear, modificar y gestionar).
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        MODULOS_SISTEMA.forEach(m => {
                          all[m.viewKey] = true;
                          m.submodulos.forEach(s => { all[s.viewKey] = true; });
                        });
                        setPermisos(prev => ({ ...prev, ...all }));
                      }}
                    >
                      Habilitar Todo Ver
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        MODULOS_SISTEMA.forEach(m => {
                          all[m.viewKey] = true;
                          all[m.editKey] = true;
                          m.submodulos.forEach(s => {
                            all[s.viewKey] = true;
                            all[s.editKey] = true;
                          });
                        });
                        setPermisos(prev => ({ ...prev, ...all }));
                      }}
                    >
                      Habilitar Todo Editar
                    </button>
                  </div>
                </div>

                {renderPermissionsSelector(permisos, setPermisos, isEdit && roleNombre === 'Administrador')}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Rol</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Department Creation/Edition */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>
                  {isEdit ? `Configurar Departamento: ${deptNombre}` : 'Crear Nuevo Departamento'}
                </h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre del Departamento *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={deptNombre} 
                      onChange={e => setDeptNombre(e.target.value)} 
                      placeholder="Ej: Logística y Despacho" 
                      required 
                    />
                    <SpanishSpellAssistant text={deptNombre} onChange={setDeptNombre} label="Nombre del departamento" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción / Objetivo Operativo</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={deptDescripcion} 
                      onChange={e => setDeptDescripcion(e.target.value)} 
                      placeholder="Ej: Custodia, entrega de carga y coordinación de choferes" 
                    />
                    <SpanishSpellAssistant text={deptDescripcion} onChange={setDeptDescripcion} label="Descripción" />
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--color-info)', fontWeight: 800 }}>
                      Matriz de Privilegios por Defecto del Departamento
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Configure qué módulos y secciones pueden Ver y Editar los miembros de este departamento.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        MODULOS_SISTEMA.forEach(m => {
                          all[m.viewKey] = true;
                          m.submodulos.forEach(s => { all[s.viewKey] = true; });
                        });
                        setDeptPermisos(prev => ({ ...prev, ...all }));
                      }}
                    >
                      Habilitar Todo Ver
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        MODULOS_SISTEMA.forEach(m => {
                          all[m.viewKey] = true;
                          all[m.editKey] = true;
                          m.submodulos.forEach(s => {
                            all[s.viewKey] = true;
                            all[s.editKey] = true;
                          });
                        });
                        setDeptPermisos(prev => ({ ...prev, ...all }));
                      }}
                    >
                      Habilitar Todo Editar
                    </button>
                  </div>
                </div>

                {renderPermissionsSelector(deptPermisos, setDeptPermisos, false)}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {isEdit ? 'Actualizar Departamento' : 'Crear Departamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Assigning Users to Department */}
      {showAssignModal && activeDeptForAssign && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Building2 size={18} color="var(--color-primary)" />
                  <span>Colaboradores: {activeDeptForAssign.nombre}</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Seleccione los empleados asignados a esta área operativa.
                </span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowAssignModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Buscador de usuarios dentro del modal */}
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Buscar colaborador por nombre, usuario o rol..." 
                  value={assignSearch} 
                  onChange={e => setAssignSearch(e.target.value)} 
                  style={{ margin: 0, paddingLeft: '2.3rem' }}
                />
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              {/* Acciones rápidas de selección */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {selectedUserIdsForDept.length} {selectedUserIdsForDept.length === 1 ? 'colaborador seleccionado' : 'colaboradores seleccionados'}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-title)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}
                    onClick={() => setSelectedUserIdsForDept(users.map(u => u.id))}
                  >
                    Marcar Todos
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-title)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}
                    onClick={() => setSelectedUserIdsForDept([])}
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              {/* Lista scrolleable de usuarios */}
              <div style={{
                maxHeight: '360px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {users
                  .filter(u => {
                    if (!assignSearch.trim()) return true;
                    const q = assignSearch.toLowerCase().trim();
                    return (
                      u.nombre.toLowerCase().includes(q) ||
                      u.nombre_usuario.toLowerCase().includes(q) ||
                      u.rol.toLowerCase().includes(q)
                    );
                  })
                  .map(u => {
                    const isSelected = selectedUserIdsForDept.includes(u.id);
                    const isOtherDept = u.departamento && u.departamento !== activeDeptForAssign.nombre;

                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserInDept(u.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.65rem 0.85rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(236, 119, 0, 0.08)' : 'transparent',
                          transition: 'background 0.15s ease',
                          gap: '0.75rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div click
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--color-primary)' : 'var(--text-title)' }}>
                              {u.nombre}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              @{u.nombre_usuario}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem', alignItems: 'center' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                              {u.rol}
                            </span>
                            {isOtherDept && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>
                                (Actualmente en: {u.departamento})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancelar</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveDepartmentUsers}
              >
                Guardar Asignaciones ({selectedUserIdsForDept.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <UserVisitorProfileModal
        isOpen={Boolean(selectedVisitorUser)}
        onClose={() => setSelectedVisitorUser(null)}
        user={selectedVisitorUser}
      />

      <UserProfileModal
        isOpen={isOwnProfileModalOpen}
        onClose={() => setIsOwnProfileModalOpen(false)}
      />
    </div>
  );
};
