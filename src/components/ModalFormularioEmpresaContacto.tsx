import React, { useState } from 'react';
import { EmpresaCliente } from '../types';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Landmark,
  FileText,
  CheckCircle2,
  X,
  Share2,
  Printer,
  Sparkles,
  Info,
  DollarSign,
  Briefcase,
  Copy,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';

interface ModalFormularioEmpresaContactoProps {
  empresaActiva: EmpresaCliente;
  onGuardarEmpresa: (empresaActualizada: EmpresaCliente, crearComoNueva?: boolean) => void;
  onClose: () => void;
}

export const ModalFormularioEmpresaContacto: React.FC<ModalFormularioEmpresaContactoProps> = ({
  empresaActiva,
  onGuardarEmpresa,
  onClose
}) => {
  // Sección activa del formulario
  const [seccionActiva, setSeccionActiva] = useState<'empresa' | 'contacto' | 'ubicacion' | 'banco' | 'condiciones'>('empresa');

  // Modo: actualizar la empresa activa o registrar como una nueva empresa
  const [crearComoNueva, setCrearComoNueva] = useState(false);

  // Estados de datos generales de la empresa
  const [nombre, setNombre] = useState(empresaActiva.nombre || '');
  const [subtitulo, setSubtitulo] = useState(empresaActiva.subtitulo || '');
  const [razonSocialLegal, setRazonSocialLegal] = useState(empresaActiva.razonSocialLegal || empresaActiva.datosBancarios?.razonSocial || '');
  const [rutEmpresa, setRutEmpresa] = useState(empresaActiva.rutEmpresa || empresaActiva.datosBancarios?.rut || '');
  const [giroComercial, setGiroComercial] = useState(empresaActiva.giroComercial || 'Banquetería, Producción y Eventos Gastronómicos');
  const [letraLogo, setLetraLogo] = useState(empresaActiva.letraLogo || 'E');
  const [colorTema, setColorTema] = useState<EmpresaCliente['colorTema']>(empresaActiva.colorTema || 'amber');

  // Contacto & Representante
  const [contactoResponsable, setContactoResponsable] = useState(empresaActiva.contactoResponsable || '');
  const [cargoResponsable, setCargoResponsable] = useState(empresaActiva.cargoResponsable || 'Administrador General / Productor');
  const [telefono, setTelefono] = useState(empresaActiva.telefono || '+56 9 ');
  const [email, setEmail] = useState(empresaActiva.email || '');
  const [sitioWeb, setSitioWeb] = useState(empresaActiva.sitioWeb || '');
  const [instagram, setInstagram] = useState(empresaActiva.instagram || '');

  // Ubicación & Modalidad
  const [modalidadOperacion, setModalidadOperacion] = useState<'domicilio' | 'recinto_fijo' | 'mixto'>(
    empresaActiva.modalidadOperacion || (empresaActiva.recintoPrincipal?.toLowerCase().includes('domicilio') || empresaActiva.recintoPrincipal?.toLowerCase().includes('itinerante') ? 'domicilio' : 'recinto_fijo')
  );
  const [recintoPrincipal, setRecintoPrincipal] = useState(empresaActiva.recintoPrincipal || '');
  const [direccion, setDireccion] = useState(empresaActiva.direccion || '');
  const [ciudad, setCiudad] = useState(empresaActiva.ciudad || 'Santiago, Chile');
  const [capacidadMaxPax, setCapacidadMaxPax] = useState<number>(empresaActiva.capacidadMaxPax || 250);

  // Datos Bancarios
  const [banco, setBanco] = useState(empresaActiva.datosBancarios?.banco || 'Banco Santander');
  const [tipoCuenta, setTipoCuenta] = useState(empresaActiva.datosBancarios?.tipoCuenta || 'Cuenta Corriente');
  const [numeroCuenta, setNumeroCuenta] = useState(empresaActiva.datosBancarios?.numeroCuenta || '');
  const [rutTitular, setRutTitular] = useState(empresaActiva.datosBancarios?.rut || empresaActiva.rutEmpresa || '');
  const [titularCuenta, setTitularCuenta] = useState(empresaActiva.datosBancarios?.titular || empresaActiva.datosBancarios?.razonSocial || '');
  const [emailTransferencia, setEmailTransferencia] = useState(empresaActiva.datosBancarios?.emailTransferencia || empresaActiva.email || '');

  // Condiciones Comerciales por defecto
  const [porcentajeAnticipo, setPorcentajeAnticipo] = useState<number>(empresaActiva.porcentajeAnticipoDefault || 40);
  const [validezDias, setValidezDias] = useState<number>(empresaActiva.validezCotizacionDefault || 15);
  const [condicionesPago, setCondicionesPago] = useState(empresaActiva.condicionesPagoDefault || '40% al reservar fecha y firmar contrato, 60% restante hasta 7 días corridos antes del evento.');

  // Feedback al usuario
  const [mensajeGuardado, setMensajeGuardado] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);

  // Auto-ajustar inicial del logo si el usuario cambia el nombre y la inicial era automática
  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (!letraLogo || letraLogo.length <= 1) {
      const inicial = val.trim().charAt(0).toUpperCase();
      if (inicial) setLetraLogo(inicial);
    }
  };

  const handleGuardar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa al menos el Nombre Comercial de la Empresa.');
      return;
    }

    const empresaActualizada: EmpresaCliente = {
      ...empresaActiva,
      id: crearComoNueva ? `emp-${Date.now()}` : empresaActiva.id,
      nombre: nombre.trim(),
      subtitulo: subtitulo.trim() || 'Servicios Gastronómicos & Eventos',
      recintoPrincipal: recintoPrincipal.trim() || (modalidadOperacion === 'domicilio' ? 'Servicio a Domicilio / Itinerante' : nombre.trim()),
      direccion: direccion.trim() || 'Dirección comercial a convenir',
      ciudad: ciudad.trim() || 'Santiago, Chile',
      telefono: telefono.trim(),
      email: email.trim(),
      sitioWeb: sitioWeb.trim() || undefined,
      letraLogo: (letraLogo.trim() || nombre.trim().charAt(0) || 'E').toUpperCase().slice(0, 3),
      colorTema,
      fechaRegistro: crearComoNueva ? new Date().toISOString().slice(0, 10) : empresaActiva.fechaRegistro,
      datosBancarios: {
        razonSocial: razonSocialLegal.trim() || nombre.trim(),
        banco: banco.trim() || undefined,
        tipoCuenta: tipoCuenta.trim() || undefined,
        numeroCuenta: numeroCuenta.trim() || undefined,
        rut: (rutTitular.trim() || rutEmpresa.trim()) || undefined,
        titular: titularCuenta.trim() || undefined,
        emailTransferencia: emailTransferencia.trim() || email.trim() || undefined
      },
      razonSocialLegal: razonSocialLegal.trim() || undefined,
      rutEmpresa: rutEmpresa.trim() || undefined,
      giroComercial: giroComercial.trim() || undefined,
      contactoResponsable: contactoResponsable.trim() || undefined,
      cargoResponsable: cargoResponsable.trim() || undefined,
      instagram: instagram.trim() || undefined,
      modalidadOperacion,
      capacidadMaxPax: Number(capacidadMaxPax) || 250,
      porcentajeAnticipoDefault: Number(porcentajeAnticipo) || 40,
      validezCotizacionDefault: Number(validezDias) || 15,
      condicionesPagoDefault: condicionesPago.trim() || undefined
    };

    onGuardarEmpresa(empresaActualizada, crearComoNueva);
    setMensajeGuardado(true);
    setTimeout(() => {
      setMensajeGuardado(false);
      onClose();
    }, 1200);
  };

  // Construir resumen estructurado de contratación
  const construirTextoFicha = () => {
    return `📄 *FICHA DE CONTRATACIÓN Y REGISTRO DE EMPRESA · SOLVI FLOW*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *DATOS DE LA EMPRESA*
• Nombre Comercial: ${nombre || 'No especificado'}
• Razón Social: ${razonSocialLegal || 'No especificada'}
• RUT Empresa: ${rutEmpresa || 'No especificado'}
• Giro Comercial: ${giroComercial || 'Banquetería y Eventos'}
• Especialidad / Slogan: ${subtitulo || 'Sin subtítulo'}

👤 *CONTACTO Y REPRESENTANTE*
• Responsable: ${contactoResponsable || 'No especificado'}
• Cargo: ${cargoResponsable || 'Administrador'}
• Teléfono / WhatsApp: ${telefono || 'No especificado'}
• Email Comercial: ${email || 'No especificado'}
• Instagram: ${instagram || 'No especificado'}
• Web: ${sitioWeb || 'No especificado'}

📍 *OPERACIÓN Y UBICACIÓN*
• Modalidad: ${modalidadOperacion === 'domicilio' ? 'A Domicilio / Itinerante' : modalidadOperacion === 'recinto_fijo' ? 'Recinto Fijo Propio' : 'Mixto (Recinto + Domicilio)'}
• Recinto / Cocina Central: ${recintoPrincipal || 'No especificado'}
• Dirección: ${direccion || 'No especificada'}
• Ciudad: ${ciudad || 'Santiago'}
• Capacidad Comensales: ${capacidadMaxPax} pax

🏦 *DATOS BANCARIOS OFICIALES*
• Banco: ${banco || 'No especificado'}
• Tipo de Cuenta: ${tipoCuenta}
• N° Cuenta: ${numeroCuenta || 'No especificado'}
• RUT Titular: ${rutTitular || rutEmpresa || 'No especificado'}
• Titular: ${titularCuenta || 'No especificado'}
• Email Transferencias: ${emailTransferencia || email || 'No especificado'}

📋 *CONDICIONES POR DEFECTO*
• Reserva / Anticipo: ${porcentajeAnticipo}%
• Validez de Cotizaciones: ${validezDias} días
• Esquema de Pago: ${condicionesPago}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Generado desde SOLVI Flow por CS Consultoría_`;
  };

  const handleCopiarTexto = () => {
    const texto = construirTextoFicha();
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 2500);
  };

  const handleEnviarWhatsAppSoporte = () => {
    const texto = construirTextoFicha();
    const numeroSoporte = '56931181304'; // CS Consultoría oficial
    const url = `https://wa.me/${numeroSoporte}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleDescargarHTML = () => {
    const htmlContenido = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ficha de Empresa - ${nombre}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; margin: 0; }
    .card { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
    .title { font-size: 26px; font-weight: 900; margin: 0; color: #0f172a; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .badge { background: #0f172a; color: white; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .section-title { font-size: 15px; font-weight: 800; color: #0f172a; border-left: 4px solid #f59e0b; padding-left: 10px; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .item { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .val { font-size: 14px; font-weight: 700; color: #0f172a; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 class="title">${nombre || 'Empresa Gastronómica'}</h1>
        <div class="subtitle">${subtitulo || 'Servicios Gastronómicos y Banquetería'}</div>
      </div>
      <div class="badge">SOLVI FLOW · ALTA CLIENTE</div>
    </div>

    <div class="section-title">1. Identidad Legal y Comercial</div>
    <div class="grid">
      <div class="item"><div class="label">Razón Social Legal</div><div class="val">${razonSocialLegal || 'No especificada'}</div></div>
      <div class="item"><div class="label">RUT Empresa</div><div class="val">${rutEmpresa || 'No especificado'}</div></div>
      <div class="item"><div class="label">Giro Comercial</div><div class="val">${giroComercial || 'Banquetería y Eventos'}</div></div>
      <div class="item"><div class="label">Modalidad</div><div class="val">${modalidadOperacion === 'domicilio' ? 'A Domicilio / Itinerante' : modalidadOperacion === 'recinto_fijo' ? 'Recinto Fijo Propio' : 'Mixto'}</div></div>
    </div>

    <div class="section-title">2. Contacto & Representante</div>
    <div class="grid">
      <div class="item"><div class="label">Responsable</div><div class="val">${contactoResponsable || 'No especificado'}</div></div>
      <div class="item"><div class="label">Cargo</div><div class="val">${cargoResponsable || 'Administrador'}</div></div>
      <div class="item"><div class="label">Teléfono / WhatsApp</div><div class="val">${telefono || 'No especificado'}</div></div>
      <div class="item"><div class="label">Email Comercial</div><div class="val">${email || 'No especificado'}</div></div>
      <div class="item"><div class="label">Instagram</div><div class="val">${instagram || 'No especificado'}</div></div>
      <div class="item"><div class="label">Sitio Web</div><div class="val">${sitioWeb || 'No especificado'}</div></div>
    </div>

    <div class="section-title">3. Recinto & Ubicación</div>
    <div class="grid">
      <div class="item"><div class="label">Recinto Principal / Cocina</div><div class="val">${recintoPrincipal || 'No especificado'}</div></div>
      <div class="item"><div class="label">Dirección</div><div class="val">${direccion || 'No especificada'}</div></div>
      <div class="item"><div class="label">Ciudad / Comuna</div><div class="val">${ciudad || 'Santiago'}</div></div>
      <div class="item"><div class="label">Capacidad Máxima</div><div class="val">${capacidadMaxPax} comensales</div></div>
    </div>

    <div class="section-title">4. Datos Bancarios para Cotizaciones</div>
    <div class="grid">
      <div class="item"><div class="label">Banco</div><div class="val">${banco}</div></div>
      <div class="item"><div class="label">Tipo de Cuenta</div><div class="val">${tipoCuenta}</div></div>
      <div class="item"><div class="label">Número de Cuenta</div><div class="val">${numeroCuenta || 'No especificado'}</div></div>
      <div class="item"><div class="label">RUT Titular</div><div class="val">${rutTitular || rutEmpresa || 'No especificado'}</div></div>
      <div class="item"><div class="label">Nombre Titular</div><div class="val">${titularCuenta || 'No especificado'}</div></div>
      <div class="item"><div class="label">Email Comprobantes</div><div class="val">${emailTransferencia || email || 'No especificado'}</div></div>
    </div>

    <div class="section-title">5. Condiciones Comerciales</div>
    <div class="grid">
      <div class="item"><div class="label">Anticipo Sugerido</div><div class="val">${porcentajeAnticipo}%</div></div>
      <div class="item"><div class="label">Validez de Oferta</div><div class="val">${validezDias} días corridos</div></div>
      <div class="item" style="grid-column: span 2;"><div class="label">Esquema de Pago</div><div class="val">${condicionesPago}</div></div>
    </div>

    <div class="footer">
      Documento generado automáticamente por SOLVI Flow · CS Consultoría Integral Gastronómica.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContenido], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-empresa-${(nombre || 'cliente').toLowerCase().replace(/\s+/g, '-')}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        
        {/* ENCABEZADO DEL MODAL */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-t-3xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xl shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Ficha de Empresa & Datos de Contacto
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  Alta de Clientes
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                Ingresa los datos comerciales, bancarios y de contacto de tu empresa. Se reflejarán en tus cotizaciones, fichas técnicas, PDF y mensajes de WhatsApp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE ÉXITO AL GUARDAR */}
        {mensajeGuardado && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              ¡Datos de empresa y contacto guardados exitosamente! Aplicando a toda la plataforma...
            </span>
          </div>
        )}

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50/70 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setSeccionActiva('empresa')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              seccionActiva === 'empresa'
                ? 'border-amber-600 text-amber-900 bg-white/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>1. Empresa & Marca</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva('contacto')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              seccionActiva === 'contacto'
                ? 'border-amber-600 text-amber-900 bg-white/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600" />
            <span>2. Contacto & Representante</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva('ubicacion')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              seccionActiva === 'ubicacion'
                ? 'border-amber-600 text-amber-900 bg-white/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>3. Modalidad & Recinto</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva('banco')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              seccionActiva === 'banco'
                ? 'border-amber-600 text-amber-900 bg-white/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-4 h-4 text-emerald-600" />
            <span>4. Datos Bancarios</span>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva('condiciones')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              seccionActiva === 'condiciones'
                ? 'border-amber-600 text-amber-900 bg-white/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>5. Condiciones Comerciales</span>
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto">
          <form onSubmit={handleGuardar} className="space-y-6">

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN 1: IDENTIDAD DE LA EMPRESA & MARCA
            ══════════════════════════════════════════════════════════════ */}
            {seccionActiva === 'empresa' && (
              <div className="space-y-5">
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <p className="font-extrabold text-amber-900 mb-0.5">Identidad Corporativa y Marca</p>
                    <p>
                      Estos datos se muestran en el encabezado principal del software, en tus presupuestos imprimibles en PDF y en la ficha de cotización.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre Comercial / Fantasía *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => handleNombreChange(e.target.value)}
                      placeholder="Ej: Doña Isidora Eventos"
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Nombre con el que tus clientes te conocen comúnmente.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Razón Social Legal (Facturación)
                    </label>
                    <input
                      type="text"
                      value={razonSocialLegal}
                      onChange={(e) => setRazonSocialLegal(e.target.value)}
                      placeholder="Ej: Inversiones y Servicios Gastronómicos SpA"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Nombre legal registrado en el SII para contratos y facturación.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      RUT de la Empresa
                    </label>
                    <input
                      type="text"
                      value={rutEmpresa}
                      onChange={(e) => setRutEmpresa(e.target.value)}
                      placeholder="Ej: 76.845.920-4"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giro Comercial
                    </label>
                    <input
                      type="text"
                      value={giroComercial}
                      onChange={(e) => setGiroComercial(e.target.value)}
                      placeholder="Ej: Banquetería, Producción y Eventos"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Slogan / Subtítulo / Especialidad
                  </label>
                  <input
                    type="text"
                    value={subtitulo}
                    onChange={(e) => setSubtitulo(e.target.value)}
                    placeholder="Ej: Banquetería & Producción de Matrimonios · Servicio Itinerante / A Domicilio"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Aparece bajo el logo en el encabezado oficial de las cotizaciones.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Letra o Sigla del Logotipo (1 a 3 letras)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={3}
                        value={letraLogo}
                        onChange={(e) => setLetraLogo(e.target.value.toUpperCase())}
                        placeholder="DI"
                        className="w-20 px-3 py-2.5 text-center font-black text-lg border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-hidden uppercase"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-serif font-black text-xl flex items-center justify-center shadow-md">
                        {letraLogo || 'E'}
                      </div>
                      <span className="text-xs text-slate-500">
                        Se muestra como ícono representativo de tu empresa.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Color de Identidad Visual
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[
                        { id: 'amber', label: 'Ámbar / Dorado', class: 'bg-amber-500' },
                        { id: 'emerald', label: 'Esmeralda', class: 'bg-emerald-600' },
                        { id: 'blue', label: 'Azul / Real', class: 'bg-indigo-600' },
                        { id: 'rose', label: 'Rosa / Vino', class: 'bg-rose-600' },
                        { id: 'slate', label: 'Elegante Pizarra', class: 'bg-slate-900' }
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setColorTema(c.id as EmpresaCliente['colorTema'])}
                          className={`w-9 h-9 rounded-xl ${c.class} text-white flex items-center justify-center shadow-xs transition-transform cursor-pointer ${
                            colorTema === c.id ? 'ring-4 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          title={c.label}
                        >
                          {colorTema === c.id && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN 2: CONTACTO & REPRESENTANTE
            ══════════════════════════════════════════════════════════════ */}
            {seccionActiva === 'contacto' && (
              <div className="space-y-5">
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3">
                  <User className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-950">
                    <p className="font-extrabold text-indigo-900 mb-0.5">Representante & Canales de Contacto Directo</p>
                    <p>
                      Indica quién es el responsable de ventas o administración de la app, su número telefónico y redes para la atención a comensales y proveedores.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Nombre del Responsable / Contacto Directo *
                    </label>
                    <input
                      type="text"
                      value={contactoResponsable}
                      onChange={(e) => setContactoResponsable(e.target.value)}
                      placeholder="Ej: Claudio Sepúlveda / María Eugenia"
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Cargo o Rol en la Productora
                    </label>
                    <input
                      type="text"
                      value={cargoResponsable}
                      onChange={(e) => setCargoResponsable(e.target.value)}
                      placeholder="Ej: Banquetera Ejecutiva / Gerente de Eventos"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Teléfono / WhatsApp Oficial *
                    </label>
                    <input
                      type="text"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+56 9 9432 1890"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Número para envío de propuestas comerciales automáticas.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Correo Electrónico Comercial *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@donaisidoraeventos.cl"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      Instagram Oficial (Opcional)
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@donaisidoraeventos"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      Sitio Web Oficial (Opcional)
                    </label>
                    <input
                      type="text"
                      value={sitioWeb}
                      onChange={(e) => setSitioWeb(e.target.value)}
                      placeholder="www.donaisidoraeventos.cl"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN 3: MODALIDAD DE OPERACIÓN & RECINTO
            ══════════════════════════════════════════════════════════════ */}
            {seccionActiva === 'ubicacion' && (
              <div className="space-y-5">
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-950">
                    <p className="font-extrabold text-rose-900 mb-0.5">Modalidad de Servicio y Ubicación</p>
                    <p>
                      Define si prestas servicios gastronómicos a domicilio e itinerantes o si tienes un salón o casona física con mesas fijas. La app adaptará las fichas técnicas automáticamente según esta elección.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Modalidad Principal de Operación:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setModalidadOperacion('domicilio');
                        if (!recintoPrincipal || recintoPrincipal.includes('Casona') || recintoPrincipal.includes('Finca')) {
                          setRecintoPrincipal('Servicio Itinerante / A Domicilio / Parcelas');
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        modalidadOperacion === 'domicilio'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs">🏠 A Domicilio / Itinerante</span>
                        {modalidadOperacion === 'domicilio' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Banquetería móvil, parcelas privadas, domicilios particulares (omite croquis de mesas si no aplica).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalidadOperacion('recinto_fijo')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        modalidadOperacion === 'recinto_fijo'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-sm ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs">🏰 Recinto Fijo / Casona</span>
                        {modalidadOperacion === 'recinto_fijo' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Centro de eventos con locación propia, salones, áreas verdes y distribución de mesas fijas.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalidadOperacion('mixto')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        modalidadOperacion === 'mixto'
                          ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-sm ring-2 ring-amber-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs">🔀 Mixto / Ambos</span>
                        {modalidadOperacion === 'mixto' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Opera tanto en recinto propio como atendiendo eventos en locaciones externas y domicilios.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre del Recinto / Cocina Central / Taller
                    </label>
                    <input
                      type="text"
                      value={recintoPrincipal}
                      onChange={(e) => setRecintoPrincipal(e.target.value)}
                      placeholder="Ej: Casona Principal / Taller Central de Banquetería"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Capacidad Máxima de Comensales (Pax)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={capacidadMaxPax}
                      onChange={(e) => setCapacidadMaxPax(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Dirección Física
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Av. Las Condes #12450 o Camino Los Aromos Parcela 4"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Comuna / Ciudad / Región
                    </label>
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej: Lo Barnechea, Santiago, Región Metropolitana"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN 4: DATOS BANCARIOS OFICIALES
            ══════════════════════════════════════════════════════════════ */}
            {seccionActiva === 'banco' && (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <Landmark className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <p className="font-extrabold text-emerald-900 mb-0.5">Cuenta Bancaria para Transferencias y Abonos</p>
                    <p>
                      Estos datos se insertan directamente en el pie de página de la Ficha Formal de Cotización para que el cliente deposite el anticipo de reserva.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Institución Bancaria
                    </label>
                    <select
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden bg-white"
                    >
                      <option value="Banco Santander">Banco Santander</option>
                      <option value="Banco de Chile / Edwards">Banco de Chile / Edwards</option>
                      <option value="BancoEstado">BancoEstado</option>
                      <option value="Banco BCI">Banco BCI</option>
                      <option value="Banco Scotiabank">Banco Scotiabank</option>
                      <option value="Banco Itaú">Banco Itaú</option>
                      <option value="Banco BICE">Banco BICE</option>
                      <option value="Banco Security">Banco Security</option>
                      <option value="Banco Falabella">Banco Falabella</option>
                      <option value="Tenpo / Coopeuch">Tenpo / Coopeuch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={tipoCuenta}
                      onChange={(e) => setTipoCuenta(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden bg-white"
                    >
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Cuenta RUT">Cuenta RUT</option>
                      <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Número de Cuenta Bancaria *
                    </label>
                    <input
                      type="text"
                      value={numeroCuenta}
                      onChange={(e) => setNumeroCuenta(e.target.value)}
                      placeholder="Ej: 0-000-12-34567-8"
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      RUT del Titular de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={rutTitular}
                      onChange={(e) => setRutTitular(e.target.value)}
                      placeholder="Ej: 76.845.920-4 o 15.345.678-9"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre Completo del Titular
                    </label>
                    <input
                      type="text"
                      value={titularCuenta}
                      onChange={(e) => setTitularCuenta(e.target.value)}
                      placeholder="Ej: Doña Isidora SpA o Nombre Representante"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email para Recepción de Comprobantes
                    </label>
                    <input
                      type="email"
                      value={emailTransferencia}
                      onChange={(e) => setEmailTransferencia(e.target.value)}
                      placeholder="pagos@empresa.cl"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECCIÓN 5: CONDICIONES COMERCIALES POR DEFECTO
            ══════════════════════════════════════════════════════════════ */}
            {seccionActiva === 'condiciones' && (
              <div className="space-y-5">
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-start gap-3">
                  <FileText className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-purple-950">
                    <p className="font-extrabold text-purple-900 mb-0.5">Parámetros Comerciales Predefinidos</p>
                    <p>
                      Ajusta los plazos de validez y porcentaje de reserva que se sugerirán al cotizar cualquier nuevo evento.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      % de Anticipo para Reserva de Fecha
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={porcentajeAnticipo}
                        onChange={(e) => setPorcentajeAnticipo(Number(e.target.value))}
                        className="w-24 px-3.5 py-2.5 text-sm font-black border border-slate-300 rounded-xl focus:border-purple-500 focus:outline-hidden"
                      />
                      <span className="text-sm font-bold text-slate-600">% del total cotizado</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Normalmente 40% o 50% en la industria de eventos chilena.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Días de Validez de las Cotizaciones
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={validezDias}
                        onChange={(e) => setValidezDias(Number(e.target.value))}
                        className="w-24 px-3.5 py-2.5 text-sm font-black border border-slate-300 rounded-xl focus:border-purple-500 focus:outline-hidden"
                      />
                      <span className="text-sm font-bold text-slate-600">días corridos</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Glosa de Esquema de Pago y Condiciones
                  </label>
                  <textarea
                    rows={3}
                    value={condicionesPago}
                    onChange={(e) => setCondicionesPago(e.target.value)}
                    placeholder="40% al reservar fecha y firmar contrato, 60% restante hasta 7 días corridos antes del evento."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* VISTA PREVIA RESUMEN DE MARCA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Vista Previa de Marca en la App:
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {modalidadOperacion === 'domicilio' ? 'A Domicilio / Itinerante' : modalidadOperacion === 'recinto_fijo' ? 'Recinto Propio' : 'Mixto'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-serif font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                  {letraLogo || 'E'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-950 text-sm truncate">
                      {nombre || 'Nombre de tu Empresa'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                      RUT: {rutEmpresa || 'Pendiente'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate mt-0.5">
                    {subtitulo || 'Servicios Gastronómicos & Eventos'} · {ciudad}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                    <span>Contacto: <strong>{contactoResponsable || 'Por definir'}</strong> ({telefono})</span>
                    <span>•</span>
                    <span>Cuenta: <strong>{banco}</strong> ({tipoCuenta})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OPCIÓN: ACTUALIZAR O REGISTRAR COMO NUEVA EMPRESA */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={crearComoNueva}
                  onChange={(e) => setCrearComoNueva(e.target.checked)}
                  className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="font-bold">
                  Guardar como NUEVA empresa / centro adicional (no sobrescribir la actual)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Copiar texto resumen de la ficha de contratación al portapapeles"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiadoTexto ? '¡Copiado!' : 'Copiar Resumen'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDescargarHTML}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Descargar ficha de contratación formal en archivo HTML"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Descargar Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarWhatsAppSoporte}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl border border-emerald-300 transition-colors cursor-pointer shadow-xs"
                  title="Enviar ficha estructurada por WhatsApp a soporte CS Consultoría (+56 9 3118 1304)"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Enviar a Soporte WhatsApp</span>
                </button>
              </div>
            </div>

            {/* BOTONES PRINCIPALES DE GUARDADO */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                <span>{crearComoNueva ? 'Crear Nuevo Cliente en la App' : '✓ Guardar y Aplicar Datos en la App'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
