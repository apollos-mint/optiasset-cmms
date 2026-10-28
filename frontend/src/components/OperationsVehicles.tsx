import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activo, Checklist, OrdenServicio, CatalogoRepuesto } from '../types';
import { Plus, Upload, FileText, Trash2, AlertTriangle, Search, CalendarDays } from 'lucide-react';
import { Pagination } from './Pagination';
import { ProfitDiagnostics } from './ProfitDiagnostics';

interface OperationsVehiclesProps {
  selectedReportId?: string | null;
  clearSelectedReportId?: () => void;
}

export const OperationsVehicles: React.FC<OperationsVehiclesProps> = ({
  selectedReportId,
  clearSelectedReportId
}) => {
  const { token, user, logout } = useAuth();

  // Permisos Ver y Editar jerárquicos (estrictamente basados en privilegios configurados)
  const canViewChecklist = user?.rol === 'Administrador' || 
    !!user?.permisos?.ver_checklists || !!user?.permisos?.editar_checklists || 
    !!user?.permisos?.ver_operaciones || !!user?.permisos?.editar_operaciones ||
    (!!user?.permisos?.acceder_checklists && user?.permisos?.ver_checklists !== false);

  const canEditChecklist = user?.rol === 'Administrador' || 
    !!user?.permisos?.editar_checklists || 
    (!!user?.permisos?.editar_operaciones && user?.permisos?.editar_checklists !== false);

  const canViewOrdenes = user?.rol === 'Administrador' || 
    !!user?.permisos?.ver_ordenes || !!user?.permisos?.editar_ordenes || 
    !!user?.permisos?.ver_operaciones || !!user?.permisos?.editar_operaciones ||
    (!!user?.permisos?.acceder_ordenes && user?.permisos?.ver_ordenes !== false);

  const canEditOrdenes = user?.rol === 'Administrador' || 
    !!user?.permisos?.editar_ordenes || 
    (!!user?.permisos?.editar_operaciones && user?.permisos?.editar_ordenes !== false);

  const canViewSolicitudes = user?.rol === 'Administrador' || 
    !!user?.permisos?.ver_solicitudes || !!user?.permisos?.editar_solicitudes || 
    canViewChecklist || canViewOrdenes;

  const canEditSolicitudes = user?.rol === 'Administrador' || 
    !!user?.permisos?.editar_solicitudes || 
    (!!user?.permisos?.editar_operaciones && user?.permisos?.editar_solicitudes !== false);

  const canChecklist = canViewChecklist;
  const canOrdenes   = canViewOrdenes;
  // Tab principal: Operaciones vs Módulo Profit
  const [mainTab, setMainTab] = useState<'operaciones' | 'profit'>('operaciones');
  const [opTab, setOpTab] = useState<'checklists' | 'ordenes' | 'solicitudes'>(
    canChecklist ? 'checklists' : (canOrdenes ? 'ordenes' : 'solicitudes')
  );
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [solicitudesPage, setSolicitudesPage] = useState(1);
  const [solicitudesRowsPerPage, setSolicitudesRowsPerPage] = useState(20);
  const [showSdmConfirmModal, setShowSdmConfirmModal] = useState(false);
  const [sdmChecklistId, setSdmChecklistId] = useState('');
  const [sdmFailuresText, setSdmFailuresText] = useState('');
  const [minimizedModals, setMinimizedModals] = useState<{ key: string; title: string; data?: any }[]>([]);
  const [vehicles, setVehicles] = useState<Activo[]>([]);
  const [catalogRepuestos, setCatalogRepuestos] = useState<CatalogoRepuesto[]>([]);
  
  // Lists
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [orders, setOrders] = useState<OrdenServicio[]>([]);

  // Pagination states
  const [checklistPage, setChecklistPage] = useState(1);
  const [checklistRowsPerPage, setChecklistRowsPerPage] = useState(20);
  const [orderPage, setOrderPage] = useState(1);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(20);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdenServicio | null>(null);

  // File Upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  // Checklist Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Checklist Modal Tab and Selected Checklist for Detail

  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Checklist Filters (Estilo Profit con opción a escribir)
  const [filterPlaca, setFilterPlaca] = useState('');
  const [filterInspector, setFilterInspector] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAuditor, setFilterAuditor] = useState('');
  const [filterOrderId, setFilterOrderId] = useState('');

  // Reset pagination on filter or tab changes
  useEffect(() => {
    setChecklistPage(1);
    setOrderPage(1);
  }, [filterPlaca, filterInspector, filterStartDate, filterEndDate, filterAuditor, filterOrderId, opTab]);

  const handleResetFilters = () => {
    setFilterPlaca('');
    setFilterInspector('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterAuditor('');
    setFilterOrderId('');
  };

  const getValidationErrors = () => {
    const errors: Record<string, boolean> = {};

    // 1. Niveles
    if (!nivelLimpiaParabrisas) errors.nivelLimpiaParabrisas = true;
    if (!nivelAceite) errors.nivelAceite = true;
    if (!nivelRefrigerante) errors.nivelRefrigerante = true;
    if (!nivelCombustible) errors.nivelCombustible = true;
    if (!combustibleCant.trim()) errors.combustibleCant = true;
    if (!nivelAguaBateria) errors.nivelAguaBateria = true;

    // Luces
    if (!luzFreno) errors.luzFreno = true;
    if (!luzBajas) errors.luzBajas = true;
    if (!luzAltas) errors.luzAltas = true;
    if (!luzBombillosQuemados) errors.luzBombillosQuemados = true;
    if (!luzMicasRotas) errors.luzMicasRotas = true;
    if (!luzFarosRotos) errors.luzFarosRotos = true;
    if (cruceDD === null) errors.cruceDD = true;
    if (cruceDI === null) errors.cruceDI = true;
    if (cruceTD === null) errors.cruceTD = true;
    if (cruceTI === null) errors.cruceTI = true;

    // 2. Generales y Seguridad
    if (!genRuidoMotor) errors.genRuidoMotor = true;
    if (!genTornillosSuspension) errors.genTornillosSuspension = true;
    if (!genDrenarTanques) errors.genDrenarTanques = true;
    if (!genQuintaRueda) errors.genQuintaRueda = true;

    if (!segBotiquin) errors.segBotiquin = true;
    if (!segGato) errors.segGato = true;
    if (!segExtintor) errors.segExtintor = true;
    if (!segLlaveRueda) errors.segLlaveRueda = true;
    if (!segLona) errors.segLona = true;
    if (!segTriangulo) errors.segTriangulo = true;
    if (!segReproductor) errors.segReproductor = true;
    if (!segMecate) errors.segMecate = true;

    // 3. Funcionamiento y Ajustes
    if (!funcBateria) errors.funcBateria = true;
    if (!funcFrenos) errors.funcFrenos = true;
    if (!funcCorneta) errors.funcCorneta = true;
    if (!funcAireAcondicionado) errors.funcAireAcondicionado = true;
    if (!funcLimpiaParabrisas) errors.funcLimpiaParabrisas = true;
    if (!funcPedales) errors.funcPedales = true;
    if (!funcRetroceso) errors.funcRetroceso = true;
    if (!funcCambios) errors.funcCambios = true;

    if (ajusteVidrioF === null) errors.ajusteVidrioF = true;
    if (ajusteVidrioTR === null) errors.ajusteVidrioTR = true;
    if (ajusteVidrioLD === null) errors.ajusteVidrioLD = true;
    if (ajusteVidrioLI === null) errors.ajusteVidrioLI = true;
    if (ajusteEspejoLD === null) errors.ajusteEspejoLD = true;
    if (ajusteEspejoLI === null) errors.ajusteEspejoLI = true;
    if (ajusteEspejoINT === null) errors.ajusteEspejoINT = true;
    if (!ajusteAsientos) errors.ajusteAsientos = true;

    // 5. Fugas y Neumáticos
    if (!fugaCombustible) errors.fugaCombustible = true;
    if (!fugaRefrigerante) errors.fugaRefrigerante = true;
    if (!fugaAceite) errors.fugaAceite = true;
    if (!fugaOtro) errors.fugaOtro = true;

    if (!presionAire) errors.presionAire = true;
    if (!condicionRines) errors.condicionRines = true;
    if (!condicionTuercas) errors.condicionTuercas = true;
    if (!puntasEjes) errors.puntasEjes = true;

    // Validar estado de llantas interactivo
    for (let i = 1; i <= 22; i++) {
      if (!wheelsState[i]) {
        errors.wheelsState = true;
        break;
      }
    }

    // 6. Cierre y Medidores
    if (!medPresionAire.trim()) errors.medPresionAire = true;
    if (!medPresionAceite.trim()) errors.medPresionAceite = true;
    if (!medVoltimetro.trim()) errors.medVoltimetro = true;
    if (!medTemperatura.trim()) errors.medTemperatura = true;

    if (!lubCajaCambio) errors.lubCajaCambio = true;
    if (!lubMotor) errors.lubMotor = true;
    if (!lubDiferencial) errors.lubDiferencial = true;
    if (!lubDireccion) errors.lubDireccion = true;
    if (!lubChasis) errors.lubChasis = true;
    if (!lubSuspension) errors.lubSuspension = true;

    return errors;
  };

  const tabHasErrors = (tabId: string) => {
    const errors = getValidationErrors();
    if (tabId === 'niveles') {
      return !!(
        errors.nivelLimpiaParabrisas || errors.nivelAceite || errors.nivelRefrigerante || 
        errors.nivelCombustible || errors.combustibleCant || errors.nivelAguaBateria ||
        errors.luzFreno || errors.luzBajas || errors.luzAltas || errors.luzBombillosQuemados || 
        errors.luzMicasRotas || errors.luzFarosRotos || errors.cruceDD || errors.cruceDI || 
        errors.cruceTD || errors.cruceTI
      );
    }
    if (tabId === 'generales') {
      return !!(
        errors.genRuidoMotor || errors.genTornillosSuspension || errors.genDrenarTanques || errors.genQuintaRueda ||
        errors.segBotiquin || errors.segGato || errors.segExtintor || errors.segLlaveRueda || 
        errors.segLona || errors.segTriangulo || errors.segReproductor || errors.segMecate
      );
    }
    if (tabId === 'funcionamiento') {
      return !!(
        errors.funcBateria || errors.funcFrenos || errors.funcCorneta || errors.funcAireAcondicionado || 
        errors.funcLimpiaParabrisas || errors.funcPedales || errors.funcRetroceso || errors.funcCambios ||
        errors.ajusteVidrioF || errors.ajusteVidrioTR || errors.ajusteVidrioLD || errors.ajusteVidrioLI || 
        errors.ajusteEspejoLD || errors.ajusteEspejoLI || errors.ajusteEspejoINT || errors.ajusteAsientos
      );
    }
    if (tabId === 'partes') {
      return false;
    }
    if (tabId === 'fugas') {
      return !!(
        errors.fugaCombustible || errors.fugaRefrigerante || errors.fugaAceite || errors.fugaOtro ||
        errors.presionAire || errors.condicionRines || errors.condicionTuercas || errors.puntasEjes ||
        errors.wheelsState
      );
    }
    if (tabId === 'cierre') {
      return !!(
        errors.medPresionAire || errors.medPresionAceite || errors.medVoltimetro || errors.medTemperatura ||
        errors.lubCajaCambio || errors.lubMotor || errors.lubDiferencial || errors.lubDireccion || 
        errors.lubChasis || errors.lubSuspension
      );
    }
    return false;
  };
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

  // Report Modal states
  const [reportActiveTab, setReportActiveTab] = useState<number>(1);
  const [tab1Reviewed, setTab1Reviewed] = useState(false);
  const [tab2Reviewed, setTab2Reviewed] = useState(false);
  const [tab3Reviewed, setTab3Reviewed] = useState(false);
  const [tab4Reviewed, setTab4Reviewed] = useState(false);
  const [tab5Reviewed, setTab5Reviewed] = useState(false);
  const [tab6Reviewed, setTab6Reviewed] = useState(false);
  const [highlightReviewError, setHighlightReviewError] = useState<number | null>(null);
  const [highlightSignatureError, setHighlightSignatureError] = useState(false);

  const handleCloseChecklistModal = () => {
    if (selectedChecklist && !selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true) {
      const confirmClose = window.confirm("¿Estás seguro que quieres cerrar sin Confirmar tu Firma de Auditoria?");
      if (!confirmClose) {
        setReportActiveTab(6);
        setHighlightSignatureError(true);
        return;
      }
    }
    setSelectedChecklist(null);
  };

  useEffect(() => {
    if (selectedReportId && checklists.length > 0) {
      const found = checklists.find(c => c.id === selectedReportId);
      if (found) {
        setSelectedChecklist(found);
        setReportActiveTab(1);
        setOpTab('checklists');
      }
      if (clearSelectedReportId) {
        clearSelectedReportId();
      }
    }
  }, [selectedReportId, checklists, clearSelectedReportId]);

  useEffect(() => {
    if (selectedChecklist) {
      setReportActiveTab(1);
      setTab1Reviewed(false);
      setTab2Reviewed(false);
      setTab3Reviewed(false);
      setTab4Reviewed(false);
      setTab5Reviewed(false);
      setTab6Reviewed(false);
      setHighlightReviewError(null);
      setHighlightSignatureError(false);
    }
  }, [selectedChecklist]);

  // New Checklist Form States (Structured based on physical template)
  // 1. Fluidos/Niveles
  const [nivelAceite, setNivelAceite] = useState<'Full' | 'Medio' | 'Bajo' | ''>('');
  const [nivelRefrigerante, setNivelRefrigerante] = useState<'Full' | 'Medio' | 'Bajo' | ''>('');
  const [nivelLimpiaParabrisas, setNivelLimpiaParabrisas] = useState<'Full' | 'Medio' | 'Bajo' | ''>('');
  const [nivelCombustible, setNivelCombustible] = useState<'Full' | 'Medio' | 'Bajo' | ''>('');
  const [combustibleCant, setCombustibleCant] = useState('');
  const [nivelAguaBateria, setNivelAguaBateria] = useState<'Full' | 'Medio' | 'Bajo' | ''>('');

  // 2. Luces
  const [luzFreno, setLuzFreno] = useState<'Bueno' | 'Malo' | ''>('');
  const [luzBajas, setLuzBajas] = useState<'Bueno' | 'Malo' | ''>('');
  const [luzAltas, setLuzAltas] = useState<'Bueno' | 'Malo' | ''>('');
  const [luzBombillosQuemados, setLuzBombillosQuemados] = useState<'Bueno' | 'Malo' | ''>('');
  const [luzMicasRotas, setLuzMicasRotas] = useState<'Bueno' | 'Malo' | ''>('');
  const [luzFarosRotos, setLuzFarosRotos] = useState<'Bueno' | 'Malo' | ''>('');
  const [cruceDD, setCruceDD] = useState<boolean | null>(null);
  const [cruceDI, setCruceDI] = useState<boolean | null>(null);
  const [cruceTD, setCruceTD] = useState<boolean | null>(null);
  const [cruceTI, setCruceTI] = useState<boolean | null>(null);
  const [explicacionLuces, setExplicacionLuces] = useState('');

  // 3. Fugas
  const [fugaCombustible, setFugaCombustible] = useState<'Si' | 'No' | ''>('');
  const [fugaRefrigerante, setFugaRefrigerante] = useState<'Si' | 'No' | ''>('');
  const [fugaAceite, setFugaAceite] = useState<'Si' | 'No' | ''>('');
  const [fugaOtro, setFugaOtro] = useState<'Si' | 'No' | ''>('');
  const [explicacionFugas, setExplicacionFugas] = useState('');

  // 4. Ruedas y Llantas
  const [presionAire, setPresionAire] = useState<'Bueno' | 'Malo' | ''>('');
  const [condicionRines, setCondicionRines] = useState<'Bueno' | 'Malo' | ''>('');
  const [condicionTuercas, setCondicionTuercas] = useState<'Bueno' | 'Malo' | ''>('');
  const [puntasEjes, setPuntasEjes] = useState<'Bueno' | 'Malo' | ''>('');

  // Interactive Tire grid state (1 to 22, each default to '')
  const [wheelsState, setWheelsState] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | ''>>(() => {
    const initial: Record<number, 'A' | 'B' | 'C' | 'D' | ''> = {};
    for (let i = 1; i <= 22; i++) {
      initial[i] = '';
    }
    return initial;
  });

  // 5. Generales
  const [genRuidoMotor, setGenRuidoMotor] = useState<'Si' | 'No' | ''>('');
  const [genTornillosSuspension, setGenTornillosSuspension] = useState<'Si' | 'No' | ''>('');
  const [genDrenarTanques, setGenDrenarTanques] = useState<'Si' | 'No' | ''>('');
  const [genQuintaRueda, setGenQuintaRueda] = useState<'Si' | 'No' | ''>('');

  // 6. Seguridad y Accesorios
  const [segBotiquin, setSegBotiquin] = useState<'Si' | 'No' | ''>('');
  const [segGato, setSegGato] = useState<'Si' | 'No' | ''>('');
  const [segExtintor, setSegExtintor] = useState<'Si' | 'No' | ''>('');
  const [segLlaveRueda, setSegLlaveRueda] = useState<'Si' | 'No' | ''>('');
  const [segLona, setSegLona] = useState<'Si' | 'No' | ''>('');
  const [segTriangulo, setSegTriangulo] = useState<'Si' | 'No' | ''>('');
  const [segReproductor, setSegReproductor] = useState<'Si' | 'No' | ''>('');
  const [segMecate, setSegMecate] = useState<'Si' | 'No' | ''>('');

  // 7. Funcionamiento
  const [funcBateria, setFuncBateria] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcFrenos, setFuncFrenos] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcCorneta, setFuncCorneta] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcAireAcondicionado, setFuncAireAcondicionado] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcLimpiaParabrisas, setFuncLimpiaParabrisas] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcPedales, setFuncPedales] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcRetroceso, setFuncRetroceso] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');
  const [funcCambios, setFuncCambios] = useState<'Bueno' | 'Reg' | 'Malo' | ''>('');

  // 8. Lubricación
  const [lubCajaCambio, setLubCajaCambio] = useState<'Bueno' | 'Malo' | ''>('');
  const [lubMotor, setLubMotor] = useState<'Bueno' | 'Malo' | ''>('');
  const [lubDiferencial, setLubDiferencial] = useState<'Bueno' | 'Malo' | ''>('');
  const [lubDireccion, setLubDireccion] = useState<'Bueno' | 'Malo' | ''>('');
  const [lubChasis, setLubChasis] = useState<'Bueno' | 'Malo' | ''>('');
  const [lubSuspension, setLubSuspension] = useState<'Bueno' | 'Malo' | ''>('');

  // 9. Ajustes
  const [ajusteVidrioF, setAjusteVidrioF] = useState<boolean | null>(null);
  const [ajusteVidrioTR, setAjusteVidrioTR] = useState<boolean | null>(null);
  const [ajusteVidrioLD, setAjusteVidrioLD] = useState<boolean | null>(null);
  const [ajusteVidrioLI, setAjusteVidrioLI] = useState<boolean | null>(null);
  const [ajusteEspejoLD, setAjusteEspejoLD] = useState<boolean | null>(null);
  const [ajusteEspejoLI, setAjusteEspejoLI] = useState<boolean | null>(null);
  const [ajusteEspejoINT, setAjusteEspejoINT] = useState<boolean | null>(null);
  const [ajusteAsientos, setAjusteAsientos] = useState<'Bueno' | 'Malo' | ''>('');

  // 10. Medidores
  const [medPresionAire, setMedPresionAire] = useState('');
  const [medPresionAceite, setMedPresionAceite] = useState('');
  const [medVoltimetro, setMedVoltimetro] = useState('');
  const [medTemperatura, setMedTemperatura] = useState('');

  // 11. Partes comentarios text states
  const [parteMotor, setParteMotor] = useState('');
  const [parteEnfriamiento, setParteEnfriamiento] = useState('');
  const [parteEscape, setParteEscape] = useState('');
  const [parteCombustible, setParteCombustible] = useState('');
  const [parteFrenos, setParteFrenos] = useState('');
  const [parteElectrico, setParteElectrico] = useState('');
  const [parteEjeDelantero, setParteEjeDelantero] = useState('');
  const [parteTransmision, setParteTransmision] = useState('');
  const [parteEjeTrasero, setParteEjeTrasero] = useState('');
  const [parteAire, setParteAire] = useState('');
  const [parteOtra1, setParteOtra1] = useState('');
  const [parteOtra2, setParteOtra2] = useState('');

  const [comentariosGenerales, setComentariosGenerales] = useState('');

  const [diagnostico, setDiagnostico] = useState('');
  const [tasaHoraTaller, setTasaHoraTaller] = useState('45.00');
  
  const [orderItems, setOrderItems] = useState<Array<{ descripcion: string; cantidad: number; proveedor: string; costo_unitario: number; unidad_medida?: string }>>([
    { descripcion: '', cantidad: 1, proveedor: '', costo_unitario: 0 }
  ]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [lastMileage, setLastMileage] = useState<number | null>(null);
  
  // Order Modification / Parts State
  const [reparacionEjecutada, setReparacionEjecutada] = useState('');
  const [horasTaller, setHorasTaller] = useState('0');
  const [estadoOrden, setEstadoOrden] = useState<OrdenServicio['estado']>('Abierta');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState('1');

  const fetchOperationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch assets (only vehicles are priority for this module)
      const assetRes = await fetch('/api/assets?tipo=Vehículo', { headers: { Authorization: `Bearer ${token}` } });
      if (assetRes.status === 401 || assetRes.status === 403) {
        logout();
        return;
      }
      const assetData = await assetRes.json();
      setVehicles(Array.isArray(assetData) ? assetData : []);
      if (Array.isArray(assetData) && assetData.length > 0) setSelectedVehicleId(assetData[0].id);

      // Fetch repuestos catalog
      const repuestoRes = await fetch('/api/repuestos', { headers: { Authorization: `Bearer ${token}` } });
      if (repuestoRes.status === 401 || repuestoRes.status === 403) {
        logout();
        return;
      }
      const repuestoData = await repuestoRes.json();
      setCatalogRepuestos(Array.isArray(repuestoData) ? repuestoData : []);
      if (Array.isArray(repuestoData) && repuestoData.length > 0) setSelectedPartId(repuestoData[0].id.toString());

      if (opTab === 'checklists') {
        const checkRes = await fetch('/api/checklists', { headers: { Authorization: `Bearer ${token}` } });
        if (checkRes.status === 401 || checkRes.status === 403) {
          logout();
          return;
        }
        const checkData = await checkRes.json();
        setChecklists(Array.isArray(checkData) ? checkData : []);
      } else if (opTab === 'ordenes') {
        const orderRes = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        if (orderRes.status === 401 || orderRes.status === 403) {
          logout();
          return;
        }
        const orderData = await orderRes.json();
        setOrders(Array.isArray(orderData) ? orderData : []);
      } else if (opTab === 'solicitudes') {
        const solRes = await fetch('/api/solicitudes', { headers: { Authorization: `Bearer ${token}` } });
        if (solRes.status === 401 || solRes.status === 403) {
          logout();
          return;
        }
        const solData = await solRes.json();
        setSolicitudes(Array.isArray(solData) ? solData : []);
      }
    } catch (err) {
      setError('Error al conectar con los servicios de operaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOperationsData();
  }, [token, opTab]);

  useEffect(() => {
    if (showOrderModal && selectedVehicleId) {
      fetch(`/api/assets/${selectedVehicleId}/max-readings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.max_kilometraje !== undefined) {
            setLastMileage(data.max_kilometraje);
          }
        })
        .catch(err => console.error(err));
    } else {
      setLastMileage(null);
    }
  }, [showOrderModal, selectedVehicleId, token]);

// No window click handler needed since we don't use dropdown filters

  // Handle media uploads directly to S3 returning URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingFile(true);
    setError(null);
    
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        // Size validation
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (isImage && file.size > 5 * 1024 * 1024) {
          alert(`El archivo "${file.name}" supera el límite de 5MB para imágenes.`);
          continue;
        }
        if (isVideo && file.size > 20 * 1024 * 1024) {
          alert(`El archivo "${file.name}" supera el límite de 20MB para videos.`);
          continue;
        }
        if (!isImage && !isVideo) {
          alert(`El archivo "${file.name}" no es una imagen o video válido.`);
          continue;
        }

        const formData = new FormData();
        formData.append('multimedia', file);

        const res = await fetch('/api/checklists/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Carga fallida para ${file.name}.`);
        }
        
        newUrls.push(data.url);
      }
      
      setUploadedFileUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveUploadedFile = (urlToRemove: string) => {
    setUploadedFileUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este checklist? Se archivará de forma segura en la bitácora de auditoría.")) {
      return;
    }
    try {
      const res = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el checklist.');
      }
      alert(data.message || 'Checklist eliminado correctamente.');
      fetchOperationsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta Orden de Servicio? Se archivará de forma segura en la bitácora de auditoría.")) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar la orden de servicio.');
      }
      alert(data.message || 'Orden de servicio eliminada correctamente.');
      fetchOperationsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSolicitud = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta Solicitud de Mantenimiento? Se archivará de forma segura en la bitácora de auditoría.")) {
      return;
    }
    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar la solicitud de mantenimiento.');
      }
      alert(data.message || 'Solicitud de mantenimiento eliminada correctamente.');
      fetchOperationsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignChecklist = async (id: string) => {
    try {
      const res = await fetch(`/api/checklists/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al firmar el checklist.');
      }
      alert(data.message || 'Checklist firmado y auditado con éxito.');
      setSelectedChecklist(prev => prev ? {
        ...prev,
        respuestas_detalle: {
          ...prev.respuestas_detalle,
          firma_auditoria: data.firma_auditoria
        }
      } : null);
      fetchOperationsData();
    } catch (err: any) {
      alert(err.message);
      setTab6Reviewed(false);
    }
  };

  const filteredChecklists = checklists.filter(c => {
    // 1. Filter by vehicle plate(s) (opción a escribir)
    if (filterPlaca.trim()) {
      const placa = c.placa || 'Interno';
      if (!placa.toLowerCase().includes(filterPlaca.trim().toLowerCase())) return false;
    }

    // 2. Filter by inspector(s) (opción a escribir)
    if (filterInspector.trim()) {
      const inspectorName = c.inspector || '';
      if (!inspectorName.toLowerCase().includes(filterInspector.trim().toLowerCase())) return false;
    }

    // 3. Filter by Date range
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(c.fecha) < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(c.fecha) > end) return false;
    }

    // 4. Filter by Auditor (text search)
    if (filterAuditor.trim()) {
      const auditorName = c.respuestas_detalle.firma_auditoria?.nombre_usuario || '';
      if (!auditorName.toLowerCase().includes(filterAuditor.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const filteredOrders = orders.filter(o => {
    // 0. Filter by Order ID
    if (filterOrderId.trim()) {
      const orderId = o.id || '';
      if (!orderId.toLowerCase().includes(filterOrderId.trim().toLowerCase())) return false;
    }

    // 1. Filter by vehicle plate(s) (opción a escribir)
    if (filterPlaca.trim()) {
      const placa = o.placa || 'Maquinaria';
      if (!placa.toLowerCase().includes(filterPlaca.trim().toLowerCase())) return false;
    }

    // 2. Filter by mechanic/creator (opción a escribir)
    if (filterInspector.trim()) {
      const mechanicName = o.mecanico || '';
      if (!mechanicName.toLowerCase().includes(filterInspector.trim().toLowerCase())) return false;
    }

    // 3. Filter by Date range
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(o.fecha_inicio) < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(o.fecha_inicio) > end) return false;
    }

    // 4. Filter by Auditor (text search)
    if (filterAuditor.trim()) {
      const auditorName = o.firma_auditoria?.nombre_usuario || '';
      if (!auditorName.toLowerCase().includes(filterAuditor.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.fecha_inicio || 0).getTime() - new Date(a.fecha_inicio || 0).getTime());

  const detectChecklistFailures = () => {
    const list: string[] = [];
    
    // 1. Fluidos/Niveles
    if (nivelAceite === 'Bajo' || nivelAceite === 'Medio') list.push(`Nivel de Aceite de Motor: ${nivelAceite}`);
    if (nivelRefrigerante === 'Bajo' || nivelRefrigerante === 'Medio') list.push(`Nivel de Refrigerante: ${nivelRefrigerante}`);
    if (nivelLimpiaParabrisas === 'Bajo' || nivelLimpiaParabrisas === 'Medio') list.push(`Nivel de Líquido Limpia Parabrisas: ${nivelLimpiaParabrisas}`);
    if (nivelAguaBateria === 'Bajo' || nivelAguaBateria === 'Medio') list.push(`Nivel de Agua a la Batería: ${nivelAguaBateria}`);
    
    // 2. Luces
    if (luzFreno === 'Malo') list.push('Luces de freno: Malo');
    if (luzBajas === 'Malo') list.push('Luces bajas de carretera: Malo');
    if (luzAltas === 'Malo') list.push('Luces altas de carretera: Malo');
    if (luzBombillosQuemados === 'Malo') list.push('Bombillos quemados: Detectados');
    if (luzMicasRotas === 'Malo') list.push('Micas rotas: Detectados');
    if (luzFarosRotos === 'Malo') list.push('Faros rotos: Detectados');
    
    // Cruce (booleans)
    if (cruceDD === false) list.push('Luz de cruce delantera derecha: Malo');
    if (cruceDI === false) list.push('Luz de cruce delantera izquierda: Malo');
    if (cruceTD === false) list.push('Luz de cruce trasera derecha: Malo');
    if (cruceTI === false) list.push('Luz de cruce trasera izquierda: Malo');
    
    // 3. Fugas
    if (fugaCombustible === 'Si') list.push('Fuga de combustible: Detectada');
    if (fugaRefrigerante === 'Si') list.push('Fuga de refrigerante: Detectada');
    if (fugaAceite === 'Si') list.push('Fuga de aceite de motor: Detectada');
    if (fugaOtro === 'Si') list.push(`Otra fuga: Detectada (${explicacionFugas || 'sin descripción'})`);
    
    // 4. Ruedas (Bueno | Malo)
    if (presionAire === 'Malo') list.push('Presión de aire de ruedas: Malo');
    if (condicionRines === 'Malo') list.push('Condición de rines: Malo');
    if (condicionTuercas === 'Malo') list.push('Condición de tuercas de ruedas: Malo');
    if (puntasEjes === 'Malo') list.push('Puntas de ejes: Malo');
    
    // 5. Generales (Si | No)
    if (genRuidoMotor === 'Si') list.push('Ruido de motor anormal: Detectado');
    if (genTornillosSuspension === 'Si') list.push('Tornillos de suspensión flojos/faltantes: Detectados');
    if (genDrenarTanques === 'No') list.push('Drenar tanques de aire/agua: Falla');
    if (genQuintaRueda === 'No') list.push('Condición de quinta rueda: Malo');
    
    // 6. Seguridad
    if (segBotiquin === 'No') list.push('Botiquín de primeros auxilios: Faltante');
    if (segGato === 'No') list.push('Gato mecánico: Faltante');
    if (segExtintor === 'No') list.push('Extintor de incendio: Faltante');
    if (segLlaveRueda === 'No') list.push('Llave de rueda: Faltante');
    if (segLona === 'No') list.push('Lona de carga: Faltante');
    if (segTriangulo === 'No') list.push('Triángulo de seguridad: Faltante');
    if (segReproductor === 'No') list.push('Reproductor de sonido: Faltante');
    if (segMecate === 'No') list.push('Mecate de amarre: Faltante');
    
    // 7. Funcionamiento (Bueno | Reg | Malo)
    if (funcBateria === 'Malo' || funcBateria === 'Reg') list.push(`Batería: ${funcBateria}`);
    if (funcFrenos === 'Malo' || funcFrenos === 'Reg') list.push(`Sistema de frenos: ${funcFrenos}`);
    if (funcCorneta === 'Malo' || funcCorneta === 'Reg') list.push(`Corneta/Claxon: ${funcCorneta}`);
    if (funcAireAcondicionado === 'Malo' || funcAireAcondicionado === 'Reg') list.push(`Aire acondicionado: ${funcAireAcondicionado}`);
    if (funcLimpiaParabrisas === 'Malo' || funcLimpiaParabrisas === 'Reg') list.push(`Escobillas limpia-parabrisas: ${funcLimpiaParabrisas}`);
    if (funcPedales === 'Malo' || funcPedales === 'Reg') list.push(`Pedales: ${funcPedales}`);
    if (funcRetroceso === 'Malo' || funcRetroceso === 'Reg') list.push(`Alarma/Luz de retroceso: ${funcRetroceso}`);
    if (funcCambios === 'Malo' || funcCambios === 'Reg') list.push(`Palanca/Cambios caja: ${funcCambios}`);
    
    // 8. Lubricación (Bueno | Malo)
    if (lubCajaCambio === 'Malo') list.push('Lubricación caja de cambios: Malo');
    if (lubMotor === 'Malo') list.push('Lubricación motor: Malo');
    if (lubDiferencial === 'Malo') list.push('Lubricación diferencial: Malo');
    if (lubDireccion === 'Malo') list.push('Lubricación dirección: Malo');
    if (lubChasis === 'Malo') list.push('Lubricación chasis: Malo');
    if (lubSuspension === 'Malo') list.push('Lubricación suspensión: Malo');
    
    // 9. Ajustes (booleans)
    if (ajusteAsientos === 'Malo') list.push('Ajuste de asientos: Malo');
    if (ajusteEspejoLD === false) list.push('Espejo lateral derecho suelto/roto: Detectado');
    if (ajusteEspejoLI === false) list.push('Espejo lateral izquierdo suelto/roto: Detectado');
    if (ajusteEspejoINT === false) list.push('Espejo retrovisor interno suelto/roto: Detectado');
    if (ajusteVidrioF === false) list.push('Vidrio frontal (parabrisas) trizado/roto: Detectado');
    if (ajusteVidrioTR === false) list.push('Vidrio trasero roto/dañado: Detectado');
    if (ajusteVidrioLD === false) list.push('Vidrio lateral derecho dañado/roto: Detectado');
    if (ajusteVidrioLI === false) list.push('Vidrio lateral izquierdo dañado/roto: Detectado');
    
    // 10. Medidores (Bueno | Malo)
    if (medPresionAire === 'Malo') list.push('Medidor de presión de aire: Malo');
    if (medPresionAceite === 'Malo') list.push('Medidor de presión de aceite: Malo');
    if (medVoltimetro === 'Malo') list.push('Voltímetro: Malo');
    if (medTemperatura === 'Malo') list.push('Medidor de temperatura: Malo');
    
    return list;
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // VALIDACIÓN DETALLADA PARA EVITAR QUE SE OMITA NINGÚN PUNTO
    const validationErrors = getValidationErrors();
    const hasAnyError = Object.keys(validationErrors).length > 0;

    if (hasAnyError) {
      setShowValidationErrors(true);
      alert("⚠️ No se puede enviar el checklist porque faltan preguntas por responder.\n\nPor favor, complete todos los campos obligatorios en las secciones marcadas con (⚠️ Incompleto).");
      setError("Complete todos los campos obligatorios del checklist.");
      return;
    }

    const payload = {
      activo_id: selectedVehicleId,
      kilometraje_registro: parseFloat(kilometraje) || 0,
      observaciones,
      respuestas_detalle: {
        niveles: {
          aceite_motor: nivelAceite,
          refrigerante: nivelRefrigerante,
          limpia_parabrisas: nivelLimpiaParabrisas,
          combustible_nivel: nivelCombustible,
          combustible_cant: combustibleCant,
          agua_bateria: nivelAguaBateria
        },
        luces: {
          freno: luzFreno,
          bajas: luzBajas,
          altas: luzAltas,
          bombillos_quemados: luzBombillosQuemados,
          micas_rotas: luzMicasRotas,
          faros_rotos: luzFarosRotos,
          cruce: {
            dd: cruceDD,
            di: cruceDI,
            td: cruceTD,
            ti: cruceTI
          },
          explicacion_luces: explicacionLuces
        },
        fugas: {
          combustible: fugaCombustible,
          refrigerante: fugaRefrigerante,
          aceite: fugaAceite,
          otro: fugaOtro,
          explicacion: explicacionFugas
        },
        ruedas: {
          presion_aire: presionAire,
          condicion_rines: condicionRines,
          condicion_tuercas: condicionTuercas,
          puntas_ejes: puntasEjes,
          estado_llantas: wheelsState
        },
        generales: {
          ruido_motor: genRuidoMotor,
          tornillos_suspension: genTornillosSuspension,
          drenar_tanques: genDrenarTanques,
          quinta_rueda: genQuintaRueda
        },
        seguridad: {
          botiquin: segBotiquin,
          gato: segGato,
          extintor: segExtintor,
          llave_rueda: segLlaveRueda,
          lona: segLona,
          triangulo: segTriangulo,
          reproductor: segReproductor,
          mecate: segMecate
        },
        funcionamiento: {
          bateria: funcBateria,
          frenos: funcFrenos,
          corneta: funcCorneta,
          aire_acondicionado: funcAireAcondicionado,
          limpia_parabrisas: funcLimpiaParabrisas,
          pedales: funcPedales,
          retroceso: funcRetroceso,
          cambios: funcCambios
        },
        lubricacion: {
          caja_cambio: lubCajaCambio,
          motor: lubMotor,
          diferencial: lubDiferencial,
          direccion: lubDireccion,
          chasis: lubChasis,
          suspension: lubSuspension
        },
        ajustes: {
          vidrios: {
            f: ajusteVidrioF,
            tr: ajusteVidrioTR,
            ld: ajusteVidrioLD,
            li: ajusteVidrioLI
          },
          espejos: {
            ld: ajusteEspejoLD,
            li: ajusteEspejoLI,
            int: ajusteEspejoINT
          },
          asientos: ajusteAsientos
        },
        medidores: {
          presion_aire: medPresionAire,
          presion_aceite: medPresionAceite,
          voltimetro: medVoltimetro,
          temperatura: medTemperatura
        },
        partes: {
          motor: parteMotor,
          enfriamiento: parteEnfriamiento,
          escape: parteEscape,
          combustible: parteCombustible,
          frenos: parteFrenos,
          electrico: parteElectrico,
          eje_delantero: parteEjeDelantero,
          transmision: parteTransmision,
          eje_trasero: parteEjeTrasero,
          aire: parteAire,
          otra1: parteOtra1,
          otra2: parteOtra2
        },
        comentarios_generales: comentariosGenerales,
        multimedia_url: uploadedFileUrls.length > 0 ? uploadedFileUrls[0] : null,
        multimedia_urls: uploadedFileUrls
      }
    };

    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fallo al procesar el checklist.');
      }

      const checklistId = data.id || data.checklist?.id || 'CHKLST-00000001';
      const failures = detectChecklistFailures();
      
      setShowChecklistModal(false);
      resetChecklistForm();
      
      if (failures.length > 0) {
        setSdmChecklistId(checklistId);
        setSdmFailuresText(failures.join('\n'));
        setShowSdmConfirmModal(true);
      } else {
        alert("✓ Checklist registrado exitosamente sin novedades.");
      }
      fetchOperationsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSdmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checklist_id: sdmChecklistId,
          activo_id: selectedVehicleId,
          detalles_fallas: sdmFailuresText,
          auditor_sugerido: user?.nombre || user?.nombre_usuario
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud.');
      }

      setShowSdmConfirmModal(false);
      alert(`✓ Solicitud de Mantenimiento (${data.sdm?.id}) y Orden de Servicio (${data.order?.id}) creadas de forma correlacionada.`);
      setOpTab('solicitudes');
      fetchOperationsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOrderCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToSend = orderItems.filter(item => item.descripcion.trim() !== '');
    const payload = {
      activo_id: selectedVehicleId,
      diagnostico: JSON.stringify({
        diagnostico_inicial: diagnostico,
        items: itemsToSend
      }),
      tasa_hora_taller: 0,
      kilometraje_registro: parseFloat(kilometraje) || 0
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear orden.');
      }

      setShowOrderModal(false);
      setDiagnostico('');
      setKilometraje('');
      setOrderItems([{ descripcion: '', cantidad: 1, proveedor: '', costo_unitario: 0 }]);
      fetchOperationsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    const row = { ...updated[index] };
    
    if (field === 'cantidad') {
      row.cantidad = parseFloat(value) || 0;
    } else if (field === 'costo_unitario') {
      row.costo_unitario = parseFloat(value) || 0;
    } else {
      (row as any)[field] = value;
    }
    
    updated[index] = row;
    
    // Auto-add new row if we edited the last row and it has some content
    const lastRow = updated[updated.length - 1];
    const isLastRowEdited = index === updated.length - 1;
    if (isLastRowEdited && (lastRow.descripcion.trim() !== '' || lastRow.proveedor.trim() !== '' || lastRow.costo_unitario > 0)) {
      updated.push({ descripcion: '', cantidad: 1, proveedor: '', costo_unitario: 0 });
    }
    setOrderItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, idx) => idx !== index));
    } else {
      setOrderItems([{ descripcion: '', cantidad: 1, proveedor: '', costo_unitario: 0 }]);
    }
  };

  const handleOpenOrderDetail = async (order: OrdenServicio) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const detailed = await res.json();
      setSelectedOrder(detailed);
      
      // Seed update forms
      setReparacionEjecutada(detailed.reparacion_ejecutada || '');
      setTasaHoraTaller(detailed.tasa_hora_taller.toString());
      setHorasTaller(detailed.horas_taller.toString());
      setEstadoOrden(detailed.estado);
    } catch (err) {
      alert('Error al sincronizar detalles de orden.');
    }
  };

  const handleAddPartToOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError(null);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/insumos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          repuesto_id: parseInt(selectedPartId),
          cantidad_usada: parseFloat(partQty) || 1
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al agregar insumo.');
      }

      // Reload detail
      handleOpenOrderDetail(selectedOrder);
      fetchOperationsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateOrderState = async () => {
    if (!selectedOrder) return;
    setError(null);

    const isClosing = estadoOrden === 'Completada';

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reparacion_ejecutada: reparacionEjecutada,
          tasa_hora_taller: parseFloat(tasaHoraTaller),
          horas_taller: parseFloat(horasTaller),
          estado: estadoOrden,
          fecha_fin: isClosing ? new Date().toISOString() : null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fallo de actualización.');
      }

      setSelectedOrder(null);
      fetchOperationsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetChecklistForm = () => {
    setShowValidationErrors(false);
    setError(null);
    setKilometraje('');
    setObservaciones('');

    
    // 1. Fluidos
    setNivelAceite('');
    setNivelRefrigerante('');
    setNivelLimpiaParabrisas('');
    setNivelCombustible('');
    setCombustibleCant('');
    setNivelAguaBateria('');

    // 2. Luces
    setLuzFreno('');
    setLuzBajas('');
    setLuzAltas('');
    setLuzBombillosQuemados('');
    setLuzMicasRotas('');
    setLuzFarosRotos('');
    setCruceDD(null);
    setCruceDI(null);
    setCruceTD(null);
    setCruceTI(null);
    setExplicacionLuces('');

    // 3. Fugas
    setFugaCombustible('');
    setFugaRefrigerante('');
    setFugaAceite('');
    setFugaOtro('');
    setExplicacionFugas('');

    // 4. Ruedas
    setPresionAire('');
    setCondicionRines('');
    setCondicionTuercas('');
    setPuntasEjes('');
    setWheelsState(() => {
      const initial: Record<number, 'A' | 'B' | 'C' | 'D' | ''> = {};
      for (let i = 1; i <= 22; i++) {
        initial[i] = '';
      }
      return initial;
    });

    // 5. Generales
    setGenRuidoMotor('');
    setGenTornillosSuspension('');
    setGenDrenarTanques('');
    setGenQuintaRueda('');

    // 6. Seguridad
    setSegBotiquin('');
    setSegGato('');
    setSegExtintor('');
    setSegLlaveRueda('');
    setSegLona('');
    setSegTriangulo('');
    setSegReproductor('');
    setSegMecate('');

    // 7. Funcionamiento
    setFuncBateria('');
    setFuncFrenos('');
    setFuncCorneta('');
    setFuncAireAcondicionado('');
    setFuncLimpiaParabrisas('');
    setFuncPedales('');
    setFuncRetroceso('');
    setFuncCambios('');

    // 8. Lubricación
    setLubCajaCambio('');
    setLubMotor('');
    setLubDiferencial('');
    setLubDireccion('');
    setLubChasis('');
    setLubSuspension('');

    // 9. Ajustes
    setAjusteVidrioF(null);
    setAjusteVidrioTR(null);
    setAjusteVidrioLD(null);
    setAjusteVidrioLI(null);
    setAjusteEspejoLD(null);
    setAjusteEspejoLI(null);
    setAjusteEspejoINT(null);
    setAjusteAsientos('');

    // 10. Medidores
    setMedPresionAire('');
    setMedPresionAceite('');
    setMedVoltimetro('');
    setMedTemperatura('');

    // 11. Partes comentarios
    setParteMotor('');
    setParteEnfriamiento('');
    setParteEscape('');
    setParteCombustible('');
    setParteFrenos('');
    setParteElectrico('');
    setParteEjeDelantero('');
    setParteTransmision('');
    setParteEjeTrasero('');
    setParteAire('');
    setParteOtra1('');
    setParteOtra2('');

    setComentariosGenerales('');
    setUploadedFileUrls([]);
  };

  // Cost calculation helper (reactive frontend logic)
  const calculateLiveCosts = () => {
    if (!selectedOrder) return { labor: 0, parts: 0, total: 0 };
    const labor = (parseFloat(horasTaller) || 0) * (parseFloat(tasaHoraTaller) || 0);
    const parts = (selectedOrder.insumos || []).reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad_usada.toString()) * parseFloat(item.costo_unitario_historico.toString()));
    }, 0);
    return {
      labor,
      parts,
      total: labor + parts
    };
  };

  const liveCost = calculateLiveCosts();

  const renderTireButton = (num: number) => {
    const status = wheelsState[num] || '';
    const hasError = showValidationErrors && status === '';
    const colors = {
      '': { bg: 'rgba(255, 255, 255, 0.03)', border: hasError ? '#ef4444' : 'var(--border-color)', color: hasError ? '#ef4444' : 'var(--text-muted)', label: 'Sin revisar' },
      A: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981', label: 'A (Bueno)' },
      B: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', color: '#06b6d4', label: 'B (Medio)' },
      C: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b', label: 'C (Planear)' },
      D: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#ef4444', label: 'D (Urgente)' }
    };
    const activeColor = colors[status];
    
    return (
      <button
        key={num}
        type="button"
        onClick={() => {
          const nextMap: Record<string, 'A' | 'B' | 'C' | 'D'> = { '': 'A', A: 'B', B: 'C', C: 'D', D: 'A' };
          setWheelsState(prev => ({ ...prev, [num]: nextMap[status] }));
        }}
        style={{
          width: '32px',
          height: '46px',
          borderRadius: '4px',
          background: activeColor.bg,
          border: `2px solid ${activeColor.border}`,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontWeight: 'bold',
          fontSize: '0.65rem',
          transition: 'all var(--transition-fast)'
        }}
        title={`Llanta #${num}: ${activeColor.label}. Haz clic para cambiar.`}
      >
        <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>#{num}</span>
        <span style={{ fontSize: '0.8rem', color: activeColor.color }}>{status}</span>
      </button>
    );
  };

  const renderReadOnlyTire = (checklist: Checklist, num: number) => {
    const status = checklist?.respuestas_detalle?.ruedas?.estado_llantas?.[num] || 'A';
    const colors = {
      A: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981' },
      B: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', color: '#06b6d4' },
      C: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b' },
      D: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#ef4444' }
    };
    const activeColor = colors[status] || colors.A;
    
    return (
      <div
        key={num}
        style={{
          width: '26px',
          height: '38px',
          borderRadius: '3px',
          background: activeColor.bg,
          border: `2.5px solid ${activeColor.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.6rem',
        }}
        title={`Llanta #${num}: ${status}`}
      >
        <span style={{ fontSize: '0.45rem', opacity: 0.7 }}>#{num}</span>
        <span style={{ fontSize: '0.75rem', color: activeColor.color }}>{status}</span>
      </div>
    );
  };

  return (
    <div className="view-container">
      {/* ── Tabs principales: Operaciones | Módulo Profit ── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
        <button
          className="btn"
          style={{
            background: 'none',
            color: mainTab === 'operaciones' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: mainTab === 'operaciones' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.75rem',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}
          onClick={() => setMainTab('operaciones')}
        >
          Operaciones
        </button>
        <button
          className="btn"
          style={{
            background: 'none',
            color: mainTab === 'profit' ? 'var(--text-title)' : 'var(--text-secondary)',
            borderBottom: mainTab === 'profit' ? '3px solid var(--color-primary)' : '3px solid transparent',
            borderRadius: 0,
            padding: '0.75rem 1.75rem',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}
          onClick={() => setMainTab('profit')}
        >
          Módulo Profit
        </button>
      </div>

      {/* ── Módulo Profit: Notas de Entrega y Notas de Recepción ── */}
      {mainTab === 'profit' && (
        <ProfitDiagnostics inlineMode={true} />
      )}

      {/* ── Operaciones: sub-tabs Checklists y Órdenes + todo el contenido ── */}
      {mainTab === 'operaciones' && <>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        {canChecklist && (
          <button 
            className="btn" 
            style={{ 
              background: 'none', 
              color: opTab === 'checklists' ? 'var(--text-title)' : 'var(--text-secondary)',
              borderBottom: opTab === 'checklists' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: 0,
              padding: '0.75rem 1.5rem',
              fontWeight: 700
            }}
            onClick={() => setOpTab('checklists')}
          >
            Checklists Técnicos
          </button>
        )}
        {canViewSolicitudes && (
          <button 
            className="btn" 
            style={{ 
              background: 'none', 
              color: opTab === 'solicitudes' ? 'var(--text-title)' : 'var(--text-secondary)',
              borderBottom: opTab === 'solicitudes' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: 0,
              padding: '0.75rem 1.5rem',
              fontWeight: 700
            }}
            onClick={() => setOpTab('solicitudes')}
          >
            Solicitudes de Mantenimiento
          </button>
        )}
        {canOrdenes && (
          <button 
            className="btn" 
            style={{ 
              background: 'none', 
              color: opTab === 'ordenes' ? 'var(--text-title)' : 'var(--text-secondary)',
              borderBottom: opTab === 'ordenes' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderRadius: 0,
              padding: '0.75rem 1.5rem',
              fontWeight: 700
            }}
            onClick={() => setOpTab('ordenes')}
          >
            Órdenes de Servicio
          </button>
        )}
      </div>

      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {opTab === 'checklists' ? 'Inspecciones Rápidas de Flota' : opTab === 'ordenes' ? 'Control del Taller Mecánico' : 'Solicitudes de Mantenimiento'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            {opTab === 'checklists' 
              ? 'Formularios interactivos para choferes y asistentes para verificar niveles, luces y registrar fugas.' 
              : opTab === 'ordenes'
              ? 'Gestión y liquidación de costos de mantenimiento preventivo y correctivo de vehículos.'
              : 'Solicitudes automáticas de reparación de taller derivadas de checklists no-óptimos.'}
          </p>
          {(!!filterPlaca || !!filterInspector || !!filterStartDate || !!filterEndDate || !!filterAuditor) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                Filtros activos. Viendo {opTab === 'checklists' ? filteredChecklists.length : filteredOrders.length} de {opTab === 'checklists' ? checklists.length : orders.length} registros.
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', border: '1px dashed var(--color-primary)' }} 
                onClick={handleResetFilters}
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>

        {/* Botón crear: solo muestra el botón del tab actual si el usuario tiene permiso de EDICIÓN */}
        {((opTab === 'checklists' && canEditChecklist) || (opTab === 'ordenes' && canEditOrdenes)) && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              if (opTab === 'checklists') {
                resetChecklistForm();
                setShowValidationErrors(false);
                setShowChecklistModal(true);
              } else {
                setShowOrderModal(true);
              }
            }}
          >
            <Plus size={16} />
            <span>{opTab === 'checklists' ? 'Nuevo Checklist' : 'Crear Orden'}</span>
          </button>
        )}
      </div>

      {error && !showChecklistModal && (
        <div style={{ padding: '1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <>
          {/* Panel de Filtros Estilo Profit (con opción a escribir) */}
          <div className="filter-panel filter-bar-branded" style={{ 
            padding: '16px', 
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'flex-end',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            {/* Buscar por # de Orden */}
            {opTab === 'ordenes' && (
              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  # ORDEN
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Escriba # orden..."
                    className="form-input"
                    value={filterOrderId}
                    onChange={(e) => setFilterOrderId(e.target.value)}
                    style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}

            {/* Buscar por Placa */}
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PLACA VEHÍCULO
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Escriba placa..."
                  className="form-input"
                  value={filterPlaca}
                  onChange={(e) => setFilterPlaca(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Buscar por Inspector / Mecánico */}
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {opTab === 'checklists' ? 'INSPECTOR' : 'MECÁNICO'}
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={opTab === 'checklists' ? 'Nombre inspector...' : 'Nombre mecánico...'}
                  className="form-input"
                  value={filterInspector}
                  onChange={(e) => setFilterInspector(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Fecha Desde */}
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FECHA DESDE
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="form-input"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Fecha Hasta */}
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FECHA HASTA
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="form-input"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Buscar por Auditor / Creador */}
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AUDITOR
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Escriba auditor..."
                  className="form-input"
                  value={filterAuditor}
                  onChange={(e) => setFilterAuditor(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: '38px', borderRadius: '4px' }}
                />
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setFilterPlaca('');
                setFilterInspector('');
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterAuditor('');
                setFilterOrderId('');
              }}
              disabled={!filterPlaca && !filterInspector && !filterStartDate && !filterEndDate && !filterAuditor && !filterOrderId}
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center' }}
            >
              Limpiar Filtros
            </button>
          </div>

          <div className="table-container">
            {opTab === 'checklists' ? (
              <>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th># de Documento</th>
                      <th>Vehículo (Placa)</th>
                      <th>Fecha</th>
                      <th>Inspector</th>
                      <th>Fluidos & Fugas</th>
                      <th>Auditoría / Firma</th>
                      <th>Multimedia</th>
                      <th>Observaciones</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredChecklists.slice((checklistPage - 1) * checklistRowsPerPage, checklistPage * checklistRowsPerPage).map(c => {
                    const isFuga = c.respuestas_detalle.fugas?.aceite === 'Si' || 
                                   c.respuestas_detalle.fugas?.combustible === 'Si' || 
                                   c.respuestas_detalle.fugas?.refrigerante === 'Si' || 
                                   c.respuestas_detalle.fugas?.otro === 'Si';
                    return (
                      <tr 
                        key={c.id} 
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onClick={() => setSelectedChecklist(c)}
                        title="Haga clic para ver el resumen detallado o auditar el checklist"
                        className="hoverable-row-highlight"
                      >
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{c.id}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span className="badge badge-info" style={{ fontWeight: 600, width: 'fit-content' }}>{c.placa || 'Interno'}</span>
                            {(c.marca || c.modelo) && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {c.marca} {c.modelo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(c.fecha).toLocaleString()}</td>
                        <td>{c.inspector}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                            <span>Aceite: <b>{c.respuestas_detalle.niveles?.aceite_motor || 'S/D'}</b></span>
                            <span>Fugas: {isFuga ? <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>🚨 Sí</span> : <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✅ No</span>}</span>
                          </div>
                        </td>
                        <td>
                          {c.respuestas_detalle.firma_auditoria ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
                                ✓ {c.respuestas_detalle.firma_auditoria.nombre_usuario}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                {new Date(c.respuestas_detalle.firma_auditoria.fecha).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span 
                              style={{ color: '#011e41', background: '#fed16d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); setSelectedChecklist(c); }}
                              title="Haga clic para auditar este checklist"
                            >
                              Pendiente (Click para Auditar)
                            </span>
                          )}
                        </td>
                        <td>
                          {c.respuestas_detalle.multimedia_urls && c.respuestas_detalle.multimedia_urls.length > 0 ? (
                            <span style={{ fontSize: '0.8rem' }}>
                              {c.respuestas_detalle.multimedia_urls.length} archivo(s)
                            </span>
                          ) : c.respuestas_detalle.multimedia_url ? (
                            <a href={c.respuestas_detalle.multimedia_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'underline' }}>
                              Ver Archivo
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ninguno</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.observaciones || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); setSelectedChecklist(c); }}>
                              Ver Checklist
                            </button>
                            {user?.permisos?.borrar_checklists === true && (!c.respuestas_detalle?.firma_auditoria || user?.rol === 'Administrador' || user?.rol === 'admin') && (
                              <button className="btn btn-danger" style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleDeleteChecklist(c.id); }} title="Eliminar Checklist">
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
                totalItems={filteredChecklists.length}
                itemsPerPage={checklistRowsPerPage}
                setItemsPerPage={setChecklistRowsPerPage}
                currentPage={checklistPage}
                setCurrentPage={setChecklistPage}
              />
              </>
            ) : (
              <>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th># Orden</th>
                      <th>Vehículo (Placa)</th>
                      <th>Fecha</th>
                      <th>Mecánico</th>
                      <th>Creado Por</th>
                      <th>Estado</th>
                      <th>Costo Estimado</th>
                      <th>Diagnóstico</th>
                      <th style={{ textAlign: 'center' }}>Gestión</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredOrders.slice((orderPage - 1) * orderRowsPerPage, orderPage * orderRowsPerPage).map(o => {
                    let diagText = o.diagnostico;
                    try {
                      const parsed = JSON.parse(o.diagnostico);
                      diagText = parsed.diagnostico_inicial || o.diagnostico;
                    } catch (e) {
                      // plain text
                    }
                    
                    return (
                      <tr 
                        key={o.id} 
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onClick={() => handleOpenOrderDetail(o)}
                        title="Haga clic para ver y gestionar la orden de servicio"
                        className="hoverable-row-highlight"
                      >
                        <td>{o.id.substring(0, 8)}...</td>
                        <td style={{ fontWeight: 600 }}>{o.placa || 'Maquinaria'}</td>
                        <td>{new Date(o.fecha_inicio).toLocaleDateString()}</td>
                        <td>{o.mecanico}</td>
                        <td>
                          {o.firma_auditoria ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
                                ✓ {o.firma_auditoria.nombre_usuario}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                {new Date(o.firma_auditoria.fecha).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#011e41', background: '#fed16d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Pendiente</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            o.estado === 'Abierta' ? 'badge-info' : 
                            o.estado === 'En Proceso' ? 'badge-warning' : 
                            o.estado === 'Completada' ? 'badge-success' : 'badge-neutral'
                          }`}>
                            {o.estado}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                          ${parseFloat(o.total_facturado.toString()).toFixed(2)}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{diagText}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginRight: '0.35rem' }} onClick={(e) => { e.stopPropagation(); handleOpenOrderDetail(o); }}>
                            Ver/Editar
                          </button>
                          {canEditOrdenes && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteOrder(o.id); }}
                              title="Eliminar Orden de Servicio"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                totalItems={filteredOrders.length}
                itemsPerPage={orderRowsPerPage}
                setItemsPerPage={setOrderRowsPerPage}
                currentPage={orderPage}
                setCurrentPage={setOrderPage}
              />
              </>
            )}

            {opTab === 'solicitudes' && (
              <>
              <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código SDM</th>
                      <th>Vehículo Placa</th>
                      <th>Solicitado Por</th>
                      <th>Fecha de Solicitud</th>
                      <th>Checklist Origen</th>
                      <th>OT Relacionada</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No hay solicitudes de mantenimiento registradas en el sistema.
                        </td>
                      </tr>
                    ) : (
                      solicitudes
                        .slice((solicitudesPage - 1) * solicitudesRowsPerPage, solicitudesPage * solicitudesRowsPerPage)
                        .map((sol) => (
                          <tr key={sol.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{sol.id}</td>
                            <td>{sol.placa || 'N/D'}</td>
                            <td>{sol.usuario_nombre} ({sol.usuario_username})</td>
                            <td>{new Date(sol.fecha).toLocaleString()}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={async () => {
                                  const c = checklists.find(chk => chk.id === sol.checklist_id);
                                  if (c) {
                                    setSelectedChecklist(c);
                                  } else {
                                    alert("El checklist origen no está disponible en la lista local.");
                                  }
                                }}
                              >
                                📄 {sol.checklist_id}
                              </button>
                            </td>
                            <td>
                              {sol.orden_id ? (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '0.25rem 0.5rem' }}
                                  onClick={async () => {
                                    const o = orders.find(ord => ord.id === sol.orden_id);
                                    if (o) {
                                      setSelectedOrder(o);
                                    } else {
                                      alert("La orden relacionada no está disponible localmente.");
                                    }
                                  }}
                                >
                                  🔧 {sol.orden_id.substring(0, 12)}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>No generada</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${sol.estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}`}>
                                {sol.estado}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {canEditSolicitudes && (
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                                  onClick={() => handleDeleteSolicitud(sol.id)}
                                  title="Eliminar Solicitud de Mantenimiento"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={solicitudes.length}
                itemsPerPage={solicitudesRowsPerPage}
                setItemsPerPage={setSolicitudesRowsPerPage}
                currentPage={solicitudesPage}
                setCurrentPage={setSolicitudesPage}
              />
              </>
            )}
          </div>
        </>
      )}

      {/* Modal Checklist (Inspección) */}
      {showChecklistModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px', width: '95%' }}>
            <div className="modal-header">
              <h3>Checklist Detallado de Vehículo</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }} onClick={() => {
                  setMinimizedModals(prev => [...prev, { key: 'newChecklist', title: 'Nuevo Checklist - ' + (vehicles.find(v => v.id === selectedVehicleId)?.datos_especificos.placa || 'Sin Placa') }]);
                  setShowChecklistModal(false);
                }}>–</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => { setShowChecklistModal(false); setError(null); setShowValidationErrors(false); }}>✕</button>
              </div>
            </div>
            <form onSubmit={handleChecklistSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '10px' }}>
                {error && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(177, 32, 40, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    {error}
                  </div>
                )}
                {/* Cabecera Principal */}
                <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Vehículo Activo</label>
                    <select className="form-select" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.datos_especificos.placa} - {v.datos_especificos.marca} {v.datos_especificos.modelo}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Kilometraje Actual</label>
                    <input type="number" className="form-input" placeholder="Ej: 24500" value={kilometraje} onChange={e => setKilometraje(e.target.value)} required />
                  </div>
                </div>

                {/* CONTENIDO EN UNA SOLA SECCIÓN VERTICAL */}
                  
                  {/* PESTAÑA 1: NIVELES Y LUCES */}
                  {/* SECCIÓN 1: NIVELES Y LUCES */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      1. Niveles y Luces
                      {showValidationErrors && tabHasErrors('niveles') && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Incompleto</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        
                        {/* NIVELES */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-info)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Niveles
                          </h4>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Líquido Limpia Parabrisas', nivelLimpiaParabrisas, setNivelLimpiaParabrisas, 'select', undefined, 'nivelLimpiaParabrisas'],
                              ['Aceite de Motor', nivelAceite, setNivelAceite, 'select', undefined, 'nivelAceite'],
                              ['Refrigerante', nivelRefrigerante, setNivelRefrigerante, 'select', undefined, 'nivelRefrigerante'],
                              ['Nivel de Combustible', nivelCombustible, setNivelCombustible, 'select', undefined, 'nivelCombustible'],
                              ['Cantidad de Combustible', combustibleCant, setCombustibleCant, 'text', 'Ej: 50 L, 15 Gal o Cant', 'combustibleCant'],
                              ['Agua a la Batería', nivelAguaBateria, setNivelAguaBateria, 'select', undefined, 'nivelAguaBateria'],
                            ].map(([label, val, setVal, type, placeholder, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className={type === 'text' ? 'form-group' : 'switch-group'} style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span className="form-label" style={{ margin: 0, fontSize: '0.8rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  {type === 'select' ? (
                                    <select className="form-select" style={{ width: '115px', padding: '0.2rem', borderColor: hasError ? '#ef4444' : undefined }} value={val} onChange={e => setVal(e.target.value as any)}>
                                      <option value="">Seleccione</option>
                                      <option value="Full">Full</option>
                                      <option value="Medio">Medio</option>
                                      <option value="Bajo">Bajo</option>
                                    </select>
                                  ) : (
                                    <input type="text" className="form-input" style={{ width: '130px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', margin: 0, borderColor: hasError ? '#ef4444' : undefined }} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* LUCES */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Luces
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Luces de freno', luzFreno, setLuzFreno, 'luzFreno'],
                              ['Luces bajas de carretera', luzBajas, setLuzBajas, 'luzBajas'],
                              ['Luces altas de carretera', luzAltas, setLuzAltas, 'luzAltas'],
                              ['Bombillos quemados', luzBombillosQuemados, setLuzBombillosQuemados, 'luzBombillosQuemados'],
                              ['Micas rotas', luzMicasRotas, setLuzMicasRotas, 'luzMicasRotas'],
                              ['Faros rotos', luzFarosRotos, setLuzFarosRotos, 'luzFarosRotos'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.8rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'Bueno' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Bueno')}>Bueno</button>
                                    <button type="button" className={`btn ${val === 'Malo' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Malo')}>Malo</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Luces de cruce:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {[
                                ['DD (Delantero Derecho)', cruceDD, setCruceDD, 'cruceDD'],
                                ['DI (Delantero Izquierdo)', cruceDI, setCruceDI, 'cruceDI'],
                                ['TD (Trasero Derecho)', cruceTD, setCruceTD, 'cruceTD'],
                                ['TI (Trasero Izquierdo)', cruceTI, setCruceTI, 'cruceTI']
                              ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                                const hasError = showValidationErrors && getValidationErrors()[stateKey];
                                return (
                                  <div key={label} className="switch-group" style={{
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: '6px',
                                    background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                    margin: '0.1rem 0',
                                    border: hasError ? '1px solid #ef4444' : 'none'
                                  }}>
                                    <span style={{ fontSize: '0.78rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                      {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                                      <button type="button" className={`btn ${val === true ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.65rem' }} onClick={() => setVal(true)}>Ok</button>
                                      <button type="button" className={`btn ${val === false ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.65rem' }} onClick={() => setVal(false)}>Falla</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Explique fallos de luces</label>
                            <input type="text" className="form-input" style={{ padding: '0.35rem 0.5rem' }} placeholder="Indique bombillos o micas rotas..." value={explicacionLuces} onChange={e => setExplicacionLuces(e.target.value)} />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  {/* SECCIÓN 2: Generales y Seguridad */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      2. Generales y Seguridad
                      {showValidationErrors && tabHasErrors('generales') && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Incompleto</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        
                        {/* GENERALES */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-warning)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Generales
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Algún ruido extraño en el motor', genRuidoMotor, setGenRuidoMotor, 'genRuidoMotor'],
                              ['Hay tornillos sueltos en suspensión', genTornillosSuspension, setGenTornillosSuspension, 'genTornillosSuspension'],
                              ['Drenar tanques de aire', genDrenarTanques, setGenDrenarTanques, 'genDrenarTanques'],
                              ['Existe fisura o juego en la quinta rueda', genQuintaRueda, setGenQuintaRueda, 'genQuintaRueda'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.75rem', lineHeight: '1.1', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'No' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('No')}>No</button>
                                    <button type="button" className={`btn ${val === 'Si' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Si')}>Sí</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ARTICULOS DE SEGURIDAD / ACCESORIOS */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Artículos de Seguridad / Accesorios
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Botiquín primeros auxilios', segBotiquin, setSegBotiquin, 'segBotiquin'],
                              ['Gato', segGato, setSegGato, 'segGato'],
                              ['Extintor', segExtintor, setSegExtintor, 'segExtintor'],
                              ['Llave de rueda', segLlaveRueda, setSegLlaveRueda, 'segLlaveRueda'],
                              ['Impermeable/Lona', segLona, setSegLona, 'segLona'],
                              ['Triángulo de Seguridad', segTriangulo, setSegTriangulo, 'segTriangulo'],
                              ['Reproductor', segReproductor, setSegReproductor, 'segReproductor'],
                              ['Mecate', segMecate, setSegMecate, 'segMecate'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'Si' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Si')}>Sí</button>
                                    <button type="button" className={`btn ${val === 'No' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('No')}>No</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  {/* SECCIÓN 3: Funcionamiento y Ajustes */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      3. Funcionamiento y Ajustes
                      {showValidationErrors && tabHasErrors('funcionamiento') && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Incompleto</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        
                        {/* FUNCIONAMIENTO */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Funcionamiento
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Batería', funcBateria, setFuncBateria, 'funcBateria'],
                              ['Frenos', funcFrenos, setFuncFrenos, 'funcFrenos'],
                              ['Corneta', funcCorneta, setFuncCorneta, 'funcCorneta'],
                              ['Aire acondicionado', funcAireAcondicionado, setFuncAireAcondicionado, 'funcAireAcondicionado'],
                              ['Lavador y limpia parabrisas', funcLimpiaParabrisas, setFuncLimpiaParabrisas, 'funcLimpiaParabrisas'],
                              ['Pedales', funcPedales, setFuncPedales, 'funcPedales'],
                              ['Retroceso', funcRetroceso, setFuncRetroceso, 'funcRetroceso'],
                              ['Velocidades / Cambios', funcCambios, setFuncCambios, 'funcCambios'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                                    <button type="button" className={`btn ${val === 'Bueno' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal('Bueno')}>Bueno</button>
                                    <button type="button" className={`btn ${val === 'Reg' ? 'btn-warning' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal('Reg')}>Reg</button>
                                    <button type="button" className={`btn ${val === 'Malo' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal('Malo')}>Malo</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* AJUSTES */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Ajustes
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Vidrios:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {[
                                  ['F (Frontal)', ajusteVidrioF, setAjusteVidrioF, 'ajusteVidrioF'],
                                  ['TR (Trasero)', ajusteVidrioTR, setAjusteVidrioTR, 'ajusteVidrioTR'],
                                  ['LD (Lat. Der)', ajusteVidrioLD, setAjusteVidrioLD, 'ajusteVidrioLD'],
                                  ['LI (Lat. Izq)', ajusteVidrioLI, setAjusteVidrioLI, 'ajusteVidrioLI']
                                ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                                  const hasError = showValidationErrors && getValidationErrors()[stateKey];
                                  return (
                                    <div key={label} className="switch-group" style={{
                                      padding: '0.35rem 0.6rem',
                                      borderRadius: '6px',
                                      background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                      margin: '0.1rem 0',
                                      border: hasError ? '1px solid #ef4444' : 'none'
                                    }}>
                                      <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                        {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                      </span>
                                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button type="button" className={`btn ${val === true ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal(true)}>Ok</button>
                                        <button type="button" className={`btn ${val === false ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal(false)}>Falla</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Espejos:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {[
                                  ['LD (Lat. Der)', ajusteEspejoLD, setAjusteEspejoLD, 'ajusteEspejoLD'],
                                  ['LI (Lat. Izq)', ajusteEspejoLI, setAjusteEspejoLI, 'ajusteEspejoLI'],
                                  ['INT (retrovisor)', ajusteEspejoINT, setAjusteEspejoINT, 'ajusteEspejoINT']
                                ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                                  const hasError = showValidationErrors && getValidationErrors()[stateKey];
                                  return (
                                    <div key={label} className="switch-group" style={{
                                      padding: '0.35rem 0.6rem',
                                      borderRadius: '6px',
                                      background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                      margin: '0.1rem 0',
                                      border: hasError ? '1px solid #ef4444' : 'none'
                                    }}>
                                      <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                        {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                      </span>
                                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button type="button" className={`btn ${val === true ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal(true)}>Ok</button>
                                        <button type="button" className={`btn ${val === false ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.12rem 0.35rem', fontSize: '0.6rem' }} onClick={() => setVal(false)}>Falla</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                              {(() => {
                                const hasError = showValidationErrors && getValidationErrors().ajusteAsientos;
                                return (
                                  <div className="switch-group" style={{
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: '6px',
                                    background: 'rgba(13, 27, 42, 0.75)',
                                    margin: '0.1rem 0',
                                    border: hasError ? '1px solid #ef4444' : 'none'
                                  }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: hasError ? '#ef4444' : 'inherit' }}>
                                      Asientos {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                      <button type="button" className={`btn ${ajusteAsientos === 'Bueno' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setAjusteAsientos('Bueno')}>Bueno</button>
                                      <button type="button" className={`btn ${ajusteAsientos === 'Malo' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setAjusteAsientos('Malo')}>Malo</button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  {/* SECCIÓN 4: Diagnóstico de Partes */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      4. Diagnóstico de Partes
                     
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-info)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                          Diagnóstico de Partes y Comentarios
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                          {[
                            ['Motor', parteMotor, setParteMotor],
                            ['Sistema de enfriamiento', parteEnfriamiento, setParteEnfriamiento],
                            ['Sistema de escape y silenciador', parteEscape, setParteEscape],
                            ['Sistema de combustible', parteCombustible, setParteCombustible],
                            ['Sistema de frenos', parteFrenos, setParteFrenos],
                            ['Sistema eléctrico', parteElectrico, setParteElectrico],
                            ['Eje delantero, dirección y resortes', parteEjeDelantero, setParteEjeDelantero],
                            ['Transmisión', parteTransmision, setParteTransmision],
                            ['Eje trasero y resortes', parteEjeTrasero, setParteEjeTrasero],
                            ['Sistema de aire', parteAire, setParteAire],
                            ['Otra parte (Adicional 1)', parteOtra1, setParteOtra1],
                            ['Otra parte (Adicional 2)', parteOtra2, setParteOtra2]
                          ].map(([label, val, setVal]: any, idx: number) => (
                            <div key={label} style={{
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 2fr',
                              gap: '1rem',
                              alignItems: 'center',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                              margin: '0.15rem 0'
                            }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{label}</span>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', margin: 0, width: '100%' }} 
                                placeholder="Escriba comentarios, estado o detalles..." 
                                value={val} 
                                onChange={e => setVal(e.target.value)} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* SECCIÓN 5: Fugas y Neumáticos */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      5. Fugas y Neumáticos
                      {showValidationErrors && tabHasErrors('fugas') && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Incompleto</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
                        
                        {/* FUGAS + EXPLIQUE */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Fugas
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Combustible', fugaCombustible, setFugaCombustible, 'fugaCombustible'], 
                              ['Refrigerante', fugaRefrigerante, setFugaRefrigerante, 'fugaRefrigerante'], 
                              ['Aceite', fugaAceite, setFugaAceite, 'fugaAceite'], 
                              ['Otro', fugaOtro, setFugaOtro, 'fugaOtro']
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.8rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'No' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('No')}>No</button>
                                    <button type="button" className={`btn ${val === 'Si' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Si')}>Sí</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Explique / Detalles de Fuga</label>
                            <input type="text" className="form-input" style={{ padding: '0.35rem 0.5rem' }} placeholder="Especifique procedencia o gravedad..." value={explicacionFugas} onChange={e => setExplicacionFugas(e.target.value)} />
                          </div>
                        </div>

                        {/* RUEDAS Y LLANTAS (Estado General) */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-info)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Ruedas y Llantas (Parámetros)
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Presión de aire de cauchos', presionAire, setPresionAire, 'presionAire'],
                              ['Condiciones de rines', condicionRines, setCondicionRines, 'condicionRines'],
                              ['Condiciones de tuercas', condicionTuercas, setCondicionTuercas, 'condicionTuercas'],
                              ['Puntas de ejes delanteras (aceite)', puntasEjes, setPuntasEjes, 'puntasEjes'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'Bueno' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Bueno')}>Bueno</button>
                                    <button type="button" className={`btn ${val === 'Malo' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Malo')}>Malo</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* DETALLE INTERACTIVO DE LAS LLANTAS (CHUTO Y REMOLQUE) */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', margin: 0 }}>
                            Estado de las Llantas (Señale en el Dibujo)
                          </h4>
                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> A: Bueno</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }}></span> B: Medio</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> C: Planear</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> D: Urgente</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          
                          {/* DIBUJO CHUTO */}
                          <div style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.01)',
                            width: '210px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-info)' }}>CHUTO (Cabina)</span>
                            
                            {/* Eje 1 (Frontal) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem', alignItems: 'center' }}>
                              {renderTireButton(1)}
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 1</span>
                              {renderTireButton(2)}
                            </div>

                            {/* Eje 2 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(3)}
                                {renderTireButton(4)}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 2</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(5)}
                                {renderTireButton(6)}
                              </div>
                            </div>

                            {/* Eje 3 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(7)}
                                {renderTireButton(8)}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 3</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(9)}
                                {renderTireButton(10)}
                              </div>
                            </div>
                          </div>

                          {/* DIBUJO REMOLQUE */}
                          <div style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.01)',
                            width: '210px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-warning)' }}>REMOLQUE</span>
                            
                            {/* Eje 4 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(11)}
                                {renderTireButton(12)}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 4</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(13)}
                                {renderTireButton(14)}
                              </div>
                            </div>

                            {/* Eje 5 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(15)}
                                {renderTireButton(16)}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 5</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(17)}
                                {renderTireButton(18)}
                              </div>
                            </div>

                            {/* Eje 6 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(19)}
                                {renderTireButton(20)}
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Eje 6</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {renderTireButton(21)}
                                {renderTireButton(22)}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                  {/* SECCIÓN 6: Medidores, Lubricación y Cierre */}
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      6. Medidores, Lubricación y Cierre
                      {showValidationErrors && tabHasErrors('cierre') && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Incompleto</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      <div className="checklist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem' }}>
                        
                        {/* MEDIDORES E INSTRUMENTOS */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-info)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Medidores e Instrumentos
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Presión de aire', medPresionAire, setMedPresionAire, 'Ej: 90 PSI', 'medPresionAire'],
                              ['Presión de aceite', medPresionAceite, setMedPresionAceite, 'Ej: 40 PSI', 'medPresionAceite'],
                              ['Voltímetro', medVoltimetro, setMedVoltimetro, 'Ej: 14 V', 'medVoltimetro'],
                              ['Temperatura', medTemperatura, setMedTemperatura, 'Ej: 80 °C', 'medTemperatura'],
                            ].map(([label, val, setVal, placeholder, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </label>
                                  <input type="text" className="form-input" style={{ width: '130px', padding: '0.25rem 0.5rem', fontSize: '0.78rem', margin: 0, borderColor: hasError ? '#ef4444' : undefined }} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* LUBRICACIÓN */}
                        <div className="checklist-card">
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                            Lubricación
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {[
                              ['Caja de Cambio', lubCajaCambio, setLubCajaCambio, 'lubCajaCambio'],
                              ['Motor', lubMotor, setLubMotor, 'lubMotor'],
                              ['Diferencial', lubDiferencial, setLubDiferencial, 'lubDiferencial'],
                              ['Sistema de Dirección', lubDireccion, setLubDireccion, 'lubDireccion'],
                              ['Chasis', lubChasis, setLubChasis, 'lubChasis'],
                              ['Sistema de Suspensión', lubSuspension, setLubSuspension, 'lubSuspension'],
                            ].map(([label, val, setVal, stateKey]: any, idx: number) => {
                              const hasError = showValidationErrors && getValidationErrors()[stateKey];
                              return (
                                <div key={label} className="switch-group" style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: idx % 2 === 0 ? 'rgba(13, 27, 42, 0.75)' : 'rgba(27, 38, 59, 0.6)',
                                  margin: '0.1rem 0',
                                  border: hasError ? '1px solid #ef4444' : 'none'
                                }}>
                                  <span style={{ fontSize: '0.75rem', color: hasError ? '#ef4444' : 'inherit' }}>
                                    {label} {hasError && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                                  </span>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button type="button" className={`btn ${val === 'Bueno' ? 'btn-success' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Bueno')}>Bueno</button>
                                    <button type="button" className={`btn ${val === 'Malo' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }} onClick={() => setVal('Malo')}>Malo</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* OBSERVACIONES Y COMENTARIOS */}
                      <div className="checklist-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Observaciones (Novedades en Ruta)</label>
                          <textarea className="form-textarea" rows={2} style={{ fontSize: '0.75rem' }} placeholder="Describa brevemente novedades..." value={observaciones} onChange={e => setObservaciones(e.target.value)}></textarea>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Comentarios / Condiciones Generales</label>
                          <textarea className="form-textarea" rows={2} style={{ fontSize: '0.75rem' }} placeholder="Comentarios generales de condiciones..." value={comentariosGenerales} onChange={e => setComentariosGenerales(e.target.value)}></textarea>
                        </div>
                      </div>

                      {/* SOPORTE MULTIMEDIA */}
                      <div className="checklist-card">
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>Evidencia (Subir Fotos / Videos)</h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                          <input type="file" accept="image/*,video/*" id="media-upload" style={{ display: 'none' }} multiple onChange={handleFileUpload} />
                          <label htmlFor="media-upload" className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                            <Upload size={14} style={{ marginRight: '0.35rem' }} />
                            <span>{uploadingFile ? 'Cargando archivos...' : 'Seleccionar Archivos'}</span>
                          </label>
                        </div>
                        
                        {uploadedFileUrls.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                            {uploadedFileUrls.map((url, idx) => {
                              const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov') || url.includes('/videos/');
                              return (
                                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                  {isVideo ? (
                                    <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <img src={url} alt={`Evidencia ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )}
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveUploadedFile(url)} 
                                    style={{ 
                                      position: 'absolute', 
                                      top: '2px', 
                                      right: '2px', 
                                      background: 'rgba(220, 53, 69, 0.9)', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '50%', 
                                      width: '16px', 
                                      height: '16px', 
                                      fontSize: '10px', 
                                      cursor: 'pointer', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      padding: 0
                                    }}
                                    title="Eliminar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChecklistModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Inspección</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Orden (OT) */}
      {showOrderModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%' }}>
            <div className="modal-header">
              <h3>Crear Nueva Orden de Servicio</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }} onClick={() => {
                  setMinimizedModals(prev => [...prev, { key: 'newOrder', title: 'Nueva Orden - ' + (vehicles.find(v => v.id === selectedVehicleId)?.datos_especificos.placa || 'Sin Placa') }]);
                  setShowOrderModal(false);
                }}>–</button>
                <button className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowOrderModal(false)}>✕</button>
              </div>
            </div>
            <form onSubmit={handleOrderCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body">
                {lastMileage !== null && lastMileage > 0 && (
                  <div style={{ padding: '0.75rem 1rem', background: '#fed16d', border: '2px solid #b85c00', borderRadius: 'var(--radius-sm)', color: '#011e41', fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <AlertTriangle size={18} style={{ color: '#011e41', flexShrink: 0 }} />
                    <span><b>Notificación de Kilometraje:</b> El kilometraje de entrada para este vehículo debe ser estrictamente mayor a <b>{lastMileage} Km</b> (último registrado).</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Vehículo Afectado</label>
                  <select className="form-select" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)}>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.datos_especificos.placa} - {v.datos_especificos.marca} {v.datos_especificos.modelo}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Kilometraje Entrada</label>
                  <input type="number" className="form-input" placeholder="Ej: 45000" value={kilometraje} onChange={e => setKilometraje(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción del Diagnóstico Inicial</label>
                  <textarea className="form-textarea" rows={3} placeholder="Escriba los fallos reportados o diagnóstico técnico..." value={diagnostico} onChange={e => setDiagnostico(e.target.value)} required></textarea>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Insumos/Materiales Iniciales Solicitados</label>
                  <div className="table-container" style={{ overflow: 'visible', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <table className="custom-table" style={{ fontSize: '0.8rem', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th style={{ width: '80px' }}>Cant</th>
                          <th>Proveedor</th>
                          <th style={{ width: '110px' }}>Costo Unit.</th>
                          <th style={{ width: '100px' }}>Total</th>
                          <th style={{ width: '50px', textAlign: 'center' }}>✕</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ position: 'relative' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '0.4rem', fontSize: '0.8rem', height: 'auto', margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} 
                                value={item.descripcion} 
                                onChange={e => {
                                  handleItemChange(idx, 'descripcion', e.target.value);
                                  setActiveDropdownIndex(idx);
                                }} 
                                onFocus={() => setActiveDropdownIndex(idx)}
                                onBlur={() => setTimeout(() => setActiveDropdownIndex(null), 200)}
                                placeholder="Ej: Aceite 15W40..." 
                              />
                              {activeDropdownIndex === idx && item.descripcion.trim().length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  zIndex: 1000,
                                  maxHeight: '180px',
                                  overflowY: 'auto',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                  width: '100%',
                                  fontWeight: 'normal',
                                  textAlign: 'left'
                                }}>
                                  {catalogRepuestos
                                    .filter(r => r.descripcion.toLowerCase().includes(item.descripcion.toLowerCase()))
                                    .map(r => (
                                      <div
                                        key={r.id}
                                        style={{
                                          padding: '0.5rem',
                                          fontSize: '0.8rem',
                                          cursor: 'pointer',
                                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                        onClick={() => {
                                          const updated = [...orderItems];
                                          updated[idx] = {
                                            ...updated[idx],
                                            descripcion: r.descripcion,
                                            costo_unitario: r.precio_referencia,
                                            unidad_medida: r.unidad_medida
                                          };
                                          const lastRow = updated[updated.length - 1];
                                          if (idx === updated.length - 1 && (lastRow.descripcion.trim() !== '' || lastRow.costo_unitario > 0)) {
                                            updated.push({ descripcion: '', cantidad: 1, proveedor: '', costo_unitario: 0 });
                                          }
                                          setOrderItems(updated);
                                          setActiveDropdownIndex(null);
                                        }}
                                        onMouseDown={e => e.preventDefault()}
                                      >
                                        <span style={{ fontWeight: 600 }}>{r.descripcion}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                                          ${r.precio_referencia} / {r.unidad_medida}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <input 
                                  type="number" 
                                  step="any"
                                  className="form-input" 
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', height: 'auto', margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} 
                                  value={item.cantidad || ''} 
                                  onChange={e => handleItemChange(idx, 'cantidad', e.target.value)} 
                                  min="0" 
                                />
                                {item.unidad_medida && (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    {item.unidad_medida}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ padding: '0.4rem', fontSize: '0.8rem', height: 'auto', margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} 
                                value={item.proveedor} 
                                onChange={e => handleItemChange(idx, 'proveedor', e.target.value)} 
                                placeholder="Ej: Distribuidora..." 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-input" 
                                style={{ padding: '0.4rem', fontSize: '0.8rem', height: 'auto', margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} 
                                value={item.costo_unitario || ''} 
                                onChange={e => handleItemChange(idx, 'costo_unitario', e.target.value)} 
                                placeholder="0.00" 
                              />
                            </td>
                            <td style={{ fontWeight: 600, verticalAlign: 'middle' }}>
                              ${(item.cantidad * item.costo_unitario).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                                onClick={() => handleRemoveItemRow(idx)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Abrir Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle/Edición de Orden (OT) y Calculadora de Costes */}
      {selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Fase Operativa & Liquidación: OT {selectedOrder.id.substring(0, 8)}</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontWeight: 'bold' }} onClick={() => {
                  setMinimizedModals(prev => [...prev, { key: 'editOrder', title: 'OT: ' + selectedOrder.id.substring(0, 8), data: selectedOrder }]);
                  setSelectedOrder(null);
                }}>–</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
            </div>
            
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-info)', marginBottom: '1rem' }}>Asociar Insumos y Repuestos</h4>
                
                {selectedOrder.estado !== 'Completada' ? (
                  <form onSubmit={handleAddPartToOrder} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <select className="form-select" style={{ flex: 2 }} value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                      {catalogRepuestos.map(r => (
                        <option key={r.id} value={r.id}>{r.descripcion} (${r.precio_referencia})</option>
                      ))}
                    </select>
                    <input type="number" className="form-input" style={{ width: '70px' }} min="1" value={partQty} onChange={e => setPartQty(e.target.value)} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>Añadir</button>
                  </form>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Esta orden está completada. No se permiten más insumos.</div>
                )}

                <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant</th>
                        <th>Costo Hist.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.insumos || []).map((ins, i) => (
                        <tr key={i}>
                          <td>{ins.descripcion}</td>
                          <td>{ins.cantidad_usada}</td>
                          <td>${parseFloat(ins.costo_unitario_historico.toString()).toFixed(2)}</td>
                          <td>${(parseFloat(ins.cantidad_usada.toString()) * parseFloat(ins.costo_unitario_historico.toString())).toFixed(2)}</td>
                        </tr>
                      ))}
                      {(selectedOrder.insumos || []).length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ningún repuesto asociado todavía.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="checklist-card" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Resumen de Costos Directos (Cálculo Live)</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', margin: '0.1rem 0' }}>
                    <span>Insumos Totales:</span>
                    <span>${liveCost.parts.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', margin: '0.1rem 0' }}>
                    <span>Mano de Obra ({horasTaller} hrs x ${tasaHoraTaller}):</span>
                    <span>${liveCost.labor.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '0.25rem', marginTop: '0.25rem', color: 'var(--color-success)' }}>
                    <span>Costo Total OT:</span>
                    <span>${liveCost.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-info)', marginBottom: '1rem' }}>Registro de Reparación y Horas</h4>
                
                <div className="form-group">
                  <label className="form-label">Estado de la Orden</label>
                  <select className="form-select" value={estadoOrden} onChange={e => setEstadoOrden(e.target.value as any)}>
                    <option value="Abierta">Abierta</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completada">Completada (Congelar Facturación)</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tasa Hora Taller</label>
                    <input type="number" className="form-input" value={tasaHoraTaller} onChange={e => setTasaHoraTaller(e.target.value)} disabled={selectedOrder.estado === 'Completada'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horas Empleadas</label>
                    <input type="number" step="0.5" className="form-input" value={horasTaller} onChange={e => setHorasTaller(e.target.value)} disabled={selectedOrder.estado === 'Completada'} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reparación Ejecutada (Trabajo Realizado)</label>
                  <textarea className="form-textarea" rows={3} value={reparacionEjecutada} onChange={e => setReparacionEjecutada(e.target.value)} disabled={selectedOrder.estado === 'Completada'} placeholder="Indique las correcciones y piezas reemplazadas..."></textarea>
                </div>
              </div>
            </div>

            {/* Pie de Acciones Fijo */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cerrar Panel</button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateOrderState}>Guardar Firma Fase</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Reporte / Detalle de Checklist (Estilo Retro Enterprise ERP) */}
      {selectedChecklist && (
        <div className="modal-backdrop">
          <div className="modal-content windows-98-modal" style={{ 
            maxWidth: '850px', 
            width: '95%',
            background: '#d4d0c8', // Classic light grey of Windows/Profit GUI
            borderRadius: '0px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '2px solid #808080',
            overflow: 'hidden',
            fontFamily: 'Tahoma, Arial, sans-serif',
            color: '#000',
            padding: 0
          }}>
            {/* Title Bar styled like Windows 98 / classic Windows */}
            <div className="profit-titlebar-print" style={{
              background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)', // Classic Windows Blue
              color: '#fff',
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>Inspección Técnica [{selectedChecklist.id}] - Enterprise ERP 8.5 (Ambiente Sincronizado)</span>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setMinimizedModals(prev => [...prev, { key: 'editChecklist', title: 'Checklist: ' + selectedChecklist.id.substring(0, 8), data: selectedChecklist }]);
                    setSelectedChecklist(null);
                  }}
                  style={{ 
                    background: '#c0c0c0', 
                    border: '1px solid #fff', 
                    borderRightColor: '#808080', 
                    borderBottomColor: '#808080', 
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '2px 6px',
                    cursor: 'pointer'
                  }}
                  title="Minimizar"
                >
                  –
                </button>
                <button 
                  type="button"
                  onClick={handleCloseChecklistModal}
                  style={{ 
                    background: '#c0c0c0', 
                    border: '1px solid #fff', 
                    borderRightColor: '#808080', 
                    borderBottomColor: '#808080', 
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '2px 6px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profit Style Toolbar Ribbon */}
            <div className="profit-toolbar-print" style={{
              background: '#d4d0c8',
              padding: '6px 12px',
              borderBottom: '1px solid #808080',
              display: 'flex',
              gap: '12px'
            }}>
              {selectedChecklist && !selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true ? (
                <button 
                  type="button"
                  onClick={() => handleSignChecklist(selectedChecklist.id)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#e0e0e0', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '3px 8px', color: '#008000', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  💾 Firmar Auditoría
                </button>
              ) : (
                <button disabled style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#c0c0c0', border: '1px solid #808080', padding: '3px 8px', color: '#777' }}>
                  💾 Firmado
                </button>
              )}
              <button 
                type="button"
                onClick={() => {
                  window.print();
                }} 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#e0e0e0', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '3px 8px', color: '#000', cursor: 'pointer' }}
              >
                🖨️ Imprimir
              </button>
              <div style={{ borderLeft: '1px solid #808080', height: '18px' }}></div>
              <button 
                type="button"
                onClick={handleCloseChecklistModal} 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#e0e0e0', border: '1px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '3px 8px', color: '#c00', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕ Salir
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px', background: '#d4d0c8' }}>
              {/* Cabecera de Datos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#d4d0c8', border: '1px solid #808080', padding: '12px', borderRadius: '2px', boxShadow: 'inset 1px 1px 0 #fff' }}>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Vehículo:</label>
                  <input readOnly type="text" value={selectedChecklist.placa || 'Sin Placa'} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px', fontWeight: 'bold', color: '#000080' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Inspector:</label>
                  <input readOnly type="text" value={selectedChecklist.inspector || 'Desconocido'} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Fecha de Registro:</label>
                  <input readOnly type="text" value={new Date(selectedChecklist.fecha).toLocaleString()} style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px', fontWeight: 'bold' }}>Kilometraje/Horómetro:</label>
                  <input readOnly type="text" value={
                    (selectedChecklist.kilometraje_registro ? `${selectedChecklist.kilometraje_registro} Km` : '') +
                    (selectedChecklist.kilometraje_registro && selectedChecklist.horometro_registro ? ' / ' : '') +
                    (selectedChecklist.horometro_registro ? `${selectedChecklist.horometro_registro} Hrs` : '') +
                    (!selectedChecklist.kilometraje_registro && !selectedChecklist.horometro_registro ? 'N/D' : '')
                  } style={{ width: '100%', background: '#fff', border: '1px solid #808080', padding: '3px' }} />
                </div>
              </div>

              {/* Sub-tabs del Reporte */}
              <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #808080', marginBottom: '12px', paddingLeft: '6px', overflowX: 'auto', paddingBottom: '1px' }}>
                {[
                  { id: 1, label: '1. Niveles y Luces' },
                  { id: 2, label: '2. Generales y Seguridad' },
                  { id: 3, label: '3. Funcionamiento y Ajustes' },
                  { id: 4, label: '4. Diagnóstico de Partes' },
                  { id: 5, label: '5. Fugas y Neumáticos' },
                  { id: 6, label: '6. Medidores, Lubricación y Cierre' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    style={{
                      background: '#d4d0c8',
                      border: '1px solid #fff',
                      borderBottom: reportActiveTab === tab.id ? 'none' : '1px solid #808080',
                      borderRightColor: '#808080',
                      borderBottomColor: reportActiveTab === tab.id ? 'transparent' : '#808080',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontFamily: 'Tahoma, Arial, sans-serif',
                      cursor: 'pointer',
                      color: '#000',
                      fontWeight: reportActiveTab === tab.id ? 'bold' : 'normal',
                      marginTop: reportActiveTab === tab.id ? '0px' : '2px',
                      zIndex: reportActiveTab === tab.id ? 2 : 1,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      borderRadius: 0
                    }}
                    onClick={() => setReportActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido de las pestañas */}
              <div style={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                
                {/* SECCIÓN 1: FLUIDOS Y LUCES */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    1. Fluidos y Luces
                    {highlightReviewError === 1 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Debe revisar esta sección</span>}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                      {/* SECCIÓN 1: NIVELES Y FLUIDOS */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-info)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          1. Niveles de Fluidos
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Limpia Parabrisas:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.niveles?.limpia_parabrisas === 'Full' ? 'badge-success' : selectedChecklist.respuestas_detalle?.niveles?.limpia_parabrisas === 'Medio' ? 'badge-warning' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.niveles?.limpia_parabrisas || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Aceite Motor:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.niveles?.aceite_motor === 'Full' ? 'badge-success' : selectedChecklist.respuestas_detalle?.niveles?.aceite_motor === 'Medio' ? 'badge-warning' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.niveles?.aceite_motor || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Refrigerante:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.niveles?.refrigerante === 'Full' ? 'badge-success' : selectedChecklist.respuestas_detalle?.niveles?.refrigerante === 'Medio' ? 'badge-warning' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.niveles?.refrigerante || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Nivel Combustible:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.niveles?.combustible_nivel === 'Full' ? 'badge-success' : selectedChecklist.respuestas_detalle?.niveles?.combustible_nivel === 'Medio' ? 'badge-warning' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.niveles?.combustible_nivel || 'S/D'}
                            </span>
                          </div>
                          {selectedChecklist.respuestas_detalle?.niveles?.combustible_cant && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Cantidad Combustible:</span>
                              <span style={{ fontWeight: 600 }}>{selectedChecklist.respuestas_detalle?.niveles?.combustible_cant}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Agua a la Batería:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.niveles?.agua_bateria === 'Full' ? 'badge-success' : selectedChecklist.respuestas_detalle?.niveles?.agua_bateria === 'Medio' ? 'badge-warning' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.niveles?.agua_bateria || 'S/D'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECCIÓN 2: SISTEMA DE LUCES */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-success)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          2. Sistema de Luces
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          {[
                            ['Luces de freno', selectedChecklist.respuestas_detalle?.luces?.freno],
                            ['Luces bajas carretera', selectedChecklist.respuestas_detalle?.luces?.bajas],
                            ['Luces altas carretera', selectedChecklist.respuestas_detalle?.luces?.altas],
                            ['Bombillos quemados', selectedChecklist.respuestas_detalle?.luces?.bombillos_quemados === 'Bueno' ? 'Bueno' : 'Malo'],
                            ['Micas rotas', selectedChecklist.respuestas_detalle?.luces?.micas_rotas === 'Bueno' ? 'Bueno' : 'Malo'],
                            ['Faros rotos', selectedChecklist.respuestas_detalle?.luces?.faros_rotos === 'Bueno' ? 'Bueno' : 'Malo'],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{lbl}:</span>
                              <span className={`badge ${val === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                                {val || 'S/D'}
                              </span>
                            </div>
                          ))}
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem', padding: '0.4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Luces de Cruce:</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.luces?.cruce?.dd ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.luces?.cruce?.dd ? 'var(--color-success)' : 'var(--color-danger)' }}>DD: {selectedChecklist.respuestas_detalle?.luces?.cruce?.dd ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.luces?.cruce?.di ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.luces?.cruce?.di ? 'var(--color-success)' : 'var(--color-danger)' }}>DI: {selectedChecklist.respuestas_detalle?.luces?.cruce?.di ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.luces?.cruce?.td ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.luces?.cruce?.td ? 'var(--color-success)' : 'var(--color-danger)' }}>TD: {selectedChecklist.respuestas_detalle?.luces?.cruce?.td ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.luces?.cruce?.ti ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.luces?.cruce?.ti ? 'var(--color-success)' : 'var(--color-danger)' }}>TI: {selectedChecklist.respuestas_detalle?.luces?.cruce?.ti ? 'OK' : 'Malo'}</span>
                            </div>
                          </div>
                          {selectedChecklist.respuestas_detalle?.luces?.explicacion_luces && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                              Nota: {selectedChecklist.respuestas_detalle?.luces?.explicacion_luces}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightReviewError === 1 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)', 
                        border: highlightReviewError === 1 ? '2px solid var(--color-danger)' : '1px solid rgba(59, 130, 246, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-1"
                          checked={tab1Reviewed} 
                          onChange={(e) => {
                            setTab1Reviewed(e.target.checked);
                            if (e.target.checked && highlightReviewError === 1) setHighlightReviewError(null);
                          }} 
                        />
                        <label htmlFor="check-tab-1" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: highlightReviewError === 1 ? 'var(--color-danger)' : 'inherit', fontWeight: highlightReviewError === 1 ? 'bold' : 'normal' }}>
                          Confirmar revisión de esta sección (Niveles y Luces)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {/* SECCIÓN 2 */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    2. Generales y Seguridad
                    {highlightReviewError === 2 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Debe revisar esta sección</span>}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                      {/* SECCIÓN 3: GENERALES MECÁNICA */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-warning)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          3. Generales Mecánica
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          {[
                            ['Ruido extraño en motor', selectedChecklist.respuestas_detalle?.generales?.ruido_motor],
                            ['Tornillos flojos en suspensión', selectedChecklist.respuestas_detalle?.generales?.tornillos_suspension],
                            ['Drenar tanques de aire', selectedChecklist.respuestas_detalle?.generales?.drenar_tanques],
                            ['Fisura o juego en quinta rueda', selectedChecklist.respuestas_detalle?.generales?.quinta_rueda],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{lbl}:</span>
                              <span className={`badge ${val === 'No' ? 'badge-success' : 'badge-danger'}`}>
                                {val || 'S/D'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECCIÓN 4: ARTÍCULOS DE SEGURIDAD / ACCESORIOS */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          4. Artículos de Seguridad / Accesorios
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          {[
                            ['Botiquín', selectedChecklist.respuestas_detalle?.seguridad?.botiquin],
                            ['Gato', selectedChecklist.respuestas_detalle?.seguridad?.gato],
                            ['Extintor', selectedChecklist.respuestas_detalle?.seguridad?.extintor],
                            ['Llave rueda', selectedChecklist.respuestas_detalle?.seguridad?.llave_rueda],
                            ['Lona/Imp.', selectedChecklist.respuestas_detalle?.seguridad?.lona],
                            ['Triángulo', selectedChecklist.respuestas_detalle?.seguridad?.triangulo],
                            ['Radio/Rep.', selectedChecklist.respuestas_detalle?.seguridad?.reproductor],
                            ['Mecate', selectedChecklist.respuestas_detalle?.seguridad?.mecate],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lbl}:</span>
                              <span className={`badge ${val === 'Si' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>
                                {val || 'S/D'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightReviewError === 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)', 
                        border: highlightReviewError === 2 ? '2px solid var(--color-danger)' : '1px solid rgba(59, 130, 246, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-2"
                          checked={tab2Reviewed} 
                          onChange={(e) => {
                            setTab2Reviewed(e.target.checked);
                            if (e.target.checked && highlightReviewError === 2) setHighlightReviewError(null);
                          }} 
                        />
                        <label htmlFor="check-tab-2" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: highlightReviewError === 2 ? 'var(--color-danger)' : 'inherit', fontWeight: highlightReviewError === 2 ? 'bold' : 'normal' }}>
                          Confirmar revisión de esta sección (Generales y Seguridad)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {/* SECCIÓN 3 */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    3. Funcionamiento y Ajustes
                    {highlightReviewError === 3 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Debe revisar esta sección</span>}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                      {/* SECCIÓN 5: FUNCIONAMIENTO */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-success)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          5. Funcionamiento
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          {[
                            ['Batería', selectedChecklist.respuestas_detalle?.funcionamiento?.bateria],
                            ['Frenos', selectedChecklist.respuestas_detalle?.funcionamiento?.frenos],
                            ['Corneta', selectedChecklist.respuestas_detalle?.funcionamiento?.corneta],
                            ['Aire Acond.', selectedChecklist.respuestas_detalle?.funcionamiento?.aire_acondicionado],
                            ['Limpia Parab.', selectedChecklist.respuestas_detalle?.funcionamiento?.limpia_parabrisas],
                            ['Pedales', selectedChecklist.respuestas_detalle?.funcionamiento?.pedales],
                            ['Retroceso', selectedChecklist.respuestas_detalle?.funcionamiento?.retroceso],
                            ['Cambios', selectedChecklist.respuestas_detalle?.funcionamiento?.cambios],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lbl}:</span>
                              <span className={`badge ${val === 'Bueno' ? 'badge-success' : val === 'Reg' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>
                                {val || 'S/D'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECCIÓN 6: AJUSTES Y CABINA */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          6. Cabina y Ajustes
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Asientos:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.ajustes?.asientos === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.ajustes?.asientos || 'S/D'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado de Vidrios (Operable):</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.f ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.f ? 'var(--color-success)' : 'var(--color-danger)' }}>Frontal: {selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.f ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.tr ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.tr ? 'var(--color-success)' : 'var(--color-danger)' }}>Trasero: {selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.tr ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.ld ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.ld ? 'var(--color-success)' : 'var(--color-danger)' }}>Der: {selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.ld ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.li ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.li ? 'var(--color-success)' : 'var(--color-danger)' }}>Izq: {selectedChecklist.respuestas_detalle?.ajustes?.vidrios?.li ? 'OK' : 'Malo'}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Espejos Retrovisores (Intactos):</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.ld ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.ld ? 'var(--color-success)' : 'var(--color-danger)' }}>Der: {selectedChecklist.respuestas_detalle?.ajustes?.espejos?.ld ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.li ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.li ? 'var(--color-success)' : 'var(--color-danger)' }}>Izq: {selectedChecklist.respuestas_detalle?.ajustes?.espejos?.li ? 'OK' : 'Malo'}</span>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.2rem', borderRadius: '2px', background: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.int ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedChecklist.respuestas_detalle?.ajustes?.espejos?.int ? 'var(--color-success)' : 'var(--color-danger)' }}>Interno: {selectedChecklist.respuestas_detalle?.ajustes?.espejos?.int ? 'OK' : 'Malo'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightReviewError === 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)', 
                        border: highlightReviewError === 3 ? '2px solid var(--color-danger)' : '1px solid rgba(59, 130, 246, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-3"
                          checked={tab3Reviewed} 
                          onChange={(e) => {
                            setTab3Reviewed(e.target.checked);
                            if (e.target.checked && highlightReviewError === 3) setHighlightReviewError(null);
                          }} 
                        />
                        <label htmlFor="check-tab-3" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: highlightReviewError === 3 ? 'var(--color-danger)' : 'inherit', fontWeight: highlightReviewError === 3 ? 'bold' : 'normal' }}>
                          Confirmar revisión de esta sección (Funcionamiento y Ajustes)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {/* SECCIÓN 4 */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    4. Diagnóstico de Partes
                    {highlightReviewError === 4 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Debe revisar esta sección</span>}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* SECCIÓN 7: DIAGNÓSTICO DE PARTES */}
                    <div className="checklist-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-info)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                        7. Diagnóstico de Partes y Comentarios
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                        {[
                          ['Motor', selectedChecklist.respuestas_detalle?.partes?.motor],
                          ['Sistema enfriamiento', selectedChecklist.respuestas_detalle?.partes?.enfriamiento],
                          ['Sistema escape y silenciador', selectedChecklist.respuestas_detalle?.partes?.escape],
                          ['Sistema combustible', selectedChecklist.respuestas_detalle?.partes?.combustible],
                          ['Sistema frenos', selectedChecklist.respuestas_detalle?.partes?.frenos],
                          ['Sistema eléctrico', selectedChecklist.respuestas_detalle?.partes?.electrico],
                          ['Eje delantero, dir. y resortes', selectedChecklist.respuestas_detalle?.partes?.eje_delantero],
                          ['Transmisión', selectedChecklist.respuestas_detalle?.partes?.transmision],
                          ['Eje trasero y resortes', selectedChecklist.respuestas_detalle?.partes?.eje_trasero],
                          ['Sistema de aire', selectedChecklist.respuestas_detalle?.partes?.aire],
                          ['Otra parte 1', selectedChecklist.respuestas_detalle?.partes?.otra1],
                          ['Otra parte 2', selectedChecklist.respuestas_detalle?.partes?.otra2],
                        ].map(([lbl, val]: any) => (
                          <div key={lbl} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.01)', paddingBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.75rem' }}>{lbl}:</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontStyle: val ? 'normal' : 'italic' }}>
                              {val || 'Sin comentarios'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightReviewError === 4 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)', 
                        border: highlightReviewError === 4 ? '2px solid var(--color-danger)' : '1px solid rgba(59, 130, 246, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-4"
                          checked={tab4Reviewed} 
                          onChange={(e) => {
                            setTab4Reviewed(e.target.checked);
                            if (e.target.checked && highlightReviewError === 4) setHighlightReviewError(null);
                          }} 
                        />
                        <label htmlFor="check-tab-4" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: highlightReviewError === 4 ? 'var(--color-danger)' : 'inherit', fontWeight: highlightReviewError === 4 ? 'bold' : 'normal' }}>
                          Confirmar revisión de esta sección (Diagnóstico de Partes)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {/* SECCIÓN 5 */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    5. Fugas y Neumáticos
                    {highlightReviewError === 5 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⚠️ Debe revisar esta sección</span>}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                      {/* SECCIÓN 8: FUGAS DETECTADAS */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-danger)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          8. Fugas Detectadas
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          {[
                            ['Combustible', selectedChecklist.respuestas_detalle?.fugas?.combustible],
                            ['Refrigerante', selectedChecklist.respuestas_detalle?.fugas?.refrigerante],
                            ['Aceite', selectedChecklist.respuestas_detalle?.fugas?.aceite],
                            ['Otro', selectedChecklist.respuestas_detalle?.fugas?.otro],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{lbl}:</span>
                              <span className={`badge ${val === 'Si' ? 'badge-danger' : 'badge-success'}`}>
                                {val === 'Si' ? '🚨 Sí' : '✅ No'}
                              </span>
                            </div>
                          ))}
                          {selectedChecklist.respuestas_detalle?.fugas?.explicacion && (
                            <div style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.15)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.2rem', color: '#fca5a5' }}>
                              <b>Explicación:</b> {selectedChecklist.respuestas_detalle?.fugas?.explicacion}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SECCIÓN 9: RUEDAS Y LLANTAS */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-info)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          9. Ruedas y Llantas
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Presión Aire:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.ruedas?.presion_aire === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.ruedas?.presion_aire || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Condición Rines:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.ruedas?.condicion_rines === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.ruedas?.condicion_rines || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Condición Tuercas:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.ruedas?.condicion_tuercas === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.ruedas?.condicion_tuercas || 'S/D'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Puntas Ejes:</span>
                            <span className={`badge ${selectedChecklist.respuestas_detalle?.ruedas?.puntas_ejes === 'Bueno' ? 'badge-success' : 'badge-danger'}`}>
                              {selectedChecklist.respuestas_detalle?.ruedas?.puntas_ejes || 'S/D'}
                            </span>
                          </div>
                        </div>

                        {/* MAPA DEL ESTADO DE LAS LLANTAS */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Mapa del Estado de las Llantas:
                          </span>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            {/* CHUTO READ-ONLY */}
                            <div style={{
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '0.5rem',
                              background: 'rgba(255,255,255,0.01)',
                              width: '100%',
                              maxWidth: '170px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontWeight: 700, fontSize: '0.68rem', color: 'var(--color-info)' }}>CHUTO (Cabina)</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 0.25rem', alignItems: 'center' }}>
                                {renderReadOnlyTire(selectedChecklist, 1)}
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E1</span>
                                {renderReadOnlyTire(selectedChecklist, 2)}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 3)}
                                  {renderReadOnlyTire(selectedChecklist, 4)}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E2</span>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 5)}
                                  {renderReadOnlyTire(selectedChecklist, 6)}
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 7)}
                                  {renderReadOnlyTire(selectedChecklist, 8)}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E3</span>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 9)}
                                  {renderReadOnlyTire(selectedChecklist, 10)}
                                </div>
                              </div>
                            </div>

                            {/* REMOLQUE READ-ONLY */}
                            <div style={{
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '0.5rem',
                              background: 'rgba(255,255,255,0.01)',
                              width: '100%',
                              maxWidth: '170px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontWeight: 700, fontSize: '0.68rem', color: 'var(--color-warning)' }}>REMOLQUE</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 11)}
                                  {renderReadOnlyTire(selectedChecklist, 12)}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E4</span>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 13)}
                                  {renderReadOnlyTire(selectedChecklist, 14)}
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 15)}
                                  {renderReadOnlyTire(selectedChecklist, 16)}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E5</span>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 17)}
                                  {renderReadOnlyTire(selectedChecklist, 18)}
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 19)}
                                  {renderReadOnlyTire(selectedChecklist, 20)}
                                </div>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>E6</span>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {renderReadOnlyTire(selectedChecklist, 21)}
                                  {renderReadOnlyTire(selectedChecklist, 22)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightReviewError === 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)', 
                        border: highlightReviewError === 5 ? '2px solid var(--color-danger)' : '1px solid rgba(59, 130, 246, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-5"
                          checked={tab5Reviewed} 
                          onChange={(e) => {
                            setTab5Reviewed(e.target.checked);
                            if (e.target.checked && highlightReviewError === 5) setHighlightReviewError(null);
                          }} 
                        />
                        <label htmlFor="check-tab-5" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, color: highlightReviewError === 5 ? 'var(--color-danger)' : 'inherit', fontWeight: highlightReviewError === 5 ? 'bold' : 'normal' }}>
                          Confirmar revisión de esta sección (Fugas y Neumáticos)
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {/* SECCIÓN 6 */}
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    6. Medidores, Lubricación y Cierre
                   
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
                      {/* SECCIÓN 10: MEDIDORES E INSTRUMENTOS */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-info)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          10. Medidores e Instrumentos
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Presión Aire:</span>
                            <span style={{ fontWeight: 600 }}>{selectedChecklist.respuestas_detalle?.medidores?.presion_aire || 'S/D'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Presión Aceite:</span>
                            <span style={{ fontWeight: 600 }}>{selectedChecklist.respuestas_detalle?.medidores?.presion_aceite || 'S/D'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Voltímetro:</span>
                            <span style={{ fontWeight: 600 }}>{selectedChecklist.respuestas_detalle?.medidores?.voltimetro || 'S/D'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Temperatura:</span>
                            <span style={{ fontWeight: 600 }}>{selectedChecklist.respuestas_detalle?.medidores?.temperatura || 'S/D'}</span>
                          </div>
                        </div>
                      </div>

                      {/* SECCIÓN 11: LUBRICACIÓN */}
                      <div className="checklist-card" style={{ padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                          11. Lubricación
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          {[
                            ['Caja de Cambio', selectedChecklist.respuestas_detalle?.lubricacion?.caja_cambio],
                            ['Motor', selectedChecklist.respuestas_detalle?.lubricacion?.motor],
                            ['Diferencial', selectedChecklist.respuestas_detalle?.lubricacion?.diferencial],
                            ['Dirección', selectedChecklist.respuestas_detalle?.lubricacion?.direccion],
                            ['Chasis', selectedChecklist.respuestas_detalle?.lubricacion?.chasis],
                            ['Suspensión', selectedChecklist.respuestas_detalle?.lubricacion?.suspension],
                          ].map(([lbl, val]: any) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lbl}:</span>
                              <span className={`badge ${val === 'Bueno' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>
                                {val || 'S/D'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 12: OBSERVACIONES Y CONDICIONES GENERALES */}
                    <div className="checklist-card" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-info)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
                        12. Observaciones y Comentarios Generales
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                        {selectedChecklist.observaciones && (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>NOVEDADES / ANOMALÍAS EN RUTA:</span>
                            <p style={{ marginTop: '0.15rem', color: 'var(--text-primary)' }}>{selectedChecklist.observaciones}</p>
                          </div>
                        )}
                        {selectedChecklist.respuestas_detalle?.comentarios_generales && (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>CONDICIONES GENERALES / ESTÉTICA:</span>
                            <p style={{ marginTop: '0.15rem', color: 'var(--text-primary)' }}>{selectedChecklist.respuestas_detalle.comentarios_generales}</p>
                          </div>
                        )}
                        {!selectedChecklist.observaciones && !selectedChecklist.respuestas_detalle?.comentarios_generales && (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin observaciones registradas.</span>
                        )}
                        
                        {/* MULTIMEDIA VIEWER SUPPORTING MULTIPLE FILES */}
                        {(selectedChecklist.respuestas_detalle?.multimedia_urls && selectedChecklist.respuestas_detalle.multimedia_urls.length > 0) ? (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ARCHIVOS DE EVIDENCIA ADJUNTOS:</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                              {selectedChecklist.respuestas_detalle.multimedia_urls.map((url, idx) => {
                                const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov') || url.includes('/videos/');
                                return (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {isVideo ? (
                                      <video src={url} controls style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                      <a href={url} target="_blank" rel="noreferrer">
                                        <img src={url} alt={`Evidencia ${idx}`} style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                      </a>
                                    )}
                                    <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textDecoration: 'underline', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      Abrir archivo
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : selectedChecklist.respuestas_detalle?.multimedia_url ? (
                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ARCHIVO DE EVIDENCIA ADJUNTO:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <a href={selectedChecklist.respuestas_detalle.multimedia_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                <Upload size={14} style={{ marginRight: '0.25rem' }} /> Abrir Archivo Adjunto
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* FIRMA DE AUDITORÍA */}
                    {!selectedChecklist.respuestas_detalle?.firma_auditoria && user?.permisos?.firmar_checklists === true && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        background: highlightSignatureError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.05)', 
                        border: highlightSignatureError ? '2px solid var(--color-danger)' : '1px solid rgba(16, 185, 129, 0.15)', 
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          id="check-tab-6"
                          checked={tab6Reviewed} 
                          onChange={async (e) => {
                            const val = e.target.checked;
                            if (val) {
                              setHighlightSignatureError(false);
                              if (!tab1Reviewed) {
                                setHighlightReviewError(1);
                                setReportActiveTab(1);
                                return;
                              }
                              if (!tab2Reviewed) {
                                setHighlightReviewError(2);
                                setReportActiveTab(2);
                                return;
                              }
                              if (!tab3Reviewed) {
                                setHighlightReviewError(3);
                                setReportActiveTab(3);
                                return;
                              }
                              if (!tab4Reviewed) {
                                setHighlightReviewError(4);
                                setReportActiveTab(4);
                                return;
                              }
                              if (!tab5Reviewed) {
                                setHighlightReviewError(5);
                                setReportActiveTab(5);
                                return;
                              }
                              
                              const confirmed = window.confirm("Vas a firmar la confirmacion de tu auditoria de este checklist. esta opcion no puede alterarze despues de confirmar esta firma");
                              if (!confirmed) return;
                              
                              await handleSignChecklist(selectedChecklist.id);
                            }
                          }} 
                        />
                        <label htmlFor="check-tab-6" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0, fontWeight: 600, color: highlightSignatureError ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          Firma de Conformidad de Auditoría (Click para Firmar como Checklist Revisado)
                        </label>
                      </div>
                    )}

                    {selectedChecklist.respuestas_detalle?.firma_auditoria && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', color: '#a7f3d0', fontWeight: 600 }}>
                        <span>✓ Checklist Auditado y Confirmado por {selectedChecklist.respuestas_detalle.firma_auditoria.nombre_usuario} el {new Date(selectedChecklist.respuestas_detalle.firma_auditoria.fecha).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedChecklist.respuestas_detalle?.firma_auditoria && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ Auditado por {selectedChecklist.respuestas_detalle.firma_auditoria.nombre_usuario}
                  </span>
                )}
              </div>
              <button type="button" className="btn btn-primary" onClick={handleCloseChecklistModal}>Cerrar Reporte</button>
            </div>
          </div>
        </div>
      )}
      {/* Cierre del bloque condicional mainTab===operaciones */}
      </>}

      {/* Modal Confirmar Solicitud de Mantenimiento (SDM) */}
      {showSdmConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h3>Confirmar Solicitud de Mantenimiento</h3>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem' }} onClick={() => setShowSdmConfirmModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSdmSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                  ⚠️ Se han detectado fallas o niveles no-óptimos en el checklist. Se generará un reporte automático a taller.
                </div>
                
                <div className="form-group">
                  <label className="form-label">Vehículo</label>
                  <input readOnly type="text" className="form-input" value={vehicles.find(v => v.id === selectedVehicleId)?.datos_especificos.placa || ''} />
                </div>

                <div className="form-group">
                  <label className="form-label">Solicitante</label>
                  <input readOnly type="text" className="form-input" value={user?.nombre + ' (' + user?.nombre_usuario + ')'} />
                </div>

                <div className="form-group">
                  <label className="form-label">Fallas a Reportar (Taller)</label>
                  <textarea readOnly className="form-input" rows={6} style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }} value={sdmFailuresText}></textarea>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSdmConfirmModal(false)}>Cancelar</button>
                {canEditSolicitudes && (
                  <button type="submit" className="btn btn-primary">Confirmar y Enviar a Taller</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dock para ventanas de Operaciones minimizadas */}
      {minimizedModals.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}>
          {minimizedModals.map((m, idx) => (
            <div 
              key={idx}
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--color-primary)',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(236, 119, 0, 0.25)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: 'auto',
                width: '320px'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🖥️</span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {m.title}
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Ventana minimizada</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                  onClick={() => {
                    if (m.key === 'newChecklist') {
                      setShowChecklistModal(true);
                    } else if (m.key === 'editChecklist') {
                      setSelectedChecklist(m.data);
                    } else if (m.key === 'newOrder') {
                      setShowOrderModal(true);
                    } else if (m.key === 'editOrder') {
                      setSelectedOrder(m.data);
                    }
                    setMinimizedModals(prev => prev.filter((_, i) => i !== idx));
                  }}
                >
                  Abrir
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto', color: 'var(--color-danger)' }}
                  onClick={() => setMinimizedModals(prev => prev.filter((_, i) => i !== idx))}
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
