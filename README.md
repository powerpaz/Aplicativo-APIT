# APIT - MINEDUC
## Sistema de Análisis de Presencia Institucional en Territorio

Sistema web interactivo para la visualización, análisis y gestión de capas geográficas del Ministerio de Educación del Ecuador, conforme al Acuerdo Nro. SNP-SNP-2024-0038-A.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-Public_Sector-green)
![Status](https://img.shields.io/badge/status-Production-success)

---

## 🎯 Características Principales

### 📍 Visualización de Capas GeoJSON
- **Cantones (NMTD)**: División administrativa territorial
- **Establecimientos Educativos**: Ubicación de instituciones
- **Vías Principales**: Red vial del país
- **Propuestas NMTD**: Modelos de desconcentración propuestos

### 🔍 Sistema de Filtros Avanzados
- Filtro por **Zona de Planificación** (UZ1-UZ9)
- Filtro por **Provincia**
- Filtro por **Cantón**
- Filtro por **Año** (2024-2025)
- **Filtros dinámicos** que se actualizan según los datos cargados

### 📊 Estadísticas en Tiempo Real
- Contador de elementos por capa
- Contador de elementos filtrados
- Actualización automática al cargar datos

### 💾 Exportación de Datos
- **Descargar filtrados**: Exportar solo los datos visibles según filtros
- **Descargar todo**: Exportar todas las capas cargadas
- **Exportar a Excel**: Generar archivo .xlsx con todos los atributos
- **Formato GeoJSON**: Mantiene la integridad geoespacial

### 🗺️ Controles del Mapa
- **Centrar en Ecuador**: Volver a la vista inicial
- **Pantalla completa**: Modo inmersivo
- **Captura de pantalla**: Guardar imagen del mapa actual

---

## 🚀 Instalación Rápida

### Opción 1: Abrir Directamente
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/apit-mineduc.git

# 2. Abrir index.html en tu navegador
open index.html  # Mac
start index.html # Windows
xdg-open index.html # Linux
```

### Opción 2: Servidor Local
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx http-server

# Abrir http://localhost:8000
```

---

## 📁 Estructura del Proyecto

```
apit-mineduc/
│
├── index.html          # Aplicación principal
├── styles.css          # Estilos y diseño
├── app.js             # Lógica de la aplicación
├── README.md          # Este archivo
│
└── data/              # Carpeta para tus archivos GeoJSON
    ├── Establecimiento.geojson
    ├── NMTD_Propuesta_final2025.geojson
    ├── NMTDOpropuesta2.geojson
    └── Vias_Principales.geojson
```

---

## 📥 Cómo Cargar Tus Datos

### 1. Preparar Archivos GeoJSON

Tus archivos deben seguir la estructura estándar GeoJSON:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "DPA_CANTON": "0904",
        "DPA_DESCAN": "BALZAR",
        "DPA_PROVIN": "09",
        "DPA_DESPRO": "GUAYAS",
        "DPA_ANIO": "2024",
        "fcode": "HA003",
        "Zonas": "UZ5"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### 2. Cargar en la Aplicación

#### Método 1: Botón de Carga
1. Abrir la aplicación
2. Click en el botón 📤 junto a la capa deseada
3. Seleccionar tu archivo .geojson
4. La capa se cargará automáticamente

#### Método 2: Colocar en Carpeta
1. Copiar archivos a la carpeta `data/`
2. Modificar `app.js` para cargar automáticamente:

```javascript
// En la función initMap(), agregar:
fetch('data/NMTD_Propuesta_final2025.geojson')
    .then(response => response.json())
    .then(data => loadGeoJSONLayer('cantones', data));
```

---

## 🎨 Campos Reconocidos Automáticamente

El sistema reconoce y procesa automáticamente estos campos:

### Para Cantones/División Territorial
- `DPA_CANTON` - Código de cantón
- `DPA_DESCAN` - Nombre del cantón
- `DPA_PROVIN` - Código de provincia
- `DPA_DESPRO` - Nombre de provincia
- `DPA_ANIO` - Año de referencia
- `Zonas` - Zona de planificación (UZ1-UZ9)
- `fcode` - Código funcional

### Para Establecimientos
- `nombre` - Nombre del establecimiento
- `tipo` - Tipo de establecimiento
- `codigo` - Código único
- `zona` - Zona de planificación

### Para Vías
- `nombre` - Nombre de la vía
- `tipo` - Tipo de vía
- `longitud` - Longitud en metros

---

## 🔧 Uso de Filtros

### Filtrar por Zona
```javascript
// Los filtros se aplican automáticamente al seleccionar en el dropdown
// Zonas disponibles: UZ1, UZ2, UZ3, UZ4, UZ5, UZ6, UZ7, UZ8, UZ9
```

### Filtros Combinados
Los filtros son **acumulativos**:
- Zona + Provincia = Cantones de esa provincia en esa zona
- Zona + Provincia + Cantón = Elementos específicos
- Todos los filtros + Año = Máxima precisión

### Limpiar Filtros
Click en el botón **"Limpiar Filtros"** para resetear todos los filtros y mostrar todos los datos.

---

## 📊 Exportar Datos

### 1. Descargar Datos Filtrados
```javascript
// Exporta solo los elementos visibles según los filtros actuales
// Formato: GeoJSON
// Archivo: datos_filtrados.geojson
```

### 2. Descargar Todos los Datos
```javascript
// Exporta todas las capas cargadas
// Formato: GeoJSON combinado
// Archivo: todos_los_datos.geojson
```

### 3. Exportar a Excel
```javascript
// Convierte todas las propiedades a formato tabular
// Formato: XLSX (Excel)
// Archivo: datos_apit.xlsx
// Incluye columna "Capa" para identificar el origen
```

---

## 💻 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Leaflet.js** | 1.9.4 | Mapas interactivos |
| **SheetJS (xlsx)** | 0.18.5 | Exportación a Excel |
| **html2canvas** | 1.4.1 | Capturas de pantalla |
| **Font Awesome** | 6.4.0 | Iconografía |
| **OpenStreetMap** | - | Capa base de mapas |

---

## 🎯 Casos de Uso

### Caso 1: Análisis de Cobertura por Zona
1. Cargar capa de Establecimientos
2. Filtrar por Zona (ej: UZ5)
3. Ver estadísticas de establecimientos en esa zona
4. Exportar datos filtrados

### Caso 2: Planificación de Rutas
1. Cargar Vías Principales
2. Cargar Establecimientos
3. Visualizar accesibilidad
4. Tomar captura para reportes

### Caso 3: Comparación de Propuestas
1. Cargar Propuesta NMTD 1
2. Cargar Propuesta NMTD 2
3. Alternar visibilidad para comparar
4. Exportar ambas propuestas a Excel

---

## 🐛 Solución de Problemas

### El mapa no carga
- ✅ Verificar conexión a internet
- ✅ Abrir consola del navegador (F12)
- ✅ Revisar errores en rojo

### El archivo GeoJSON no se carga
- ✅ Verificar que sea JSON válido
- ✅ Usar herramienta: https://geojsonlint.com/
- ✅ Tamaño recomendado: < 50MB

### Los filtros no funcionan
- ✅ Verificar que los campos existan en tus datos
- ✅ Los nombres de campos son case-sensitive
- ✅ Recargar la página

### Exportación a Excel falla
- ✅ Deshabilitar bloqueador de popups
- ✅ Verificar espacio en disco
- ✅ Probar con menos datos

---

## 📱 Compatibilidad

### Navegadores
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dispositivos
- ✅ Desktop (Óptimo)
- ✅ Laptop
- ⚠️ Tablet (Funcional)
- ⚠️ Mobile (Limitado)

---

## 🚀 Despliegue en GitHub Pages

### Configuración Automática

```bash
# 1. Crear repositorio en GitHub
# 2. Subir archivos
git add .
git commit -m "Initial commit"
git push origin main

# 3. En GitHub: Settings → Pages
#    - Source: Deploy from branch
#    - Branch: main
#    - Folder: / (root)

# Tu sitio estará en:
# https://tu-usuario.github.io/apit-mineduc/
```

---

## 🤝 Contribuir

¿Quieres mejorar el sistema? ¡Genial!

1. Fork el proyecto
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto se desarrolla para el sector público ecuatoriano conforme a las normativas de la Secretaría Nacional de Planificación.

---

## 📞 Contacto

**Ministerio de Educación del Ecuador**
- 🌐 Web: https://educacion.gob.ec
- 📧 Email: info@educacion.gob.ec

**Secretaría Nacional de Planificación**
- 🌐 Web: https://www.planificacion.gob.ec
- 📧 Email: info@planificacion.gob.ec

---

## 🙏 Agradecimientos

- Secretaría Nacional de Planificación (SNP)
- Ministerio de Educación (MINEDUC)
- Comunidad OpenStreetMap
- Proyecto Leaflet.js
- Contribuidores del proyecto

---

**Versión**: 2.0  
**Última actualización**: Diciembre 2024  
**Estado**: Producción ✅
