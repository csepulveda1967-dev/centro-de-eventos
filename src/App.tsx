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
  PerfilClienteId,
  ItemGastoFijo,
  RegistroCostoFijoMensual
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
import { ModuloCocteleria } from './components/ModuloCocteleria';
import { Modulo3Proveedores } from './components/Modulo3Proveedores';
import { Modulo4Mesas } from './components/Modulo4Mesas';
import { Modulo5Decoracion } from './components/Modulo5Decoracion';
import { Modulo6DashboardCostos } from './components/Modulo6DashboardCostos';
import { ResumenPropuestaComercial } from './components/ResumenPropuestaComercial';
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
import { ModalFormularioEmpresaContacto } from './components/ModalFormularioEmpresaContacto';
import {
  guardarInsumoEnSupabase,
  eliminarInsumoEnSupabase,
  cargarInsumosDesdeSupabase,
  isSupabaseConfigured
} from './lib/supabase';
import { PaqueteRespaldoCompleto, descargarRespaldoJSON, descargarRespaldoSQL } from './utils/respaldoDiscoDuro';
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
  Users,
  Save,
  FilePlus,
  Wine,
  Database,
  FileCode2
} from 'lucide-react';

export default function App() {
  // ── Vista activa ──
  const [vistaActual, setVistaActual] = useState<'cotizador' | 'adm-costos' | 'recetas' | 'cocteleria' | 'insumos' | 'compras' | 'calendario' | 'tarifas'>('cotizador');

  // ── Pestaña activa dentro del formulario de cotización ──
  const [seccionActiva, setSeccionActiva] = useState<'todos' | '1' | '2' | '3' | '4' | '5'>('todos');

  // ── Gestión de Perfil de Operación / Cliente con Aislamiento en localStorage ──
  const [clienteActivoId, setClienteActivoId] = useState<PerfilClienteId>(() => {
    const saved = localStorage.getItem('hlr_perfil_cliente_activo') as PerfilClienteId;
    if (saved && (saved === 'modelo-base' || saved === 'dominga-eventos' || saved === 'damaris-eventos')) {
      return saved;
    }
    return 'modelo-base'; // Doña Isidora Eventos como predeterminado de operación
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
  const [proveedores, setProveedores] = useState<ProveedorServicio[]>(() => 
    datosIniciales.proveedores.filter(p => p.id !== 'arriendo-locacion-damaris' && !p.id.includes('gasto-fijo'))
  );
  const [estilosDecoracion, setEstilosDecoracion] = useState<EstiloDecoracion[]>(() => datosIniciales.estilosDecoracion);
  const [reservas, setReservas] = useState<ReservaCalendario[]>(() => datosIniciales.reservas);

  // Tipos de evento personalizados creados por el usuario (ej: "Fiesta de 15 Años", "Cena de Cumpleaños")
  const [tiposEventoPersonalizados, setTiposEventoPersonalizados] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hlr_tipos_evento_personalizados') || '[]');
    } catch {
      return [];
    }
  });
  const [cotizacion, setCotizacion] = useState<CotizacionState>(() => {
    const cot = { ...datosIniciales.cotizacion };
    if (cot.proveedoresSeleccionados) {
      delete cot.proveedoresSeleccionados['arriendo-locacion-damaris'];
    }
    return cot;
  });

  // ── Modales y UI ──
  const [modalEmpresasOpen, setModalEmpresasOpen] = useState(false);
  const [modalFormularioEmpresaOpen, setModalFormularioEmpresaOpen] = useState(false);
  const [modalFichaOpen, setModalFichaOpen] = useState(false);
  const [modalComercialOpen, setModalComercialOpen] = useState(false);
  const [modalRespaldoOpen, setModalRespaldoOpen] = useState(false);
  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const handleGuardarEmpresaContacto = (empresaActualizada: EmpresaCliente, crearComoNueva?: boolean) => {
    if (crearComoNueva) {
      setEmpresas(prev => [...prev, empresaActualizada]);
      setEmpresaActiva(empresaActualizada);
      mostrarToast(`✓ Nueva empresa "${empresaActualizada.nombre}" creada y activada`);
    } else {
      setEmpresaActiva(empresaActualizada);
      setEmpresas(prev => {
        const existe = prev.some(e => e.id === empresaActualizada.id);
        if (existe) {
          return prev.map(e => e.id === empresaActualizada.id ? empresaActualizada : e);
        }
        return [...prev, empresaActualizada];
      });
      mostrarToast(`✓ Ficha de "${empresaActualizada.nombre}" guardada y actualizada`);
    }

    // Persistir en el perfil de cliente activo
    try {
      const datosActuales: DatosPerfilCliente = {
        cotizacion,
        insumos,
        recetas,
        menus,
        tarifasStaff,
        proveedores,
        estilosDecoracion,
        reservas,
        empresa: empresaActualizada
      };
      guardarDatosCliente(clienteActivoId, datosActuales);
      localStorage.setItem('hlr_empresas_clientes', JSON.stringify(empresas));
    } catch (e) {
      console.error('Error guardando empresa en localStorage:', e);
    }
  };

  // ── Modo Administrador (Libre por defecto para Respaldos y Gestión) ──
  const [modoAdmin, setModoAdmin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('solvi_flow_modo_admin');
      if (saved !== null) return saved === 'true';
      return true; // Libre y desbloqueado por defecto para respaldo
    } catch {
      return true;
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

  // Sincronización automática de insumos con Supabase si está conectado
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    cargarInsumosDesdeSupabase(empresaActiva.id).then(resultado => {
      if (resultado.ok && resultado.insumos && resultado.insumos.length > 0) {
        const insumosRemotos = resultado.insumos;
        setInsumos(prev => {
          const mapa = new Map<string, InsumoMaestro>();
          prev.forEach(i => mapa.set(i.id, i));
          insumosRemotos.forEach(i => mapa.set(i.id, i));
          const combinados = Array.from(mapa.values());
          try {
            localStorage.setItem('hlr_maestro_insumos', JSON.stringify(combinados));
          } catch {}
          return combinados;
        });
      }
    });
  }, [empresaActiva.id]);

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
    setProveedores(nuevosDatos.proveedores.filter(p => p.id !== 'arriendo-locacion-damaris' && !p.id.includes('gasto-fijo')));
    setEstilosDecoracion(nuevosDatos.estilosDecoracion);
    setReservas(nuevosDatos.reservas);
    setEmpresaActiva(nuevosDatos.empresa);
    setEmpresas(prev => {
      const exists = prev.some(e => e.id === nuevosDatos.empresa.id);
      if (exists) {
        return prev.map(e => e.id === nuevosDatos.empresa.id ? nuevosDatos.empresa : e);
      }
      return [nuevosDatos.empresa, ...prev];
    });

    const config = PERFILES_CLIENTES_CATALOGO[nuevoClienteId];
    mostrarToast(`✓ Perfil activado: ${config.nombreOpcion} (${nuevosDatos.cotizacion.invitados} Pax)`);
  };

  const handleRestaurarDatos = (datos: PaqueteRespaldoCompleto) => {
    if (datos.empresas && datos.empresas.length > 0) setEmpresas(datos.empresas);
    if (datos.insumos && datos.insumos.length > 0) setInsumos(datos.insumos);
    if (datos.recetas && datos.recetas.length > 0) setRecetas(datos.recetas);
    if (datos.menus && datos.menus.length > 0) setMenus(datos.menus);
    if (datos.tarifasStaff) setTarifasStaff(datos.tarifasStaff);
    if (datos.proveedores && datos.proveedores.length > 0) {
      setProveedores(datos.proveedores.filter(p => p.id !== 'arriendo-locacion-damaris' && !p.id.includes('gasto-fijo')));
    }
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

    // 1.5 Costo Bebestibles y Barra por Persona
    const costoBebestibles = (cotizacion.bebestibles || []).reduce((acc, it) => {
      if (it.incluido === false) return acc;
      const cant = Number(it.cantidadPorPersona) || 0;
      const unit = Number(it.costoUnitario) || 0;
      return acc + (cant * unit * cotizacion.invitados);
    }, 0);

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

    // 4. Costo Decoración (opción libre de no incluir ambientación $0)
    const noIncluyeDecoracion = cotizacion.decoracionId === 'sin-decoracion' || !cotizacion.decoracionId;
    const estiloActual = noIncluyeDecoracion ? undefined : (estilosDecoracion.find(e => e.id === cotizacion.decoracionId) || estilosDecoracion[0]);
    const costoDecoracion = noIncluyeDecoracion ? 0 : (estiloActual?.costoFijo || 0);

    // 5. Costos Fijos Operacionales Prorrateados para Emprendedores
    const gastoLuzMensual = Math.max(0, Number(cotizacion.gastoLuzMensual) || 0);
    const gastoGasMensual = Math.max(0, Number(cotizacion.gastoGasMensual) || 0);
    const otrosGastosFijos = Array.isArray(cotizacion.otrosGastosFijos) ? cotizacion.otrosGastosFijos : [];
    const sumaOtros = otrosGastosFijos.reduce((s, it) => s + (Math.max(0, Number(it.monto)) || 0), 0);

    const gastosFijosMensuales = (gastoLuzMensual > 0 || gastoGasMensual > 0 || sumaOtros > 0)
      ? (gastoLuzMensual + gastoGasMensual + sumaOtros)
      : Math.max(0, Number(cotizacion.gastosFijosMensuales) || 0);

    const eventosAlMes = Math.max(0, Number(cotizacion.eventosAlMes) || 0);
    const costosFijosEvento = eventosAlMes > 0 && gastosFijosMensuales > 0 
      ? Math.round(gastosFijosMensuales / eventosAlMes) 
      : 0;

    // Costo fijo por persona / comensal (p.p.) para costear productos
    const costoFijoPorPersona = cotizacion.invitados > 0
      ? Math.round(costosFijosEvento / cotizacion.invitados)
      : 0;

    // Costo Variables Total y Costo Total Real de Operación (Tu Gasto Base)
    const costoVariablesTotal = costoMenu + costoBebestibles + costoPersonal + costoProveedores + costoDecoracion;
    const costoTotalReal = costoVariablesTotal + costosFijosEvento;
    const costoPorInvitado = cotizacion.invitados > 0 ? costoTotalReal / cotizacion.invitados : 0;

    // Sugerencia referencial de la plataforma
    const margenPorcentaje = cotizacion.margenGanancia;
    const precioVentaNeto = Math.round(costoTotalReal * (1 + margenPorcentaje / 100));
    const utilidadProyectada = precioVentaNeto - costoTotalReal;

    const ivaMonto = cotizacion.aplicaIva ? Math.round(precioVentaNeto * 0.19) : 0;
    const precioVentaTotal = precioVentaNeto + ivaMonto;
    const precioVentaPorInvitado = cotizacion.invitados > 0 ? Math.round(precioVentaTotal / cotizacion.invitados) : 0;

    // Criterio libre del emprendedor (sugerido vs precio libre)
    const usarPrecioManual = !!cotizacion.usarPrecioManual;
    const precioVentaManual = Math.max(0, Number(cotizacion.precioVentaManual) || 0);

    const precioCobradoFinal = (usarPrecioManual && precioVentaManual > 0)
      ? precioVentaManual
      : (cotizacion.aplicaIva ? precioVentaTotal : precioVentaNeto);

    // Margen y utilidad real obtenida según lo que el emprendedor decida cobrar
    const precioNetoCobrado = cotizacion.aplicaIva ? Math.round(precioCobradoFinal / 1.19) : precioCobradoFinal;
    const utilidadRealObtenida = precioNetoCobrado - costoTotalReal;
    const margenRealObtenido = costoTotalReal > 0
      ? Math.round(((precioNetoCobrado - costoTotalReal) / costoTotalReal) * 100 * 10) / 10
      : 0;

    return {
      costoMenu,
      costoBebestibles,
      costoPersonal,
      costoProveedores,
      costoDecoracion,
      costosFijosEvento,
      costoFijoPorPersona,
      gastosFijosMensuales,
      gastoLuzMensual,
      gastoGasMensual,
      otrosGastosFijos,
      eventosAlMes,
      costoVariablesTotal,
      costoTotalReal,
      costoPorInvitado,
      margenPorcentaje,
      utilidadProyectada,
      precioVentaNeto,
      ivaMonto,
      precioVentaTotal,
      precioVentaPorInvitado,
      usarPrecioManual,
      precioVentaManual,
      precioCobradoFinal,
      margenRealObtenido,
      utilidadRealObtenida
    };
  }, [cotizacion, menus, tarifasStaff, proveedores, estilosDecoracion]);

  // ── Handlers de actualización de insumos con propagación automática a menús y Base de Datos ──
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
    try {
      localStorage.setItem('hlr_maestro_insumos', JSON.stringify(nuevosInsumos));
    } catch (e) {
      console.error('Error guardando insumos en localStorage:', e);
    }

    const insumoModificado = nuevosInsumos.find(i => i.id === id);
    if (insumoModificado && isSupabaseConfigured()) {
      guardarInsumoEnSupabase(insumoModificado, empresaActiva.id);
    }

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

  const handleAddInsumo = async (nuevo: InsumoMaestro) => {
    const actualizados = [nuevo, ...insumos];
    setInsumos(actualizados);
    try {
      localStorage.setItem('hlr_maestro_insumos', JSON.stringify(actualizados));
    } catch (e) {
      console.error('Error guardando insumo en localStorage:', e);
    }

    if (isSupabaseConfigured()) {
      const guardado = await guardarInsumoEnSupabase(nuevo, empresaActiva.id);
      if (guardado) {
        mostrarToast(`✓ Insumo "${nuevo.nombre}" guardado en BD Supabase`);
      } else {
        mostrarToast(`✓ Insumo "${nuevo.nombre}" guardado localmente`);
      }
    } else {
      mostrarToast(`✓ Insumo "${nuevo.nombre}" agregado al maestro`);
    }
  };

  const handleDeleteInsumo = async (id: string) => {
    const actualizados = insumos.filter(i => i.id !== id);
    setInsumos(actualizados);
    try {
      localStorage.setItem('hlr_maestro_insumos', JSON.stringify(actualizados));
    } catch (e) {}

    if (isSupabaseConfigured()) {
      await eliminarInsumoEnSupabase(id);
    }
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
    const recetaAnterior = recetas.find(r => r.id === recetaActualizada.id);
    const nuevasRecetas = recetas.map(r => r.id === recetaActualizada.id ? recetaActualizada : r);
    setRecetas(nuevasRecetas);

    // Si es Coffee Break, propagar de inmediato el nuevo costo unitario a Tarifas Generales
    if (recetaActualizada.tiempoMenu === 'coffee-break' || recetaActualizada.servicioAsociadoId === 'coffee-break-cocteleria') {
      const { costoPorPorcion, precioSugeridoVenta } = calcularCostoReceta(recetaActualizada, insumos);
      handleVincularCoffeeBreak(recetaActualizada, costoPorPorcion, precioSugeridoVenta);
      return;
    }

    // VINCULACIÓN MÚLTIPLE: recopilar TODOS los menús afectados (vinculaciones previas y nuevas),
    // de modo que agregar/quitar la ficha de un menú o editar sus ingredientes
    // actualice automáticamente el costo de cada menú involucrado en el cotizador.
    const menusAfectados = new Set<string>();
    if (recetaAnterior?.menuAsociadoId) menusAfectados.add(recetaAnterior.menuAsociadoId);
    (recetaAnterior?.menusAsociadosIds || []).forEach(id => menusAfectados.add(id));
    if (recetaActualizada.menuAsociadoId) menusAfectados.add(recetaActualizada.menuAsociadoId);
    (recetaActualizada.menusAsociadosIds || []).forEach(id => menusAfectados.add(id));

    if (menusAfectados.size === 0) return;

    setMenus(prevMenus =>
      prevMenus.map(m => {
        if (!menusAfectados.has(m.id)) return m;
        const { costoMenuCalculado, recetasEncontradas } = calcularCostoMenuDesdeRecetas(m.id, nuevasRecetas, insumos);
        // Solo re-escribir el costo si el menú sigue teniendo fichas asociadas
        // (así no se borra por accidente un costo ingresado a mano)
        if (recetasEncontradas > 0 && costoMenuCalculado > 0) {
          return {
            ...m,
            costoPersona: costoMenuCalculado,
            precioSugeridoPersona: Math.round(costoMenuCalculado / (recetaActualizada.margenSugerido / 100 || 0.33))
          };
        }
        return m;
      })
    );
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

  const handleAddMenu = (nuevoMenu: MenuOption) => {
    setMenus(prev => [nuevoMenu, ...prev]);
    // Vinculación automática TOTAL al crear un menú:
    // 1) El menú nuevo queda SELECCIONADO de inmediato (el Resumen y los costos lo muestran al instante,
    //    ya no queda la propuesta "en blanco" ni apuntando al menú anterior).
    // 2) Si el menú tiene bebestibles marcados en su ficha, se cargan solos a la sección Bebestibles.
    // 3) Los tragos con receta vinculada (creados en Tragos & Barra) se conservan siempre.
    setCotizacion(prev => {
      const bebsMenu = nuevoMenu.bebestiblesPorPersona;
      if (bebsMenu && bebsMenu.length > 0) {
        const conservar = (prev.bebestibles || []).filter(b => b.recetaId);
        const yaVinculados = new Set(conservar.map(b => b.recetaId));
        const delMenu = bebsMenu
          .filter(it => !it.recetaId || !yaVinculados.has(it.recetaId))
          .map((it, idx) => ({ ...it, id: 'beb-menu-' + Date.now() + '-' + idx, incluido: true }));
        return { ...prev, menuId: nuevoMenu.id, bebestibles: [...conservar, ...delMenu] };
      }
      return { ...prev, menuId: nuevoMenu.id };
    });
    mostrarToast(`✓ Menú "${nuevoMenu.nombre}" creado, seleccionado e integrado a la propuesta`);
  };

  const handleUpdateMenu = (menuActualizado: MenuOption) => {
    setMenus(prev => prev.map(m => (m.id === menuActualizado.id ? menuActualizado : m)));
    mostrarToast(`✓ Menú "${menuActualizado.nombre}" actualizado correctamente`);
  };

  const handleDeleteMenu = (menuId: string) => {
    if (menus.length <= 1) {
      mostrarToast('⚠️ Debe existir al menos un menú en la carta gastronómica');
      return;
    }
    const menuAEliminar = menus.find(m => m.id === menuId);
    if (!menuAEliminar) return;
    setMenus(prev => prev.filter(m => m.id !== menuId));
    if (cotizacion.menuId === menuId) {
      const restante = menus.find(m => m.id !== menuId);
      if (restante) {
        setCotizacion(prev => ({ ...prev, menuId: restante.id }));
      }
    }
    mostrarToast(`✓ Menú "${menuAEliminar.nombre}" eliminado de la carta`);
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
    setCotizacion(prev => {
      const menuElegido = menus.find(m => m.id === id);
      const bebsMenu = menuElegido?.bebestiblesPorPersona;
      // Vinculación automática: al elegir un menú con bebestibles en su ficha,
      // se cargan al cotizador solos. Se conservan los tragos con receta vinculada.
      if (bebsMenu && bebsMenu.length > 0) {
        const conservar = (prev.bebestibles || []).filter(b => b.recetaId);
        const yaVinculados = new Set(conservar.map(b => b.recetaId));
        const delMenu = bebsMenu
          .filter(it => !it.recetaId || !yaVinculados.has(it.recetaId))
          .map((it, idx) => ({ ...it, id: 'beb-menu-' + Date.now() + '-' + idx, incluido: true }));
        return { ...prev, menuId: id, bebestibles: [...conservar, ...delMenu] };
      }
      return { ...prev, menuId: id };
    });
  };

  const handleChangeInvitados = (inv: number) => {
    const validInv = Math.max(1, inv);
    setCotizacion(prev => {
      // Re-escalar dotación de personal proporcional y realista a los comensales
      const garzonesAuto = Math.max(1, Math.ceil(validInv / 15));
      const cocinerosAuto = Math.max(1, Math.ceil(validInv / 35));
      const aseoAuto = Math.max(1, Math.ceil(validInv / 60));
      const maitreAuto = validInv > 60 ? 1 : 0;

      // Adaptar mesas si la capacidad actual está desvinculada del número de comensales
      let mesasAdaptadas = prev.mesas;
      const capacidadActual = (prev.mesas || []).reduce((s, m) => s + m.capacidad, 0);
      if (capacidadActual > validInv * 1.8 || capacidadActual < validInv * 0.7) {
        if (validInv <= 20) {
          const cap1 = Math.ceil(validInv / 2);
          const cap2 = Math.floor(validInv / 2);
          mesasAdaptadas = [
            { id: 'm-1', numero: 1, nombre: 'Mesa Principal', capacidad: cap1, tipo: 'redonda' as const, zona: 'Salón' },
            ...(cap2 > 0 ? [{ id: 'm-2', numero: 2, nombre: 'Mesa Secundaria', capacidad: cap2, tipo: 'redonda' as const, zona: 'Salón' }] : [])
          ];
        } else {
          const totalMesas = Math.ceil(validInv / 10);
          mesasAdaptadas = Array.from({ length: totalMesas }, (_, i) => ({
            id: `m-${i + 1}`,
            numero: i + 1,
            nombre: i === 0 ? 'Mesa Principal / Honor' : `Mesa ${i + 1}`,
            capacidad: Math.min(10, Math.ceil(validInv / totalMesas)),
            tipo: (i === 0 ? 'presidencial' : 'redonda') as Mesa['tipo'],
            zona: 'Salón Principal'
          }));
        }
      }

      return {
        ...prev,
        invitados: validInv,
        personal: {
          garzones: garzonesAuto,
          cocineros: cocinerosAuto,
          aseo: aseoAuto,
          maitre: maitreAuto
        },
        mesas: mesasAdaptadas
      };
    });
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
    const limpio = Number.isFinite(porcentaje) ? Math.min(100, Math.max(0, porcentaje)) : 0;
    setCotizacion(prev => ({ ...prev, porcentajeAnticipo: limpio }));
  };

  const handleChangeEsquemaPago = (esquema: string) => {
    setCotizacion(prev => ({ ...prev, esquemaPago: esquema }));
  };

  const handleChangeHito2Porcentaje = (porcentaje: number) => {
    const limpio = Number.isFinite(porcentaje) ? Math.min(100, Math.max(0, porcentaje)) : 0;
    setCotizacion(prev => ({ ...prev, hito2Porcentaje: limpio }));
  };

  const handleChangeHito3Porcentaje = (porcentaje: number) => {
    const limpio = Number.isFinite(porcentaje) ? Math.min(100, Math.max(0, porcentaje)) : 0;
    setCotizacion(prev => ({ ...prev, hito3Porcentaje: limpio }));
  };

  const handleChangeCondicionesPago = (texto: string) => {
    setCotizacion(prev => ({ ...prev, condicionesPagoPersonalizadas: texto }));
  };

  const handleChangeDiasSaldo = (dias: number) => {
    const limpio = Number.isFinite(dias) ? Math.max(0, Math.round(dias)) : 0;
    setCotizacion(prev => ({ ...prev, diasSaldo: limpio }));
  };

  const handleChangeDiasConfirmacion = (dias: number) => {
    const limpio = Number.isFinite(dias) ? Math.max(0, Math.round(dias)) : 0;
    setCotizacion(prev => ({ ...prev, diasConfirmacionComensales: limpio }));
  };

  const handleChangeValidezDias = (dias: number) => {
    const limpio = Number.isFinite(dias) ? Math.max(1, Math.round(dias)) : 15;
    setCotizacion(prev => ({ ...prev, validezDias: limpio }));
  };

  const handleChangeMetodoPago = (metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque' | 'otro') => {
    setCotizacion(prev => ({ ...prev, metodoPago: metodo }));
  };

  const handleChangeDetalleMetodoPago = (texto: string) => {
    setCotizacion(prev => ({ ...prev, detalleMetodoPago: texto }));
  };

  const handleToggleMostrarCondiciones = (mostrar: boolean) => {
    setCotizacion(prev => ({ ...prev, mostrarCondicionesPago: mostrar }));
  };

  const handleChangeModoCondiciones = (modo: 'manual' | 'auto') => {
    setCotizacion(prev => ({ ...prev, modoCondicionesPago: modo }));
  };

  const handleChangeGastoLuz = (luz: number) => {
    setCotizacion(prev => {
      const otros = prev.otrosGastosFijos || [];
      const sumaOtros = otros.reduce((s, o) => s + (o.monto || 0), 0);
      const total = Math.max(0, luz) + (prev.gastoGasMensual || 0) + sumaOtros;
      return { ...prev, gastoLuzMensual: Math.max(0, luz), gastosFijosMensuales: total };
    });
  };

  const handleChangeGastoGas = (gas: number) => {
    setCotizacion(prev => {
      const otros = prev.otrosGastosFijos || [];
      const sumaOtros = otros.reduce((s, o) => s + (o.monto || 0), 0);
      const total = (prev.gastoLuzMensual || 0) + Math.max(0, gas) + sumaOtros;
      return { ...prev, gastoGasMensual: Math.max(0, gas), gastosFijosMensuales: total };
    });
  };

  const handleAddOtroGastoFijo = (nombre: string, monto: number) => {
    setCotizacion(prev => {
      const nuevo: ItemGastoFijo = {
        id: 'gf-' + Date.now(),
        nombre: nombre || 'Nuevo Costo Fijo',
        monto: Math.max(0, monto)
      };
      const list = [...(prev.otrosGastosFijos || []), nuevo];
      const sumaOtros = list.reduce((s, o) => s + (o.monto || 0), 0);
      const total = (prev.gastoLuzMensual || 0) + (prev.gastoGasMensual || 0) + sumaOtros;
      return { ...prev, otrosGastosFijos: list, gastosFijosMensuales: total };
    });
  };

  const handleRemoveOtroGastoFijo = (id: string) => {
    setCotizacion(prev => {
      const list = (prev.otrosGastosFijos || []).filter(it => it.id !== id);
      const sumaOtros = list.reduce((s, o) => s + (o.monto || 0), 0);
      const total = (prev.gastoLuzMensual || 0) + (prev.gastoGasMensual || 0) + sumaOtros;
      return { ...prev, otrosGastosFijos: list, gastosFijosMensuales: total };
    });
  };

  const handleUpdateOtroGastoFijo = (id: string, nombre: string, monto: number) => {
    setCotizacion(prev => {
      const list = (prev.otrosGastosFijos || []).map(it =>
        it.id === id ? { ...it, nombre, monto: Math.max(0, monto) } : it
      );
      const sumaOtros = list.reduce((s, o) => s + (o.monto || 0), 0);
      const total = (prev.gastoLuzMensual || 0) + (prev.gastoGasMensual || 0) + sumaOtros;
      return { ...prev, otrosGastosFijos: list, gastosFijosMensuales: total };
    });
  };

  const handleChangeEventosAlMes = (eventos: number) => {
    setCotizacion(prev => ({ ...prev, eventosAlMes: Math.max(0, eventos) }));
  };

  const handleToggleUsarPrecioManual = (usar: boolean) => {
    setCotizacion(prev => ({ ...prev, usarPrecioManual: usar }));
  };

  const handleChangePrecioManual = (precio: number) => {
    setCotizacion(prev => ({ ...prev, precioVentaManual: Math.max(0, precio), usarPrecioManual: true }));
  };

  const handleGuardarMesCostosFijos = (registro: RegistroCostoFijoMensual) => {
    setCotizacion(prev => {
      const historial = { ...(prev.historialCostosFijosMensuales || {}), [registro.id]: registro };
      return {
        ...prev,
        mesActivoCostosFijos: registro.mesNombre,
        historialCostosFijosMensuales: historial
      };
    });
    mostrarToast(`✓ Facturas de ${registro.mesNombre} guardadas con éxito`);
  };

  const handleCargarMesCostosFijos = (registro: RegistroCostoFijoMensual) => {
    setCotizacion(prev => {
      const sumaOtros = (registro.otrosGastos || []).reduce((s, o) => s + (o.monto || 0), 0);
      const total = (registro.gastoLuz || 0) + (registro.gastoGas || 0) + sumaOtros;
      return {
        ...prev,
        mesActivoCostosFijos: registro.mesNombre,
        gastoLuzMensual: registro.gastoLuz,
        gastoGasMensual: registro.gastoGas,
        otrosGastosFijos: registro.otrosGastos,
        eventosAlMes: registro.eventosAlMes,
        gastosFijosMensuales: total
      };
    });
    mostrarToast(`✓ Cuentas de ${registro.mesNombre} cargadas`);
  };

  // ── Guardar en Calendario e Historial de Cotizaciones ──
  const handleGuardarCotizacionActual = () => {
    const fecha = cotizacion.fechaEvento || new Date().toISOString().slice(0, 10);
    const nombre = cotizacion.nombreEvento?.trim() || (cotizacion.cliente ? `Evento ${cotizacion.cliente}` : 'Cotización en Proceso');
    const idReserva = cotizacion.id || ('res-' + Date.now());

    const nuevaReserva: ReservaCalendario = {
      id: idReserva,
      titulo: nombre,
      cliente: cotizacion.cliente || 'Cliente Particular',
      tipoEvento: cotizacion.tipoEvento,
      fecha,
      invitados: cotizacion.invitados,
      estado: 'cotizado',
      montoTotal: Math.round(resumenFinanciero.precioCobradoFinal || resumenFinanciero.precioVentaTotal),
      cotizacionSnapshot: { ...cotizacion, id: idReserva, nombreEvento: nombre, fechaEvento: fecha }
    };

    setReservas(prev => {
      const filtradas = prev.filter(r => r.id !== idReserva);
      return [nuevaReserva, ...filtradas];
    });

    setCotizacion(prev => ({
      ...prev,
      id: idReserva,
      nombreEvento: nombre
    }));

    mostrarToast(`✓ Cotización "${nombre}" guardada con éxito en tu historial y calendario`);
  };

  const handleGuardarEnCalendario = () => {
    handleGuardarCotizacionActual();
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
      montoTotal: Math.round(resumenFinanciero.precioCobradoFinal || resumenFinanciero.precioVentaTotal),
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

  // ── Iniciar Nueva Cotización Limpia (Todos los Cotizadores en Blanco) ──
  const handleNuevaCotizacionLimpia = () => {
    const config = PERFILES_CLIENTES_CATALOGO[clienteActivoId];
    const def = config.crearDatosIniciales();
    const hoy = new Date().toISOString().slice(0, 10);

    const cotizacionLimpia: CotizacionState = {
      id: 'cot-' + Date.now(),
      nombreEvento: '',
      cliente: '',
      emailCliente: '',
      telefonoCliente: '',
      tipoEvento: 'Boda',
      fechaEvento: hoy,
      invitados: 100,
      menuId: menus[0]?.id || def.menus[0]?.id || 'menu-gourmet',
      personal: {
        garzones: Math.ceil(100 / 15),
        cocineros: Math.ceil(100 / 35),
        aseo: Math.ceil(100 / 60),
        maitre: 1
      },
      proveedoresSeleccionados: { ...(def.cotizacion.proveedoresSeleccionados || {}) },
      mesas: Array.from({ length: 10 }, (_, i) => ({
        id: `m-${i + 1}`,
        numero: i + 1,
        nombre: i === 0 ? 'Mesa Principal / Honor' : `Mesa ${i + 1}`,
        capacidad: 10,
        tipo: (i === 0 ? 'presidencial' : 'redonda') as Mesa['tipo'],
        zona: 'Salón Principal'
      })),
      decoracionId: def.cotizacion.decoracionId || 'rustico-chic',
      margenGanancia: def.cotizacion.margenGanancia || 35,
      aplicaIva: false,
      observaciones: '',
      porcentajeAnticipo: 40,
      esquemaPago: 'dos_pagos',
      hito2Porcentaje: 30,
      hito3Porcentaje: 20,
      condicionesPagoPersonalizadas: '',
      diasSaldo: 7,
      diasConfirmacionComensales: 10,
      validezDias: 15,
      metodoPago: 'transferencia',
      detalleMetodoPago: '',
      mostrarCondicionesPago: false,
      modoCondicionesPago: 'manual',
      gastoLuzMensual: def.cotizacion.gastoLuzMensual || 85000,
      gastoGasMensual: def.cotizacion.gastoGasMensual || 45000,
      otrosGastosFijos: def.cotizacion.otrosGastosFijos || [],
      eventosAlMes: def.cotizacion.eventosAlMes || 4,
      gastosFijosMensuales: def.cotizacion.gastosFijosMensuales || 130000,
      usarPrecioManual: false,
      precioVentaManual: 0,
      bebestibles: [
        { id: 'beb-sug-gaseosas', nombre: 'Bebidas, Gaseosas y Aguas Minerales (350cc)', cantidadPorPersona: 2, unidad: 'lata / vaso', costoUnitario: 900, categoria: 'bebestible' },
        { id: 'beb-sug-vinos', nombre: 'Vinos Reserva & Espumante de Brindis', cantidadPorPersona: 1.5, unidad: 'copa', costoUnitario: 1800, categoria: 'bebestible' },
        { id: 'beb-sug-barra', nombre: 'Barra Libre / Coctelería de Autor', cantidadPorPersona: 2, unidad: 'copa / vaso', costoUnitario: 2500, categoria: 'bebestible' }
      ]
    };

    setCotizacion(cotizacionLimpia);
    mostrarToast('✓ Cotizador preparado en blanco: Listo para ingresar nueva cotización');
  };

  const handleUpdateBebestibles = (nuevos: any[]) => {
    setCotizacion(prev => ({
      ...prev,
      bebestibles: nuevos
    }));
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
  const estiloActual = cotizacion.decoracionId === 'sin-decoracion'
    ? undefined
    : (estilosDecoracion.find(e => e.id === cotizacion.decoracionId) || estilosDecoracion[0]);
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
        precioSugeridoVenta={resumenFinanciero.precioCobradoFinal}
        empresaActiva={empresaActiva}
        clienteActivoId={clienteActivoId}
        onCambiarCliente={handleCambiarCliente}
        onAbrirFicha={() => setModalFichaOpen(true)}
        onNuevaCotizacion={handleNuevaCotizacionLimpia}
        onGuardarCotizacion={handleGuardarCotizacionActual}
        onAbrirGestionEmpresas={() => setModalEmpresasOpen(true)}
        onAbrirComercial={() => setModalComercialOpen(true)}
        onAbrirRespaldo={() => setModalRespaldoOpen(true)}
        onAbrirWhatsAppPropuesta={() => setModalWhatsAppOpen(true)}
        modoAdmin={modoAdmin}
        onToggleModoAdmin={toggleModoAdmin}
        onAbrirFormularioEmpresa={() => setModalFormularioEmpresaOpen(true)}
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
                        Centro Campestre Damaris
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        Calera de Tango
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
                        Doña Isidora Eventos
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        Matrimonios & Bodas
                      </span>
                      <span className="text-[10px] text-emerald-400 block font-medium">
                        ✓ Sin recinto fijo · A Domicilio & Parcelas
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

                  <div className="border-l border-white/10 pl-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setModalFormularioEmpresaOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                      title="Llenar o editar datos de empresa, contacto, RUT y datos bancarios"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>🏢 Llenar Datos Empresa</span>
                    </button>
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
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === '__OTRO_TIPO__') {
                          const escrito = window.prompt('Escribe el tipo de evento (ej: Fiesta de 15 Años, Cena de Cumpleaños, Bautizo...):');
                          const limpio = (escrito || '').trim();
                          if (!limpio) return; // sin texto: no cambia nada
                          if (!tiposEventoPersonalizados.some(t => t.toLowerCase() === limpio.toLowerCase())) {
                            const actualizados = [...tiposEventoPersonalizados, limpio];
                            setTiposEventoPersonalizados(actualizados);
                            try { localStorage.setItem('hlr_tipos_evento_personalizados', JSON.stringify(actualizados)); } catch (err) { console.error(err); }
                          }
                          setCotizacion(prev => ({ ...prev, tipoEvento: limpio }));
                        } else {
                          setCotizacion(prev => ({ ...prev, tipoEvento: valor as CotizacionState['tipoEvento'] }));
                        }
                      }}
                      className="bg-transparent focus:outline-hidden text-slate-800 font-medium w-full"
                    >
                      <option value="Boda">Boda</option>
                      <option value="Corporativo">Corporativo</option>
                      <option value="Graduación">Graduación</option>
                      <option value="Cumpleaños / Aniversario">Cumpleaños / Aniversario</option>
                      <option value="Fiesta Fin de Año">Fiesta Fin de Año</option>
                      {tiposEventoPersonalizados.map(t => (
                        <option key={t} value={t}>{t} ★</option>
                      ))}
                      <option value="__OTRO_TIPO__">+ Otro tipo de evento...</option>
                    </select>
                  </div>
                </div>

                {/* Acciones directas de la Ficha: Guardar y Nueva en Blanco */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGuardarCotizacionActual}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Guardar esta cotización en el historial y calendario"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNuevaCotizacionLimpia}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                    title="Iniciar cotización limpia en blanco lista para un nuevo cliente"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-slate-600" />
                    <span>En Blanco</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selector de Secciones Rápidas / Filtro de Módulos (Solo Vendibles) */}
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
                Ver Todo el Cotizador
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
                onClick={() => setSeccionActiva('3')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  seccionActiva === '3'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                02. Proveedores & Servicios
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
                03. Mesas & Salón
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
                04. Decoración
              </button>
            </div>

            {/* Split Principal: Formularios a la izquierda (col-span-2) + Dashboard a la derecha (col-span-1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: Módulos de Ítems Vendibles para Clientes */}
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
                    onAddMenu={handleAddMenu}
                    onUpdateMenu={handleUpdateMenu}
                    costoFijoPorPersona={resumenFinanciero.costoFijoPorPersona}
                    recetas={recetas}
                    insumos={insumos}
                    onUpdateReceta={handleUpdateReceta}
                    bebestibles={cotizacion.bebestibles}
                    onUpdateBebestibles={handleUpdateBebestibles}
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

              {/* COLUMNA DERECHA: Resumen de Propuesta Comercial (Ítems Vendibles para Clientes) */}
              <div className="lg:col-span-1">
                <ResumenPropuestaComercial
                  cotizacion={cotizacion}
                  resumen={resumenFinanciero}
                  menuActual={menuActual}
                  estiloActual={estiloActual}
                  proveedores={proveedores}
                  onIrAAdmCostos={() => setVistaActual('adm-costos')}
                  onAbrirFichaCliente={() => setModalFichaOpen(true)}
                  onAbrirWhatsAppPropuesta={() => setModalWhatsAppOpen(true)}
                  onGuardarEnCalendario={handleGuardarEnCalendario}
                  onGuardarCotizacion={handleGuardarCotizacionActual}
                  onToggleIva={handleToggleIva}
                  onToggleUsarPrecioManual={handleToggleUsarPrecioManual}
                  onChangePrecioManual={handleChangePrecioManual}
                  onChangeAnticipo={handleChangeAnticipo}
                  onChangeDiasSaldo={handleChangeDiasSaldo}
                />
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA: ADM. COSTOS (DASHBOARD DE COSTOS REALES, GASTOS FIJOS & PRORRATEO)
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'adm-costos' && (
          <div className="space-y-6">
            {/* Banner de Cabecera de Adm. Costos */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">
                    Gestión Financiera & Administración
                  </span>
                  <span className="text-xs text-indigo-200">
                    Control de Costos Fijos, Prorrateo y Margen Real
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-indigo-400" />
                  <span>Adm. Costos & Prorrateo Operacional</span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Administra los gastos fijos mensuales (Luz, Gas, Arriendo y otros), calcula el prorrateo automático por evento y por comensal ({cotizacion.invitados} Pax), y ajusta libremente tus márgenes de utilidad.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVistaActual('cotizador')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <span>← Volver al Cotizador de Clientes</span>
              </button>
            </div>

            {/* Módulo 6 Completo */}
            <div className="max-w-4xl mx-auto">
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
                hito2Porcentaje={cotizacion.hito2Porcentaje ?? 30}
                onChangeHito2Porcentaje={handleChangeHito2Porcentaje}
                hito3Porcentaje={cotizacion.hito3Porcentaje ?? 20}
                onChangeHito3Porcentaje={handleChangeHito3Porcentaje}
                condicionesPagoPersonalizadas={cotizacion.condicionesPagoPersonalizadas ?? ''}
                onChangeCondicionesPagoPersonalizadas={handleChangeCondicionesPago}
                diasSaldo={cotizacion.diasSaldo ?? 7}
                onChangeDiasSaldo={handleChangeDiasSaldo}
                diasConfirmacionComensales={cotizacion.diasConfirmacionComensales ?? 10}
                onChangeDiasConfirmacion={handleChangeDiasConfirmacion}
                validezDias={cotizacion.validezDias ?? 15}
                onChangeValidezDias={handleChangeValidezDias}
                metodoPago={cotizacion.metodoPago ?? 'transferencia'}
                onChangeMetodoPago={handleChangeMetodoPago}
                detalleMetodoPago={cotizacion.detalleMetodoPago ?? ''}
                onChangeDetalleMetodoPago={handleChangeDetalleMetodoPago}
                mostrarCondicionesPago={cotizacion.mostrarCondicionesPago ?? ((cotizacion.condicionesPagoPersonalizadas ?? '').trim().length > 0)}
                onToggleMostrarCondiciones={handleToggleMostrarCondiciones}
                modoCondicionesPago={cotizacion.modoCondicionesPago ?? 'manual'}
                onChangeModoCondiciones={handleChangeModoCondiciones}
                // Gastos fijos específicos para emprendedores: Luz, Gas y Otros a mano
                gastoLuzMensual={cotizacion.gastoLuzMensual ?? 0}
                onChangeGastoLuz={handleChangeGastoLuz}
                gastoGasMensual={cotizacion.gastoGasMensual ?? 0}
                onChangeGastoGas={handleChangeGastoGas}
                otrosGastosFijos={cotizacion.otrosGastosFijos ?? []}
                onAddOtroGastoFijo={handleAddOtroGastoFijo}
                onRemoveOtroGastoFijo={handleRemoveOtroGastoFijo}
                onUpdateOtroGastoFijo={handleUpdateOtroGastoFijo}
                eventosAlMes={cotizacion.eventosAlMes ?? 0}
                onChangeEventosAlMes={handleChangeEventosAlMes}
                // Historial y guardado mensual (variación mes a mes)
                mesActivoCostosFijos={cotizacion.mesActivoCostosFijos ?? 'Noviembre 2024'}
                onChangeMesActivo={(mes) => setCotizacion(prev => ({ ...prev, mesActivoCostosFijos: mes }))}
                historialCostosFijosMensuales={cotizacion.historialCostosFijosMensuales ?? {}}
                onGuardarMesCostosFijos={handleGuardarMesCostosFijos}
                onCargarMesCostosFijos={handleCargarMesCostosFijos}
                // Criterio libre del emprendedor (sugerido vs propio)
                usarPrecioManual={!!cotizacion.usarPrecioManual}
                onToggleUsarPrecioManual={handleToggleUsarPrecioManual}
                precioVentaManual={cotizacion.precioVentaManual ?? 0}
                onChangePrecioManual={handleChangePrecioManual}
              />
            </div>

            {/* Zona de Respaldos Libres & Descargas Directas */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white border border-indigo-500/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-white">Respaldos de Datos Libres (Sin Bloqueos)</h3>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Descarga inmediata de tus recetas ({recetas.length}), insumos ({insumos.length}) y cotizaciones a tu disco duro.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    descargarRespaldoJSON({
                      version: '1.2.0',
                      fechaExportacion: new Date().toISOString(),
                      autor: 'SOLVI Flow',
                      empresaActivaId: empresaActiva.id,
                      empresas,
                      insumos,
                      recetas,
                      menus,
                      tarifasStaff,
                      proveedores,
                      estilosDecoracion,
                      reservas,
                      cotizacionActual: cotizacion
                    }, empresaActiva.nombre);
                    mostrarToast('✓ Respaldo JSON descargado con éxito');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    descargarRespaldoSQL({
                      version: '1.2.0',
                      fechaExportacion: new Date().toISOString(),
                      autor: 'SOLVI Flow',
                      empresaActivaId: empresaActiva.id,
                      empresas,
                      insumos,
                      recetas,
                      menus,
                      tarifasStaff,
                      proveedores,
                      estilosDecoracion,
                      reservas,
                      cotizacionActual: cotizacion
                    }, empresaActiva.nombre);
                    mostrarToast('✓ Script SQL descargado');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-blue-200" />
                  <span>Descargar SQL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalRespaldoOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Ver Todos los Respaldos</span>
                </button>
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
            invitados={cotizacion.invitados}
            onUpdateReceta={handleUpdateReceta}
            onAddReceta={handleAddReceta}
            onDeleteReceta={handleDeleteReceta}
            onSincronizarCostosMenu={handleSincronizarCostosMenu}
            onVincularCoffeeBreak={handleVincularCoffeeBreak}
            onAddMenu={handleAddMenu}
            onUpdateMenu={handleUpdateMenu}
            onDeleteMenu={handleDeleteMenu}
            tarifasStaff={tarifasStaff}
            personal={cotizacion.personal}
            onChangePersonal={handleChangePersonal}
            bebestibles={cotizacion.bebestibles}
            onUpdateBebestibles={handleUpdateBebestibles}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VISTA: COTIZADOR DE TRAGOS & LICORES (COCTELERÍA VINCULADA AL MENÚ)
        ════════════════════════════════════════════════════════════════════════ */}
        {vistaActual === 'cocteleria' && (
          <ModuloCocteleria
            recetas={recetas}
            insumos={insumos}
            invitados={cotizacion.invitados}
            onAddReceta={handleAddReceta}
            onUpdateReceta={handleUpdateReceta}
            onDeleteReceta={handleDeleteReceta}
            bebestibles={cotizacion.bebestibles}
            onUpdateBebestibles={handleUpdateBebestibles}
            onIrACotizador={() => setVistaActual('cotizador')}
            onAddInsumo={handleAddInsumo}
            onIrAMaestroInsumos={() => setVistaActual('insumos')}
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
            onVerFicha={() => setModalFichaOpen(true)}
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
          precioVentaNeto={resumenFinanciero.usarPrecioManual ? (cotizacion.aplicaIva ? Math.round(resumenFinanciero.precioCobradoFinal / 1.19) : resumenFinanciero.precioCobradoFinal) : resumenFinanciero.precioVentaNeto}
          ivaMonto={resumenFinanciero.usarPrecioManual ? (cotizacion.aplicaIva ? Math.round(resumenFinanciero.precioCobradoFinal - Math.round(resumenFinanciero.precioCobradoFinal / 1.19)) : 0) : resumenFinanciero.ivaMonto}
          precioVentaTotal={resumenFinanciero.precioCobradoFinal}
          empresaActiva={empresaActiva}
          onClose={() => setModalFichaOpen(false)}
          onAbrirWhatsAppPropuesta={() => {
            setModalFichaOpen(false);
            setModalWhatsAppOpen(true);
          }}
          modoAdmin={modoAdmin}
          onGuardarCotizacion={handleGuardarCotizacionActual}
          recetas={recetas}
          insumos={insumos}
          onUpdateEmpresaActiva={(emp) => {
            setEmpresaActiva(emp);
            setEmpresas(prev => prev.map(e => e.id === emp.id ? emp : e));
          }}
        />
      )}

      {/* Modal de Propuesta Formal en 1 Clic para WhatsApp */}
      {modalWhatsAppOpen && (
        <ModalPropuestaWhatsApp
          cotizacion={cotizacion}
          menu={menuActual}
          proveedores={proveedores}
          estiloDecoracion={estiloActual}
          precioVentaNeto={resumenFinanciero.usarPrecioManual ? (cotizacion.aplicaIva ? Math.round(resumenFinanciero.precioCobradoFinal / 1.19) : resumenFinanciero.precioCobradoFinal) : resumenFinanciero.precioVentaNeto}
          ivaMonto={resumenFinanciero.usarPrecioManual ? (cotizacion.aplicaIva ? Math.round(resumenFinanciero.precioCobradoFinal - Math.round(resumenFinanciero.precioCobradoFinal / 1.19)) : 0) : resumenFinanciero.ivaMonto}
          precioVentaTotal={resumenFinanciero.precioCobradoFinal}
          empresaActiva={empresaActiva}
          onClose={() => setModalWhatsAppOpen(false)}
          recetas={recetas}
          insumos={insumos}
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
          onAbrirFormularioEmpresa={() => setModalFormularioEmpresaOpen(true)}
        />
      )}

      {/* Modal Formulario de Empresa y Contacto (Alta Cliente) */}
      {modalFormularioEmpresaOpen && (
        <ModalFormularioEmpresaContacto
          empresaActiva={empresaActiva}
          onGuardarEmpresa={handleGuardarEmpresaContacto}
          onClose={() => setModalFormularioEmpresaOpen(false)}
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
