// ========================================
// APIT - Application Logic
// Mapbox Style with Dynamic Popups
// ========================================

// Global Variables
let map;
let currentBasemap = 'osm';
let basemapLayers = {};
let dataLayers = {};
let uploadedFiles = {};

// Layer Configuration
const LAYER_CONFIG = {
    cantones: {
        name: 'Cantones NMTD',
        icon: 'fas fa-map',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        style: { fillColor: '#667eea', weight: 2, color: '#764ba2', fillOpacity: 0.4 }
    },
    establecimientos: {
        name: 'Establecimientos',
        icon: 'fas fa-school',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        pointStyle: { radius: 6, fillColor: '#f5576c', color: '#f093fb', weight: 2, fillOpacity: 0.8 }
    },
    vias: {
        name: 'Vías Principales',
        icon: 'fas fa-road',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        style: { color: '#fa709a', weight: 3, opacity: 0.8 }
    },
    propuesta: {
        name: 'Propuesta NMTD',
        icon: 'fas fa-project-diagram',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        style: { fillColor: '#a8edea', weight: 2, color: '#fed6e3', fillOpacity: 0.4 }
    },
    propuesta2: {
        name: 'Propuesta NMTD 2',
        icon: 'fas fa-sitemap',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        style: { fillColor: '#30cfd0', weight: 2, color: '#330867', fillOpacity: 0.4 }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeBasemaps();
    initializeLayerCards();
    setupEventListeners();
    showToast('Sistema inicializado correctamente', 'success');
});

// ===== MAP INITIALIZATION =====
function initializeMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView([-1.8312, -78.1834], 7);

    // Add scale control
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
}

// ===== BASEMAP INITIALIZATION =====
function initializeBasemaps() {
    basemapLayers = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
        }),
        dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB',
            maxZoom: 19
        }),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap',
            maxZoom: 17
        })
    };

    basemapLayers[currentBasemap].addTo(map);
}

// ===== BASEMAP SWITCHER =====
function switchBasemap(basemapType) {
    if (basemapLayers[currentBasemap]) {
        map.removeLayer(basemapLayers[currentBasemap]);
    }

    currentBasemap = basemapType;
    basemapLayers[currentBasemap].addTo(map);

    // Update UI
    document.querySelectorAll('.basemap-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-basemap="${basemapType}"]`).classList.add('active');

    showToast(`Mapa base cambiado a ${basemapType}`, 'info');
}

// ===== LAYER CARDS INITIALIZATION =====
function initializeLayerCards() {
    const container = document.getElementById('layers-container');
    container.innerHTML = '';

    Object.keys(LAYER_CONFIG).forEach(layerId => {
        const config = LAYER_CONFIG[layerId];
        const card = createLayerCard(layerId, config);
        container.appendChild(card);
    });
}

function createLayerCard(layerId, config) {
    const card = document.createElement('div');
    card.className = 'layer-card';
    card.id = `card-${layerId}`;

    card.innerHTML = `
        <div class="layer-header">
            <div class="layer-info">
                <div class="layer-icon" style="background: ${config.gradient}">
                    <i class="${config.icon}"></i>
                </div>
                <div class="layer-details">
                    <h4>${config.name}</h4>
                    <span class="layer-count" id="count-${layerId}">0 elementos</span>
                </div>
            </div>
            <label class="layer-toggle">
                <input type="checkbox" id="toggle-${layerId}" onchange="toggleLayer('${layerId}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </div>
        <div class="layer-actions">
            <button class="btn-layer" onclick="uploadLayerFile('${layerId}')">
                <i class="fas fa-upload"></i>
                <span>Cargar</span>
            </button>
            <button class="btn-layer" onclick="zoomToLayer('${layerId}')">
                <i class="fas fa-search-location"></i>
                <span>Zoom</span>
            </button>
        </div>
        <input type="file" id="file-${layerId}" accept=".geojson,.json" style="display:none" onchange="handleFileLoad(event, '${layerId}')">
    `;

    return card;
}

// ===== FILE UPLOAD =====
function uploadLayerFile(layerId) {
    document.getElementById(`file-${layerId}`).click();
}

function handleFileLoad(event, layerId) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading(true, `Cargando ${file.name}...`);

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const geojsonData = JSON.parse(e.target.result);
            loadGeoJSONLayer(layerId, geojsonData, file.name);
            showToast(`Capa "${LAYER_CONFIG[layerId].name}" cargada exitosamente`, 'success');
        } catch (error) {
            showToast(`Error al cargar: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    };

    reader.onerror = function() {
        showToast('Error al leer el archivo', 'error');
        showLoading(false);
    };

    reader.readAsText(file);
}

// ===== LOAD GEOJSON LAYER =====
function loadGeoJSONLayer(layerId, geojsonData, filename) {
    // Remove existing layer
    if (dataLayers[layerId]) {
        map.removeLayer(dataLayers[layerId]);
    }

    const config = LAYER_CONFIG[layerId];
    
    // Create layer with dynamic popups
    const layer = L.geoJSON(geojsonData, {
        style: function(feature) {
            return config.style || {};
        },
        pointToLayer: function(feature, latlng) {
            if (config.pointStyle) {
                return L.circleMarker(latlng, config.pointStyle);
            }
            return L.marker(latlng);
        },
        onEachFeature: function(feature, layer) {
            // Create dynamic popup
            const popupContent = createDynamicPopup(feature, layerId);
            layer.bindPopup(popupContent, {
                maxWidth: 400,
                className: 'custom-popup'
            });

            // Click event for info panel
            layer.on('click', function(e) {
                showFeatureInfo(feature, layerId);
            });

            // Hover effects
            layer.on('mouseover', function(e) {
                if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                    this.setStyle({
                        fillOpacity: 0.7,
                        weight: 3
                    });
                }
            });

            layer.on('mouseout', function(e) {
                if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                    this.setStyle(config.style);
                }
            });
        }
    });

    dataLayers[layerId] = layer;
    uploadedFiles[layerId] = { data: geojsonData, filename };

    // Update UI
    const count = geojsonData.features.length;
    document.getElementById(`count-${layerId}`).textContent = `${count} elementos`;
    document.getElementById(`toggle-${layerId}`).checked = true;
    document.getElementById(`card-${layerId}`).classList.add('active');

    // Add to map
    layer.addTo(map);

    // Zoom to layer
    if (layer.getBounds && layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }

    // Update legend
    updateLegend();

    // Extract filter options
    extractFilterOptions(geojsonData);
}

// ===== CREATE DYNAMIC POPUP =====
function createDynamicPopup(feature, layerId) {
    const props = feature.properties;
    if (!props || Object.keys(props).length === 0) {
        return '<div class="popup-empty">Sin información disponible</div>';
    }

    let html = `<div class="popup-container">`;
    html += `<div class="popup-title">${LAYER_CONFIG[layerId].name}</div>`;
    html += `<div class="popup-content">`;

    // Priority fields for different layers
    const priorityFields = {
        cantones: ['DPA_DESCAN', 'DPA_DESPRO', 'Zonas', 'DPA_ANIO', 'fcode'],
        establecimientos: ['nombre', 'amie', 'zona', 'distrito', 'tipo_educacion', 'sostenimiento'],
        vias: ['nombre', 'tipo', 'estado', 'longitud_km'],
        propuesta: ['nombre', 'tipo', 'estado', 'zona', 'fecha'],
        propuesta2: ['nombre', 'tipo', 'estado', 'zona', 'fecha']
    };

    const fields = priorityFields[layerId] || Object.keys(props).slice(0, 8);

    fields.forEach(field => {
        if (props[field] !== undefined && props[field] !== null && props[field] !== '') {
            const label = formatFieldLabel(field);
            const value = formatFieldValue(props[field], field);
            html += `
                <div class="popup-row">
                    <span class="popup-label">${label}:</span>
                    <span class="popup-value">${value}</span>
                </div>
            `;
        }
    });

    html += `</div>`;
    html += `<div class="popup-footer">
        <button onclick="showFeatureInfo(${JSON.stringify(feature)}, '${layerId}')" class="popup-btn">
            <i class="fas fa-info-circle"></i> Más información
        </button>
    </div>`;
    html += `</div>`;

    return html;
}

// ===== FORMAT FIELD LABEL =====
function formatFieldLabel(field) {
    const labels = {
        'DPA_DESCAN': 'Cantón',
        'DPA_DESPRO': 'Provincia',
        'DPA_CANTON': 'Código Cantón',
        'DPA_PROVIN': 'Código Provincia',
        'DPA_ANIO': 'Año',
        'Zonas': 'Zona',
        'fcode': 'Código',
        'nombre': 'Nombre',
        'amie': 'Código AMIE',
        'zona': 'Zona',
        'distrito': 'Distrito',
        'tipo_educacion': 'Tipo Educación',
        'sostenimiento': 'Sostenimiento',
        'tipo': 'Tipo',
        'estado': 'Estado',
        'longitud_km': 'Longitud (km)'
    };

    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ===== FORMAT FIELD VALUE =====
function formatFieldValue(value, field) {
    if (typeof value === 'number') {
        if (field.includes('km') || field.includes('longitud')) {
            return value.toFixed(2) + ' km';
        }
        return value.toLocaleString('es-EC');
    }
    return value;
}

// ===== SHOW FEATURE INFO =====
function showFeatureInfo(feature, layerId) {
    const panel = document.getElementById('info-panel');
    const body = document.getElementById('info-body');
    const title = document.getElementById('info-title');

    title.innerHTML = `<i class="fas fa-info-circle"></i> ${LAYER_CONFIG[layerId].name}`;

    let html = '';
    const props = feature.properties;

    Object.keys(props).forEach(key => {
        if (props[key] !== null && props[key] !== undefined) {
            html += `
                <div class="info-row">
                    <span class="info-label">${formatFieldLabel(key)}</span>
                    <span class="info-value">${formatFieldValue(props[key], key)}</span>
                </div>
            `;
        }
    });

    body.innerHTML = html;
    panel.style.display = 'block';
}

function closeInfoPanel() {
    document.getElementById('info-panel').style.display = 'none';
}

// ===== TOGGLE LAYER =====
function toggleLayer(layerId, visible) {
    if (!dataLayers[layerId]) return;

    if (visible) {
        map.addLayer(dataLayers[layerId]);
        document.getElementById(`card-${layerId}`).classList.add('active');
    } else {
        map.removeLayer(dataLayers[layerId]);
        document.getElementById(`card-${layerId}`).classList.remove('active');
    }
}

// ===== ZOOM TO LAYER =====
function zoomToLayer(layerId) {
    if (dataLayers[layerId] && dataLayers[layerId].getBounds) {
        const bounds = dataLayers[layerId].getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
}

// ===== MAP CONTROLS =====
function zoomToEcuador() {
    map.setView([-1.8312, -78.1834], 7);
}

function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function takeScreenshot() {
    showLoading(true, 'Generando captura...');
    html2canvas(document.getElementById('map')).then(canvas => {
        const link = document.createElement('a');
        link.download = `apit_screenshot_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast('Captura guardada', 'success');
        showLoading(false);
    });
}

// ===== SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
    } else {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
    }
}

// ===== DOCUMENT PANEL =====
function toggleDocumentPanel() {
    const panel = document.getElementById('document-panel');
    panel.classList.toggle('active');
}

// ===== FILTERS =====
function extractFilterOptions(geojsonData) {
    // Implementation similar to previous version
}

function applyFilters() {
    // Implementation similar to previous version
}

function clearAllFilters() {
    document.getElementById('filter-zona').value = '';
    document.getElementById('filter-provincia').value = '';
    document.getElementById('filter-canton').value = '';
    document.getElementById('filter-anio').value = '';
    showToast('Filtros limpiados', 'info');
}

// ===== EXPORT =====
function exportFilteredData() {
    showToast('Exportando datos filtrados...', 'info');
}

function exportAllData() {
    showToast('Exportando todos los datos...', 'info');
}

function exportToExcel() {
    showToast('Exportando a Excel...', 'info');
}

// ===== LEGEND =====
function updateLegend() {
    const content = document.getElementById('legend-content');
    content.innerHTML = '';

    Object.keys(dataLayers).forEach(layerId => {
        if (dataLayers[layerId]) {
            const config = LAYER_CONFIG[layerId];
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-symbol" style="background: ${config.style?.fillColor || config.pointStyle?.fillColor || config.style?.color}"></div>
                <span>${config.name}</span>
            `;
            content.appendChild(item);
        }
    });
}

function toggleLegend() {
    const content = document.getElementById('legend-content');
    const icon = document.getElementById('legend-toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// ===== UI HELPERS =====
function showLoading(show, message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');
    overlay.style.display = show ? 'flex' : 'none';
    if (messageEl) messageEl.textContent = message;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Drag and drop for upload area
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4264fb';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        });
    }
}

// Add CSS for custom popup
const style = document.createElement('style');
style.textContent = `
    .custom-popup .leaflet-popup-content-wrapper {
        background: #0f1419;
        color: white;
        border-radius: 8px;
        border: 1px solid #2b313b;
    }
    .custom-popup .leaflet-popup-content {
        margin: 0;
    }
    .popup-container {
        min-width: 250px;
    }
    .popup-title {
        background: linear-gradient(135deg, #4264fb 0%, #7b61ff 100%);
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        border-radius: 8px 8px 0 0;
        margin: -1px -1px 0 -1px;
    }
    .popup-content {
        padding: 12px 16px;
    }
    .popup-row {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #2b313b;
        font-size: 13px;
    }
    .popup-label {
        font-weight: 600;
        color: #8a9299;
    }
    .popup-value {
        color: #ffffff;
    }
    .popup-footer {
        padding: 12px 16px;
        border-top: 1px solid #2b313b;
    }
    .popup-btn {
        width: 100%;
        background: #4264fb;
        border: none;
        color: white;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    .popup-btn:hover {
        background: #3451d9;
    }
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🗺️ APIT System Loaded Successfully');
