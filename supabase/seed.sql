-- ==============================================================================
-- DATOS INICIALES (SEEDS) PARA SUPABASE
-- Dominga Eventos & Centros de Eventos Chile
-- ==============================================================================

-- 1. Insertar Empresas
INSERT INTO public.empresas (id, nombre, subtitulo, recinto_principal, direccion, ciudad, telefono, email, sitio_web)
VALUES 
  ('emp-dominga', 'Dominga Eventos & Banquetes', 'Centro de Eventos Campestre & Banquetería Premium', 'Casona Dominga & Jardines', 'Camino Los Aromos 4520, Pirque', 'Santiago, Chile', '+56 9 3118 1304', 'contacto@domingaeventos.cl', 'https://domingaeventos.cl'),
  ('emp-toscana', 'Finca La Toscana Eventos', 'Elegancia italiana y viñedos para bodas exclusivas', 'Casona Patrimonial Los Almendros', 'Camino del Vino Km 14, Pirque', 'Santiago, Chile', '+56 9 3118 1304', 'eventos@latoscana.cl', 'https://latoscana.cl')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Insumos Maestro
INSERT INTO public.insumos (id, empresa_id, nombre, categoria, unidad_medida, precio_compra, merma_porcentaje, proveedor)
VALUES
  ('ins-filete', 'emp-dominga', 'Filete de Vacuno Limpio V/V', 'carnes', 'kg', 16500, 12, 'Carnes Premium Lo Valledor'),
  ('ins-salmon', 'emp-dominga', 'Salmón Fresco Calibre 4-5 Premium', 'pescados', 'kg', 13800, 8, 'Pesquera Puerto Montt'),
  ('ins-camaron', 'emp-dominga', 'Camarón Ecuatoriano 36/40', 'pescados', 'kg', 11900, 5, 'Congelados del Mar'),
  ('ins-reineta', 'emp-dominga', 'Reineta Filete Fresca', 'pescados', 'kg', 8900, 10, 'Terminal Pesquero Metropolitano'),
  ('ins-pechuga-pollo', 'emp-dominga', 'Pechuga deshuesada sin piel', 'carnes', 'kg', 5400, 6, 'Avícola Santa Rosa'),
  ('ins-crema', 'emp-dominga', 'Crema de Leche 35% MG', 'lacteos_huevos', 'L', 4200, 2, 'Soprole Profesional'),
  ('ins-mantequilla', 'emp-dominga', 'Mantequilla con Sal Artesanal', 'lacteos_huevos', 'kg', 8900, 1, 'Colun'),
  ('ins-queso-parmesano', 'emp-dominga', 'Queso Parmesano Grana Grattugiato', 'lacteos_huevos', 'kg', 15900, 3, 'Importadora San Remo'),
  ('ins-huevos', 'emp-dominga', 'Huevos de Campo Extra Grandes', 'lacteos_huevos', 'unidad', 220, 4, 'Huevos La Castellana'),
  ('ins-vino-tinto', 'emp-dominga', 'Vino Carmenere Reserva (Cocina y Salsas)', 'licores_bebidas', 'L', 3800, 0, 'Viña Concha y Toro'),
  ('ins-aceite-oliva', 'emp-dominga', 'Aceite de Oliva Extra Virgen Valle del Huasco', 'abarrotes', 'L', 9800, 2, 'Olivares del Norte'),
  ('ins-papas', 'emp-dominga', 'Papas Chilotas Seleccionadas', 'verduras_frutas', 'kg', 1200, 18, 'La Vega Central'),
  ('ins-esparragos', 'emp-dominga', 'Espárragos Verdes Calibre Jumbo', 'verduras_frutas', 'kg', 4500, 15, 'Agrícola Quillota'),
  ('ins-champinon', 'emp-dominga', 'Champiñón París Fresco', 'verduras_frutas', 'kg', 3600, 10, 'Cultivos Paine'),
  ('ins-frambuesas', 'emp-dominga', 'Frambuesas Frescas / IQF Grado A', 'verduras_frutas', 'kg', 6900, 5, 'Berries del Sur')
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Recetas Fichas Técnicas
INSERT INTO public.recetas (id, empresa_id, nombre, tiempo_menu, categoria, rendimiento_porciones, margen_sugerido, costo_adicional_elaboracion, descripcion_procedimiento, menu_asociado_id)
VALUES
  ('rec-fondo-filete', 'emp-dominga', 'Filete de Vacuno en Reducción de Carmenere con Gratin Dauphinois', 'fondo', 'Carnes Rojas', 1, 33, 850, 'Sellar el medallón de filete a fuego vivo con mantequilla clarificada. Hornear a 180°C por 7 minutos hasta alcanzar término medio (54°C núcleo). Reducir el Carmenere con mirepoix tostado y fondo oscuro.', 'menu-toscana-gala'),
  ('rec-fondo-salmon', 'emp-dominga', 'Salmón Austral en Crosta de Finas Hierbas y Risotto de Espárragos', 'fondo', 'Pescados', 1, 33, 900, 'Marcar el lomo de salmón por la piel. Aplicar crosta de panko, mantequilla y hierbas frescas. Hornear a 200°C por 6 minutos.', 'menu-campestre-asador'),
  ('rec-entrada-ceviche', 'emp-dominga', 'Ceviche Mixto Reineta & Camarón en Leche de Tigre al Maracuyá', 'entrada', 'Entradas Frías', 1, 35, 500, 'Cortar la reineta fresca en cubos de 1.5 cm. Hidratar camarones. Emulsionar leche de tigre con lima, jengibre y toques de maracuyá.', 'menu-toscana-gala'),
  ('rec-postre-tarta', 'emp-dominga', 'Tarta Tibia de Frambuesas Silvestres con Helado Artesanal de Vainilla', 'postre', 'Pastelería & Postres', 1, 30, 450, 'Masa sableé horneada a blanco, relleno de confitura de frambuesas ácidas de la zona de Pirque y helado de vainilla Madagascar.', 'menu-toscana-gala')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Ingredientes de Recetas
INSERT INTO public.receta_ingredientes (id, receta_id, insumo_id, cantidad, unidad, merma_especifica)
VALUES
  ('ri-1', 'rec-fondo-filete', 'ins-filete', 0.250, 'kg', 12),
  ('ri-2', 'rec-fondo-filete', 'ins-vino-tinto', 0.120, 'L', 0),
  ('ri-3', 'rec-fondo-filete', 'ins-papas', 0.200, 'kg', 18),
  ('ri-4', 'rec-fondo-filete', 'ins-crema', 0.080, 'L', 2),
  ('ri-5', 'rec-fondo-filete', 'ins-mantequilla', 0.030, 'kg', 1),
  ('ri-6', 'rec-fondo-salmon', 'ins-salmon', 0.220, 'kg', 8),
  ('ri-7', 'rec-fondo-salmon', 'ins-esparragos', 0.100, 'kg', 15),
  ('ri-8', 'rec-fondo-salmon', 'ins-mantequilla', 0.040, 'kg', 1),
  ('ri-9', 'rec-entrada-ceviche', 'ins-reineta', 0.120, 'kg', 10),
  ('ri-10', 'rec-entrada-ceviche', 'ins-camaron', 0.060, 'kg', 5),
  ('ri-11', 'rec-postre-tarta', 'ins-frambuesas', 0.100, 'kg', 5),
  ('ri-12', 'rec-postre-tarta', 'ins-crema', 0.050, 'L', 2)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Menús
INSERT INTO public.menus (id, empresa_id, nombre, categoria, costo_persona, precio_sugerido_persona, descripcion, coctel, entrada, fondo, postre, trasnoche, destacado, recetas_ids, costo_calculado_desde_recetas)
VALUES
  ('menu-toscana-gala', 'emp-dominga', 'Banquete Gala Finca La Toscana (Alta Gastronomía)', 'formal', 15850, 48000, 'Servicio formal de 4 tiempos diseñado para bodas y galas con servicio al plato sincronizado.', '12 bocados por persona fríos y calientes (Ceviches, empanaditas gourmet, pinchos de pulpo, tártaro)', 'Ceviche Mixto de Reineta & Camarón en Leche de Tigre al Maracuyá o Carpaccio de Filete', 'Filete de Res en Reducción de Carmenere con Papas Rústicas Gratinadas y Espárragos Salteados', 'Tarta Tibia de Frambuesas Silvestres con Helado Artesanal de Vainilla y crocante de caramelo', 'Mini smash burgers con queso cheddar ahumado y sopaipillas con pebre criollo', true, '["rec-entrada-ceviche", "rec-fondo-filete", "rec-postre-tarta"]'::jsonb, true),
  ('menu-campestre-asador', 'emp-dominga', 'Asado Campestre Premium al Fuego', 'campestre', 14200, 42000, 'Experiencia rústica con estaciones de cortes a las brasas a la vista de los invitados.', 'Empanaditas de pino al horno de barro, tablas de quesos artesanales y charcutería chilena', 'Buffet fresco de ensaladas orgánicas con aliños de la casa y quínoa al cilantro', 'Cortes nobles a la espada: Costillar a la chilena, Punta de Ganso, Lomo Vetado y Verduras asadas', 'Buffet de postres chilenos: Mousse de lúcuma, Suspiro limeño y Torta hojarasca manjar', 'Choripanes en marraqueta con chimichurri casero y consomé campestre', false, '["rec-fondo-salmon"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Insertar Tarifas Staff
INSERT INTO public.staff_tarifas (id, empresa_id, garzon_jornada, cocinero_jornada, aseo_jornada, maitre_jornada, ratio_garzon, ratio_cocinero, ratio_aseo)
VALUES
  ('tarifa-staff-default', 'emp-dominga', 45000, 55000, 40000, 70000, 15, 35, 50)
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar Proveedores
INSERT INTO public.proveedores (id, empresa_id, nombre, categoria, tipo_cobro, costo, precio_venta_sugerido, descripcion, icon_name, obligatorio)
VALUES
  ('vajilla-cristaleria', 'emp-dominga', 'Menaje Completo, Mantelería y Cristalería', 'vajilla', 'por_persona', 4800, 8500, 'Copas de cristal para vino/agua/espumante, platos de loza blanca y mantelería fina.', 'Utensils', true),
  ('dj-musica-iluminacion', 'emp-dominga', 'DJ Profesional, Audio Line-Array e Iluminación DMX', 'tecnica', 'fijo', 650000, 950000, 'Equipamiento completo para ceremonia, cóctel y fiesta bailable con iluminación perimetral.', 'Speaker', false),
  ('flores-centros-mesa', 'emp-dominga', 'Centros de Mesa y Floristería Natural', 'ambientacion', 'por_persona', 3200, 5800, 'Arreglos con flores de temporada, eucalipto fresco y bases cilíndricas con velas.', 'Flower2', false),
  ('barra-libre-premium', 'emp-dominga', 'Barra Libre Ilimitada de Coctelería & Licores', 'bar', 'por_persona', 7500, 13900, 'Pisco Sour artesanal, Gin Tonic, Mojito cubano, Aperol Spritz, cerveza y bebidas.', 'Wine', false),
  ('generador-respaldo', 'emp-dominga', 'Generador Eléctrico Silencioso de Respaldo 80 kVA', 'tecnica', 'fijo', 280000, 390000, 'Garantía 100% ante cortes de suministro durante todo el evento.', 'Zap', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Insertar Estilos de Decoración
INSERT INTO public.estilos_decoracion (id, empresa_id, nombre, subtitulo, costo_fijo, precio_venta_sugerido, descripcion, paleta, elementos, destacado, estilo_visual)
VALUES
  ('estilo-toscana-campestre', 'emp-dominga', 'Toscana Campestre Elegante', 'Calidez mediterránea con toques de viñedo y madera noble', 450000, 750000, 'Montaje con mesas de madera al descubierto, caminos de lino natural, follaje verde olivo y guirnaldas de microleds cálidas.', '["#2d5016", "#e8dfd8", "#c8963e", "#5c4033"]'::jsonb, '["Guirnaldas microled 300m", "Caminos de mesa lino rústico", "Candelabros de fierro forjado", "Vasos ámbar labrados"]'::jsonb, true, '{"bgGradient": "from-amber-50 to-emerald-50", "borderAccent": "border-amber-300", "textColor": "text-amber-900", "tagBg": "bg-amber-100 text-amber-800"}'::jsonb),
  ('estilo-boho-chic', 'emp-dominga', 'Boho Chic & Pampa Grass', 'Tendencia orgánica, plumas de pampa y fibras naturales', 520000, 850000, 'Estructuras florales con plumero de pampa, alfombras persas en la ceremonia y lámparas de ratán suspendidas.', '["#b58463", "#eddcd2", "#cb997e", "#6b705c"]'::jsonb, '["Estructura floral de ceremonia hexagonal", "Lámparas colgantes de mimbre", "Alfombras artesanales vintage", "Cojines y livings de terciopelo"]'::jsonb, false, '{"bgGradient": "from-stone-50 to-orange-50", "borderAccent": "border-orange-300", "textColor": "text-stone-800", "tagBg": "bg-orange-100 text-orange-800"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
