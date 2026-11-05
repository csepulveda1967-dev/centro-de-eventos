import {
  CotizacionState,
  MenuOption,
  StaffTarifas,
  ProveedorServicio,
  EstiloDecoracion,
  ReservaCalendario,
  InsumoMaestro,
  RecetaFichaTecnica,
  EmpresaCliente,
  PerfilClienteId
} from '../types';
import {
  MENUS_INICIALES,
  PERSONAL_TARIFAS_INICIALES,
  PROVEEDORES_INICIALES,
  ESTILOS_DECORACION_INICIALES,
  MESAS_EJEMPLO_INICIALES
} from './tarifas';
import {
  INSUMOS_MAESTRO_INICIALES,
  RECETAS_INICIALES,
  migrarRecetasAGramos
} from './insumosYRecetas';

export interface DatosPerfilCliente {
  cotizacion: CotizacionState;
  menus: MenuOption[];
  tarifasStaff: StaffTarifas;
  proveedores: ProveedorServicio[];
  estilosDecoracion: EstiloDecoracion[];
  insumos: InsumoMaestro[];
  recetas: RecetaFichaTecnica[];
  reservas: ReservaCalendario[];
  empresa: EmpresaCliente;
}

export interface PerfilClienteConfig {
  id: PerfilClienteId;
  nombreOpcion: string;
  detalleOpcion: string;
  tituloCabecera: string;
  infraestructura: string;
  tarifaBaseArriendo?: number;
  crearDatosIniciales: () => DatosPerfilCliente;
}

/* =========================================================================================
   1. PERFIL: DOMINGA EVENTOS
   Título: "Dominga Eventos by Mauge · Alta Banquetería & Matrimonios"
   Infraestructura: "Salón exclusivo en Finca La Toscana, producción integral de bodas, graduaciones y eventos corporativos de alto estándar."
   Tarifa base: Según cotización guardada.
   8 servicios activos: Incluye Coffee Break, costeo en gramos y vajilla de $390.000 (100 pax x $3.900).
   ========================================================================================= */
const crearDatosDominga = (): DatosPerfilCliente => {
  const empresa: EmpresaCliente = {
    id: 'emp-dominga',
    nombre: 'Dominga Eventos by Mauge',
    subtitulo: 'Alta Banquetería & Matrimonios',
    recintoPrincipal: 'Finca La Toscana',
    direccion: 'Avenida Teniente Merino #620, Linderos',
    ciudad: 'Buin, Región Metropolitana',
    telefono: '+56 9 6236 0766',
    email: 'info@domingaeventos.cl',
    sitioWeb: 'www.domingaeventos.cl',
    letraLogo: 'D',
    colorTema: 'amber',
    fechaRegistro: '2026-10-10',
    tituloCabecera: 'Dominga Eventos by Mauge · Alta Banquetería & Matrimonios',
    infraestructura: 'Salón exclusivo en Finca La Toscana, producción integral de bodas, graduaciones y eventos corporativos de alto estándar.'
  };

  const cotizacion: CotizacionState = {
    nombreEvento: 'Matrimonio Sofía & Cristóbal en Finca La Toscana',
    cliente: 'Sofía Echeverría & Cristóbal Valdés',
    emailCliente: 'sofia.echeverria@gmail.com',
    telefonoCliente: '+56 9 8456 7890',
    tipoEvento: 'Boda',
    fechaEvento: '2026-11-28',
    invitados: 100, // 100 pax -> Vajilla $3.900 * 100 = $390.000 exactos
    menuId: 'menu-toscana-gala',
    personal: {
      garzones: 8,
      cocineros: 3,
      aseo: 2,
      maitre: 1
    },
    // Los 8 servicios activos requeridos
    proveedoresSeleccionados: {
      'vajilla-cristaleria': true,       // $3.900 x 100 = $390.000
      'dj-musica-iluminacion': true,     // $520.000
      'flores-centros-mesa': true,       // $420.000
      'barra-libre-premium': true,       // $13.500 x 100 = $1.350.000
      'coffee-break-cocteleria': true,   // $5.450 x 100 = $545.000
      'pista-baile-led': true,           // $390.000
      'fotografia-cinematografia': true, // $580.000
      'generador-respaldo': true         // $240.000
    },
    mesas: MESAS_EJEMPLO_INICIALES,
    decoracionId: 'estilo-toscana-campestre',
    margenGanancia: 35,
    aplicaIva: true,
    observaciones: 'Ceremonia civil en el jardín de la pérgola al atardecer. Cóctel en los viñedos y cena servida en salón.',
    porcentajeAnticipo: 40,
    esquemaPago: 'dos_pagos',
    diasSaldo: 7,
    validezDias: 15,
    gastoLuzMensual: 180000,
    gastoGasMensual: 140000,
    otrosGastosFijos: [],
    gastosFijosMensuales: 320000,
    eventosAlMes: 4,
    mesActivoCostosFijos: 'Noviembre 2024',
    historialCostosFijosMensuales: {
      '2024-10': {
        id: '2024-10',
        mesNombre: 'Octubre 2024',
        mesIndex: 9,
        año: 2024,
        gastoLuz: 165000,
        gastoGas: 130000,
        otrosGastos: [],
        eventosAlMes: 4,
        fechaGuardado: '31/10/2024'
      },
      '2024-11': {
        id: '2024-11',
        mesNombre: 'Noviembre 2024',
        mesIndex: 10,
        año: 2024,
        gastoLuz: 180000,
        gastoGas: 140000,
        otrosGastos: [],
        eventosAlMes: 4,
        fechaGuardado: '01/11/2024'
      }
    },
    usarPrecioManual: false,
    precioVentaManual: 0
  };

  const reservas: ReservaCalendario[] = [
    {
      id: 'res-dominga-01',
      empresaId: 'emp-dominga',
      titulo: 'Matrimonio Sofía & Cristóbal en Finca La Toscana',
      cliente: 'Sofía Echeverría & Cristóbal Valdés',
      tipoEvento: 'Boda',
      fecha: '2026-11-28',
      invitados: 100,
      estado: 'confirmado',
      montoTotal: 10850000,
      cotizacionSnapshot: cotizacion
    }
  ];

  return {
    cotizacion,
    menus: MENUS_INICIALES,
    tarifasStaff: PERSONAL_TARIFAS_INICIALES,
    proveedores: PROVEEDORES_INICIALES,
    estilosDecoracion: ESTILOS_DECORACION_INICIALES,
    insumos: INSUMOS_MAESTRO_INICIALES,
    recetas: migrarRecetasAGramos(RECETAS_INICIALES),
    reservas,
    empresa
  };
};

/* =========================================================================================
   2. PERFIL: CENTRO DE EVENTOS DAMARIS
   Título: "Centro de Eventos Damaris · Sistema Inteligente de Gestión & Banquetes"
   Infraestructura: "Salón Principal (hasta 300 personas), 10.000 m² de parque campestre con jardines, piscina y zona de juegos inflables."
   Tarifa base arriendo locación por defecto: $1.500.000.
   ========================================================================================= */
const crearDatosDamaris = (): DatosPerfilCliente => {
  const empresa: EmpresaCliente = {
    id: 'emp-damaris',
    nombre: 'Centro de Eventos Damaris',
    subtitulo: 'Sistema Inteligente de Gestión & Banquetes',
    recintoPrincipal: 'Salón Principal & Parque Campestre Damaris',
    direccion: 'Camino Lonquén Sur s/n, Calera de Tango',
    ciudad: 'Calera de Tango, Región Metropolitana',
    telefono: '+56 9 7123 4567',
    email: 'contacto@eventosdamaris.cl',
    sitioWeb: 'www.eventosdamaris.cl',
    letraLogo: 'D',
    colorTema: 'emerald',
    fechaRegistro: '2026-10-20',
    tituloCabecera: 'Centro de Eventos Damaris · Sistema Inteligente de Gestión & Banquetes',
    infraestructura: 'Salón Principal (hasta 300 personas), 10.000 m² de parque campestre con jardines, piscina y zona de juegos inflables.',
    tarifaBaseArriendo: 1500000
  };

  const proveedoresDamaris: ProveedorServicio[] = [
    {
      id: 'vajilla-cristaleria-damaris',
      nombre: 'Vajilla & Cristalería Campestre Calera de Tango',
      categoria: 'vajilla',
      tipoCobro: 'por_persona',
      costo: 3500,
      precioVentaSugerido: 5500,
      descripcion: 'Platos de loza rústica, cristalería para aperitivos, copas de vino y espumante, y cubertería de acero inoxidable pulido.',
      iconName: 'UtensilsCrossed',
      contactoNombre: 'Arriendos del Maipo SpA',
      telefonoPedidos: '+56 9 8456 1234',
      emailPedidos: 'pedidos@vajillamaipo.cl',
      rut: '77.102.340-9',
      plazoAnticipacion: 'Reserva con 7 días de anticipación'
    },
    {
      id: 'dj-sonido-damaris',
      nombre: 'DJ Profesional, Iluminación de Parque & Sonido Salón Damaris',
      categoria: 'tecnica',
      tipoCobro: 'fijo',
      costo: 480000,
      precioVentaSugerido: 750000,
      descripcion: 'Amplificación para ceremonia al aire libre en jardines, sonido envolvente en Salón Principal y show de luces LED robotizadas.',
      iconName: 'Disc',
      contactoNombre: 'Sonido Tango Pro',
      telefonoPedidos: '+56 9 9123 4455',
      emailPedidos: 'dj@sonidotango.cl',
      rut: '16.550.220-4',
      plazoAnticipacion: 'Coordinación playlist 10 días antes'
    },
    {
      id: 'ambientacion-parque-damaris',
      nombre: 'Ambientación Campestre & Centros Rústicos de Mesa',
      categoria: 'ambientacion',
      tipoCobro: 'fijo',
      costo: 380000,
      precioVentaSugerido: 590000,
      descripcion: 'Decoración natural con madera, flores campestres de la zona, caminos de arpillera y faroles rústicos en senderos.',
      iconName: 'Flower2',
      contactoNombre: 'Taller Floral Calera de Tango',
      telefonoPedidos: '+56 9 7334 5566',
      emailPedidos: 'contacto@florestango.cl',
      rut: '76.990.110-8',
      plazoAnticipacion: 'Montaje 4 horas previas al evento'
    },
    {
      id: 'barra-libre-damaris',
      nombre: 'Barra Libre Tradicional & Cócteles Campestres (5 Horas)',
      categoria: 'bar',
      tipoCobro: 'por_persona',
      costo: 12000,
      precioVentaSugerido: 19000,
      descripcion: 'Pisco Mistral/Alto del Carmen, Vodka Absolut, Ron añejo, Whisky Ballantines, terremotos artesanales y jugos naturales del valle.',
      iconName: 'Wine',
      contactoNombre: 'Barra Móvil Calera de Tango',
      telefonoPedidos: '+56 9 8221 9900',
      emailPedidos: 'barras@eventosdamaris.cl',
      rut: '77.502.810-1',
      plazoAnticipacion: 'Coordinación stock 5 días antes'
    },
    {
      id: 'piscina-juegos-inflables',
      nombre: 'Zona de Piscina con Salvavidas & Juegos Inflables Parque',
      categoria: 'ambientacion',
      tipoCobro: 'fijo',
      costo: 180000,
      precioVentaSugerido: 290000,
      descripcion: 'Acceso seguro al área de piscina con salvavidas certificado y 2 juegos inflables gigantes en el parque para niños y jóvenes.',
      iconName: 'Sparkles',
      contactoNombre: 'Animaciones & Recreación Parque',
      telefonoPedidos: '+56 9 6778 1234',
      emailPedidos: 'juegos@eventosdamaris.cl',
      rut: '76.321.450-7',
      plazoAnticipacion: 'Instalación matutina el día del evento'
    },
    {
      id: 'generador-respaldo-damaris',
      nombre: 'Generador Eléctrico Silencioso de Respaldo Parque (100 kVA)',
      categoria: 'tecnica',
      tipoCobro: 'fijo',
      costo: 220000,
      precioVentaSugerido: 340000,
      descripcion: 'Planta de fuerza trifásica para asegurar el Salón Principal, cocinas y la iluminación de los 10.000 m² de parque.',
      iconName: 'Zap',
      contactoNombre: 'Generadores Maipo Sur',
      telefonoPedidos: '+56 9 8899 0011',
      emailPedidos: 'soporte@generadoresmaipo.cl',
      rut: '76.109.845-0',
      plazoAnticipacion: 'Revisión técnica previa'
    },
    {
      id: 'coffee-break-campestre-damaris',
      nombre: 'Coffee Break Campestre & Pastelería Casera de Tango',
      categoria: 'cocteleria',
      tipoCobro: 'por_persona',
      costo: 4900,
      precioVentaSugerido: 7800,
      descripcion: 'Café en grano recién molido, infusiones de hierbas del huerto, empolvados chilenos, torta de milhojas artesanal y alfajores de maicena.',
      iconName: 'Coffee',
      contactoNombre: 'Pastelería Tradición de Tango',
      telefonoPedidos: '+56 9 7443 2211',
      emailPedidos: 'coffee@eventosdamaris.cl',
      rut: '77.890.332-6',
      plazoAnticipacion: 'Montaje 1 hora antes de la apertura'
    }
  ];

  const menusDamaris: MenuOption[] = [
    {
      id: 'menu-damaris-asado-campestre',
      nombre: 'Gran Asado Criollo Campestre Calera de Tango',
      categoria: 'campestre',
      costoPersona: 24000,
      precioSugeridoPersona: 39000,
      descripcion: 'Asado campestre tradicional en el parque de 10.000 m²: carnes a las brasas (lomo liso Angus, costillar a la chilena, longanizas de campo) y buffet criollo.',
      tiempos: {
        coctel: 'Empanadas de pino de horno calientes, sopaipillas con pebre de campo y brochetas caprese rústicas.',
        entrada: 'Pastelera de choclo tierno campesino con albahaca fresca en plato de greda.',
        fondo: 'Cortes nobles a la parrilla (Lomo liso Angus y costillar de cerdo crocante) con papas rústicas al romero y buffet de ensaladas del valle.',
        postre: 'Buffet de campo: leche asada tradicional, mote con huesillo artesanal y torta milhojas con abundante manjar.',
        trasnoche: 'Choripanes criollos al chimichurri fresco y consomé de campo reconfortante.'
      },
      destacado: true
    },
    {
      id: 'menu-damaris-gala',
      nombre: 'Banquete de Gala Salón Principal Damaris (3 Tiempos)',
      categoria: 'formal',
      costoPersona: 28000,
      precioSugeridoPersona: 46000,
      descripcion: 'Cena servida de alto estándar para matrimonios en el Salón Principal climatizado con vistas a los jardines iluminados.',
      tiempos: {
        coctel: 'Canapés gourmet variados, mini ceviche mixto en conchitas y pinchos de pollo thai al sésamo.',
        entrada: 'Carpaccio de filete con lascas de parmesano grana y rúcula silvestre con dressing balsámico.',
        fondo: 'Medallón de filete a la salsa de vino carménère con gratín de papas dauphinoise y espárragos grillados.',
        postre: 'Dúo dulce: mousse de chocolate amargo y volcán tibio de dulce de leche con helado artesanal.',
        trasnoche: 'Mini hamburguesas caseras en pan brioche y tapaditos de ave pimentón.'
      }
    },
    {
      id: 'menu-damaris-sunset',
      nombre: 'Cóctel Sunset & Buffet Campestre Relajado',
      categoria: 'cocktail',
      costoPersona: 18500,
      precioSugeridoPersona: 31000,
      descripcion: 'Formato dinámico al atardecer en los jardines y terraza de la piscina: 16 bocados por persona con estaciones temáticas.',
      tiempos: {
        coctel: 'Estación de 14 bocados fríos y calientes: tablas de quesos y charcutería criolla, mini brochetas teriyaki y mini quiches.',
        entrada: 'Mesa campesina con panes de masa madre horneados en el día, patés y mermeladas caseras.',
        fondo: 'Estación interactiva caliente: mini tacos de plateada deshilachada y risotto de champiñones.',
        postre: 'Mesa dulce con mini tartaletas de frutas, alfajores artesanales y vasitos de mousse.',
        trasnoche: 'Sopaipillas pasadas artesanales y café de grano.'
      }
    }
  ];

  const cotizacion: CotizacionState = {
    nombreEvento: 'Boda Campestre en Centro de Eventos Damaris',
    cliente: 'Camila Henríquez & Felipe Morales',
    emailCliente: 'camila.henriquez@gmail.com',
    telefonoCliente: '+56 9 9876 5432',
    tipoEvento: 'Boda',
    fechaEvento: '2026-12-12',
    invitados: 120, // 120 invitados reactivos
    menuId: 'menu-damaris-asado-campestre',
    personal: {
      garzones: 10,
      cocineros: 4,
      aseo: 2,
      maitre: 1
    },
    proveedoresSeleccionados: {
      'vajilla-cristaleria-damaris': true,   // Vajilla campestre
      'dj-sonido-damaris': true,             // DJ & Sonido
      'ambientacion-parque-damaris': true,   // Ambientación
      'barra-libre-damaris': true,           // Barra libre
      'piscina-juegos-inflables': true,      // Zona piscina & inflables
      'generador-respaldo-damaris': true,    // Generador
      'coffee-break-campestre-damaris': true // Coffee break
    },
    mesas: [
      { id: 'md1', numero: 1, nombre: 'Mesa de Honor Novios', capacidad: 8, tipo: 'presidencial' },
      { id: 'md2', numero: 2, nombre: 'Mesa Padres & Familiares', capacidad: 10, tipo: 'redonda' },
      { id: 'md3', numero: 3, nombre: 'Mesa Amigos A', capacidad: 10, tipo: 'redonda' },
      { id: 'md4', numero: 4, nombre: 'Mesa Amigos B', capacidad: 10, tipo: 'redonda' },
      { id: 'md5', numero: 5, nombre: 'Mesa Familia Novio', capacidad: 10, tipo: 'redonda' },
      { id: 'md6', numero: 6, nombre: 'Mesa Familia Novia', capacidad: 10, tipo: 'redonda' },
      { id: 'md7', numero: 7, nombre: 'Mesa Compañeros de Trabajo', capacidad: 10, tipo: 'redonda' },
      { id: 'md8', numero: 8, nombre: 'Mesa Jóvenes', capacidad: 10, tipo: 'redonda' }
    ],
    decoracionId: 'estilo-toscana-campestre',
    margenGanancia: 35,
    aplicaIva: true,
    observaciones: 'Ceremonia en el parque bajo los árboles centenarios. Aperitivo junto a la piscina y almuerzo/cena en el Salón Principal.',
    porcentajeAnticipo: 40,
    esquemaPago: 'dos_pagos',
    diasSaldo: 7,
    validezDias: 15,
    gastoLuzMensual: 220000,
    gastoGasMensual: 160000,
    otrosGastosFijos: [],
    gastosFijosMensuales: 380000,
    eventosAlMes: 4,
    usarPrecioManual: false,
    precioVentaManual: 0
  };

  const reservas: ReservaCalendario[] = [
    {
      id: 'res-damaris-01',
      empresaId: 'emp-damaris',
      titulo: 'Boda Campestre en Centro de Eventos Damaris',
      cliente: 'Camila Henríquez & Felipe Morales',
      tipoEvento: 'Boda',
      fecha: '2026-12-12',
      invitados: 120,
      estado: 'confirmado',
      montoTotal: 12650000,
      cotizacionSnapshot: cotizacion
    }
  ];

  return {
    cotizacion,
    menus: menusDamaris,
    tarifasStaff: {
      garzonJornada: 48000,
      cocineroJornada: 58000,
      aseoJornada: 40000,
      maitreJornada: 80000,
      ratioGarzon: 12,
      ratioCocinero: 35,
      ratioAseo: 50
    },
    proveedores: proveedoresDamaris,
    estilosDecoracion: ESTILOS_DECORACION_INICIALES,
    insumos: INSUMOS_MAESTRO_INICIALES,
    recetas: migrarRecetasAGramos(RECETAS_INICIALES),
    reservas,
    empresa
  };
};

/* =========================================================================================
   3. PERFIL: DOÑA ISIDORA EVENTOS (BANQUETERÍA ITINERANTE / MATRIMONIOS)
   Título: "Doña Isidora Eventos · Banquetería & Producción de Matrimonios"
   Infraestructura: "Servicio móvil e integral para matrimonios en parcelas privadas, centros de eventos externos y casas particulares (sin costos fijos de recinto)."
   Configuración sin centro de eventos fijo con 2 menús de matrimonio chilenos realistas.
   ========================================================================================= */
const crearDatosIsidoraEventos = (): DatosPerfilCliente => {
  const empresa: EmpresaCliente = {
    id: 'emp-isidora',
    nombre: 'Doña Isidora Eventos',
    subtitulo: 'Banquetería & Producción de Matrimonios',
    recintoPrincipal: 'Servicio Itinerante / A Domicilio / Parcelas Privadas',
    direccion: 'Avenida Las Condes #12450, Lo Barnechea',
    ciudad: 'Santiago, Región Metropolitana',
    telefono: '+56 9 9432 1890',
    email: 'contacto@donaisidoraeventos.cl',
    sitioWeb: 'www.donaisidoraeventos.cl',
    letraLogo: 'I',
    colorTema: 'rose',
    fechaRegistro: '2026-10-01',
    tituloCabecera: 'Doña Isidora Eventos · Banquetería & Producción de Matrimonios',
    infraestructura: 'Servicio móvil e integral para matrimonios en parcelas privadas, centros de eventos externos y casas particulares (sin costos fijos de recinto).'
  };

  const menusIsidora: MenuOption[] = [
    {
      id: 'menu-isidora-campestre-fuegos',
      nombre: 'Matrimonio Campestre & Fuegos Doña Isidora',
      categoria: 'campestre',
      costoPersona: 17500,
      precioSugeridoPersona: 39500,
      descripcion: 'Banquetería rústica chilena para matrimonios al aire libre: 18 bocados criollos, carpaccio angus, plateada braseada 6 horas con pastelera rústica y trilogía dulce chilena.',
      tiempos: {
        coctel: '18 bocados criollos por persona: empanaditas de pino al horno, empanaditas camarón-queso, ceviche de reineta en cucharitas comestibles, brochetitas de lomo liso a las brasas con chimichurri, vasitos de pastelera de choclo con albahaca y bruschettas de jamón serrano con rúcula.',
        entrada: 'Carpaccio de res angus con alcaparras crocantes, láminas de queso parmesano reggiano, rúcula fresca y emulsión de mostaza dijon al limón de pica con tostadas finas.',
        fondo: 'Plateada al horno de barro en cocción lenta de 6 horas con reducción de Carmenère, servida con pastelera rústica de choclo y verduras de la huerta salteadas en mantequilla de romero.',
        postre: 'Trilogía dulce chilena: mini vasito de mote con huesillo artesanal, suspiro limeño con merengue al oporto y milhojas crocante rellena de manjar de campo.',
        trasnoche: 'Estación de tapaditos en pan amasado caliente (lomo con palta y ave pimentón) junto a consomé de campo en pocillos de greda.'
      },
      destacado: true
    },
    {
      id: 'menu-isidora-gala-vinedos',
      nombre: 'Matrimonio Gala & Viñedos Doña Isidora',
      categoria: 'premium',
      costoPersona: 23800,
      precioSugeridoPersona: 49900,
      descripcion: 'Banquetería fina de alta gama para bodas: 20 bocados finos con ostiones y centolla, tártaro de salmón, filete mignon con setas y buffet dulce con volcán belga.',
      tiempos: {
        coctel: '20 bocados finos de autor: ostiones a la parmesana gratinados, tártaro de atún rojo con sésamo negro, canapés de centolla austral con mayonesa casera, mini chupes de jaiba en masitas doradas y mini quiches de higos con queso azul.',
        entrada: 'Tártaro de salmón atlántico y palta hass con vinagreta de maracuyá, caviar de trucha y brotes orgánicos con tostadas finas.',
        fondo: 'Filete de vacuno mignon envuelto en tocino crocante con salsa de setas silvestres y vino tinto del Valle de Colchagua, acompañado de risotto de quinoa real y espárragos verdes grillados.',
        postre: 'Buffet de postres de boda: volcán tibio de chocolate belga con helado artesanal de vainilla bourbon, pavlova de frutos rojos patagónicos y creme brulée de lavanda.',
        trasnoche: 'Estación smash burgers gourmet en pan brioche con queso cheddar fundido + churros españoles crujientes con manjar casero y chocolate fundido.'
      }
    }
  ];

  const cotizacion: CotizacionState = {
    nombreEvento: 'Matrimonio Isidora & Tomás en Parcela El Arrayán',
    cliente: 'Isidora Undurraga & Tomás Larraín',
    emailCliente: 'isidora.undurraga@gmail.com',
    telefonoCliente: '+56 9 9432 1890',
    tipoEvento: 'Boda',
    fechaEvento: '2026-11-21',
    invitados: 100,
    menuId: 'menu-isidora-campestre-fuegos',
    personal: {
      garzones: 8,
      cocineros: 3,
      aseo: 2,
      maitre: 1
    },
    proveedoresSeleccionados: {
      'vajilla-cristaleria': true,
      'dj-musica-iluminacion': true,
      'flores-centros-mesa': true,
      'barra-libre-premium': true,
      'generador-respaldo': true
    },
    mesas: MESAS_EJEMPLO_INICIALES,
    decoracionId: ESTILOS_DECORACION_INICIALES[0].id,
    margenGanancia: 35,
    aplicaIva: true,
    observaciones: 'Banquetería integral en parcela privada. Ceremonia al aire libre y banquete en carpa con cocina de fuegos en vivo.',
    porcentajeAnticipo: 40,
    esquemaPago: 'dos_pagos',
    diasSaldo: 7,
    validezDias: 15,
    gastoLuzMensual: 120000,
    gastoGasMensual: 95000,
    otrosGastosFijos: [],
    gastosFijosMensuales: 215000,
    eventosAlMes: 4,
    mesActivoCostosFijos: 'Noviembre 2024',
    usarPrecioManual: false,
    precioVentaManual: 0,
    bebestibles: [
      { id: 'beb-isidora-1', nombre: 'Bebidas, Gaseosas y Aguas Minerales', cantidadPorPersona: 2, unidad: 'lata / vaso', costoUnitario: 900, categoria: 'bebestible' },
      { id: 'beb-isidora-2', nombre: 'Vinos Reserva & Espumante de Brindis', cantidadPorPersona: 1.5, unidad: 'copa', costoUnitario: 1800, categoria: 'bebestible' }
    ]
  };

  const reservas: ReservaCalendario[] = [
    {
      id: 'res-isidora-01',
      empresaId: 'emp-isidora',
      titulo: 'Matrimonio Isidora & Tomás en Parcela El Arrayán',
      cliente: 'Isidora Undurraga & Tomás Larraín',
      tipoEvento: 'Boda',
      fecha: '2026-11-21',
      invitados: 100,
      estado: 'confirmado',
      montoTotal: 10850000,
      cotizacionSnapshot: cotizacion
    }
  ];

  return {
    cotizacion,
    menus: menusIsidora,
    tarifasStaff: {
      garzonJornada: 45000,
      cocineroJornada: 55000,
      aseoJornada: 38000,
      maitreJornada: 75000,
      ratioGarzon: 12,
      ratioCocinero: 35,
      ratioAseo: 50
    },
    proveedores: PROVEEDORES_INICIALES,
    estilosDecoracion: ESTILOS_DECORACION_INICIALES,
    insumos: INSUMOS_MAESTRO_INICIALES,
    recetas: migrarRecetasAGramos(RECETAS_INICIALES),
    reservas,
    empresa
  };
};

/* =========================================================================================
   MAPA PRINCIPAL DE PERFILES PRECARGADOS
   ========================================================================================= */
export const PERFILES_CLIENTES_CATALOGO: Record<PerfilClienteId, PerfilClienteConfig> = {
  'modelo-base': {
    id: 'modelo-base',
    nombreOpcion: 'Doña Isidora Eventos',
    detalleOpcion: 'Banquetería Itinerante / Bodas (Sin recinto fijo)',
    tituloCabecera: 'Doña Isidora Eventos · Banquetería & Producción de Matrimonios',
    infraestructura: 'Servicio móvil e integral para matrimonios en parcelas privadas, centros de eventos externos y casas particulares (sin costos fijos de recinto).',
    crearDatosIniciales: crearDatosIsidoraEventos
  },
  'dominga-eventos': {
    id: 'dominga-eventos',
    nombreOpcion: 'Dominga Eventos',
    detalleOpcion: 'Propuesta Linderos / Finca La Toscana',
    tituloCabecera: 'Dominga Eventos by Mauge · Alta Banquetería & Matrimonios',
    infraestructura: 'Salón exclusivo en Finca La Toscana, producción integral de bodas, graduaciones y eventos corporativos de alto estándar.',
    crearDatosIniciales: crearDatosDominga
  },
  'damaris-eventos': {
    id: 'damaris-eventos',
    nombreOpcion: 'Centro de Eventos Damaris',
    detalleOpcion: 'Propuesta Campestre Calera de Tango',
    tituloCabecera: 'Centro de Eventos Damaris · Sistema Inteligente de Gestión & Banquetes',
    infraestructura: 'Salón Principal (hasta 300 personas), 10.000 m² de parque campestre con jardines, piscina y zona de juegos inflables.',
    tarifaBaseArriendo: 1500000,
    crearDatosIniciales: crearDatosDamaris
  }
};

export const LISTA_PERFILES_CLIENTES = [
  PERFILES_CLIENTES_CATALOGO['modelo-base'],
  PERFILES_CLIENTES_CATALOGO['dominga-eventos'],
  PERFILES_CLIENTES_CATALOGO['damaris-eventos']
];

/* Helper para guardar con aislamiento seguro en localStorage */
export const obtenerClaveStorageCliente = (clienteId: PerfilClienteId): string => {
  return `propuesta_datos_v3_${clienteId}`;
};

export const cargarDatosCliente = (clienteId: PerfilClienteId): DatosPerfilCliente => {
  const clave = obtenerClaveStorageCliente(clienteId);
  const guardado = localStorage.getItem(clave);
  const config = PERFILES_CLIENTES_CATALOGO[clienteId] || PERFILES_CLIENTES_CATALOGO['modelo-base'];
  const def = config.crearDatosIniciales();
  
  if (guardado) {
    try {
      const parsed = JSON.parse(guardado) as Partial<DatosPerfilCliente>;
      
      // La empresa SIEMPRE adopta la estructura oficial del perfil seleccionado
      const empresaFinal = def.empresa;

      const rawProveedores = parsed.proveedores && parsed.proveedores.length > 0 ? parsed.proveedores : def.proveedores;
      const proveedoresLimpios = rawProveedores.filter(p => p.id !== 'arriendo-locacion-damaris' && !p.id.includes('gasto-fijo'));

      // Combinar menús para NUNCA perder menús creados por el usuario
      const mapaMenus = new Map<string, MenuOption>();
      def.menus.forEach(m => mapaMenus.set(m.id, m));
      if (parsed.menus && Array.isArray(parsed.menus)) {
        parsed.menus.forEach(m => mapaMenus.set(m.id, m));
      }
      const menusFinales = Array.from(mapaMenus.values());
      
      const cotizacionLimpia = parsed.cotizacion || def.cotizacion;
      if (cotizacionLimpia.proveedoresSeleccionados) {
        delete cotizacionLimpia.proveedoresSeleccionados['arriendo-locacion-damaris'];
      }
      if (!menusFinales.some(m => m.id === cotizacionLimpia.menuId)) {
        cotizacionLimpia.menuId = menusFinales[0].id;
      }
      // Asegurar array de bebestibles
      if (!cotizacionLimpia.bebestibles) {
        cotizacionLimpia.bebestibles = def.cotizacion.bebestibles || [];
      }

      // Asegurar que insumos creados en el maestro o BD se conserven siempre
      let insumosFinales = parsed.insumos && parsed.insumos.length > 0 ? parsed.insumos : def.insumos;
      try {
        const savedGlobal = localStorage.getItem('hlr_maestro_insumos');
        if (savedGlobal) {
          const parsedGlobal = JSON.parse(savedGlobal);
          if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
            const mapIds = new Map(insumosFinales.map((i: InsumoMaestro) => [i.id, i]));
            for (const item of parsedGlobal) {
              if (item && item.id && !mapIds.has(item.id)) {
                mapIds.set(item.id, item);
              }
            }
            insumosFinales = Array.from(mapIds.values());
          }
        }
      } catch (err) {}

      // Combinar recetas para NUNCA perder recetas técnicas creadas
      const mapaRecetas = new Map<string, RecetaFichaTecnica>();
      def.recetas.forEach(r => mapaRecetas.set(r.id, r));
      if (parsed.recetas && Array.isArray(parsed.recetas)) {
        migrarRecetasAGramos(parsed.recetas).forEach(r => mapaRecetas.set(r.id, r));
      }
      const recetasFinales = Array.from(mapaRecetas.values());

      return {
        cotizacion: cotizacionLimpia,
        menus: menusFinales,
        tarifasStaff: parsed.tarifasStaff || def.tarifasStaff,
        proveedores: proveedoresLimpios,
        estilosDecoracion: parsed.estilosDecoracion && parsed.estilosDecoracion.length > 0 ? parsed.estilosDecoracion : def.estilosDecoracion,
        insumos: insumosFinales,
        recetas: recetasFinales,
        reservas: parsed.reservas || def.reservas,
        empresa: empresaFinal
      };
    } catch (e) {
      console.error(`Error al cargar datos aislados para ${clienteId}:`, e);
    }
  }

  // Inicialización limpia
  const datosIniciales = config.crearDatosIniciales();
  try {
    const savedGlobal = localStorage.getItem('hlr_maestro_insumos');
    if (savedGlobal) {
      const parsedGlobal = JSON.parse(savedGlobal);
      if (Array.isArray(parsedGlobal) && parsedGlobal.length > 0) {
        const mapIds = new Map(datosIniciales.insumos.map((i: InsumoMaestro) => [i.id, i]));
        for (const item of parsedGlobal) {
          if (item && item.id && !mapIds.has(item.id)) {
            mapIds.set(item.id, item);
          }
        }
        datosIniciales.insumos = Array.from(mapIds.values());
      }
    }
    localStorage.setItem(clave, JSON.stringify(datosIniciales));
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
  return datosIniciales;
};

export const guardarDatosCliente = (clienteId: PerfilClienteId, datos: DatosPerfilCliente): void => {
  try {
    const clave = obtenerClaveStorageCliente(clienteId);
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (e) {
    console.error(`Error guardando datos aislados para ${clienteId}:`, e);
  }
};
