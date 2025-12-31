# APIT - Sistema Mejorado con Capas Precargadas

## 🎯 Mejoras Implementadas

### ✅ Principales Cambios

1. **Capas Precargadas Automáticamente**
   - Las capas GeoJSON se cargan al iniciar la aplicación
   - No es necesario usar el botón "Cargar"
   - Los toggles solo activan/desactivan la visualización

2. **Mejor Rendimiento**
   - Carga inicial optimizada con Promise.all()
   - Datos almacenados en memoria para acceso rápido
   - Filtros aplicados en tiempo real

3. **Nueva Funcionalidad**
   - Botón "Descargar" para exportar capas individuales
   - Búsqueda de ubicaciones con Nominatim
   - Herramienta de medición de distancias
   - Estadísticas del sistema

4. **UI/UX Mejorada**
   - Indicador de carga con mensaje informativo
   - Contadores de elementos en tiempo real
   - Leyenda que muestra solo capas activas
   - Tooltips informativos

## 📁 Estructura de Archivos

```
APIT-Mejorado/
├── index-mejorado.html    # Página principal
├── app-mejorado.js        # Lógica de la aplicación (mejorada)
├── styles.css             # Estilos (sin cambios)
├── NMTD_OT.geojson       # Capa de cantones NMTD
├── Establecimiento.geojson # Capa de establecimientos
├── Vias_Principales.geojson # Capa de vías principales
└── Provincia_.json        # Capa de provincias
```

## 🚀 Cómo Usar

### Opción 1: Servidor Local

```bash
# Si tienes Python 3 instalado:
python -m http.server 8000

# Luego abre en tu navegador:
http://localhost:8000/index-mejorado.html
```

### Opción 2: Servidor HTTP Simple

```bash
# Si tienes Node.js instalado:
npx http-server -p 8000

# Luego abre en tu navegador:
http://localhost:8000/index-mejorado.html
```

### Opción 3: VS Code Live Server

1. Abre la carpeta en VS Code
2. Instala la extensión "Live Server"
3. Click derecho en `index-mejorado.html` → "Open with Live Server"

## 🎮 Funcionalidades

### Capas Geográficas
- ✅ **Cantones NMTD**: Límites de cantones
- ✅ **Establecimientos**: Puntos de establecimientos educativos
- ✅ **Vías Principales**: Red vial principal
- ✅ **Provincias**: Límites provinciales

### Controles del Mapa
- 🏠 **Centrar en Ecuador**: Vuelve a la vista inicial
- ➕ **Zoom In/Out**: Acercar o alejar el mapa
- 🖥️ **Pantalla Completa**: Modo de pantalla completa
- 📷 **Captura de Pantalla**: Guarda imagen del mapa
- 📏 **Medir Distancia**: Mide distancias en el mapa
- 🔍 **Búsqueda**: Busca ubicaciones en Ecuador

### Filtros
- **Zona**: Filtra por zona geográfica
- **Provincia**: Filtra por provincia
- **Cantón**: Filtra por cantón
- **Año**: Filtra por año

### Exportación
- 📤 **Datos Filtrados**: Exporta solo los datos visibles
- 💾 **Todos los Datos**: Exporta todas las capas
- 📊 **Excel**: Exporta en formato Excel (.xlsx)

## 🔧 Configuración de Capas

En `app-mejorado.js`, puedes modificar las capas en el objeto `LAYER_CONFIG`:

```javascript
const LAYER_CONFIG = {
    cantones: {
        name: 'Cantones NMTD',
        icon: 'fas fa-map',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        style: { fillColor: '#667eea', weight: 2, color: '#764ba2', fillOpacity: 0.4 },
        file: 'NMTD_OT.geojson'  // ← Ruta al archivo
    },
    // ... más capas
};
```

## 📊 Diferencias con la Versión Original

| Característica | Original | Mejorado |
|----------------|----------|----------|
| Carga de capas | Manual (botón "Cargar") | Automática al inicio |
| Toggles | No funcionaba bien | Solo prende/apaga capas |
| Botón "Cargar" | Presente | Eliminado (reemplazado por "Descargar") |
| Contadores | No se actualizaban | Se actualizan en tiempo real |
| Leyenda | Todas las capas | Solo capas activas |
| Búsqueda | No disponible | Integrada con Nominatim |
| Medición | No disponible | Herramienta de distancias |
| Estadísticas | No disponible | Panel de estadísticas |

## 🐛 Solución de Problemas

### Las capas no se cargan
- Verifica que todos los archivos `.geojson` estén en la misma carpeta que `index-mejorado.html`
- Revisa la consola del navegador (F12) para ver errores
- Asegúrate de estar usando un servidor HTTP (no abrir directamente el archivo HTML)

### Error de CORS
- **Problema**: No puedes abrir el archivo directamente en el navegador
- **Solución**: Usa un servidor local (ver sección "Cómo Usar")

### Los filtros no funcionan
- Verifica que las propiedades en los archivos GeoJSON coincidan con los nombres esperados
- Revisa la función `extractFilterOptions()` en `app-mejorado.js`

## 📝 Notas Técnicas

### Archivos GeoJSON
Los archivos deben estar en formato GeoJSON válido:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": { ... }
    }
  ]
}
```

### Propiedades Esperadas
Para que los filtros funcionen correctamente, las features deben tener estas propiedades:
- `zona`, `ZONA` o `Zona`
- `provincia`, `PROVINCIA`, `Provincia` o `DPA_DESPRO`
- `canton`, `CANTON`, `Canton` o `DPA_DESCAN`

## 🎨 Personalización

### Cambiar Colores
Modifica los gradientes en `LAYER_CONFIG`:
```javascript
gradient: 'linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%)'
```

### Cambiar Íconos
Usa cualquier ícono de Font Awesome:
```javascript
icon: 'fas fa-nombre-icono'
```

### Cambiar Estilos de Capas
Modifica las propiedades `style` y `pointStyle`:
```javascript
style: { 
    fillColor: '#667eea', 
    weight: 2, 
    color: '#764ba2', 
    fillOpacity: 0.4 
}
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que todos los archivos estén presentes
3. Asegúrate de usar un servidor HTTP local

## 🚀 Próximas Mejoras Sugeridas

- [ ] Cache de capas con LocalStorage
- [ ] Modo offline
- [ ] Análisis espacial avanzado
- [ ] Exportación de mapas en PDF
- [ ] Integración con base de datos
- [ ] Autenticación de usuarios
- [ ] Panel de administración

---

**Versión**: 2.0 - Capas Precargadas
**Fecha**: Diciembre 2024
**Desarrollado para**: MINEDUC Ecuador
