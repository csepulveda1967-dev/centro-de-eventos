import React, { useState } from 'react';
import { CotizacionState, MenuOption, ProveedorServicio, EstiloDecoracion, StaffTarifas, EmpresaCliente } from '../types';
import { formatMoneda, formatFechaEsp } from '../utils/formatters';
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
  FileText
} from 'lucide-react';

interface FichaCotizacionModalProps {
  cotizacion: CotizacionState;
  menu: MenuOption;
  proveedores: ProveedorServicio[];
  estiloDecoracion: EstiloDecoracion;
  tarifasStaff: StaffTarifas;
  precioVentaNeto: number;
  ivaMonto: number;
  precioVentaTotal: number;
  empresaActiva: EmpresaCliente;
  onClose: () => void;
  onAbrirWhatsAppPropuesta?: () => void;
  modoAdmin?: boolean;
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
  modoAdmin = false
}) => {
  const [copiado, setCopiado] = useState(false);

  const proveedoresActivos = proveedores.filter(p => cotizacion.proveedoresSeleccionados[p.id]);
  const capacidadTotalMesas = cotizacion.mesas.reduce((s, m) => s + m.capacidad, 0);

  const totalAPagar = cotizacion.aplicaIva ? precioVentaTotal : precioVentaNeto;
  const porcentajeAnticipo = cotizacion.porcentajeAnticipo ?? 40;
  const esquemaPago = cotizacion.esquemaPago ?? 'dos_pagos';
  const diasSaldo = cotizacion.diasSaldo ?? 7;
  const pieMonto = Math.round(totalAPagar * (porcentajeAnticipo / 100));
  const hito2Monto = esquemaPago === 'tres_pagos' ? Math.round(totalAPagar * 0.30) : 0;
  const saldoMonto = totalAPagar - pieMonto - hito2Monto;
  const valorPorInvitado = Math.round(totalAPagar / Math.max(1, cotizacion.invitados));

  const handlePrint = () => {
    window.print();
  };

  const handleDescargarHTML = () => {
    const htmlContenido = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización Formal - ${cotizacion.nombreEvento} - ${empresaActiva.nombre}</title>
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
        ${empresaActiva.direccion}, ${empresaActiva.ciudad} · Tel: ${empresaActiva.telefono} · Email: ${empresaActiva.email}
      </p>
    </div>
    <div style="text-align: right; font-size: 12px;">
      <div style="font-weight: 900; font-size: 16px; color: #0f172a;">COT-2026-${Math.floor(1000 + Math.random() * 9000)}</div>
      <div style="color: #64748b;">Fecha Emisión: ${new Date().toLocaleDateString('es-CL')}</div>
      <div style="color: #047857; font-weight: bold;">Validez: 15 días continuos</div>
    </div>
  </div>

  <div class="meta-box">
    <div>
      <div class="meta-label">Cliente / Solicitante:</div>
      <div class="meta-val">${cotizacion.cliente || 'Por definir'}</div>
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

  <div class="section-title">1. Propuesta Gastronómica: ${menu.nombre}</div>
  <div class="card">
    <p style="font-style: italic; color: #334155; margin-bottom: 10px;">"${menu.descripcion}"</p>
    <div class="grid-2">
      <div><strong>Cóctel de Bienvenida:</strong><br>${menu.tiempos.coctel}</div>
      <div><strong>Entrada Gourmet:</strong><br>${menu.tiempos.entrada}</div>
      <div><strong>Plato de Fondo:</strong><br>${menu.tiempos.fondo}</div>
      <div><strong>Mesa de Postres:</strong><br>${menu.tiempos.postre}</div>
    </div>
    <p style="margin-top: 10px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      <strong>Trasnoche / Fin de Fiesta:</strong> ${menu.tiempos.trasnoche}
    </p>
  </div>

  <div class="section-title">2. Brigada de Operaciones & Personal de Servicio</div>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px;">
    <div class="card"><strong>Garzones:</strong><br>${cotizacion.personal.garzones} profesionales</div>
    <div class="card"><strong>Cocineros/Chefs:</strong><br>${cotizacion.personal.cocineros} cocineros</div>
    <div class="card"><strong>Aseo/Sanitarios:</strong><br>${cotizacion.personal.aseo} personas</div>
    <div class="card"><strong>Maître de Sala:</strong><br>${cotizacion.personal.maitre} coordinador</div>
  </div>

  <div class="section-title">3. Ambientación & Decoración</div>
  <div class="card">
    <strong>${estiloDecoracion.nombre}:</strong> ${estiloDecoracion.descripcion}<br>
    <span style="font-size: 11px; color: #64748b;">Incluye: ${estiloDecoracion.elementos.join(' · ')}</span>
  </div>

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
    • Datos de Transferencia: Dominga Eventos SpA · Banco de Chile · Cta Cte 00-189-23491-09 · RUT 77.892.410-K.
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
    a.download = `cotizacion_formal_${cotizacion.nombreEvento.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Barra superior de acciones (no se imprime) */}
        <div className="no-print p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 rounded-t-3xl border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Vista Previa de Cotización Formal para Cliente</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onAbrirWhatsAppPropuesta && (
              <button
                type="button"
                onClick={onAbrirWhatsAppPropuesta}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                title="Generar propuesta por WhatsApp en 1 clic"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
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
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Guardar HTML</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs"
              title="Abrir diálogo de impresión para imprimir o guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO IMPRIMIBLE DE LA FICHA */}
        <div className="p-6 sm:p-10 space-y-8 bg-white text-slate-900" id="seccion-cotizacion-imprimible">
          
          {/* Membrete Oficial del Centro de Eventos */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif font-black text-xl shadow-xs">
                  {empresaActiva.letraLogo}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {empresaActiva.nombre.toUpperCase()}
                  </h1>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest">
                    {empresaActiva.subtitulo} · {empresaActiva.recintoPrincipal}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-3 space-y-0.5">
                <p className="font-semibold text-slate-700">Recinto: {empresaActiva.recintoPrincipal} · {empresaActiva.direccion}, {empresaActiva.ciudad}</p>
                <p>Contacto comercial: {empresaActiva.email} · Tel/WhatsApp: {empresaActiva.telefono}</p>
                {empresaActiva.sitioWeb && (
                  <p>Sitio web: {empresaActiva.sitioWeb} · Región Metropolitana, Chile</p>
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
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {cotizacion.cliente || 'Por definir'}
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

          {/* 1. Detalle del Menú Gastronómico */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                1. Propuesta Gastronómica: {menu.nombre}
              </h3>
              <span className="text-xs font-bold text-amber-900 tabular-nums">
                {formatMoneda(menu.precioSugeridoPersona * cotizacion.invitados)}
              </span>
            </div>

            <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 text-xs space-y-2">
              <p className="text-slate-700 italic mb-3">
                &ldquo;{menu.descripcion}&rdquo;
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-800">Cóctel de Bienvenida:</span>
                  <p className="text-slate-600 mt-0.5">{menu.tiempos.coctel}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Entrada Gourmet:</span>
                  <p className="text-slate-600 mt-0.5">{menu.tiempos.entrada}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Plato de Fondo:</span>
                  <p className="text-slate-600 mt-0.5">{menu.tiempos.fondo}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Mesa de Postres:</span>
                  <p className="text-slate-600 mt-0.5">{menu.tiempos.postre}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Trasnoche / Fin de Fiesta:</span> {menu.tiempos.trasnoche}
              </div>
            </div>
          </div>

          {/* 2. Personal & Brigada de Servicio Incluida */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                2. Staff de Operaciones & Brigada de Salón
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Incluido en la tarifa
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Garzones de Salón:</span>
                <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.garzones} personas</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Chefs & Cocineros:</span>
                <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.cocineros} personas</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Aseo y Sanitarios:</span>
                <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.aseo} personas</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Maître de Sala:</span>
                <span className="font-bold text-slate-900 text-sm">{cotizacion.personal.maitre} persona(s)</span>
              </div>
            </div>
          </div>

          {/* 3. Servicios & Proveedores Contratados */}
          {proveedoresActivos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  3. Equipamiento, Técnica & Servicios de Proveedores
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {proveedoresActivos.map((p) => {
                  const ventaItem = p.tipoCobro === 'por_persona' ? p.precioVentaSugerido * cotizacion.invitados : p.precioVentaSugerido;

                  return (
                    <div key={p.id} className="py-2.5 flex items-start justify-between gap-4">
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

          {/* 4. Ambientación & Decoración */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                4. Concepto de Ambientación: {estiloDecoracion.nombre}
              </h3>
              <span className="text-xs font-bold text-rose-900 tabular-nums">
                {formatMoneda(estiloDecoracion.precioVentaSugerido)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <p className="text-slate-600">{estiloDecoracion.descripcion}</p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span className="font-bold text-slate-700">Incluye:</span>{' '}
                {estiloDecoracion.elementos.join(' · ')}
              </div>
            </div>
          </div>

          {/* 5. Esquema de Mesas Resumen */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                5. Distribución de Salón & Mesas
              </h3>
              <span className="text-xs font-bold text-emerald-800">
                {cotizacion.mesas.length} mesas ({capacidadTotalMesas} puestos asignados)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              El salón incluye mantelería completa, numeración de mesas y plano de distribución a la entrada para la bienvenida de los invitados.
            </p>
          </div>

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
                <li>Horario estándar: 9 horas de uso exclusivo del centro de eventos (hasta las 05:00 AM).</li>
              </ul>

              <div className="border-t sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-4 pt-2 sm:pt-0 space-y-1">
                <strong className="text-slate-800 block">Datos de Transferencia Bancaria:</strong>
                <p>• Razón Social: Dominga Eventos SpA</p>
                <p>• RUT: 77.892.410-K</p>
                <p>• Banco: Banco de Chile · Cuenta Corriente</p>
                <p>• N° Cuenta: 00-189-23491-09</p>
                <p>• Correo: {empresaActiva.email}</p>
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
