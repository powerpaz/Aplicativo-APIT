# 🗺️ APIT v3.0 - Sistema de Análisis de Presencia Institucional en Territorio

## ✨ VERSIÓN MEJORADA CON ESTÉTICA MAPBOX

Sistema web profesional para visualización y análisis de datos geográficos del MINEDUC Ecuador.

---

## 🚀 Características Principales

### 🎨 Interfaz Estilo Mapbox
- **Diseño oscuro moderno** similar a Mapbox Studio
- **Tipografía Inter** (la misma que usa Mapbox)
- **Gradientes vibrantes** para cada capa
- **Animaciones suaves** y transiciones fluidas
- **Totalmente responsivo**

### 🗺️ Basemap Switcher Dinámico
Cambia entre 4 mapas base con un solo click:

1. **🗺️ Calles (OSM)**: Mapa estándar de OpenStreetMap
2. **🛰️ Satélite**: Vista satelital de alta resolución (Esri)
3. **🌙 Modo Oscuro**: Tema oscuro estilo CartoDB
4. **⛰️ Terreno**: Relieve topográfico (OpenTopoMap)

### 💬 Popups Dinámicos e Inteligentes

**Características de los popups:**
- ✅ Se generan **automáticamente** según el tipo de capa
- ✅ Muestran campos **prioritarios** primero
- ✅ **Formato inteligente** de valores (números, fechas, unidades)
- ✅ Botón "Más información" para ver detalles completos
- ✅ **Estilo oscuro** consistente con Mapbox
- ✅ **Responsive** y adaptables

**Campos reconocidos por capa:**

#### Cantones NMTD
- Cantón (DPA_DESCAN)
- Provincia (DPA_DESPRO)
- Zona de Planificación
- Año
- Código

#### Establecimientos
- Nombre
- Código AMIE
- Zona y Distrito
- Tipo de Educación
- Sostenimiento

#### Vías Principales
- Nombre de la vía
- Tipo
- Estado
- Longitud (km)

#### Propuestas NMTD
- Nombre
- Tipo
- Estado
- Zona
- Fecha

### 📁 Gestor de Documentos Inteligente

**Organización automática por carpetas:**
```
📁 Documentos APIT/
  ├── 📂 Normativa y Acuerdos
  ├── 📂 Anexos
  ├── 📂 Capas GeoJSON
  └── 📂 Reportes
```

**Funcionalidades:**
- 📤 **Drag & drop** para subir archivos
- 👁️ Vista previa de documentos
- ⬇️ Descarga directa
- 🔄 Sincronización automática

### 🎯 Capas Dinámicas

**5 tipos de capas configurables:**
1. 🗺️ Cantones NMTD
2. 🏫 Establecimientos Educativos
3. 🛣️ Vías Principales
4. 📊 Propuesta NMTD
5. 📈 Propuesta NMTD 2

**Cada capa incluye:**
- Icono y gradiente único
- Contador de elementos en tiempo real
- Toggle para mostrar/ocultar
- Botón de carga de archivos
- Zoom automático a la capa

---

## 📦 Instalación

### Opción 1: Abrir Directamente
```bash
# Simplemente abre index.html en tu navegador
open index.html
```

### Opción 2: Servidor Local
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# Luego abre: http://localhost:8000
```

---

## 🎮 Cómo Usar

### 1️⃣ Cambiar el Mapa Base
- Click en los botones superiores derechos
- Opciones: Calles | Satélite | Oscuro | Terreno

### 2️⃣ Cargar tus Capas GeoJSON
**Método A - Botón Cargar:**
1. Click en "Cargar" en cualquier capa
2. Selecciona tu archivo `.geojson`
3. ¡Listo! La capa se carga automáticamente

**Método B - Drag & Drop:**
1. Click en "Documentos" (header)
2. Arrastra tu archivo a la zona de carga
3. Se organiza automáticamente

### 3️⃣ Interactuar con el Mapa
- **Click en un elemento**: Ver popup con información
- **Hover sobre polígonos**: Resaltado automático
- **Click en "Más información"**: Panel lateral con todos los detalles

### 4️⃣ Aplicar Filtros
- Selecciona Zona, Provincia, Cantón o Año
- Los filtros se aplican automáticamente
- Click en ❌ para limpiar todos los filtros

### 5️⃣ Exportar Datos
- **Datos Filtrados**: Solo elementos visibles
- **Todos los Datos**: Todas las capas cargadas
- **Excel**: Formato tabular con todas las propiedades

---

## 🎨 Personalización

### Cambiar Colores de las Capas

En `app.js`, línea ~15:
```javascript
const LAYER_CONFIG = {
    cantones: {
        gradient: 'linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%)',
        style: { fillColor: '#TU_COLOR', ... }
    }
};
```

### Agregar Nuevos Basemaps

En `app.js`, función `initializeBasemaps()`:
```javascript
basemapLayers.miMapa = L.tileLayer('https://tu-url/{z}/{x}/{y}.png', {
    attribution: 'Tu Atribución',
    maxZoom: 19
});
```

Luego agrega el botón en HTML:
```html
<button class="basemap-btn" data-basemap="miMapa" onclick="switchBasemap('miMapa')">
    <div class="basemap-preview"></div>
    <span>Mi Mapa</span>
</button>
```

### Personalizar Popups

Los popups se generan automáticamente, pero puedes personalizar los campos prioritarios en `app.js`:

```javascript
const priorityFields = {
    cantones: ['DPA_DESCAN', 'DPA_DESPRO', 'Zonas'],
    // Agrega tus campos aquí
};
```

---

## 🔧 Estructura de Archivos

```
apit-v3/
├── index.html          # Interfaz principal
├── styles.css          # Estilos Mapbox
├── app.js             # Lógica y funcionalidades
├── README.md          # Este archivo
├── data/              # Tus archivos GeoJSON
│   ├── Establecimiento.geojson
│   ├── NMTD_Propuesta_final2025.geojson
│   └── Vias_Principales.geojson
└── docs/              # Documentos APIT
    ├── acuerdos/
    ├── anexos/
    └── reportes/
```

---

## 🌐 URLs de Basemaps

### OpenStreetMap (Calles)
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Esri World Imagery (Satélite)
```
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

### CartoDB Dark Matter (Oscuro)
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

### OpenTopoMap (Terreno)
```
https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png
```

---

## 📱 Compatibilidad

| Navegador | Versión | Estado |
|-----------|---------|--------|
| Chrome | 90+ | ✅ Completo |
| Firefox | 88+ | ✅ Completo |
| Safari | 14+ | ✅ Completo |
| Edge | 90+ | ✅ Completo |

| Dispositivo | Soporte |
|-------------|---------|
| Desktop | ✅ Óptimo |
| Tablet | ✅ Funcional |
| Mobile | ⚠️ Limitado |

---

## 🐛 Solución de Problemas

### Los popups no aparecen
✅ Verifica que la capa tenga propiedades en el GeoJSON
✅ Abre la consola del navegador (F12) para ver errores

### El basemap no cambia
✅ Verifica tu conexión a internet
✅ Revisa que las URLs de tiles estén correctas

### Los archivos no se cargan
✅ Formato válido: `.geojson` o `.json`
✅ Tamaño máximo recomendado: 50MB
✅ Valida tu GeoJSON en: https://geojsonlint.com/

### El mapa se ve en blanco
✅ Espera a que carguen los tiles
✅ Verifica conexión a internet
✅ Prueba cambiar el basemap

---

## 🎯 Próximas Características

- [ ] Medición de distancias
- [ ] Búsqueda de ubicaciones
- [ ] Exportación a PDF
- [ ] Carga desde URL
- [ ] Comparación de capas
- [ ] Modo offline (PWA)

---

## 💡 Tips Pro

1. **Carga Progresiva**: Los archivos grandes se procesan en segundo plano
2. **Cache del Navegador**: Los basemaps se cachean automáticamente
3. **Zoom Inteligente**: Usa el botón 🏠 para volver a Ecuador
4. **Sidebar Colapsable**: Más espacio para el mapa
5. **Pantalla Completa**: Ideal para presentaciones

---

## 📞 Soporte

**Ministerio de Educación del Ecuador**
- 🌐 [https://educacion.gob.ec](https://educacion.gob.ec)
- 📧 info@educacion.gob.ec

**Secretaría Nacional de Planificación**
- 🌐 [https://www.planificacion.gob.ec](https://www.planificacion.gob.ec)
- 📧 info@planificacion.gob.ec

---

## 📄 Licencia

Desarrollado para el sector público ecuatoriano conforme a la normativa de la SNP.

---

## 🙏 Créditos

- **Diseño**: Inspirado en Mapbox Studio
- **Mapas**: OpenStreetMap, Esri, CartoDB, OpenTopoMap
- **Iconos**: Font Awesome
- **Tipografía**: Inter (Google Fonts)

---

**Versión**: 3.0  
**Fecha**: Diciembre 2024  
**Estado**: ✅ Producción Lista

**Desarrollado con** ❤️ **y mucho** ☕
