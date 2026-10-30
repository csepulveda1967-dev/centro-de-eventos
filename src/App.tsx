/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  MenuOption,
  StaffTarifas,
  ProveedorServicio,
  EstiloDecoracion,
  Mesa,
  CotizacionState,
  ReservaCalendario,
  ResumenFinanciero,
  InsumoMaestro,
  RecetaFichaTecnica,
  EmpresaCliente,
  PerfilClienteId
} from './types';
import {
  MENUS_INICIALES,
  PERSONAL_TARIFAS_INICIALES,
  PROVEEDORES_INICIALES,
  ESTILOS_DECORACION_INICIALES,
  MESAS_EJEMPLO_INICIALES,
  RESERVAS_CALENDARIO_INICIALES
} from './config/tarifas';
import { EMPRESAS_INICIALES } from './config/empresasIniciales';
import {
  INSUMOS_MAESTRO_INICIALES,
  RECETAS_INICIALES,
  calcularCostoMenuDesdeRecetas,
  calcularCostoReceta,
  migrarRecetasAGramos
} from './config/insumosYRecetas';
import {
  PERFILES_CLIENTES_CATALOGO,
  cargarDatosCliente,
  guardarDatosCliente,
  DatosPerfilCliente
} from './config/perfilesClientes';
import { Header } from './components/Header';
import { Modulo1Menu } from './components/Modulo1Menu';
import { Modulo2Personal } from './components/Modulo2Personal';
import { Modulo3Proveedores } from './components/Modulo3Proveedores';
import { Modulo4Mesas } from './components/Modulo4Mesas';
import { Modulo5Decoracion } from './components/Modulo5Decoracion';
import { Modulo6DashboardCostos } from './components/Modulo6DashboardCostos';
import { Modulo7Calendario } from './components/Modulo7Calendario';
import { CatalogoTarifasModal } from './components/CatalogoTarifasModal';
import { FichaCotizacionModal } from './components/FichaCotizacionModal';
import { MaestroInsumos } from './components/MaestroInsumos';
import { CalculadoraRecetas } from './components/CalculadoraRecetas';
import { GestionEmpresasModal } from './components/GestionEmpresasModal';
import { DemoComercialModal } from './components/DemoComercialModal';
import { BotonFlotanteWhatsApp } from './components/BotonFlotanteWhatsApp';
import { ModalRespaldoSupabase } from './components/ModalRespaldoSupabase';
import { ModuloExplosionInsumos } from './components/ModuloExplosionInsumos';
import { ModalPropuestaWhatsApp } from './components/ModalPropuestaWhatsApp';
import { PaqueteRespaldoCompleto } from './utils/respaldoDiscoDuro';
import { descargarPaqueteCompletoZip } from './utils/generadorZipCliente';
import { formatMoneda } from './utils/formatters';
import {
  Sparkles,
  Calendar,
  User,
  CheckCircle2,
  ChefHat,
  Boxes,
  HardDrive,
  Download,
  Building2,
  Users
} from 'lucide-react';

export default function App() {
  // ── Vista activa ──
  const [vistaActual, setVistaActual] = useState<'cotizador' | 'recetas' | 'insumos' | 'compras' | 'calendario' | 'tarifas'>('cotizador');

  // ── Pestaña activa dentro del formulario de cotización ──
  const [seccionActiva, setSeccionActiva] = useState<'todos' | '1' | '2' | '3' | '4' | '5'>('todos');

  // ── Gestión de Perfil de Operación / Cliente con Aislamiento en localStorage ──
  const [clienteActivoId, setClienteActivoId] = useState<PerfilClienteId>(() => {
    const saved = localStorage.getItem('hlr_perfil_cliente_activo') as PerfilClienteId;
    if (saved && (saved === 'modelo-base' || saved === 'dominga-eventos' || saved === 'damaris-eventos')) {
      return saved;
    }
    return 'dominga-eventos';
  });

  // Carga inicial de datos según el perfil activo
  const datosIniciales = useMemo(() => {
    return cargarDatosCliente(clienteActivoId);
  }, []);

  const [empresas, setEmpresas] = useState<EmpresaCliente[]>(() => {
    const saved = localStorage.getItem('hlr_empresas_clientes');
    return saved ? JSON.parse(saved) : EMPRESAS_INICIALES;
  });

  const [empresaActiva, setEmpresaActiva] = useState<EmpresaCliente>(() => datosIniciales.empresa);
  const [insumos, setInsumos] = useState<InsumoMaestro[]>(() => datosIniciales.insumos);
  const [recetas, setRecetas] = useState<RecetaFichaTecnica[]>(() => datosIniciales.recetas);
  const [menus, setMenus] = useState<MenuOption[]>(() => datosIniciales.menus);
  const [tarifasStaff, setTarifasStaff] = useState<StaffTarifas>(() => datosIniciales.tarifasStaff);
  const [proveedores, setProveedores] = useState<ProveedorServicio[]>(() => datosIniciales.proveedores);
  const [estilosDecoracion, setEstilosDecoracion] = useState<EstiloDecoracion[]>(() => datosIniciales.estilosDecoracion);
  const [reservas, setReservas] = useState<ReservaCalendario[]>(() => datosIniciales.reservas);
  const [cotizacion, setCotizacion] = useState<CotizacionState>(() => datosIniciales.cotizacion);

  // ── Modales y UI ──
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false);
  const [modalFichaOpen, setModalFichaOpen] = useState(false);
  const [modalComercialOpen, setModalComercialOpen] = useState(false);
  const [modalRespaldoOpen, setModalRespaldoOpen] = useState(false);
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // ── Modo Administrador (Oculto por defecto para Demos a Clientes) ──
  const [modoAdmin, setModoAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('solvi_flow_modo_admin') === 'true';
    } catch {
      return false;
    }
  });

  const toggleModoAdmin = () => {
    setModoAdmin(prev => {
      const next = !prev;
      try {
        localStorage.setItem('solvi_flow_modo_admin', String(next));
      } catch {}
      mostrarToast(next ? '🔓 Modo Administrador Activado (Herramientas técnicas visibles)' : '🔒 Modo Demo Activado (Herramientas de respaldo ocultas para el cliente)');
      return next;
    });
  };

  // Atajos de teclado para el dueño/administrador:
  // Ctrl + Shift + D (o Cmd + Shift + D): Abre panel de GitHub & Respaldo directamente
  // Ctrl + Shift + A (o Cmd + Shift + A): Alterna modo administrador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setModalRespaldoOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        toggleModoAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  // ── PERSISTENCIA CONTINUA CON AISLAMIENTO DE DATOS EN LOCALSTORAGE ──
  // Guarda el estado actual dinámicamente bajo propuesta_datos_${clienteActivoId}
  useEffect(() => {
    const paqueteCliente: DatosPerfilCliente = {
      cotizacion,
      insumos,
      recetas,
      menus,
      tarifasStaff,
      proveedores,
      estilosDecoracion,
      reservas,
      empresa: empresaActiva
    };
    guardarDatosCliente(clienteActivoId, paqueteCliente);
    localStorage.setItem('hlr_perfil_cliente_activo', clienteActivoId);
  }, [
    clienteActivoId,
    cotizacion,
    insumos,
    recetas,
    menus,
    tarifasStaff,
    proveedores,
    estilosDecoracion,
    reservas,
    empresaActiva
  ]);

  // Sincronizar catálogo global de empresas si cambia
  useEffect(() => {
    localStorage.setItem('hlr_empresas_clientes', JSON.stringify(empresas));
  }, [empresas]);

  // ── CAMBIO DE PERFIL / CLIENTE CON AISLAMIENTO TOTAL Y REACCIÓN INSTANTÁNEA ──
  const handleCambiarCliente = (nuevoClienteId: PerfilClienteId) => {
    if (nuevoClienteId === clienteActivoId) return;

    // 1. Guardar el estado actual del cliente saliente
    const datosActuales: DatosPerfilCliente = {
      cotizacion,
      insumos,
      recetas,
      menus,
      tarifasStaff,
      proveedores,
      estilosDecoracion,
      reservas,
      empresa: empresaActiva
    };
    guardarDatosCliente(clienteActivoId, datosActuales);

    // 2. Cargar de inmediato los datos del nuevo cliente seleccionado desde propuesta_datos_${nuevoClienteId}
    const nuevosDatos = cargarDatosCliente(nuevoClienteId);

    // 3. Actualizar el ID del cliente activo y persistir
    setClienteActivoId(nuevoClienteId);
    localStorage.setItem('hlr_perfil_cliente_activo', nuevoClienteId);

    // 4. Cargar inventario, costos, recetas en gramos, vajilla y pax del nuevo cliente
    setCotizacion(nuevosDatos.cotizacion);
    setInsumos(nuevosDatos.insumos);
    setRecetas(nuevosDatos.recetas);
    setMenus(nuevosDatos.menus);
    setTarifasStaff(nuevosDatos.tarifasStaff);
    setProveedores(nuevosDatos.proveedores);
    setEstilosDecoracion(nuevosDatos.estilosDecoracion);
    setReservas(nuevosDatos.reservas);
    setEmpresaActiva(nuevosDatos.empresa);

    const config = PERFILES_CLIENTES_CATALOGO[nuevoClienteId];
    mostrarToast(`✓ Perfil activado: ${config.nombreOpcion} (${nuevosDatos.cotizacion.invitados} Pax)`);
  };

  const handleRestaurarDatos = (datos: PaqueteRespaldoCompleto) => {
    if (datos.empresas && datos.empresas.length > 0) setEmpresas(datos.empresas);
    if (datos.insumos && datos.insumos.length > 0) setInsumos(datos.insumos);
    if (datos.recetas && datos.recetas.length > 0) setRecetas(datos.recetas);
    if (datos.menus && datos.menus.length > 0) setMenus(datos.menus);
    if (datos.tarifasStaff) setTarifasStaff(datos.tarifasStaff);
    if (datos.proveedores && datos.proveedores.length > 0) setProveedores(datos.proveedores);
    if (datos.estilosDecoracion && datos.estilosDecoracion.length > 0) setEstilosDecoracion(datos.estilosDecoracion);
    if (datos.reservas && datos.reservas.length > 0) setReservas(datos.reservas);
    if (datos.cotizacionActual) setCotizacion(datos.cotizacionActual);
    mostrarToast('✓ Respaldo restaurado e importado con éxito');
  };

  // ── CÁLCULO REACTIVO INSTANTÁNEO EN TIEMPO REAL CON useMemo ──
  const resumenFinanciero = useMemo<ResumenFinanciero>(() => {
    // 1. Costo Menú
    const menuActual = menus.find(m => m.id === cotizacion.menuId) || menus[0];
    const costoMenu = (menuActual?.costoPersona || 0) * cotizacion.invitados;

    // 2. Costo Personal
    const costoPersonal =
      cotizacion.personal.garzones * tarifasStaff.garzonJornada +
      cotizacion.personal.cocineros * tarifasStaff.cocineroJornada +
      cotizacion.personal.aseo * tarifasStaff.aseoJornada +
      cotizacion.personal.maitre * tarifasStaff.maitreJornada;

    // 3. Costo Proveedores
    const costoProveedores = proveedores.reduce((acc, p) => {
      if (!cotizacion.proveedoresSeleccionados[p.id]) return acc;
      if (p.tipoCobro === 'por_persona') {
        return acc + p.costo * cotizacion.invitados;
      }
      return acc + p.costo;
    }, 0);

    // 4. Costo Decoración
    const estiloActual = estilosDecoracion.find(e => e.id === cotizacion.decoracionId) || estilosDecoracion[0];
    const costoDecoracion = estiloActual?.costoFijo || 0;

    // Costo Total Real de Operación
    const costoTotalReal = costoMenu + costoPersonal + costoProveedores + costoDecoracion;
    const costoPorInvitado = cotizacion.invitados > 0 ? costoTotalReal / cotizacion.invitados : 0;

    // Margen y Precio Sugerido de Venta
    const margenPorcentaje = cotizacion.margenGanancia;
    const precioVentaNeto = costoTotalReal * (1 + margenPorcentaje / 100);
    const utilidadProyectada = precioVentaNeto - costoTotalReal;

    const ivaMonto = cotizacion.aplicaIva ? precioVentaNeto * 0.19 : 0;
    const precioVentaTotal = precioVentaNeto + ivaMonto;
    const precioVentaPorInvitado = cotizacion.invitados > 0 ? precioVentaTotal / cotizacion.invitados : 0;

    return {
      costoMenu,
      costoPersonal,
      costoProveedores,
      costoDecoracion,
      costoTotalReal,
      costoPorInvitado,
      margenPorcentaje,
      utilidadProyectada,
      precioVentaNeto,
      ivaMonto,
      precioVentaTotal,
      precioVentaPorInvitado
    };
  }, [cotizacion, menus, tarifasStaff, proveedores, estilosDecoracion]);

  // ── Handlers de actualización de insumos con propagación automática a menús ──
  const handleUpdateInsumo = (
    id: string,
    precioCompra: number,
    mermaPorcentaje: number,
    categoria?: string,
    nombre?: string,
    proveedor?: string
  ) => {
    const nuevosInsumos = insumos.map(i =>
      i.id === id
        ? {
            ...i,
            precioCompra,
            mermaPorcentaje,
            categoria: categoria !== undefined ? categoria : i.categoria,
            nombre: nombre !== undefined ? nombre : i.nombre,
            proveedor: proveedor !== undefined ? proveedor : i.proveedor,
            ultimoCambio: new Date().toISOString().slice(0, 10)
          }
        : i
    );
    setInsumos(nuevosInsumos);

    // Propagación automática: recalcular costos de menús que tienen recetas asociadas
    setMenus(prevMenus =>
      prevMenus.map(menu => {
        const { costoMenuCalculado, recetasEncontradas } = calcularCostoMenuDesdeRecetas(menu.id, recetas, nuevosInsumos);
        if (recetasEncontradas > 0 && costoMenuCalculado > 0) {
          return {
            ...menu,
            costoPersona: costoMenuCalculado,
            // Precio de venta sugerido con Food Cost estándar del 33%
            precioSugeridoPersona: Math.round(costoMenuCalculado / 0.33)
          };
        }
        return menu;
      })
    );
  };

  const handleAddInsumo = (nuevo: InsumoMaestro) => {
    setInsumos(prev => [nuevo, ...prev]);
    mostrarToast(`✓ Insumo "${nuevo.nombre}" agregado al maestro`);
  };

  const handleDeleteInsumo = (id: string) => {
    setInsumos(prev => prev.filter(i => i.id !== id));
    mostrarToast('✓ Insumo eliminado del maestro');
  };

  const handleRestablecerInsumos = () => {
    if (window.confirm('¿Deseas restablecer el maestro de insumos a sus valores iniciales?')) {
      localStorage.removeItem('hlr_maestro_insumos');
      setInsumos(INSUMOS_MAESTRO_INICIALES);
      mostrarToast('✓ Insumos restablecidos');
    }
  };

  // ── VINCULACIÓN AUTOMÁTICA DIRECTA A TARIFAS GENERALES (COFFEE BREAK) ──
  const handleVincularCoffeeBreak = (receta: RecetaFichaTecnica, costoPorPorcion: number, precioSugerido: number) => {
    // 1. Identificar proveedor de Coffee Break según el perfil activo
    const coffeeProv = proveedores.find(p => p.id === 'coffee-break-cocteleria' || p.categoria === 'cocteleria' || p.id.includes('coffee'));
    const provId = coffeeProv?.id || 'coffee-break-cocteleria';
    const precioVentaFinal = precioSugerido > 0 ? precioSugerido : Math.round(costoPorPorcion / 0.33);

    // 2. Inyectar directamente como Costo Actual en la tarjeta de Tarifas Generales
    setProveedores(prevProveedores =>
      prevProveedores.map(p => {
        if (p.id === provId || (p.categoria === 'cocteleria' && p.id.includes('coffee'))) {
          return {
            ...p,
            costo: costoPorPorcion,
            precioVentaSugerido: precioVentaFinal,
            recetaVinculadaId: receta.id,
            recetaVinculadaNombre: receta.nombre,
            costoCalculadoDesdeReceta: true
          };
        }
        return p;
      })
    );

    // 3. Sincronizar desglose de componentes en localStorage para evitar multiplicaciones erróneas
    try {
      const STORAGE_KEY_DESGLOSE = 'hlr_tarifas_desglose_servicios';
      const savedDesgloses = localStorage.getItem(STORAGE_KEY_DESGLOSE);
      const desglosesMap = savedDesgloses ? JSON.parse(savedDesgloses) : {};
      
      const itemsCoffee = desglosesMap[provId] || [];
      let nuevosItems: any[] = [];

      if (itemsCoffee.length > 0) {
        const sumaUnitarios = itemsCoffee.reduce((s: number, it: any) => s + ((it.multiplicadorPax || 1) * it.valorUnitario), 0);
        if (sumaUnitarios > 0 && Math.abs(sumaUnitarios - costoPorPorcion) > 0.01) {
          const factor = costoPorPorcion / sumaUnitarios;
          nuevosItems = itemsCoffee.map((it: any) => ({
            ...it,
            valorUnitario: Math.round(it.valorUnitario * factor),
            cantidad: (it.multiplicadorPax || 1) * cotizacion.invitados,
            escalaConPax: true
          }));
        } else {
          nuevosItems = itemsCoffee.map((it: any) => ({
            ...it,
            cantidad: (it.multiplicadorPax || 1) * cotizacion.invitados,
            escalaConPax: true
          }));
        }
      } else {
        nuevosItems = [
          {
            id: `cb-vinc-${receta.id}`,
            concepto: `Ficha Técnica: ${receta.nombre}`,
            cantidad: cotizacion.invitados,
            valorUnitario: costoPorPorcion,
            escalaConPax: true,
            multiplicadorPax: 1
          }
        ];
      }

      desglosesMap[provId] = nuevosItems;
      localStorage.setItem(STORAGE_KEY_DESGLOSE, JSON.stringify(desglosesMap));
      localStorage.setItem(`${STORAGE_KEY_DESGLOSE}_${clienteActivoId}`, JSON.stringify(desglosesMap));
    } catch (err) {
      console.error('Error sincronizando desglose de Coffee Break:', err);
    }

    // 4. Persistir vínculo bajo el identificador del perfil de cliente actual
    try {
      localStorage.setItem(`hlr_vinculo_coffee_break_${clienteActivoId}`, JSON.stringify({
        recetaId: receta.id,
        nombre: receta.nombre,
        costoPorcion: costoPorPorcion,
        precioSugerido: precioVentaFinal,
        clienteId: clienteActivoId,
        fechaVinculacion: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error guardando vínculo Coffee Break:', e);
    }

    mostrarToast(`✓ Coffee Break vinculado: ${formatMoneda(costoPorPorcion)}/pax inyectados en Tarifas Generales y Cotizador`);
  };

  // ── Handlers de actualización de recetas con propagación automática a menús y tarifas ──
  const handleUpdateReceta = (recetaActualizada: RecetaFichaTecnica) => {
    const nuevasRecetas = recetas.map(r => r.id === recetaActualizada.id ? recetaActualizada : r);
    setRecetas(nuevasRecetas);

    // Si es Coffee Break, propagar de inmediato el nuevo costo unitario a Tarifas Generales
    if (recetaActualizada.tiempoMenu === 'coffee-break' || recetaActualizada.servicioAsociadoId === 'coffee-break-cocteleria') {
      const { costoPorPorcion, precioSugeridoVenta } = calcularCostoReceta(recetaActualizada, insumos);
      handleVincularCoffeeBreak(recetaActualizada, costoPorPorcion, precioSugeridoVenta);
      return;
    }

    // Si tiene menú asociado, actualizar automáticamente el menú
    if (recetaActualizada.menuAsociadoId) {
      const { costoMenuCalculado } = calcularCostoMenuDesdeRecetas(recetaActualizada.menuAsociadoId, nuevasRecetas, insumos);
      if (costoMenuCalculado > 0) {
        setMenus(prevMenus =>
          prevMenus.map(m =>
            m.id === recetaActualizada.menuAsociadoId
              ? {
                  ...m,
                  costoPersona: costoMenuCalculado,
                  precioSugeridoPersona: Math.round(costoMenuCalculado / (recetaActualizada.margenSugerido / 100 || 0.33))
                }
              : m
          )
        );
      }
    }
  };

  const handleAddReceta = (nueva: RecetaFichaTecnica) => {
    setRecetas(prev => [nueva, ...prev]);
    if (nueva.tiempoMenu === 'coffee-break' || nueva.servicioAsociadoId === 'coffee-break-cocteleria') {
      const { costoPorPorcion, precioSugeridoVenta } = calcularCostoReceta(nueva, insumos);
      handleVincularCoffeeBreak(nueva, costoPorPorcion, precioSugeridoVenta);
    }
  };

  const handleDeleteReceta = (id: string) => {
    setRecetas(prev => prev.filter(r => r.id !== id));
    mostrarToast('✓ Ficha técnica eliminada');
  };

  const handleSincronizarCostosMenu = (menuId: string, nuevoCosto: number) => {
    setMenus(prevMenus =>
      prevMenus.map(m =>
        m.id === menuId
          ? {
              ...m,
              costoPersona: nuevoCosto,
              precioSugeridoPersona: Math.round(nuevoCosto / 0.33)
            }
          : m
      )
    );
  };

  // ── Handlers de actualización de cotización ──
  const handleSelectMenu = (id: string) => {
    setCotizacion(prev => ({ ...prev, menuId: id }));
  };

  const handleChangeInvitados = (inv: number) => {
    setCotizacion(prev => ({ ...prev, invitados: inv }));
  };

  const handleChangePersonal = (nuevoPersonal: CotizacionState['personal']) => {
    setCotizacion(prev => ({ ...prev, personal: nuevoPersonal }));
  };

  const handleToggleProveedor = (id: string) => {
    setCotizacion(prev => ({
      ...prev,
      proveedoresSeleccionados: {
        ...prev.proveedoresSeleccionados,
        [id]: !prev.proveedoresSeleccionados[id]
      }
    }));
  };

  const handleChangeMesas = (nuevasMesas: Mesa[]) => {
    setCotizacion(prev => ({ ...prev, mesas: nuevasMesas }));
  };

  const handleSelectDecoracion = (id: string) => {
    setCotizacion(prev => ({ ...prev, decoracionId: id }));
  };

  const handleChangeMargen = (margen: number) => {
    setCotizacion(prev => ({ ...prev, margenGanancia: margen }));
  };

  const handleToggleIva = (aplica: boolean) => {
    setCotizacion(prev => ({ ...prev, aplicaIva: aplica }));
  };

  const handleChangeAnticipo = (porcentaje: number) => {
    setCotizacion(prev => ({ ...prev, porcentajeAnticipo: porcentaje }));
  };

  const handleChangeEsquemaPago = (esquema: 'dos_pagos' | 'tres_pagos' | 'corporativo') => {
    setCotizacion(prev => ({ ...prev, esquemaPago: esquema }));
  };

  const handleChangeDiasSaldo = (dias: number) => {
    setCotizacion(prev => ({ ...prev, diasSaldo: dias }));
  };

  // ── Guardar en Calendario ──
  const handleGuardarEnCalendario = () => {
    const fecha = cotizacion.fechaEvento || '2026-11-28';
    const nuevaReserva: ReservaCalendario = {
      id: 'res-' + Date.now(),
      titulo: cotizacion.nombreEvento || `Evento ${cotizacion.cliente}`,
      cliente: cotizacion.cliente || 'Cliente Particular',
      tipoEvento: cotizacion.tipoEvento,
      fecha,
      invitados: cotizacion.invitados,
      estado: 'cotizado',
      montoTotal: Math.round(resumenFinanciero.precioVentaTotal),
      cotizacionSnapshot: { ...cotizacion }
    };

    setReservas(prev => [nuevaReserva, ...prev]);
    mostrarToast(`✓ Cotización agendada con éxito para el ${fecha}`);
  };

  const handleCrearReservaDesdeActual = (fecha: string, estado: 'confirmado' | 'cotizado' | 'bloqueado') => {
    const nuevaReserva: ReservaCalendario = {
      id: 'res-' + Date.now(),
      titulo: cotizacion.nombreEvento || `Evento ${cotizacion.cliente}`,
      cliente: cotizacion.cliente || 'Cliente Particular',
      tipoEvento: cotizacion.tipoEvento,
      fecha,
      invitados: cotizacion.invitados,
      estado,
      montoTotal: Math.round(resumenFinanciero.precioVentaTotal),
      cotizacionSnapshot: { ...cotizacion, fechaEvento: fecha }
    };

    setReservas(prev => [nuevaReserva, ...prev]);
    setCotizacion(prev => ({ ...prev, fechaEvento: fecha }));
    mostrarToast(`✓ Evento agendado en el calendario para el ${fecha}`);
  };

  // ── Cargar Cotización desde Calendario ──
  const handleCargarCotizacion = (snapshot: CotizacionState) => {
    setCotizacion({ ...snapshot });
    setVistaActual('cotizador');
    mostrarToast(`✓ Cotización cargada: "${snapshot.nombreEvento}" (${snapshot.invitados} invitados)`);
  };

  // ── Iniciar Nueva Cotización Limpia para el Cliente Actual ──
  const handleNuevaCotizacion = () => {
    const config = PERFILES_CLIENTES_CATALOGO[clienteActivoId];
    if (window.confirm(`¿Deseas iniciar una nueva cotización limpia para ${config.nombreOpcion}?`)) {
      const def = config.crearDatosIniciales();
      setCotizacion({
        ...def.cotizacion,
        nombreEvento: `Nueva Cotización ${config.nombreOpcion}`,
        cliente: '',
        emailCliente: '',
        telefonoCliente: '',
        fechaEvento: new Date().toISOString().slice(0, 10),
        observaciones: ''
      });
      mostrarToast(`✓ Nueva cotización iniciada para ${config.nombreOpcion}`);
    }
  };

  // ── Handlers de actualización de tarifas desde Catálogo General ──
  const handleUpdateMenuCost = (menuId: string, nuevoCosto: number, nuevoPrecioSugerido: number) => {
    setMenus(prev =>
      prev.map(m =>
        m.id === menuId
          ? { ...m, costoPersona: nuevoCosto, precioSugeridoPersona: nuevoPrecioSugerido }
          : m
      )
    );
  };

  const handleUpdateStaffTarifas = (nuevasTarifas: StaffTarifas) => {
    setTarifasStaff(nuevasTarifas);
  };

  const handleUpdateProveedorCost = (proveedorId: string, nuevoCosto: number, nuevoPrecioVenta: number) => {
    setProveedores(prev =>
      prev.map(p =>
        p.id === proveedorId
          ? { ...p, costo: nuevoCosto, precioVentaSugerido: nuevoPrecioVenta }
          : p
      )
    );
  };

  const handleUpdateDecoracionCost = (estiloId: string, nuevoCosto: number, nuevoPrecioVenta: number) => {
    setEstilosDecoracion(prev =>
      prev.map(e =>
        e.id === estiloId
          ? { ...e, costoFijo: nuevoCosto, precioVentaSugerido: nuevoPrecioVenta }
          : e
      )
    );
  };

  const handleRestablecerDefecto = () => {
    const config = PERFILES_CLIENTES_CATALOGO[clienteActivoId];
    if (window.confirm(`¿Deseas restablecer los valores del perfil "${config.nombreOpcion}" a sus valores de fábrica?`)) {
      const def = config.crearDatosIniciales();
      setMenus(def.menus);
      setTarifasStaff(def.tarifasStaff);
      setProveedores(def.proveedores);
      setEstilosDecoracion(def.estilosDecoracion);
      setInsumos(def.insumos);
      setRecetas(def.recetas);
      setCotizacion(def.cotizacion);
      setEmpresaActiva(def.empresa);
      guardarDatosCliente(clienteActivoId, def);
      mostrarToast(`✓ Precios y recetas restablecidos para ${config.nombreOpcion}`);
    }
  };

  const menuActual = menus.find(m => m.id === cotizacion.menuId) || menus[0];
  const estiloActual = estilosDecoracion.find(e => e.id === cotizacion.decoracionId) || estilosDecoracion[0];
  const perfilActualConfig = PERFILES_CLIENTES_CATALOGO[clienteActivoId] || PERFILES_CLIENTES_CATALOGO['dominga-eventos'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Notificación */}
      {toastMensaje && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Header Principal con navegación de vistas y selector de cliente */}
      <Header
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        invitados={cotizacion.invitados}
        precioSugeridoVenta={resumenFinanciero.precioVentaTotal}
        empresaActiva={empresaActiva}
        clienteActivoId={clienteActivoId}
        onCambiarCliente={handleCambiarCliente}
        onAbrirFicha={() => setModalFichaOpen(true)}
        onNuevaCotizacion={handleNuevaCotizacion}
        onAbrirGestionEmpresas={() => setModalEmpresasOpen(true)}
        onAbrirComercial={() => setModalComercialOpen(true)}
        onAbrirRespaldo={() => setModalRespaldoOpen(true)}
        onAbrirWhatsAppPropuesta={() => setModalWhatsAppOpen(true)}
        modoAdmin={modoAdmin}
        onToggleModoAdmin={toggleModoAdmin}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA 1: COTIZADOR DINÁMICO & DASHBOARD FINANCIERO
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'cotizador' && (
          <div className="space-y-6">

            {/* ── Banner Informativo del Perfil Activo, Infraestructura y Tarifa Base ── */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-500/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-sans shadow-xs">
                      {perfilActualConfig.nombreOpcion}
                    </span>
                    <span className="text-xs font-semibold text-indigo-200">
                      {perfilActualConfig.detalleOpcion}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aislamiento en localStorage: <code className="text-emerald-300 font-mono text-[10px]">propuesta_datos_{clienteActivoId}</code>
                    </span>
                  </div>

                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>{empresaActiva.tituloCabecera || perfilActualConfig.tituloCabecera}</span>
                  </h1>

                  <div className="flex items-start gap-2 text-xs text-slate-300 pt-0.5 max-w-3xl">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-white font-semibold">Infraestructura: </strong>
                      {empresaActiva.infraestructura || perfilActualConfig.infraestructura}
                    </p>
                  </div>
                </div>

                {/* Resumen Clave del Perfil: Tarifa Base / Arriendo + Pax */}
                <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 shrink-0">
                  {clienteActivoId === 'damaris-eventos' && (
                    <div className="text-left border-r border-white/10 pr-3">
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                        Tarifa Base Arriendo Locación
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        $1.500.000
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-medium">
                        ✓ Salón & 10.000 m² parque
                      </span>
                    </div>
                  )}

                  {clienteActivoId === 'dominga-eventos' && (
                    <div className="text-left border-r border-white/10 pr-3">
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                        Servicios Dominga
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        8 Activos
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-medium">
                        ✓ Vajilla $390.000 · Coffee Break · Gramos
                      </span>
                    </div>
                  )}

                  {clienteActivoId === 'modelo-base' && (
                    <div className="text-left border-r border-white/10 pr-3">
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                        Modelo Estándar
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        Config Base
                      </span>
                      <span className="text-[10px] text-indigo-300 block font-medium">
                        Predeterminado SOLVI Flow
                      </span>
                    </div>
                  )}

                  <div className="text-left">
                    <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
                      Pax Asignado (Sincronizado)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span className="text-lg font-black text-amber-300 tabular-nums">
                        {cotizacion.invitados}
                      </span>
                      <span className="text-xs text-slate-300">comensales</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Tablas reactivas en tiempo real
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner de Datos Generales del Evento */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                      Ficha de Trabajo
                    </span>
                    <input
                      type="text"
                      value={cotizacion.nombreEvento}
                      onChange={(e) => setCotizacion(prev => ({ ...prev, nombreEvento: e.target.value }))}
                      placeholder="Nombre del Evento (ej. Boda González & Pérez)"
                      className="text-base sm:text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-hidden bg-transparent w-full md:w-80"
                    />
                  </div>
                </div>

                {/* Campos rápidos de Cliente y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={cotizacion.cliente}
                      onChange={(e) => setCotizacion(prev => ({ ...prev, cliente: e.target.value }))}
                      placeholder="Nombre Cliente"
                      className="bg-transparent focus:outline-hidden text-slate-800 font-medium w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={cotizacion.fechaEvento}
                      onChange={(e) => setCotizacion(prev => ({ ...prev, fechaEvento: e.target.value }))}
                      className="bg-transparent focus:outline-hidden text-slate-800 font-medium w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-400 font-semibold">Tipo:</span>
                    <select
                      value={cotizacion.tipoEvento}
                      onChange={(e) => setCotizacion(prev => ({ ...prev, tipoEvento: e.target.value as CotizacionState['tipoEvento'] }))}
                      className="bg-transparent focus:outline-hidden text-slate-800 font-medium w-full"
                    >
                      <option value="Boda">Boda</option>
                      <option value="Corporativo">Corporativo</option>
                      <option value="Graduación">Graduación</option>
                      <option value="Cumpleaños / Aniversario">Cumpleaños / Aniversario</option>
                      <option value="Fiesta Fin de Año">Fiesta Fin de Año</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Secciones Rápidas / Filtro de Módulos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              <span className="text-slate-400 mr-1 hidden sm:inline">Ir al Módulo:</span>
              <button
                type="button"
                onClick={() => setSeccionActiva('todos')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Ver Todo el Formulario
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('1')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '1'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                01. Menú & Comensales
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('2')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                02. Personal & Brigada
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('3')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '3'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                03. Proveedores
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('4')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                04. Mesas & Distribución
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('5')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '5'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                05. Decoración
              </button>
            </div>

            {/* Split Principal: Formularios a la izquierda (col-span-2) + Dashboard a la derecha (col-span-1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: Módulos 1 al 5 */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Módulo 1: Menú & Invitados */}
                {(seccionActiva === 'todos' || seccionActiva === '1') && (
                  <Modulo1Menu
                    menus={menus}
                    menuSeleccionadoId={cotizacion.menuId}
                    onSelectMenu={handleSelectMenu}
                    invitados={cotizacion.invitados}
                    onChangeInvitados={handleChangeInvitados}
                    onIrARecetas={() => setVistaActual('recetas')}
                  />
                )}

                {/* Módulo 2: Personal */}
                {(seccionActiva === 'todos' || seccionActiva === '2') && (
                  <Modulo2Personal
                    tarifas={tarifasStaff}
                    personal={cotizacion.personal}
                    onChangePersonal={handleChangePersonal}
                    invitados={cotizacion.invitados}
                  />
                )}

                {/* Módulo 3: Proveedores */}
                {(seccionActiva === 'todos' || seccionActiva === '3') && (
                  <Modulo3Proveedores
                    proveedores={proveedores}
                    proveedoresSeleccionados={cotizacion.proveedoresSeleccionados}
                    onToggleProveedor={handleToggleProveedor}
                    invitados={cotizacion.invitados}
                  />
                )}

                {/* Módulo 4: Mesas (con la alerta visual de distribución) */}
                {(seccionActiva === 'todos' || seccionActiva === '4') && (
                  <Modulo4Mesas
                    mesas={cotizacion.mesas}
                    onChangeMesas={handleChangeMesas}
                    invitadosTotales={cotizacion.invitados}
                  />
                )}

                {/* Módulo 5: Decoración */}
                {(seccionActiva === 'todos' || seccionActiva === '5') && (
                  <Modulo5Decoracion
                    estilos={estilosDecoracion}
                    decoracionSeleccionadaId={cotizacion.decoracionId}
                    onSelectDecoracion={handleSelectDecoracion}
                  />
                )}

              </div>

              {/* COLUMNA DERECHA: Módulo 6 (Dashboard de Costos Reales en Vivo) */}
              <div className="lg:col-span-1">
                <Modulo6DashboardCostos
                  resumen={resumenFinanciero}
                  invitados={cotizacion.invitados}
                  margenGanancia={cotizacion.margenGanancia}
                  onChangeMargen={handleChangeMargen}
                  aplicaIva={cotizacion.aplicaIva}
                  onToggleIva={handleToggleIva}
                  onGuardarEnCalendario={handleGuardarEnCalendario}
                  onAbrirFichaCliente={() => setModalFichaOpen(true)}
                  onAbrirWhatsAppPropuesta={() => setModalWhatsAppOpen(true)}
                  porcentajeAnticipo={cotizacion.porcentajeAnticipo ?? 40}
                  onChangeAnticipo={handleChangeAnticipo}
                  esquemaPago={cotizacion.esquemaPago ?? 'dos_pagos'}
                  onChangeEsquemaPago={handleChangeEsquemaPago}
                  diasSaldo={cotizacion.diasSaldo ?? 7}
                  onChangeDiasSaldo={handleChangeDiasSaldo}
                />
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA 2: CALCULADORA DE RECETAS & COSTEO DE PLATOS (CON EL MARGEN 33%)
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'recetas' && (
          <CalculadoraRecetas
            recetas={recetas}
            insumos={insumos}
            menus={menus}
            onUpdateReceta={handleUpdateReceta}
            onAddReceta={handleAddReceta}
            onDeleteReceta={handleDeleteReceta}
            onSincronizarCostosMenu={handleSincronizarCostosMenu}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA 3: MAESTRO DE INSUMOS & VALORES REALES DE COMPRA
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'insumos' && (
          <MaestroInsumos
            insumos={insumos}
            onUpdateInsumo={handleUpdateInsumo}
            onAddInsumo={handleAddInsumo}
            onDeleteInsumo={handleDeleteInsumo}
            onRestablecerInsumos={handleRestablecerInsumos}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA: RESUMEN DE INSUMOS & COMPRAS DE COCINA (MÓDULO COMPRAS)
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'compras' && (
          <ModuloExplosionInsumos
            cotizacion={cotizacion}
            menus={menus}
            recetas={recetas}
            insumos={insumos}
            empresaActiva={empresaActiva}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA 4: CALENDARIO DE PLANIFICACIÓN (Módulo 7)
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'calendario' && (
          <Modulo7Calendario
            reservas={reservas}
            onCargarCotizacion={handleCargarCotizacion}
            onCrearReservaDesdeActual={handleCrearReservaDesdeActual}
            cotizacionActual={cotizacion}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA 5: CATÁLOGO DE TARIFAS GENERALES
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'tarifas' && (
          <CatalogoTarifasModal
            menus={menus}
            tarifasStaff={tarifasStaff}
            proveedores={proveedores}
            estilosDecoracion={estilosDecoracion}
            invitados={cotizacion.invitados}
            onChangeInvitados={handleChangeInvitados}
            onUpdateMenuCost={handleUpdateMenuCost}
            onUpdateStaffTarifas={handleUpdateStaffTarifas}
            onUpdateProveedorCost={handleUpdateProveedorCost}
            onUpdateDecoracionCost={handleUpdateDecoracionCost}
            onRestablecerDefecto={handleRestablecerDefecto}
          />
        )}

      </main>

      {/* Modal de Ficha Formal para el Cliente */}
      {modalFichaOpen && (
        <FichaCotizacionModal
          cotizacion={cotizacion}
          menu={menuActual}
          proveedores={proveedores}
          estiloDecoracion={estiloActual}
          tarifasStaff={tarifasStaff}
          precioVentaNeto={resumenFinanciero.precioVentaNeto}
          ivaMonto={resumenFinanciero.ivaMonto}
          precioVentaTotal={resumenFinanciero.precioVentaTotal}
          empresaActiva={empresaActiva}
          onClose={() => setModalFichaOpen(false)}
          onAbrirWhatsAppPropuesta={() => {
            setModalFichaOpen(false);
            setModalWhatsAppOpen(true);
          }}
          modoAdmin={modoAdmin}
        />
      )}

      {/* Modal de Propuesta Formal en 1 Clic para WhatsApp */}
      {modalWhatsAppOpen && (
        <ModalPropuestaWhatsApp
          cotizacion={cotizacion}
          menu={menuActual}
          proveedores={proveedores}
          estiloDecoracion={estiloActual}
          precioVentaNeto={resumenFinanciero.precioVentaNeto}
          ivaMonto={resumenFinanciero.ivaMonto}
          precioVentaTotal={resumenFinanciero.precioVentaTotal}
          empresaActiva={empresaActiva}
          onClose={() => setModalWhatsAppOpen(false)}
        />
      )}

      {/* Modal de Gestión Multi-Empresa & Base de Datos */}
      {modalEmpresasOpen && (
        <GestionEmpresasModal
          empresas={empresas}
          empresaActivaId={empresaActiva.id}
          onSelectEmpresa={(id) => {
            const emp = empresas.find(e => e.id === id);
            if (emp) {
              setEmpresaActiva(emp);
              if (id === 'emp-dominga') handleCambiarCliente('dominga-eventos');
              else if (id === 'emp-damaris') handleCambiarCliente('damaris-eventos');
              else if (id === 'emp-solvi') handleCambiarCliente('modelo-base');
              mostrarToast(`✓ Cambiado a ${emp.nombre} (${emp.recintoPrincipal})`);
            }
          }}
          onAddEmpresa={(nueva) => {
            setEmpresas(prev => [...prev, nueva]);
            mostrarToast(`✓ Nuevo centro de eventos "${nueva.nombre}" registrado`);
          }}
          onClose={() => setModalEmpresasOpen(false)}
          modoAdmin={modoAdmin}
          onToggleModoAdmin={toggleModoAdmin}
          onAbrirRespaldo={() => setModalRespaldoOpen(true)}
        />
      )}

      {/* Modal de Demo Comercial Publicitario con Voz */}
      {modalComercialOpen && (
        <DemoComercialModal
          isOpen={modalComercialOpen}
          onClose={() => setModalComercialOpen(false)}
          empresa={empresaActiva}
          onIrAFuncion={(vista) => {
            setVistaActual(vista);
            setModalComercialOpen(false);
          }}
        />
      )}

      {/* Modal de Respaldo en Disco Duro y Supabase */}
      {modalRespaldoOpen && (
        <ModalRespaldoSupabase
          isOpen={modalRespaldoOpen}
          onClose={() => setModalRespaldoOpen(false)}
          empresa={empresaActiva}
          empresas={empresas}
          insumos={insumos}
          recetas={recetas}
          menus={menus}
          tarifasStaff={tarifasStaff}
          proveedores={proveedores}
          estilosDecoracion={estilosDecoracion}
          reservas={reservas}
          cotizacionActual={cotizacion}
          onRestaurarDatos={handleRestaurarDatos}
          onNotificar={mostrarToast}
        />
      )}

      {/* Footer Oficial SOLVI Flow & CS Consultoría */}
      <footer className="no-print mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">SOLVI Flow</span>
          <span className="text-slate-300">·</span>
          <span className="text-indigo-700 font-semibold italic">«Todo fluye. Todo conecta»</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Software de gestión integral de centros de eventos y productoras · Desarrollado por <strong className="text-slate-800">CS Consultoría</strong>
        </p>
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span>Empresa: {empresaActiva.nombre}</span>
          <span>·</span>
          <button
            type="button"
            onClick={toggleModoAdmin}
            className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600"
            title={modoAdmin ? "Modo Administrador Activo. Clic para volver a Modo Demo para Clientes" : "Hacer clic para activar Modo Administrador"}
          >
            {modoAdmin ? '🔓 Admin Activo (Clic para Modo Demo)' : '🔒 Cambiar a Modo Administrador'}
          </button>
        </div>
      </footer>

      {/* Botón Flotante Permanente de WhatsApp con Demo */}
      <BotonFlotanteWhatsApp empresa={empresaActiva} />

    </div>
  );
}
