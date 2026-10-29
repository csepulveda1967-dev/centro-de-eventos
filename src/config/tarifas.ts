import { MenuOption, StaffTarifas, ProveedorServicio, EstiloDecoracion, Mesa, ReservaCalendario } from '../types';

/* =========================================================================================
   CONFIGURACIÓN CENTRAL DE PRECIOS Y TARIFAS · DOMINGA EVENTOS
   Espacio Principal: Finca La Toscana (Av. Teniente Merino #620, Linderos, Buin)
   =========================================================================================
   ¡ATENCIÓN ADMINISTRADOR GASTRONÓMICO!
   Aquí puedes cambiar fácilmente cualquier precio, jornada o servicio sin saber programar.
   Los valores están expresados en pesos chilenos ($) y se actualizan automáticamente en todo el sistema.
========================================================================================= */

// -----------------------------------------------------------------------------------------
// 1. TARIFAS DE MENÚS GASTRONÓMICOS (Costo por cada comensal)
// -----------------------------------------------------------------------------------------
export const MENUS_INICIALES: MenuOption[] = [
  {
    id: 'menu-toscana-gala',
    nombre: 'Banquete Toscana de Gala (3 Tiempos)',
    categoria: 'formal',
    costoPersona: 29500, // Costo real de insumos por persona
    precioSugeridoPersona: 48000, // Precio recomendado al cliente
    descripcion: 'Cena servida formal en Finca La Toscana con cóctel en jardines, entrada gourmet, plato de fondo noble y trilogía de postres.',
    tiempos: {
      coctel: 'Canapés tibios de mariscos en masa filo, brochetas caprese al pesto fresco de albahaca y ceviche de reineta en cucharitas de greda.',
      entrada: 'Carpaccio de salmón del sur con alcaparras crocantes, vinagreta de maracuyá y tostadas de masa madre.',
      fondo: 'Medallón de filete a la salsa de oporto y champiñones silvestres acompañado de risotto al azafrán con parmesano grana.',
      postre: 'Trilogía dulce: mousse de chocolate belga 70%, suspiro de lúcuma limeña y sorbete de frutos rojos del valle.',
      trasnoche: 'Mini hamburguesas caseras en pan brioche y consomé caliente reconfortante con hierbas frescas.'
    },
    destacado: true
  },
  {
    id: 'menu-asado-finca-toscana',
    nombre: 'Asado Campestre Finca La Toscana a las Brasas',
    categoria: 'campestre',
    costoPersona: 23500,
    precioSugeridoPersona: 38000,
    descripcion: 'Parrillada campestre al aire libre bajo los árboles: lomo vetado Angus, costillar adobado a la chilena, chorizo artesanal y buffet de ensaladas rústicas.',
    tiempos: {
      coctel: 'Empanaditas de pino de horno, sopaipillas con pebre de tomate de campo y tabla de quesos curados con frutos secos.',
      entrada: 'Pastelera de choclo tierno servida en greda o ceviche campestre de trucha arcoíris.',
      fondo: 'Cortes seleccionados a las brasas (Lomo vetado Angus, costillar de cerdo crocante y entrañas) con papas rústicas al romero fresco.',
      postre: 'Buffet de postres de campo: leche asada tradicional de campo, torta milhojas manjar nuez y mote con huesillo artesanal.',
      trasnoche: 'Choripanes al chimichurri fresco con pebre y consomé de campo.'
    }
  },
  {
    id: 'menu-sunset-cocktail',
    nombre: 'Cóctel Sunset & Finger Food Linderos',
    categoria: 'cocktail',
    costoPersona: 19500,
    precioSugeridoPersona: 32000,
    descripcion: 'Formato dinámico y relajado ideal para matrimonios de tarde al atardecer en los jardines de Finca La Toscana (18 bocados por persona).',
    tiempos: {
      coctel: 'Estación de 14 bocados fríos y tibios: gyozas de camarón, mini brochetas teriyaki, ceviche de salmón y mini tacos gourmet.',
      entrada: 'Mesa de quesos del mundo, charcutería artesanal de la zona y panes de masa madre de campo.',
      fondo: 'Estación caliente interactiva: mini risotto servido al momento y cazuelitas de garrón de cordero braseado.',
      postre: 'Mesa de bocados dulces: macarons franceses, mini lemon pies y vasitos de cheesecake de maracuyá.',
      trasnoche: 'Churros españoles con salsa de manjar tibio y chocolate espeso.'
    }
  },
  {
    id: 'menu-petite-intimo',
    nombre: 'Menú Petite & Matrimonios Íntimos (Signature)',
    categoria: 'premium',
    costoPersona: 38500,
    precioSugeridoPersona: 62000,
    descripcion: 'Experiencia gastronómica exclusiva para matrimonios íntimos de hasta 80 invitados con maridaje guiado de vinos del Valle del Maipo.',
    tiempos: {
      coctel: 'Ostras frescas con granizado de sauvignon blanc, jamón ibérico de bellota y cucharitas de atún rojo con sésamo.',
      entrada: 'Tartar de atún con palta ahumada del valle y vinagreta cítrica de ponzu.',
      fondo: 'Garrón de cordero braseado al vino tinto durante 12 horas con puré aterciopelado de castañas y vegetales baby.',
      postre: 'Esfera de chocolate amargo con centro líquido de maracuyá y helado artesanal de pistacho.',
      trasnoche: 'Estación de pizzas rústicas a la piedra preparadas en vivo.'
    }
  }
];

// -----------------------------------------------------------------------------------------
// 2. TARIFAS DE PERSONAL / STAFF (Jornada completa del evento)
// -----------------------------------------------------------------------------------------
export const PERSONAL_TARIFAS_INICIALES: StaffTarifas = {
  garzonJornada: 48000,     // $ Pago al garzón por turno en Finca La Toscana
  cocineroJornada: 58000,    // $ Pago al cocinero / parrillero
  aseoJornada: 40000,        // $ Pago al personal de aseo y baños continuos
  maitreJornada: 80000,      // $ Coordinadora de sala / Wedding Planner en terreno

  // Ratios recomendados en gastronomía (ej: 1 garzón cada 12 invitados):
  ratioGarzon: 12,           // 1 garzón cada 12 invitados
  ratioCocinero: 35,         // 1 cocinero cada 35 invitados
  ratioAseo: 50              // 1 persona de aseo cada 50 invitados
};

// -----------------------------------------------------------------------------------------
// 3. TARIFAS DE PROVEEDORES Y SERVICIOS INTEGRALES DOMINGA EVENTOS
// -----------------------------------------------------------------------------------------
export const PROVEEDORES_INICIALES: ProveedorServicio[] = [
  {
    id: 'vajilla-cristaleria',
    nombre: 'Vajilla & Cristalería Fina de Gala (Línea Toscana)',
    categoria: 'vajilla',
    tipoCobro: 'por_persona',
    costo: 3900,
    precioVentaSugerido: 6000,
    descripcion: 'Platos de porcelana con ribete dorado o rústicos de greda esmaltada, copas de cristal labrado para vino y espumante, y cubiertos pulidos.',
    iconName: 'UtensilsCrossed',
    contactoNombre: 'Valeria Monckeberg (Arriendos de Gala SpA)',
    telefonoPedidos: '+56 9 8812 3450',
    emailPedidos: 'pedidos@vajillatoscana.cl',
    rut: '76.512.980-4',
    plazoAnticipacion: 'Reserva con 7 días de anticipación'
  },
  {
    id: 'dj-musica-iluminacion',
    nombre: 'DJ Profesional, Sonido Line-Array & Iluminación Perimetral Cálida',
    categoria: 'tecnica',
    tipoCobro: 'fijo',
    costo: 520000,
    precioVentaSugerido: 800000,
    descripcion: 'Sistema de audio distribuido para ceremonia en jardín, cóctel y salón de baile, micrófonos inalámbricos y cabezas robóticas LED.',
    iconName: 'Disc',
    contactoNombre: 'DJ Álvaro Carrasco (Producciones Acústicas)',
    telefonoPedidos: '+56 9 9234 5678',
    emailPedidos: 'alvaro.carrasco@prosound.cl',
    rut: '15.670.320-1',
    plazoAnticipacion: 'Reserva con 14 días para pruebas de sonido'
  },
  {
    id: 'flores-centros-mesa',
    nombre: 'Floristería de Autor & Pérgola de Ceremonia Civil',
    categoria: 'ambientacion',
    tipoCobro: 'fijo',
    costo: 420000,
    precioVentaSugerido: 650000,
    descripcion: 'Arreglo floral para arco de ceremonia en el jardín, centros de mesa con flores frescas de estación y caminos de follaje de eucalipto.',
    iconName: 'Flower2',
    contactoNombre: 'Constanza Silva (Floral Design Studio)',
    telefonoPedidos: '+56 9 7543 2190',
    emailPedidos: 'pedidos@floralstudio.cl',
    rut: '77.201.840-2',
    plazoAnticipacion: 'Montaje desde las 09:00 AM del día del evento'
  },
  {
    id: 'barra-libre-premium',
    nombre: 'Barra Libre Coctelería de Autor Dominga (5 Horas)',
    categoria: 'bar',
    tipoCobro: 'por_persona',
    costo: 13500,
    precioVentaSugerido: 21000,
    descripcion: 'Destilados premium (Gin Bombay/Beefeater, Vodka Absolut, Pisco Mistral Nobel, Whisky Johnnie Walker), cócteles de autor con macerados caseros.',
    iconName: 'Wine',
    contactoNombre: 'Matías Larraín (Jefe de Bar & Mixología)',
    telefonoPedidos: '+56 9 8456 1120',
    emailPedidos: 'barras@domingaeventos.cl',
    rut: '77.892.410-K',
    plazoAnticipacion: 'Coordinación insumos y stock 5 días antes'
  },
  {
    id: 'fotografia-cinematografia',
    nombre: 'Fotografía & Video Cinematográfico con Dron en Finca',
    categoria: 'cobertura',
    tipoCobro: 'fijo',
    costo: 580000,
    precioVentaSugerido: 890000,
    descripcion: '2 fotógrafos profesionales dedicados, tomas aéreas con dron de los viñedos y jardines de Finca La Toscana, y entrega de galería online en alta calidad.',
    iconName: 'Camera',
    contactoNombre: 'Sebastián Cruz (Cine & Foto Eventos)',
    telefonoPedidos: '+56 9 7621 9840',
    emailPedidos: 'contacto@cruzfotografia.cl',
    rut: '16.920.441-8',
    plazoAnticipacion: 'Briefing con novios 1 semana antes'
  },
  {
    id: 'pista-baile-led',
    nombre: 'Pista de Baile Iluminada & Microguirnaldas Aéreas',
    categoria: 'tecnica',
    tipoCobro: 'fijo',
    costo: 390000,
    precioVentaSugerido: 620000,
    descripcion: 'Cielo estrellado con cientos de luces microled sobre la pista de baile y estructura perimetral decorativa.',
    iconName: 'Sparkles',
    contactoNombre: 'Gabriel Henríquez (Estructuras & Iluminación)',
    telefonoPedidos: '+56 9 6432 1098',
    emailPedidos: 'iluminacion@eventospro.cl',
    rut: '76.490.112-9',
    plazoAnticipacion: 'Montaje 6 horas antes del inicio'
  },
  {
    id: 'generador-respaldo',
    nombre: 'Generador Eléctrico Silencioso de Respaldo Finca (120 kVA)',
    categoria: 'tecnica',
    tipoCobro: 'fijo',
    costo: 240000,
    precioVentaSugerido: 380000,
    descripcion: 'Planta de fuerza conectada con transferencia automática para garantizar 0 cortes de energía durante la música y la cocina.',
    iconName: 'Zap',
    contactoNombre: 'Cristián Alarcón (Generadores Chile)',
    telefonoPedidos: '+56 9 8320 7654',
    emailPedidos: 'emergencias@generadoreschile.cl',
    rut: '76.109.845-0',
    plazoAnticipacion: 'Instalación y prueba de carga técnica el día anterior'
  },
  {
    id: 'coffee-break-cocteleria',
    nombre: 'Coffee Break / Coctelería',
    categoria: 'cocteleria',
    tipoCobro: 'por_persona',
    costo: 5450,
    precioVentaSugerido: 8500,
    descripcion: 'Estación gourmet de café en grano, té seleccionado, tapaditos artesanales, mini pastelería fina y jugos naturales.',
    iconName: 'Coffee',
    contactoNombre: 'Camila Valenzuela (Banquetería & Coffee Break)',
    telefonoPedidos: '+56 9 7890 1234',
    emailPedidos: 'coffeebreak@domingaeventos.cl',
    rut: '77.340.891-6',
    plazoAnticipacion: 'Montaje 1 hora previa al inicio del evento'
  }
];

// -----------------------------------------------------------------------------------------
// 4. ESTILOS DE AMBIENTACIÓN & DECORACIÓN DE DOMINGA EVENTOS
// -----------------------------------------------------------------------------------------
export const ESTILOS_DECORACION_INICIALES: EstiloDecoracion[] = [
  {
    id: 'estilo-toscana-campestre',
    nombre: 'Toscana Campestre & Viñedos',
    subtitulo: 'Maderas nobles, luz cálida de guirnaldas y caminos de eucalipto fresco',
    costoFijo: 560000,
    precioVentaSugerido: 890000,
    descripcion: 'El estilo icónico de Finca La Toscana: atmósfera cálida en los jardines con faroles de hierro, velas y maderas patinadas.',
    paleta: ['#8B5A2B', '#556B2F', '#D2B48C', '#FFF8DC'],
    elementos: [
      'Mesas de madera maciza a la vista sin mantel completo',
      'Caminos de mesa en lino crudo y ramas frescas de eucalipto',
      'Cielo de guirnaldas cálidas estilo feria toscana',
      'Faroles rústicos de hierro negro con cirios aromáticos',
      'Detalles de corcho de viña y señalética en madera grabada'
    ],
    destacado: true,
    estiloVisual: {
      bgGradient: 'from-amber-50 to-orange-50/40',
      borderAccent: 'border-amber-300',
      textColor: 'text-amber-900',
      tagBg: 'bg-amber-100 text-amber-800'
    }
  },
  {
    id: 'estilo-elegante-romantico',
    nombre: 'Elegante Romántico Finca La Toscana',
    subtitulo: 'Candelabros dorados, lencería de lino marfil y orquídeas blancas',
    costoFijo: 820000,
    precioVentaSugerido: 1320000,
    descripcion: 'Diseño clásico y refinado para novios que buscan la máxima sofisticación en el salón principal climatizado.',
    paleta: ['#D4AF37', '#1E293B', '#F8FAFC', '#94A3B8'],
    elementos: [
      'Candelabros altos de bronce con velas cónicas',
      'Mantelería de jacquard marfil y servilletas de lino',
      'Platos de sitio labrados con ribete dorado',
      'Arreglos esféricos con orquídeas, rosas blancas y lisianthus',
      'Iluminación rasante dorada en muros y cortinajes'
    ],
    estiloVisual: {
      bgGradient: 'from-slate-50 to-amber-50/30',
      borderAccent: 'border-amber-400',
      textColor: 'text-slate-900',
      tagBg: 'bg-amber-50 text-amber-900'
    }
  },
  {
    id: 'estilo-boho-chic-linderos',
    nombre: 'Boho Chic & Fibras Naturales',
    subtitulo: 'Pampas grass gigantes, lámparas de mimbre y tonos terracota',
    costoFijo: 640000,
    precioVentaSugerido: 990000,
    descripcion: 'Estilo relajado pero de alta tendencia internacional, con materiales orgánicos y texturas cálidas bajo los árboles.',
    paleta: ['#C86D51', '#E3A857', '#FAF0E6', '#697152'],
    elementos: [
      'Penachos de pampas grass en floreros de cerámica artesanal',
      'Lámparas colgantes de mimbre tejido y ratán',
      'Alfombras de yute delimitando salas lounge campestres',
      'Servilletas de algodón terracota anudadas con ramitas de olivo',
      'Arco de ceremonia circular decorado en flores secas'
    ],
    estiloVisual: {
      bgGradient: 'from-orange-50/50 to-stone-50',
      borderAccent: 'border-orange-300',
      textColor: 'text-stone-900',
      tagBg: 'bg-orange-100 text-orange-900'
    }
  },
  {
    id: 'estilo-sunset-hadas',
    nombre: 'Sunset Garden & Luces de Hadas',
    subtitulo: 'Velas flotantes, pérgola botánica y microbombillos titilantes',
    costoFijo: 490000,
    precioVentaSugerido: 790000,
    descripcion: 'Diseñado para atardeceres mágicos: acento total en la iluminación sutil y la vegetación de la finca.',
    paleta: ['#0F172A', '#38BDF8', '#E2E8F0', '#FFFFFF'],
    elementos: [
      'Velas flotantes en cilindros de cristal de distintas alturas',
      'Pérgola principal cubierta de enredaderas y microleds',
      'Caminos iluminados con antorchas ecológicas de fuego cálido',
      'Centros de mesa transparentes con follaje verde y gypsophila',
      'Letrero de neón cálido con las iniciales de los novios'
    ],
    estiloVisual: {
      bgGradient: 'from-sky-50/40 to-slate-50',
      borderAccent: 'border-sky-300',
      textColor: 'text-slate-900',
      tagBg: 'bg-sky-100 text-sky-900'
    }
  }
];

// -----------------------------------------------------------------------------------------
// 5. PLANTILLA DE MESAS Y DISTRIBUCIÓN EN FINCA LA TOSCANA
// -----------------------------------------------------------------------------------------
export const MESAS_EJEMPLO_INICIALES: Mesa[] = [
  { id: 'm-1', numero: 1, nombre: 'Mesa Novios (Honor)', capacidad: 8, tipo: 'presidencial', zona: 'Salón Principal Toscana' },
  { id: 'm-2', numero: 2, nombre: 'Padres de la Novia', capacidad: 10, tipo: 'redonda', zona: 'Frente a Pista de Baile' },
  { id: 'm-3', numero: 3, nombre: 'Padres del Novio', capacidad: 10, tipo: 'redonda', zona: 'Frente a Pista de Baile' },
  { id: 'm-4', numero: 4, nombre: 'Familia Directa & Hermanos', capacidad: 10, tipo: 'redonda', zona: 'Terraza Campestre' },
  { id: 'm-5', numero: 5, nombre: 'Amigos Colegio', capacidad: 10, tipo: 'redonda', zona: 'Salón Principal Toscana' },
  { id: 'm-6', numero: 6, nombre: 'Amigos Universidad', capacidad: 10, tipo: 'redonda', zona: 'Salón Principal Toscana' },
  { id: 'm-7', numero: 7, nombre: 'Tíos y Adultos Mayores', capacidad: 10, tipo: 'redonda', zona: 'Zona Jardín Climatizada' },
  { id: 'm-8', numero: 8, nombre: 'Mesa Imperial Amigos de la Vida', capacidad: 12, tipo: 'imperial', zona: 'Pérgola Exterior' }
  // Total inicial: 80 puestos (Demuestra la alerta si se configuran 100 invitados)
];

// -----------------------------------------------------------------------------------------
// 6. RESERVAS PRE-CARGADAS EN EL CALENDARIO DE FINCA LA TOSCANA
// -----------------------------------------------------------------------------------------
export const RESERVAS_CALENDARIO_INICIALES: ReservaCalendario[] = [
  {
    id: 'res-toscana-01',
    titulo: 'Matrimonio Sofía & Cristóbal',
    cliente: 'Sofía Echeverría Larraín',
    tipoEvento: 'Boda',
    fecha: '2026-10-31',
    invitados: 130,
    estado: 'confirmado',
    montoTotal: 7920000,
    cotizacionSnapshot: {
      nombreEvento: 'Matrimonio Sofía & Cristóbal en Finca La Toscana',
      cliente: 'Sofía Echeverría Larraín',
      emailCliente: 'sofia.echeverria@gmail.com',
      telefonoCliente: '+56 9 8456 7890',
      tipoEvento: 'Boda',
      fechaEvento: '2026-10-31',
      invitados: 130,
      menuId: 'menu-toscana-gala',
      personal: { garzones: 11, cocineros: 4, aseo: 3, maitre: 1 },
      proveedoresSeleccionados: {
        'vajilla-cristaleria': true,
        'dj-musica-iluminacion': true,
        'flores-centros-mesa': true,
        'barra-libre-premium': true,
        'fotografia-cinematografia': true,
        'pista-baile-led': true,
        'generador-respaldo': true
      },
      mesas: [
        { id: 'm1', numero: 1, nombre: 'Mesa Novios', capacidad: 8, tipo: 'presidencial' },
        { id: 'm2', numero: 2, nombre: 'Padres Novia', capacidad: 10, tipo: 'redonda' },
        { id: 'm3', numero: 3, nombre: 'Padres Novio', capacidad: 10, tipo: 'redonda' },
        { id: 'm4', numero: 4, nombre: 'Familia Echeverría', capacidad: 10, tipo: 'redonda' },
        { id: 'm5', numero: 5, nombre: 'Familia Larraín', capacidad: 10, tipo: 'redonda' },
        { id: 'm6', numero: 6, nombre: 'Amigos Santiago', capacidad: 10, tipo: 'redonda' },
        { id: 'm7', numero: 7, nombre: 'Amigos Buin / Paine', capacidad: 10, tipo: 'redonda' },
        { id: 'm8', numero: 8, nombre: 'Mesa Imperial Jóvenes', capacidad: 12, tipo: 'imperial' },
        { id: 'm9', numero: 9, nombre: 'Tíos y Mayores', capacidad: 10, tipo: 'redonda' },
        { id: 'm10', numero: 10, nombre: 'Mesa Colegio', capacidad: 10, tipo: 'redonda' },
        { id: 'm11', numero: 11, nombre: 'Mesa Trabajo', capacidad: 10, tipo: 'redonda' },
        { id: 'm12', numero: 12, nombre: 'Mesa Universidad', capacidad: 10, tipo: 'redonda' },
        { id: 'm13', numero: 13, nombre: 'Mesa Niños y Primos', capacidad: 10, tipo: 'redonda' }
      ],
      decoracionId: 'estilo-toscana-campestre',
      margenGanancia: 40,
      aplicaIva: true,
      observaciones: 'Ceremonia civil en la pérgola de los jardines de Finca La Toscana a las 18:30 hrs. Coctel Sunset al atardecer.'
    }
  },
  {
    id: 'res-toscana-02',
    titulo: 'Cena de Fin de Año Viña Santa Rita / CMPC',
    cliente: 'Matías Undurraga (Gerencia RRHH)',
    tipoEvento: 'Corporativo',
    fecha: '2026-11-07',
    invitados: 160,
    estado: 'cotizado',
    montoTotal: 8450000,
    cotizacionSnapshot: {
      nombreEvento: 'Cena de Fin de Año Viña Santa Rita / CMPC',
      cliente: 'Matías Undurraga',
      emailCliente: 'mundurraga@santarita.cl',
      telefonoCliente: '+56 9 9234 5678',
      tipoEvento: 'Corporativo',
      fechaEvento: '2026-11-07',
      invitados: 160,
      menuId: 'menu-asado-finca-toscana',
      personal: { garzones: 14, cocineros: 5, aseo: 4, maitre: 1 },
      proveedoresSeleccionados: {
        'vajilla-cristaleria': true,
        'dj-musica-iluminacion': true,
        'generador-respaldo': true,
        'barra-libre-premium': true
      },
      mesas: [],
      decoracionId: 'estilo-sunset-hadas',
      margenGanancia: 35,
      aplicaIva: true,
      observaciones: 'Parrillada al palo al aire libre y premiación de trabajadores en el escenario principal.'
    }
  },
  {
    id: 'res-toscana-03',
    titulo: 'Boda Campestre Valentina & Tomás',
    cliente: 'Valentina Mackenna',
    tipoEvento: 'Boda',
    fecha: '2026-11-14',
    invitados: 110,
    estado: 'bloqueado',
    montoTotal: 6980000,
    cotizacionSnapshot: {
      nombreEvento: 'Boda Campestre Valentina & Tomás',
      cliente: 'Valentina Mackenna',
      emailCliente: 'vale.mackenna@gmail.com',
      telefonoCliente: '+56 9 7654 3211',
      tipoEvento: 'Boda',
      fechaEvento: '2026-11-14',
      invitados: 110,
      menuId: 'menu-sunset-cocktail',
      personal: { garzones: 10, cocineros: 4, aseo: 3, maitre: 1 },
      proveedoresSeleccionados: {
        'vajilla-cristaleria': true,
        'dj-musica-iluminacion': true,
        'flores-centros-mesa': true,
        'barra-libre-premium': true,
        'pista-baile-led': true,
        'generador-respaldo': true
      },
      mesas: [],
      decoracionId: 'estilo-boho-chic-linderos',
      margenGanancia: 35,
      aplicaIva: true,
      observaciones: 'Reserva pre-bloqueada con abono de garantía. Decoración boho chic con luces cálidas.'
    }
  }
];
