import React, { useState } from 'react';
import { CotizacionState, MenuOption, ProveedorServicio, EstiloDecoracion, StaffTarifas, EmpresaCliente, RecetaFichaTecnica, InsumoMaestro } from '../types';
import { formatMoneda, formatFechaEsp } from '../utils/formatters';
import { minutaATexto, construirMinutaConFichas } from '../utils/minutaHelper';
import { calcularCostoReceta } from '../config/insumosYRecetas';
import {
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  Download,
  MessageCircle,
  Copy,
  Check,
  Building,
  CreditCard,
  FileText,
  Utensils,
  Users,
  Layers,
  Wine,
  GlassWater,
  Save,
  Sliders,
  Truck,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface FichaCotizacionModalProps {
  cotizacion: CotizacionState;
  menu: MenuOption;
  proveedores: ProveedorServicio[];
  estiloDecoracion?: EstiloDecoracion;
  tarifasStaff: StaffTarifas;
  precioVentaNeto: number;
  ivaMonto: number;
  precioVentaTotal: number;
  empresaActiva: EmpresaCliente;
  onClose: () => void;
  onAbrirWhatsAppPropuesta?: () => void;
  modoAdmin?: boolean;
  onGuardarCotizacion?: () => void;
  recetas?: RecetaFichaTecnica[];
  insumos?: InsumoMaestro[];
  onUpdateEmpresaActiva?: (emp: EmpresaCliente) => void;
}

export const FichaCotizacionModal: React.FC<FichaCotizacionModalProps> = ({
  cotizacion,
  menu,
  proveedores,
  estiloDecoracion,
  tarifasStaff,
  precioVentaNeto,
  ivaMonto,
  precioVentaTotal,
  empresaActiva,
  onClose,
  onAbrirWhatsAppPropuesta,
  modoAdmin = false,
  onGuardarCotizacion,
  recetas = [],
  insumos = [],
  onUpdateEmpresaActiva
}) => {
  const [copiado, setCopiado] = useState(false);

  // Edición inline de datos bancarios (los guarda en el perfil activo)
  const [editandoBanco, setEditandoBanco] = useState(false);
  const [dbRazon, setDbRazon] = useState(empresaActiva.datosBancarios?.razonSocial || '');
  const [dbRut, setDbRut] = useState(empresaActiva.datosBancarios?.rut || '');
  const [dbBanco, setDbBanco] = useState(empresaActiva.datosBancarios?.banco || '');
  const [dbTipo, setDbTipo] = useState(empresaActiva.datosBancarios?.tipoCuenta || 'Cuenta Corriente');
  const [dbNumero, setDbNumero] = useState(empresaActiva.datosBancarios?.numeroCuenta || '');
  const [dbTitular, setDbTitular] = useState(empresaActiva.datosBancarios?.titular || '');
  const [dbEmail, setDbEmail] = useState(empresaActiva.datosBancarios?.emailTransferencia || empresaActiva.email);

  const guardarDatosBancarios = () => {
    if (!onUpdateEmpresaActiva) {
      alert('Esta función requiere acceso al perfil de la empresa. Cierra y vuelve a abrir la ficha.');
      return;
    }
    onUpdateEmpresaActiva({
      ...empresaActiva,
      datosBancarios: {
        razonSocial: dbRazon.trim() || undefined,
        rut: dbRut.trim() || undefined,
        banco: dbBanco.trim() || undefined,
        tipoCuenta: dbTipo.trim() || undefined,
        numeroCuenta: dbNumero.trim() || undefined,
        titular: dbTitular.trim() || undefined,
        emailTransferencia: dbEmail.trim() || undefined
      }
    });
    setEditandoBanco(false);
  };

  // Bebestibles por persona (p.p.) considerados en la cotización o en el menú
  const bebestiblesLista = (cotizacion.bebestibles && cotizacion.bebestibles.length > 0)
    ? cotizacion.bebestibles
    : (menu?.bebestiblesPorPersona || []);

  // Pluraliza correctamente una unidad (incluidas las que tienen "/" o dos palabras como "lata / vaso")
  const pluralizarUnidad = (u: string, n: number): string => {
    if (n === 1) return u;
    const partes = u.split(' / ');
    return partes.map(p => {
      const t = p.trim();
      if (/s$|x$/i.test(t)) return t;
      return t + 's';
    }).join(' / ');
  };

  // Filtrar únicamente proveedores activos con valor positivo contratado (nada en $0)
  const proveedoresActivos = proveedores.filter(p => {
    if (!cotizacion.proveedoresSeleccionados[p.id]) return false;
    const precio = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;
    return precio > 0;
  });

  const capacidadTotalMesas = cotizacion.mesas.reduce((s, m) => s + m.capacidad, 0);

  const totalAPagar = cotizacion.aplicaIva ? precioVentaTotal : precioVentaNeto;
  const porcentajeAnticipo = cotizacion.porcentajeAnticipo ?? 40;
  const esquemaPago = cotizacion.esquemaPago ?? 'dos_pagos';
  const diasSaldo = cotizacion.diasSaldo ?? 7;
  const hito2Porcentaje = cotizacion.hito2Porcentaje ?? 30;
  const pieMonto = esquemaPago === 'un_pago' ? totalAPagar : Math.round(totalAPagar * (porcentajeAnticipo / 100));
  const hito2Monto = esquemaPago === 'tres_pagos' ? Math.round(totalAPagar * (hito2Porcentaje / 100)) : 0;
  const saldoMonto = esquemaPago === 'un_pago' ? 0 : Math.max(0, totalAPagar - pieMonto - hito2Monto);
  const valorPorInvitado = Math.round(totalAPagar / Math.max(1, cotizacion.invitados));

  // Detección de ambientación contratada (NUNCA mostrar sección con $0)
  const incluyeDecoracion = Boolean(
    estiloDecoracion &&
    estiloDecoracion.id !== 'sin-decoracion' &&
    cotizacion.decoracionId !== 'sin-decoracion' &&
    ((estiloDecoracion.precioVentaSugerido && estiloDecoracion.precioVentaSugerido > 0) ||
      (estiloDecoracion.costoFijo && estiloDecoracion.costoFijo > 0))
  );

  // Detección de brigada de staff contratada (NUNCA mostrar si es 0 personas o no contratado)
  const totalStaffPersonas =
    (cotizacion.personal?.garzones || 0) +
    (cotizacion.personal?.cocineros || 0) +
    (cotizacion.personal?.aseo || 0) +
    (cotizacion.personal?.maitre || 0);

  const costoStaffTotal =
    (cotizacion.personal?.garzones || 0) * (tarifasStaff?.garzonJornada || 0) +
    (cotizacion.personal?.cocineros || 0) * (tarifasStaff?.cocineroJornada || 0) +
    (cotizacion.personal?.aseo || 0) * (tarifasStaff?.aseoJornada || 0) +
    (cotizacion.personal?.maitre || 0) * (tarifasStaff?.maitreJornada || 0);

  const tieneStaffContratado = totalStaffPersonas > 0;

  // Detección inteligente de evento a domicilio / solo servicio (desactiva mesas por defecto)
  const esEventoDomicilio =
    (cotizacion.tipoEvento || '').toLowerCase().includes('domicilio') ||
    (cotizacion.nombreEvento || '').toLowerCase().includes('domicilio') ||
    (cotizacion.cliente || '').toLowerCase().includes('domicilio') ||
    (empresaActiva.recintoPrincipal || '').toLowerCase().includes('domicilio') ||
    (empresaActiva.recintoPrincipal || '').toLowerCase().includes('itinerante') ||
    (menu?.categoria || '').toLowerCase().includes('domicilio');

  // Estados interactivos para libertad total de eliminar o incluir secciones
  const [incluirGastronomia, setIncluirGastronomia] = useState(true);
  const [incluirBebestibles, setIncluirBebestibles] = useState(bebestiblesLista.length > 0);
  const [incluirStaff, setIncluirStaff] = useState(tieneStaffContratado);
  const [incluirProveedores, setIncluirProveedores] = useState(proveedoresActivos.length > 0);
  const [incluirDecoracion, setIncluirDecoracion] = useState(incluyeDecoracion);
  const [incluirMesas, setIncluirMesas] = useState(cotizacion.mesas.length > 0 && !esEventoDomicilio);
  const [incluirDesgloseValores, setIncluirDesgloseValores] = useState(true);

  // Detección inteligente de si los tiempos del menú son texto genérico de boda
  const esTextoRellenoBoda = (texto?: string) => {
    if (!texto || !texto.trim()) return true;
    const t = texto.trim().toLowerCase();
    return (
      t.includes('selección de bocados fríos y calientes gourmet en jardín') ||
      t.includes('entrada fresca de temporada según minuta del chef') ||
      t.includes('plato de fondo noble con guarnición rústica y salsa de autor') ||
      t.includes('trilogía dulce de autor o buffet de postres artesanales') ||
      t.includes('estación de trasnoche: mini hamburguesas brioche')
    );
  };

  const tieneItemsPorPersona = Array.isArray(menu?.itemsPorPersona) && menu.itemsPorPersona.length > 0;

  // Filtrar solo los tiempos que el usuario realmente redactó y que no sean relleno
  // INCLUYE fichas técnicas vinculadas a este menú (sin doble digitación)
  // Si el texto manual coincide con el nombre de la ficha → se muestra UNA sola vez
  const tiemposReales: Array<{ etiqueta: string; valor: string }> = [];
  if (menu?.tiempos) {
    const minuta = construirMinutaConFichas(menu, recetas, insumos);
    const etiquetaTiempo: Record<string, string> = {
      coctel: 'Cóctel de Bienvenida',
      entrada: 'Entrada Gourmet',
      fondo: 'Plato Principal / Fondo',
      postre: 'Mesa de Postres',
      trasnoche: 'Trasnoche / Fin de Fiesta'
    };
    minuta.forEach(t => {
      if (t.ocultoManual) return; // El usuario marcó este tiempo como oculto → no se muestra en el PDF
      if (!t.tieneContenido) return; // oculta tiempos vacíos
      const etiqueta = etiquetaTiempo[t.tiempoId] || t.tiempoLabel;
      const partes: string[] = [];

      // Detectar fichas cuyo nombre coincide con el texto manual (sin distinción de mayúsculas)
      const textoNorm = t.textoManual.trim().toLowerCase();
      const fichasDiferentes = t.fichas.filter(f => f.nombre.trim().toLowerCase() !== textoNorm);
      const fichasIguales = t.fichas.filter(f => f.nombre.trim().toLowerCase() === textoNorm);

      // Si hay fichas idénticas al texto manual → mostrar UNA sola vez con su costo, sin repetir
      if (fichasIguales.length > 0 && t.textoManual && fichasDiferentes.length === 0) {
        const fichasTxt = fichasIguales.map(f => {
          const calc = calcularCostoReceta(f, insumos);
          return `${t.textoManual} (${formatMoneda(calc.costoPorPorcion)}/porción)`;
        }).join(', ');
        tiemposReales.push({ etiqueta, valor: fichasTxt });
        return;
      }

      // Caso normal: mostrar texto manual + fichas distintas
      if (t.textoManual) partes.push(t.textoManual);
      if (fichasDiferentes.length > 0) {
        const fichasTxt = fichasDiferentes.map(f => {
          const calc = calcularCostoReceta(f, insumos);
          return `${f.nombre} (${formatMoneda(calc.costoPorPorcion)}/porción)`;
        }).join(', ');
        partes.push(`Fichas: ${fichasTxt}`);
      } else if (fichasIguales.length > 0 && !t.textoManual) {
        // No hay texto manual pero hay fichas (mismas o distintas) → mostrar las fichas
        const fichasTxt = t.fichas.map(f => {
          const calc = calcularCostoReceta(f, insumos);
          return `${f.nombre} (${formatMoneda(calc.costoPorPorcion)}/porción)`;
        }).join(', ');
        partes.push(`Fichas: ${fichasTxt}`);
      }
      if (partes.length > 0) {
        tiemposReales.push({ etiqueta, valor: partes.join(' · ') });
      }
    });
  }

  // Contador dinámico y secuencial de secciones para evitar saltos (ej: 1, 2, 3...)
  let numeroSeccion = 0;
  const getNextNum = () => {
    numeroSeccion += 1;
    return numeroSeccion;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDescargarHTML = () => {
    let htmlSec = 1;
    const htmlContenido = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización Formal - ${cotizacion.nombreEvento && cotizacion.nombreEvento.trim() ? cotizacion.nombreEvento : 'Evento'} - ${empresaActiva.nombre}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; max-width: 900px; margin: 0 auto; background: #fff; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
    .subtitle { font-size: 13px; color: #b45309; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px; }
    .meta-label { color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .meta-val { font-weight: 800; color: #0f172a; font-size: 14px; margin-top: 2px; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 28px; margin-bottom: 12px; color: #0f172a; }
    .card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px; font-size: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .table-custom { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .table-custom th { text-align: left; padding: 6px 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; }
    .table-custom td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .total-box { background: #0f172a; color: #fff; border-radius: 12px; padding: 20px; margin-top: 28px; }
    .total-price { font-size: 32px; font-weight: 900; color: #fbbf24; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; font-size: 12px; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 8px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="logo-title">${empresaActiva.nombre.toUpperCase()}</h1>
      <div class="subtitle">${empresaActiva.subtitulo} · ${empresaActiva.recintoPrincipal}</div>
      <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
        ${(() => {
          // Si la empresa es itinerante/sin recinto fijo, mostrarlo explícitamente en vez de la dirección fija
          const esItinerante = (empresaActiva.recintoPrincipal || '').toLowerCase().includes('itinerante') ||
                                (empresaActiva.recintoPrincipal || '').toLowerCase().includes('sin recinto') ||
                                (empresaActiva.infraestructura || '').toLowerCase().includes('sin recinto') ||
                                (empresaActiva.infraestructura || '').toLowerCase().includes('itinerante') ||
                                (empresaActiva.infraestructura || '').toLowerCase().includes('parcelas privadas');
          if (esItinerante) {
            return `${empresaActiva.recintoPrincipal} · ${empresaActiva.ciudad} · Tel: ${empresaActiva.telefono} · Email: ${empresaActiva.email}`;
          }
          return `${empresaActiva.direccion}, ${empresaActiva.ciudad} · Tel: ${empresaActiva.telefono} · Email: ${empresaActiva.email}`;
        })()}
      </p>
    </div>
    <div style="text-align: right; font-size: 12px;">
      <div style="font-weight: 900; font-size: 16px; color: #0f172a;">${(() => {
        // COT estable: deriva del id de la cotización guardada. Si no tiene id (cotización nueva), usa timestamp del día.
        const rawId = (cotizacion.id || '').replace(/^cot-/, '').replace(/^res-/, '');
        let num = 0;
        if (rawId && /^\d+$/.test(rawId)) {
          num = parseInt(rawId.slice(-6)) % 10000;
        } else if (rawId) {
          // hash simple
          for (let i = 0; i < rawId.length; i++) num = (num * 31 + rawId.charCodeAt(i)) % 10000;
        } else {
          // fallback: timestamp del día, estable por día
          num = Math.floor(Date.now() / 86400000) % 10000;
        }
        return 'COT-2026-' + String(num).padStart(4, '0');
      })()}</div>
      <div style="color: #64748b;">Fecha Emisión: ${new Date().toLocaleDateString('es-CL')}</div>
      <div style="color: #047857; font-weight: bold;">Validez: 15 días continuos</div>
    </div>
  </div>

  <div class="meta-box">
    <div>
      <div class="meta-label">Cliente / Solicitante:</div>
      <div class="meta-val">${cotizacion.cliente && cotizacion.cliente.trim() ? cotizacion.cliente : '[CLIENTE]'}</div>
    </div>
    <div>
      <div class="meta-label">Celebración:</div>
      <div class="meta-val">${cotizacion.tipoEvento}</div>
    </div>
    <div>
      <div class="meta-label">Fecha Reservada:</div>
      <div class="meta-val">${formatFechaEsp(cotizacion.fechaEvento)}</div>
    </div>
    <div>
      <div class="meta-label">Invitados:</div>
      <div class="meta-val" style="color: #b45309;">${cotizacion.invitados} Comensales</div>
    </div>
  </div>

  ${incluirGastronomia ? `
  <div class="section-title">${htmlSec++}. Propuesta Gastronómica: ${menu.nombre}</div>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span class="subtitle">Categoría: ${menu.categoria}</span>
      <strong style="color: #b45309;">${formatMoneda(menu.precioSugeridoPersona * cotizacion.invitados)} CLP (${formatMoneda(menu.precioSugeridoPersona)} / comensal)</strong>
    </div>
    <p style="font-style: italic; color: #334155; margin-bottom: 8px;">&ldquo;${(menu.descripcion || '').replace(/"/g, '&quot;')}&rdquo;</p>
    ${tieneItemsPorPersona ? `
      <div style="margin-top: 10px;">
        <strong>Consumos Exactos e Ítems por Persona (Para ${cotizacion.invitados} Comensales):</strong>
        <table class="table-custom">
          <thead>
            <tr>
              <th>Ítem / Preparación</th>
              <th>Ratio p.p.</th>
              <th>Cantidad Total a Servir</th>
            </tr>
          </thead>
          <tbody>
            ${menu.itemsPorPersona?.map(it => `
              <tr>
                <td><strong>${it.nombre}</strong></td>
                <td>${it.cantidadPorPersona} ${it.unidad} p.p.</td>
                <td><strong style="color: #b45309;">${it.cantidadPorPersona * cotizacion.invitados} ${pluralizarUnidad(String(it.unidad || ''), it.cantidadPorPersona * cotizacion.invitados)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${tiemposReales.length > 0 ? `
      <div class="grid-2" style="margin-top: 10px;">
        ${tiemposReales.map(t => `
          <div><strong>${t.etiqueta}:</strong><br>${t.valor}</div>
        `).join('')}
      </div>
    ` : ''}
  </div>
  ` : ''}

  ${(incluirBebestibles && bebestiblesLista.length > 0) ? `
    <div class="section-title">${htmlSec++}. Servicio de Bebestibles & Barra por Persona (p.p.)</div>
    <div class="card">
      <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569;">
            <th style="padding: 6px 4px;">Ítem Bebestible / Trago</th>
            <th style="padding: 6px 4px; text-align: center;">Consumo Estimado por Persona</th>
            <th style="padding: 6px 4px; text-align: right;">Total para ${cotizacion.invitados} Pax</th>
          </tr>
        </thead>
        <tbody>
          ${bebestiblesLista.map(b => {
            const total = Math.ceil(b.cantidadPorPersona * cotizacion.invitados);
            const unidadPlural = pluralizarUnidad(String(b.unidad || ''), total);
            const unidadPP = String(b.unidad || '');
            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 4px; font-weight: bold; color: #0f172a;">${b.nombre}</td>
                <td style="padding: 6px 4px; text-align: center; color: #7e22ce; font-weight: bold;">${b.cantidadPorPersona} ${unidadPP} p.p.</td>
                <td style="padding: 6px 4px; text-align: right; font-weight: bold; color: #047857;">${total} ${unidadPlural}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  ${(incluirStaff && tieneStaffContratado) ? `
  <div class="section-title">${htmlSec++}. Brigada de Operaciones & Personal de Servicio</div>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px;">
    ${cotizacion.personal.garzones > 0 ? `<div class="card"><strong>Garzones:</strong><br>${cotizacion.personal.garzones} profesionales (${formatMoneda(tarifasStaff?.garzonJornada || 0)}/jornada)</div>` : ''}
    ${cotizacion.personal.cocineros > 0 ? `<div class="card"><strong>Cocineros/Chefs:</strong><br>${cotizacion.personal.cocineros} profesionales (${formatMoneda(tarifasStaff?.cocineroJornada || 0)}/jornada)</div>` : ''}
    ${cotizacion.personal.aseo > 0 ? `<div class="card"><strong>Aseo/Sanitarios:</strong><br>${cotizacion.personal.aseo} auxiliares (${formatMoneda(tarifasStaff?.aseoJornada || 0)}/jornada)</div>` : ''}
    ${cotizacion.personal.maitre > 0 ? `<div class="card"><strong>Maître de Sala:</strong><br>${cotizacion.personal.maitre} coordinador (${formatMoneda(tarifasStaff?.maitreJornada || 0)}/jornada)</div>` : ''}
  </div>
  ` : ''}

  ${(incluirProveedores && proveedoresActivos.length > 0) ? `
    <div class="section-title">${htmlSec++}. Equipamiento, Técnica & Servicios de Proveedores</div>
    <div class="card">
      ${proveedoresActivos.map(p => {
        const val = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;
        return `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <div><strong>${p.nombre}</strong><br><span style="font-size: 11px; color: #64748b;">${p.descripcion}</span></div>
            <strong style="white-space: nowrap;">${formatMoneda(val)} CLP</strong>
          </div>
        `;
      }).join('')}
    </div>
  ` : ''}

  ${(incluirDecoracion && incluyeDecoracion) ? `
    <div class="section-title">${htmlSec++}. Ambientación & Decoración: ${estiloDecoracion?.nombre}</div>
    <div class="card">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <strong>${estiloDecoracion?.nombre}</strong><br>
          <span style="font-size: 11px; color: #64748b;">${estiloDecoracion?.descripcion}</span>
          ${estiloDecoracion?.elementos ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;">Incluye: ${estiloDecoracion.elementos.join(' · ')}</div>` : ''}
        </div>
        <strong style="white-space: nowrap;">${formatMoneda(estiloDecoracion?.precioVentaSugerido || 0)} CLP</strong>
      </div>
    </div>
  ` : ''}

  ${(incluirMesas && cotizacion.mesas.length > 0) ? `
  <div class="section-title">${htmlSec++}. Distribución de Salón & Mesas</div>
  <div class="card">
    <p><strong>Configuración de montaje:</strong> ${cotizacion.mesas.length} mesas distribuidas para la atención cómoda de los ${cotizacion.invitados} comensales (${capacidadTotalMesas} asientos asignados).</p>
    <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Incluye mantelería completa, numeración de mesas y plano de acceso.</p>
  </div>
  ` : ''}

  ${incluirDesgloseValores ? `
  <div class="section-title">${htmlSec++}. Desglose Detallado de Valores Finales por Ítem</div>
  <div class="card" style="padding: 0; overflow: hidden;">
    <table class="table-custom" style="margin: 0; width: 100%;">
      <thead>
        <tr>
          <th>Ítem / Concepto Contratado</th>
          <th style="text-align: center;">Provisión / Cantidad</th>
          <th style="text-align: right;">Tarifa Unitaria</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${incluirGastronomia ? `
          <tr>
            <td><strong>Servicio Gastronómico:</strong> ${menu.nombre}</td>
            <td style="text-align: center;">${cotizacion.invitados} comensales</td>
            <td style="text-align: right;">${formatMoneda(menu.precioSugeridoPersona)}/pax</td>
            <td style="text-align: right;"><strong>${formatMoneda(menu.precioSugeridoPersona * cotizacion.invitados)} CLP</strong></td>
          </tr>
        ` : ''}
        ${(incluirStaff && tieneStaffContratado) ? `
          <tr>
            <td><strong>Brigada de Personal & Servicio:</strong> ${totalStaffPersonas} profesionales</td>
            <td style="text-align: center;">Turno completo</td>
            <td style="text-align: right;">Turno evento</td>
            <td style="text-align: right;"><strong>${formatMoneda(costoStaffTotal)} CLP</strong></td>
          </tr>
        ` : ''}
        ${(incluirProveedores && proveedoresActivos.length > 0) ? proveedoresActivos.map(p => {
          const val = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;
          return `
            <tr>
              <td><strong>${p.nombre}</strong> (${p.categoria})</td>
              <td style="text-align: center;">${p.tipoCobro === 'por_persona' ? `${cotizacion.invitados} pax` : 'Tarifa fija'}</td>
              <td style="text-align: right;">${p.tipoCobro === 'por_persona' ? `${formatMoneda(p.precioVentaSugerido)}/pax` : 'Tarifa fija'}</td>
              <td style="text-align: right;"><strong>${formatMoneda(val)} CLP</strong></td>
            </tr>
          `;
        }).join('') : ''}
        ${(incluirDecoracion && incluyeDecoracion) ? `
          <tr>
            <td><strong>Ambientación & Decoración:</strong> ${estiloDecoracion?.nombre}</td>
            <td style="text-align: center;">Diseño integral</td>
            <td style="text-align: right;">Global</td>
            <td style="text-align: right;"><strong>${formatMoneda(estiloDecoracion?.precioVentaSugerido || 0)} CLP</strong></td>
          </tr>
        ` : ''}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="3" style="text-align: right; padding: 8px;">Subtotal Neto Servicios:</td>
          <td style="text-align: right; padding: 8px; font-weight: 800;">${formatMoneda(precioVentaNeto)} CLP</td>
        </tr>
        ${cotizacion.aplicaIva ? `
          <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; padding: 8px;">IVA (19%):</td>
            <td style="text-align: right; padding: 8px; font-weight: 800;">+${formatMoneda(ivaMonto)} CLP</td>
          </tr>
        ` : ''}
        <tr style="background: #fef3c7; font-weight: 900; font-size: 13px;">
          <td colspan="3" style="text-align: right; padding: 8px; color: #78350f;">TOTAL GENERAL PROPUESTA:</td>
          <td style="text-align: right; padding: 8px; color: #78350f;">${formatMoneda(totalAPagar)} CLP</td>
        </tr>
      </tfoot>
    </table>
  </div>
  ` : ''}

  <div class="total-box">
    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
      <span>Subtotal Neto de Servicios:</span>
      <span>${formatMoneda(precioVentaNeto)} CLP</span>
    </div>
    ${cotizacion.aplicaIva ? `
    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
      <span>Impuesto al Valor Agregado (IVA 19%):</span>
      <span>+${formatMoneda(ivaMonto)} CLP</span>
    </div>` : ''}
    <div style="border-top: 1px solid #334155; padding-top: 12px; margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 12px; text-transform: uppercase; color: #fbbf24; font-weight: bold;">TOTAL PROPUESTA</div>
        <div style="font-size: 11px; color: #94a3b8;">${cotizacion.aplicaIva ? 'Con IVA incluido' : 'Valores netos'}</div>
      </div>
      <div style="text-align: right;">
        <div class="total-price">${formatMoneda(totalAPagar)} CLP</div>
        <div style="font-size: 12px; color: #cbd5e1;">${formatMoneda(valorPorInvitado)} CLP por invitado</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 30px; font-size: 11px; color: #64748b; line-height: 1.6;">
    <h4 style="color: #0f172a; text-transform: uppercase; font-size: 12px; margin-bottom: 4px;">Condiciones Comerciales y de Pago:</h4>
    • Anticipo del ${porcentajeAnticipo}% (${formatMoneda(pieMonto)} CLP) para reservar y asegurar la exclusividad de la fecha.<br>
    ${esquemaPago === 'tres_pagos' ? `• Segundo Pago 30% (${formatMoneda(hito2Monto)} CLP) tras degustación y prueba de menú.<br>• Saldo Final (${100 - porcentajeAnticipo - 30}% - ${formatMoneda(saldoMonto)} CLP) hasta ${diasSaldo} días hábiles previos al evento.<br>` : esquemaPago === 'corporativo' ? `• Saldo Restante (${100 - porcentajeAnticipo}% - ${formatMoneda(saldoMonto)} CLP) contra factura a 30 días con Orden de Compra aprobada.<br>` : `• Saldo del ${100 - porcentajeAnticipo}% (${formatMoneda(saldoMonto)} CLP) hasta ${diasSaldo} días hábiles previos a la realización del evento.<br>`}
    • Confirmación final de comensales con un mínimo de 10 días de anticipación.<br>
    ${!incluyeDecoracion ? '• <em>Ambientación & Decoración: No incluida en la tarifa (Aporte directo del cliente o no requerida).</em><br>' : ''}
    ${(empresaActiva.datosBancarios && (empresaActiva.datosBancarios.razonSocial || empresaActiva.datosBancarios.numeroCuenta)) ? `• Datos de Transferencia: ${[empresaActiva.datosBancarios.razonSocial, empresaActiva.datosBancarios.banco, empresaActiva.datosBancarios.tipoCuenta, empresaActiva.datosBancarios.numeroCuenta, empresaActiva.datosBancarios.rut].filter(Boolean).join(' · ')}.<br>` : '• <em>Datos de Transferencia: A confirmar por la empresa.</em><br>'}
  </div>

  <div class="signatures">
    <div class="sig-line">
      <strong>${empresaActiva.nombre}</strong><br>
      Banquetería & Producción de Eventos
    </div>
    <div class="sig-line">
      <strong>${cotizacion.cliente || 'Firma Cliente Conforme'}</strong><br>
      Aceptación de Propuesta
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContenido], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion_formal_${(cotizacion.nombreEvento || 'evento').toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Contenedor Modal: Header fijo independiente y cuerpo scrollable separado para evitar solapamientos */}
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Barra superior de acciones (no se imprime) - Con fondo sólido y fijada en la cabecera */}
        <div className="no-print p-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Vista Previa de Cotización Formal para Cliente</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onGuardarCotizacion && (
              <button
                type="button"
                onClick={onGuardarCotizacion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                title="Guardar esta cotización en tu historial y calendario"
              >
                <Save className="w-4 h-4 text-white shrink-0" />
                <span>Guardar Ficha</span>
              </button>
            )}

            {onAbrirWhatsAppPropuesta && (
              <button
                type="button"
                onClick={onAbrirWhatsAppPropuesta}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                title="Generar propuesta por WhatsApp en 1 clic"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                <span>Enviar por WhatsApp</span>
              </button>
            )}

            {modoAdmin && (
              <button
                type="button"
                onClick={handleDescargarHTML}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
                title="Descargar archivo HTML autónomo para guardar o abrir sin conexión"
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Guardar HTML</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              title="Abrir diálogo de impresión para imprimir o guardar como PDF"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Personalización de Secciones Visibles (No se imprime) */}
        <div className="no-print px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white flex items-center gap-1.5 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Secciones en Cotización:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setIncluirGastronomia(!incluirGastronomia)}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  incluirGastronomia ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500 line-through'
                }`}
              >
                {incluirGastronomia ? '✓ Gastronomía' : '✕ Gastronomía'}
              </button>

              {bebestiblesLista.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIncluirBebestibles(!incluirBebestibles)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    incluirBebestibles ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                >
                  {incluirBebestibles ? `✓ Bebestibles (${bebestiblesLista.length})` : '✕ Bebestibles'}
                </button>
              )}

              {tieneStaffContratado && (
                <button
                  type="button"
                  onClick={() => setIncluirStaff(!incluirStaff)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    incluirStaff ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                >
                  {incluirStaff ? `✓ Staff (${totalStaffPersonas})` : '✕ Staff'}
                </button>
              )}

              {proveedoresActivos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIncluirProveedores(!incluirProveedores)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    incluirProveedores ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                >
                  {incluirProveedores ? `✓ Proveedores (${proveedoresActivos.length})` : '✕ Proveedores'}
                </button>
              )}

              {incluyeDecoracion && (
                <button
                  type="button"
                  onClick={() => setIncluirDecoracion(!incluirDecoracion)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    incluirDecoracion ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                >
                  {incluirDecoracion ? '✓ Decoración' : '✕ Decoración'}
                </button>
              )}

              {cotizacion.mesas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIncluirMesas(!incluirMesas)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    incluirMesas ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-500 line-through'
                  }`}
                  title={incluirMesas ? 'Clic para omitir mesas' : 'Clic para incluir mesas'}
                >
                  {incluirMesas ? '✓ Distribución Mesas' : '✕ Mesas Omitidas'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIncluirDesgloseValores(!incluirDesgloseValores)}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  incluirDesgloseValores ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-500 line-through'
                }`}
              >
                {incluirDesgloseValores ? '✓ Detalle Valores' : '✕ Detalle Valores'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIncluirMesas(false);
                if (!tieneStaffContratado) setIncluirStaff(false);
              }}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Ajustar automáticamente para servicio a domicilio: oculta mesas y servicios no requeridos"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>🚚 Modo Solo Servicio / A Domicilio</span>
            </button>
            {(!incluirMesas || !incluirStaff) && (
              <button
                type="button"
                onClick={() => {
                  setIncluirGastronomia(true);
                  setIncluirBebestibles(bebestiblesLista.length > 0);
                  setIncluirStaff(tieneStaffContratado);
                  setIncluirProveedores(proveedoresActivos.length > 0);
                  setIncluirDecoracion(incluyeDecoracion);
                  setIncluirMesas(cotizacion.mesas.length > 0);
                  setIncluirDesgloseValores(true);
                }}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                title="Restablecer todas las secciones estándar"
              >
                Restablecer todas
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO IMPRIMIBLE DE LA FICHA - Contenedor scrollable independiente */}
        <div className="p-6 sm:p-10 space-y-7 bg-white text-slate-900 flex-1 overflow-y-auto" id="seccion-cotizacion-imprimible">
          
          {/* Membrete Oficial del Centro de Eventos */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif font-black text-xl shadow-xs shrink-0">
                  {empresaActiva.letraLogo || 'SF'}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {empresaActiva.nombre.toUpperCase()}
                  </h1>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest block mt-0.5">
                    {empresaActiva.subtitulo} · {empresaActiva.recintoPrincipal}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-3 space-y-0.5">
                <p className="font-semibold text-slate-700">Recinto: {empresaActiva.recintoPrincipal} · {empresaActiva.direccion}, {empresaActiva.ciudad}</p>
                <p>
                  {empresaActiva.rutEmpresa && <span className="font-semibold text-slate-800">RUT: {empresaActiva.rutEmpresa} · </span>}
                  {empresaActiva.contactoResponsable && <span>Resp: <strong>{empresaActiva.contactoResponsable}</strong>{empresaActiva.cargoResponsable ? ` (${empresaActiva.cargoResponsable})` : ''} · </span>}
                  Contacto comercial: {empresaActiva.email} · Tel/WhatsApp: {empresaActiva.telefono}
                </p>
                {(empresaActiva.sitioWeb || empresaActiva.instagram) && (
                  <p>
                    {empresaActiva.instagram && <span className="text-pink-700 font-semibold mr-3">IG: {empresaActiva.instagram}</span>}
                    {empresaActiva.sitioWeb && <span>Sitio web: {empresaActiva.sitioWeb} · Región Metropolitana, Chile</span>}
                  </p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Presupuesto Oficial Matrimonios & Eventos
              </span>
              <div className="text-lg font-black text-slate-900 tabular-nums">
                COT-2026-{Math.floor(1000 + Math.random() * 9000)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Fecha emisión: {new Date().toLocaleDateString('es-CL')}
              </div>
              <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                Validez: 15 días continuos
              </div>
            </div>
          </div>

          {/* Información del Cliente & Evento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente / Empresa:</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                {cotizacion.cliente && cotizacion.cliente.trim() ? cotizacion.cliente : '[CLIENTE]'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo de Celebración:</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {cotizacion.tipoEvento}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha del Evento:</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {formatFechaEsp(cotizacion.fechaEvento)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cantidad de Invitados:</span>
              <span className="font-extrabold text-amber-900 text-sm mt-0.5 block tabular-nums">
                {cotizacion.invitados} Comensales
              </span>
            </div>
          </div>

          {/* 1. Detalle del Menú Gastronómico (Adaptado 100% al Evento) */}
          {incluirGastronomia && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>{getNextNum()}. Propuesta Gastronómica: {menu.nombre}</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-900 tabular-nums">
                    {formatMoneda(menu.precioSugeridoPersona * cotizacion.invitados)} CLP ({formatMoneda(menu.precioSugeridoPersona)}/pax)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluirGastronomia(false)}
                    className="no-print text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Omitir propuesta gastronómica de la cotización"
                  >
                    ✕ Omitir
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-800 font-medium italic">
                    &ldquo;{menu.descripcion}&rdquo;
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md uppercase tracking-wider">
                    Categoría: {menu.categoria}
                  </span>
                </div>

                {/* Si el menú tiene Ratios / Ítems por Persona (ej: Sándwiches, Bebidas), mostrar desglose de compra exacto */}
                {tieneItemsPorPersona && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Consumos Exactos por Comensal (Para los {cotizacion.invitados} comensales):
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-amber-200 rounded-lg overflow-hidden bg-white">
                        <thead className="bg-amber-100/70 text-amber-950 font-bold text-[11px]">
                          <tr>
                            <th className="py-2 px-3">Ítem / Preparación</th>
                            <th className="py-2 px-3 text-center">Consumo p.p.</th>
                            <th className="py-2 px-3 text-right">Total a Preparar / Servir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {menu.itemsPorPersona?.map(it => {
                            const total = it.cantidadPorPersona * cotizacion.invitados;
                            return (
                              <tr key={it.id} className="hover:bg-amber-50/30">
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {it.nombre}
                                </td>
                                <td className="py-2 px-3 text-center text-slate-600">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 text-[11px]">
                                    {it.cantidadPorPersona} {it.unidad} p.p.
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-black text-amber-950 tabular-nums">
                                  {total} {pluralizarUnidad(String(it.unidad || ''), total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tiempos de banquete reales (únicamente si existen y no son texto relleno) */}
                {tiemposReales.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tiemposReales.map(t => (
                        <div key={t.etiqueta}>
                          <span className="font-bold text-slate-800">{t.etiqueta}:</span>
                          <p className="text-slate-600 mt-0.5">{t.valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1.5. Servicio de Bebestibles & Barra por Persona (p.p.) */}
          {incluirBebestibles && bebestiblesLista.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Wine className="w-4 h-4 text-purple-600" />
                  <span>{getNextNum()}. Servicio de Bebestibles & Barra por Persona (p.p.)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {bebestiblesLista.length} ítems considerados
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluirBebestibles(false)}
                    className="no-print text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Omitir servicio de bebestibles"
                  >
                    ✕ Omitir
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200/80 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-200 text-left text-slate-500 text-[10px] uppercase tracking-wider">
                        <th className="pb-2 font-bold">Bebestible / Coctelería</th>
                        <th className="pb-2 text-center font-bold">Consumo Estimado p.p.</th>
                        <th className="pb-2 text-right font-bold">Total para {cotizacion.invitados} Comensales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {bebestiblesLista.map((it) => {
                        const totalCalculado = Math.ceil(it.cantidadPorPersona * cotizacion.invitados);
                        return (
                          <tr key={it.id} className="py-2">
                            <td className="py-2 font-bold text-slate-800">
                              {it.nombre}
                            </td>
                            <td className="py-2 text-center text-purple-900 font-extrabold tabular-nums">
                              {it.cantidadPorPersona} {it.unidad} p.p.
                            </td>
                            <td className="py-2 text-right font-extrabold text-emerald-800 tabular-nums">
                              {totalCalculado} {pluralizarUnidad(String(it.unidad || ''), totalCalculado)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-purple-950/80 italic">
                  * Provisión calculada para los {cotizacion.invitados} invitados del evento. Incluye barra, cristalería adecuada, hielo purificado y atención continua.
                </p>
              </div>
            </div>
          )}

          {/* 2. Personal & Brigada de Servicio Incluida (SOLO si fue contratado) */}
          {incluirStaff && tieneStaffContratado && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{getNextNum()}. Staff de Operaciones & Brigada de Salón</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    {totalStaffPersonas} profesionales en turno
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluirStaff(false)}
                    className="no-print text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Omitir staff de la cotización"
                  >
                    ✕ Omitir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {cotizacion.personal.garzones > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Garzones de Salón:</span>
                    <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.garzones} persona(s)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{formatMoneda(tarifasStaff?.garzonJornada || 0)} / jornada</span>
                  </div>
                )}
                {cotizacion.personal.cocineros > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Chefs & Cocineros:</span>
                    <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.cocineros} persona(s)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{formatMoneda(tarifasStaff?.cocineroJornada || 0)} / jornada</span>
                  </div>
                )}
                {cotizacion.personal.aseo > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Aseo y Sanitarios:</span>
                    <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.aseo} persona(s)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{formatMoneda(tarifasStaff?.aseoJornada || 0)} / jornada</span>
                  </div>
                )}
                {cotizacion.personal.maitre > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Maître de Sala:</span>
                    <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.maitre} persona(s)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{formatMoneda(tarifasStaff?.maitreJornada || 0)} / jornada</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Servicios & Proveedores Contratados (Solo si hay contrataciones reales) */}
          {incluirProveedores && proveedoresActivos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{getNextNum()}. Equipamiento, Técnica & Servicios de Proveedores</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIncluirProveedores(false)}
                  className="no-print text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Omitir proveedores de la cotización"
                >
                  ✕ Omitir
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                {proveedoresActivos.map((p) => {
                  const ventaItem = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;

                  return (
                    <div key={p.id} className="py-2 flex items-start justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-800">{p.nombre}</span>
                        <p className="text-slate-500 text-[11px]">{p.descripcion}</p>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums shrink-0">
                        {formatMoneda(ventaItem)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Ambientación & Decoración: Solo se muestra si está contratada y no es $0 */}
          {incluirDecoracion && incluyeDecoracion && estiloDecoracion && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  {getNextNum()}. Concepto de Ambientación: {estiloDecoracion.nombre}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-900 tabular-nums">
                    {formatMoneda(estiloDecoracion.precioVentaSugerido)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluirDecoracion(false)}
                    className="no-print text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Omitir decoración de la cotización"
                  >
                    ✕ Omitir
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
                <p className="text-slate-600">
                  {estiloDecoracion.descripcion}
                </p>
                {estiloDecoracion.elementos && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">Incluye:</span>{' '}
                    {estiloDecoracion.elementos.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Esquema de Mesas y Montaje (Libertad total de omitir en evento a domicilio o solo servicio) */}
          {incluirMesas && cotizacion.mesas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  {getNextNum()}. Distribución de Salón & Mesas
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800">
                    {cotizacion.mesas.length} mesas ({capacidadTotalMesas} puestos para {cotizacion.invitados} comensales)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncluirMesas(false)}
                    className="no-print text-[11px] text-rose-700 hover:text-rose-900 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Eliminar esta sección si el evento es a domicilio o solo servicio"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Eliminar (Solo Servicio / A Domicilio)</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Montaje y distribución coordinada para {cotizacion.invitados} comensales. El salón incluye mantelería completa, numeración de mesas y plano de distribución para la recepción.
              </p>
            </div>
          )}

          {/* 6. Desglose Detallado de Valores Finales por Ítem */}
          {incluirDesgloseValores && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>{getNextNum()}. Desglose Detallado de Valores Finales por Ítem</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  Transparencia Total de Presupuesto
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ítem / Concepto Contratado</th>
                      <th className="py-2.5 px-3 text-center">Provisión / Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Tarifa Unitaria</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incluirGastronomia && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">Servicio Gastronómico: {menu.nombre}</span>
                          <span className="text-[10px] text-slate-400">Categoría: {menu.categoria}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {cotizacion.invitados} comensales
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          {formatMoneda(menu.precioSugeridoPersona)} / pax
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                          {formatMoneda(menu.precioSugeridoPersona * cotizacion.invitados)}
                        </td>
                      </tr>
                    )}

                    {incluirStaff && tieneStaffContratado && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">Brigada de Personal & Servicio</span>
                          <span className="text-[10px] text-slate-400">
                            {[
                              cotizacion.personal.garzones > 0 ? `${cotizacion.personal.garzones} garzones` : null,
                              cotizacion.personal.cocineros > 0 ? `${cotizacion.personal.cocineros} cocineros` : null,
                              cotizacion.personal.aseo > 0 ? `${cotizacion.personal.aseo} aseo` : null,
                              cotizacion.personal.maitre > 0 ? `${cotizacion.personal.maitre} maître` : null
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {totalStaffPersonas} profesionales
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          Turno completo
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                          {formatMoneda(costoStaffTotal)}
                        </td>
                      </tr>
                    )}

                    {incluirProveedores && proveedoresActivos.map((p) => {
                      const val = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{p.nombre}</span>
                            <span className="text-[10px] text-slate-400">{p.descripcion}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                            {p.tipoCobro === 'por_persona' ? `${cotizacion.invitados} pax` : 'Tarifa fija evento'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                            {p.tipoCobro === 'por_persona' ? `${formatMoneda(p.precioVentaSugerido)}/pax` : 'Tarifa única'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                            {formatMoneda(val)}
                          </td>
                        </tr>
                      );
                    })}

                    {incluirDecoracion && incluyeDecoracion && estiloDecoracion && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">Ambientación: {estiloDecoracion.nombre}</span>
                          <span className="text-[10px] text-slate-400">{estiloDecoracion.descripcion}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          Diseño integral
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                          Global
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                          {formatMoneda(estiloDecoracion.precioVentaSugerido)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-700 text-right">
                        Subtotal Neto Servicios:
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatMoneda(precioVentaNeto)} CLP
                      </td>
                    </tr>
                    {cotizacion.aplicaIva && (
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-slate-700 text-right">
                          Impuesto al Valor Agregado (IVA 19%):
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                          +{formatMoneda(ivaMonto)} CLP
                        </td>
                      </tr>
                    )}
                    <tr className="bg-amber-100/70 text-amber-950 font-black">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs">
                        Total Final de la Propuesta:
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-sm font-black text-amber-900">
                        {formatMoneda(totalAPagar)} CLP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Resumen Económico Final para el Cliente */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Subtotal Neto Servicios:</span>
              <span className="font-bold tabular-nums text-sm text-white">
                {formatMoneda(precioVentaNeto)}
              </span>
            </div>

            {cotizacion.aplicaIva && (
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Impuesto al Valor Agregado (IVA 19%):</span>
                <span className="font-bold tabular-nums text-sm text-white">
                  +{formatMoneda(ivaMonto)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold block uppercase tracking-wider">
                  Total Final Propuesta
                </span>
                <span className="text-[11px] text-slate-400">
                  {cotizacion.aplicaIva ? 'Valores con IVA incluido' : 'Valores netos exentos'}
                </span>
              </div>

              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  {formatMoneda(totalAPagar)}
                </div>
                <div className="text-xs text-slate-300 tabular-nums font-medium">
                  {formatMoneda(valorPorInvitado)} por comensal
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones Comerciales, Datos de Pago y Firmas */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              Condiciones Comerciales & Forma de Pago:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-slate-800">Anticipo {porcentajeAnticipo}%:</strong> {formatMoneda(pieMonto)} CLP para reservar la exclusividad de la fecha.</li>
                {esquemaPago === 'tres_pagos' ? (
                  <>
                    <li><strong className="text-slate-800">Segundo Pago 30%:</strong> {formatMoneda(hito2Monto)} CLP tras degustación y aprobación.</li>
                    <li><strong className="text-slate-800">Saldo Final {100 - porcentajeAnticipo - 30}%:</strong> {formatMoneda(saldoMonto)} CLP hasta {diasSaldo} días hábiles previos.</li>
                  </>
                ) : esquemaPago === 'corporativo' ? (
                  <li><strong className="text-slate-800">Saldo {100 - porcentajeAnticipo}%:</strong> {formatMoneda(saldoMonto)} CLP contra factura 30 días (con O.C.).</li>
                ) : (
                  <li><strong className="text-slate-800">Saldo {100 - porcentajeAnticipo}%:</strong> {formatMoneda(saldoMonto)} CLP hasta {diasSaldo} días hábiles previos al evento.</li>
                )}
                <li>Confirmación definitiva de comensales con un mínimo de 10 días de anticipación.</li>
                {!incluyeDecoracion && (
                  <li><strong className="text-slate-700">Ambientación & Decoración:</strong> No incluida en la propuesta (Aporte directo del cliente o no requerida).</li>
                )}
                <li>Horario estándar: uso exclusivo del recinto según bloque acordado.</li>
              </ul>

              <div className="border-t sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-4 pt-2 sm:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-800 block">Datos de Transferencia Bancaria:</strong>
                  {onUpdateEmpresaActiva && (
                    <button
                      type="button"
                      onClick={() => setEditandoBanco(!editandoBanco)}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                      title="Editar y guardar los datos bancarios de esta empresa (quedan guardados en el perfil)"
                    >
                      {editandoBanco ? 'Cancelar' : '✏️ Editar'}
                    </button>
                  )}
                </div>

                {editandoBanco ? (
                  <div className="space-y-1.5 mt-1 p-2 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <input type="text" value={dbRazon} onChange={(e) => setDbRazon(e.target.value)} placeholder="Razón Social" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <input type="text" value={dbRut} onChange={(e) => setDbRut(e.target.value)} placeholder="RUT (ej: 77.892.410-K)" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <input type="text" value={dbBanco} onChange={(e) => setDbBanco(e.target.value)} placeholder="Banco (ej: Banco de Chile)" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <select value={dbTipo} onChange={(e) => setDbTipo(e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white">
                      <option>Cuenta Corriente</option>
                      <option>Cuenta Vista</option>
                      <option>Cuenta RUT</option>
                      <option>Cuenta de Ahorro</option>
                    </select>
                    <input type="text" value={dbNumero} onChange={(e) => setDbNumero(e.target.value)} placeholder="N° Cuenta" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <input type="text" value={dbTitular} onChange={(e) => setDbTitular(e.target.value)} placeholder="Titular (si es distinto a la razón social)" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <input type="email" value={dbEmail} onChange={(e) => setDbEmail(e.target.value)} placeholder="Correo para comprobantes" className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                    <button type="button" onClick={guardarDatosBancarios} className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs mt-1 cursor-pointer">
                      Guardar datos bancarios
                    </button>
                    <p className="text-[10px] text-slate-500 italic">Quedan guardados en el perfil de esta empresa. No vuelven a aparecer los datos ficticios.</p>
                  </div>
                ) : empresaActiva.datosBancarios && (empresaActiva.datosBancarios.razonSocial || empresaActiva.datosBancarios.numeroCuenta) ? (
                  <>
                    {empresaActiva.datosBancarios.razonSocial && <p>• Razón Social: {empresaActiva.datosBancarios.razonSocial}</p>}
                    {empresaActiva.datosBancarios.rut && <p>• RUT: {empresaActiva.datosBancarios.rut}</p>}
                    {empresaActiva.datosBancarios.banco && <p>• Banco: {empresaActiva.datosBancarios.banco}{empresaActiva.datosBancarios.tipoCuenta ? ` · ${empresaActiva.datosBancarios.tipoCuenta}` : ''}</p>}
                    {empresaActiva.datosBancarios.numeroCuenta && <p>• N° Cuenta: {empresaActiva.datosBancarios.numeroCuenta}</p>}
                    {empresaActiva.datosBancarios.titular && <p>• Titular: {empresaActiva.datosBancarios.titular}</p>}
                    {empresaActiva.datosBancarios.emailTransferencia && <p>• Correo: {empresaActiva.datosBancarios.emailTransferencia}</p>}
                  </>
                ) : (
                  <p className="italic text-slate-500">Datos bancarios a confirmar por la empresa (no configurados todavía). Clic en "Editar" para llenarlos.</p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">{empresaActiva.nombre} · {empresaActiva.recintoPrincipal}</p>
                <p className="text-[10px]">Banquetería & Coordinación de Eventos</p>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">{cotizacion.cliente || 'Firma Cliente Conforme'}</p>
                <p className="text-[10px]">Aceptación de Propuesta</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
