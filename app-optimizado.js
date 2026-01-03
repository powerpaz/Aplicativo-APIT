// ========================================
// APIT - Application Logic MEJORADO
// Capas GeoJSON Precargadas
// ========================================

// Global Variables
let map;
let currentBasemap = 'osm';
let basemapLayers = {};
let dataLayers = {};
let layerData = {}; // Almacena los datos GeoJSON precargados
let geocodeMarker = null; // Marcador temporal para búsquedas
let zonaUZStats = null; // Cache: conteo de cantones por Zona (UZ)

// Layer Configuration con rutas de archivos
// Layer Configuration con rutas de archivos
// NOTA: Cambia preload a true si quieres que una capa se cargue al inicio
const LAYER_CONFIG = {
    cantones: {
        name: 'Cantones NMTD',
        icon: 'fas fa-map',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        style: { fillColor: '#667eea', weight: 2, color: '#764ba2', fillOpacity: 0.4 },
        file: 'NMTD_OT.geojson',
        preload: true  // Cargar al inicio (es pequeño - 85KB)
    },
    establecimientos: {
        name: 'Establecimientos',
        icon: 'fas fa-school',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        pointStyle: { radius: 3, fillColor: '#0d6efd', color: '#083d8c', weight: 1, fillOpacity: 0.85 },
        file: 'Establecimiento.geojson',
        preload: false  // Cargar bajo demanda (11MB - pesado)
    },
    vias: {
        name: 'Vías Principales',
        icon: 'fas fa-road',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        style: { color: '#d90429', weight: 3, opacity: 0.9 },
        file: 'Vias_Principales.geojson',
        preload: false  // Cargar bajo demanda (21MB - muy pesado)
    },
    provincia: {
        name: 'Provincias',
        icon: 'fas fa-map-marked-alt',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        style: { color: '#000000', weight: 2, opacity: 1, fillOpacity: 0 },
        file: 'Provincia_.json',
        preload: true  // Cargar al inicio (1.9MB - manejable)
    },
    zonas_uz: {
        name: 'Zonas (UZ)',
        icon: 'fas fa-border-all',
        gradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        // contorno negro sólido + relleno muy leve
        style: { color: '#000000', weight: 2, opacity: 1, fillColor: '#ffffff', fillOpacity: 0.05 },
        file: 'Zonas_UZ.geojson',
        preload: false  // Cargar bajo demanda
    }
};


// ===== Paleta de colores por Zona (UZ) =====
const UZ_COLOR_MAP = {
    'UZ1': '#1f77b4',
    'UZ2': '#ff7f0e',
    'UZ3': '#2ca02c',
    'UZ4': '#d62728',
    'UZ5': '#9467bd',
    'UZ6': '#8c564b',
    'UZ7': '#e377c2',
    'UZ8': '#7f7f7f',
    'UZ9': '#bcbd22',
    'UZ10': '#17becf',
    'UZ11': '#4e79a7',
    'UZ12': '#f28e2b',
    'UZ13': '#59a14f',
    'UZ14': '#e15759',
    'ZEE': '#9ca3af'
};

function getUZFillColor(zonaCode) {
    const key = String(zonaCode || '').toUpperCase();
    return UZ_COLOR_MAP[key] || '#93c5fd';
}

// ===== NMT_25: símbolos por clase =====
function normalizeNmt25(value) {
    return String(value || '').trim().toUpperCase();
}

function createNmt25Icon(nmt25) {
    const v = normalizeNmt25(nmt25);

    // Azul institucional (con borde más oscuro)
    const fill = '#0d6efd';
    const stroke = '#083d8c';
    const size = 18;
    const half = size / 2;

    let svg = '';
    if (v === 'OT') {
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="${half}" cy="${half}" r="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
               </svg>`;
    } else if (v === 'UZ') {
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                 <rect x="4" y="4" width="10" height="10" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
               </svg>`;
    } else { // UD u otros
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                 <polygon points="${half},3 15,14 3,14" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
               </svg>`;
    }

    return L.divIcon({
        className: 'nmt25-icon',
        html: svg,
        iconSize: [size, size],
        iconAnchor: [half, half]
    });
}


// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeBasemaps();
    initializeLayerCards();
    preloadAllLayers(); // NUEVA FUNCIÓN: Precarga todas las capas
    setupEventListeners();
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

// ===== FUNCIÓN OPTIMIZADA: PRELOAD SOLO CAPAS ESENCIALES =====
async function preloadAllLayers() {
    showLoading(true, 'Iniciando sistema...');
    
    // Solo precargar capas marcadas con preload: true
    const layersToPreload = Object.entries(LAYER_CONFIG).filter(([_, config]) => config.preload === true);
    const total = layersToPreload.length;
    let loaded = 0;
    let successCount = 0;
    
    console.log(`📊 Precargando ${total} capas esenciales...`);
    
    // Cargar capas SECUENCIALMENTE
    for (const [layerId, config] of layersToPreload) {
        if (!config.file) continue;
        
        try {
            loaded++;
            showLoading(true, `Cargando ${config.name}... (${loaded}/${total})`);
            
            const response = await fetch(config.file);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const geojsonData = await response.json();
            
            // Guardar datos
            layerData[layerId] = geojsonData;
            
            // Crear capa (pero NO agregarla al mapa aún)
            createLayerFromData(layerId, geojsonData);
            
            // Calcular stats de cantones por Zona (UZ) cuando existan ambas capas
            if (layerId === 'zonas_uz' || layerId === 'cantones') {
                maybeComputeZonaUZStats();
            }
            // Actualizar contador
            const count = geojsonData.features.length;
            updateLayerCount(layerId, count);
            
            successCount++;
            console.log(`✓ ${config.name}: ${count.toLocaleString()} elementos precargados`);
            
        } catch (error) {
            console.error(`✗ Error cargando ${config.name}:`, error);
            updateLayerCount(layerId, 0);
            const countEl = document.getElementById(`count-${layerId}`);
            if (countEl) {
                countEl.textContent = 'Error al cargar';
                countEl.style.color = '#f5576c';
            }
        }
    }
    
    // Inicializar contadores para capas bajo demanda
    Object.entries(LAYER_CONFIG).forEach(([layerId, config]) => {
        if (config.preload === false) {
            const countEl = document.getElementById(`count-${layerId}`);
            if (countEl) {
                countEl.textContent = 'Click para cargar';
                countEl.style.color = '#8a9299';
            }
        }
    });
    
    showLoading(false);
    
    if (successCount > 0) {
        showToast(`${successCount} capas precargadas. Las demás se cargarán al activarlas.`, 'success');
        updateLegend();
    } else if (total > 0) {
        showToast('Error al cargar capas. Verifica la consola.', 'error');
    } else {
        showToast('Sistema iniciado. Activa las capas para cargarlas.', 'info');
    }
}

// ===== CREAR CAPA DESDE DATOS PRECARGADOS (OPTIMIZADO) =====
function createLayerFromData(layerId, geojsonData) {
    const config = LAYER_CONFIG[layerId];
    const featureCount = geojsonData.features.length;
    
    // Para datasets grandes (>1000 features), usar renderizado optimizado
    const isLargeDataset = featureCount > 1000;

    
    // ==============================
    // CANTONES NMTD (NMTD_OT): símbolos por NMT_25 + cluster numérico
    // ==============================
    if (layerId === 'cantones') {
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 45,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div>${count}</div>`,
                    className: 'marker-cluster marker-cluster-custom',
                    iconSize: L.point(40, 40)
                });
            }
        });

        const geoLayer = L.geoJSON(geojsonData, {
            pointToLayer: function(feature, latlng) {
                const nmt = feature?.properties?.NMT_25;
                return L.marker(latlng, { icon: createNmt25Icon(nmt) });
            },
            onEachFeature: function(feature, layer) {
                const popupContent = createDynamicPopup(feature, layerId);
                layer.bindPopup(popupContent, { maxWidth: 400, className: 'custom-popup' });
                layer.on('click', function() {
                    showFeatureInfo(feature, layerId);
                });
            }
        });

        clusterGroup.addLayer(geoLayer);
        dataLayers[layerId] = clusterGroup;

        // Extraer filtros (incluye NMT_25)
        extractFilterOptions(geojsonData);
        return;
    }

// ==============================
    // ESTABLECIMIENTOS: puntos pequeños + cluster numérico
    // ==============================
    if (layerId === 'establecimientos') {
        const dotSize = 6;
        const dotIcon = L.divIcon({
            className: 'ie-dot-icon',
            html: '',
            iconSize: [dotSize, dotSize],
            iconAnchor: [dotSize / 2, dotSize / 2]
        });

        const clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 60,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div>${count}</div>`,
                    className: 'marker-cluster marker-cluster-custom',
                    iconSize: L.point(40, 40)
                });
            }
        });

        const geoLayer = L.geoJSON(geojsonData, {
            pointToLayer: function(feature, latlng) {
                return L.marker(latlng, { icon: dotIcon });
            },
            onEachFeature: function(feature, layer) {
                // Popup lazy para datasets grandes
                if (isLargeDataset) {
                    layer.on('click', function() {
                        const popupContent = createDynamicPopup(feature, layerId);
                        layer.bindPopup(popupContent, {
                            maxWidth: 400,
                            className: 'custom-popup'
                        }).openPopup();
                        showFeatureInfo(feature, layerId);
                    });
                } else {
                    const popupContent = createDynamicPopup(feature, layerId);
                    layer.bindPopup(popupContent, {
                        maxWidth: 400,
                        className: 'custom-popup'
                    });
                    layer.on('click', function() {
                        showFeatureInfo(feature, layerId);
                    });
                }
            }
        });

        clusterGroup.addLayer(geoLayer);
        dataLayers[layerId] = clusterGroup;

        // Extraer filtros solo si es manejable
        if (featureCount < 10000) {
            extractFilterOptions(geojsonData);
        }
        return;
    }

    // ==============================
    // Capas normales (líneas/polígonos)
    // ==============================
    const layer = L.geoJSON(geojsonData, {
        style: function(feature) {
            if (layerId === 'zonas_uz') {
                const props = feature.properties || {};
                const uz = props.Zonas || props.ZONAS || props.zonas || props.ZONA || props.zona || props.Zona;
                return {
                    ...(config.style || {}),
                    fillColor: getUZFillColor(uz),
                    fillOpacity: 0.18
                };
            }
            return config.style || {};
        },
        pointToLayer: function(feature, latlng) {
            if (config.pointStyle) {
                return L.circleMarker(latlng, config.pointStyle);
            }
            return L.marker(latlng);
        },
        onEachFeature: function(feature, layer) {
            // Para datasets grandes, crear popup lazy (solo cuando se hace clic)
            if (isLargeDataset) {
                layer.on('click', function() {
                    const popupContent = createDynamicPopup(feature, layerId);
                    layer.bindPopup(popupContent, {
                        maxWidth: 400,
                        className: 'custom-popup'
                    }).openPopup();
                    showFeatureInfo(feature, layerId);
                });
            } else {
                // Para datasets pequeños, crear popup inmediatamente
                const popupContent = createDynamicPopup(feature, layerId);
                layer.bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'custom-popup'
                });
                
                layer.on('click', function() {
                    showFeatureInfo(feature, layerId);
                });
            }

            // Hover effects solo para polígonos y datasets pequeños
            if (!isLargeDataset && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                layer.on('mouseover', function() {
                    this.setStyle({
                        fillOpacity: 0.7,
                        weight: 3
                    });
                });

                layer.on('mouseout', function() {
                    this.setStyle(config.style);
                });
            }
        }
    });

    // Guardar la capa pero NO agregarla al mapa aún
    dataLayers[layerId] = layer;
    
    // Extraer opciones de filtro solo si es necesario
    if (featureCount < 10000) {
        extractFilterOptions(geojsonData);
    }
}


// ===== ACTUALIZAR CONTADOR DE CAPA =====
function updateLayerCount(layerId, count) {
    const countEl = document.getElementById(`count-${layerId}`);
    if (countEl) {
        countEl.textContent = `${count.toLocaleString()} elementos`;
    }
}

// ===== LAYER CARDS INITIALIZATION (SIN BOTÓN CARGAR) =====
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
                    <span class="layer-count" id="count-${layerId}">Cargando...</span>
                </div>
            </div>
            <label class="layer-toggle">
                <input type="checkbox" id="toggle-${layerId}" onchange="toggleLayer('${layerId}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </div>
        <div class="layer-actions">
            <button class="btn-layer" onclick="zoomToLayer('${layerId}')" title="Hacer zoom a la capa">
                <i class="fas fa-search-location"></i>
                <span>Zoom</span>
            </button>
            <button class="btn-layer" onclick="downloadLayer('${layerId}')" title="Descargar GeoJSON">
                <i class="fas fa-download"></i>
                <span>Descargar</span>
            </button>
        </div>
    `;

    return card;
}

// ===== NUEVA FUNCIÓN: DESCARGAR CAPA =====
function downloadLayer(layerId) {
    if (!layerData[layerId]) {
        showToast('No hay datos para descargar', 'warning');
        return;
    }
    
    const config = LAYER_CONFIG[layerId];
    const dataStr = JSON.stringify(layerData[layerId], null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layerId}_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast(`Descargando ${config.name}`, 'success');
}

// ===== ZONAS (UZ): CONTAR CANTONES POR ZONA =====
function maybeComputeZonaUZStats() {
    // Requiere cantones y zonas_uz cargados en layerData
    if (zonaUZStats) return zonaUZStats;
    if (!layerData || !layerData.cantones || !layerData.zonas_uz) return null;

    try {
        const zonasFeatures = layerData.zonas_uz.features || [];
        const cantonesFeatures = layerData.cantones.features || [];

        const stats = {};
        const zonasIndex = [];

        zonasFeatures.forEach(zf => {
            const zp = zf.properties || {};
            const code = zp.Zonas || zp.ZONAS || zp.zonas || zp.ZONA || zp.zona || zp.Zona;
            if (!code) return;
            const key = String(code);
            if (!stats[key]) stats[key] = { count: 0, cantones: [] };
            zonasIndex.push({ key, geom: zf.geometry });
        });

        cantonesFeatures.forEach(cf => {
            const cp = cf.properties || {};
            const cantonName = cp.DPA_DESCAN || cp.CANTON || cp.canton || cp.Canton || cp.nombre || cp.NOMBRE || 'Sin nombre';
            const centroid = computeFeatureCentroidLngLat(cf);
            if (!centroid) return;

            for (const z of zonasIndex) {
                if (pointInGeoJSONGeometry(centroid, z.geom)) {
                    stats[z.key].cantones.push(String(cantonName));
                    return;
                }
            }
        });

        Object.keys(stats).forEach(k => {
            stats[k].cantones = Array.from(new Set(stats[k].cantones)).sort((a, b) => a.localeCompare(b, 'es'));
            stats[k].count = stats[k].cantones.length;
        });

        zonaUZStats = stats;
        console.log('✓ Stats Zonas (UZ) calculadas:', zonaUZStats);
        return zonaUZStats;
    } catch (e) {
        console.error('Error calculando stats de Zonas (UZ):', e);
        return null;
    }
}

function computeFeatureCentroidLngLat(feature) {
    const geom = feature && feature.geometry;
    if (!geom) return null;

    if (geom.type === 'Point') {
        const c = geom.coordinates;
        return Array.isArray(c) ? [c[0], c[1]] : null;
    }

    const rings = extractRingsFromGeometry(geom);
    if (!rings.length) return null;

    rings.sort((a, b) => (b.length || 0) - (a.length || 0));
    const ring = rings[0];
    return polygonCentroidLngLat(ring);
}

function extractRingsFromGeometry(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') {
        return (geom.coordinates || []).map(r => r);
    }
    if (geom.type === 'MultiPolygon') {
        const out = [];
        (geom.coordinates || []).forEach(poly => {
            (poly || []).forEach(r => out.push(r));
        });
        return out;
    }
    return [];
}

function polygonCentroidLngLat(ring) {
    if (!Array.isArray(ring) || ring.length < 3) return null;

    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        const x0 = ring[i][0], y0 = ring[i][1];
        const x1 = ring[i + 1][0], y1 = ring[i + 1][1];
        const a = x0 * y1 - x1 * y0;
        area += a;
        cx += (x0 + x1) * a;
        cy += (y0 + y1) * a;
    }
    area *= 0.5;

    if (Math.abs(area) < 1e-12) {
        let sx = 0, sy = 0;
        ring.forEach(p => { sx += p[0]; sy += p[1]; });
        return [sx / ring.length, sy / ring.length];
    }

    cx /= (6 * area);
    cy /= (6 * area);
    return [cx, cy];
}

function pointInRing(point, ring) {
    const x = point[0], y = point[1];
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function pointInGeoJSONGeometry(point, geom) {
    if (!geom) return false;

    if (geom.type === 'Polygon') {
        const rings = geom.coordinates || [];
        if (!rings.length) return false;
        const inOuter = pointInRing(point, rings[0]);
        if (!inOuter) return false;
        for (let i = 1; i < rings.length; i++) {
            if (pointInRing(point, rings[i])) return false;
        }
        return true;
    }

    if (geom.type === 'MultiPolygon') {
        const polys = geom.coordinates || [];
        for (const poly of polys) {
            if (!poly || !poly.length) continue;
            const inOuter = pointInRing(point, poly[0]);
            if (!inOuter) continue;
            let inHole = false;
            for (let i = 1; i < poly.length; i++) {
                if (pointInRing(point, poly[i])) { inHole = true; break; }
            }
            if (!inHole) return true;
        }
        return false;
    }

    return false;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function buildZonaUZSummaryHTML(zonaCode) {
    const stats = maybeComputeZonaUZStats();
    const key = String(zonaCode || '');
    const entry = stats && stats[key];

    if (!entry) {
        return `
            <div class="popup-row">
                <div class="popup-label">Cantones en la zona:</div>
                <div class="popup-value">No disponible (activa Cantones NMTD y Zonas UZ)</div>
            </div>
        `;
    }

    const limit = 25;
    const list = entry.cantones.slice(0, limit).map(c => `<li>${escapeHtml(c)}</li>`).join('');
    const extra = entry.cantones.length > limit ? `<li>... y ${entry.cantones.length - limit} más</li>` : '';

    return `
        <div class="popup-row">
            <div class="popup-label">Cantones en la zona:</div>
            <div class="popup-value">${entry.count}</div>
        </div>
        <div class="popup-row" style="display:block;">
            <div class="popup-label">Listado:</div>
            <div class="popup-value">
                <ul style="margin:6px 0 0 16px; padding:0;">
                    ${list}${extra}
                </ul>
            </div>
        </div>
    `;
}

// ===== CREATE DYNAMIC POPUP =====
function createDynamicPopup(feature, layerId) {
    const props = feature.properties;
    const config = LAYER_CONFIG[layerId];

    // Popup especial para Zonas (UZ): incluye conteo de cantones dentro de la zona
    if (layerId === 'zonas_uz') {
        const zonaCode = props.Zonas || props.ZONAS || props.zonas || props.ZONA || props.zona || props.Zona || 'Sin código';
        const summaryHTML = buildZonaUZSummaryHTML(zonaCode);
        return `
            <div class="popup-container">
                <div class="popup-title">
                    <i class="${config.icon}"></i> Zona ${escapeHtml(zonaCode)}
                </div>
                <div class="popup-content">
                    ${summaryHTML}
                </div>
            </div>
        `;
    }
    
    // Obtener los primeros 8 campos más relevantes
    const relevantFields = Object.keys(props)
        .filter(key => props[key] !== null && props[key] !== '')
        .slice(0, 8);
    
    let rows = '';
    relevantFields.forEach(key => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const value = props[key];
        rows += `
            <div class="popup-row">
                <div class="popup-label">${label}:</div>
                <div class="popup-value">${value}</div>
            </div>
        `;
    });
    
    // Título del popup
    const title = props.nombre || props.NOMBRE || props.name || props.NAME || config.name;
    
    return `
        <div class="popup-container">
            <div class="popup-title">
                <i class="${config.icon}"></i> ${title}
            </div>
            <div class="popup-content">
                ${rows}
            </div>
            <div class="popup-footer">
                <button class="popup-btn" onclick="showFeatureInfo(${JSON.stringify(feature).replace(/"/g, '&quot;')}, '${layerId}')">
                    <i class="fas fa-info-circle"></i>
                    Ver más detalles
                </button>
            </div>
        </div>
    `;
}

// ===== SHOW FEATURE INFO =====
function showFeatureInfo(feature, layerId) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const body = document.getElementById('info-body');
    
    const config = LAYER_CONFIG[layerId];
    const props = feature.properties;
    
    title.innerHTML = `<i class="${config.icon}"></i> ${config.name}`;
    
    let content = '<div class="info-content">';
    
    // Mostrar todas las propiedades
    Object.keys(props).forEach(key => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const value = props[key];
        if (value !== null && value !== '') {
            content += `
                <div class="info-row">
                    <strong>${label}:</strong>
                    <span>${value}</span>
                </div>
            `;
        }
    });
    
    // Información de geometría
    content += `
        <div class="info-section">
            <h5><i class="fas fa-shapes"></i> Información Geométrica</h5>
            <div class="info-row">
                <strong>Tipo:</strong>
                <span>${feature.geometry.type}</span>
            </div>
        </div>
    `;
    
    content += '</div>';
    body.innerHTML = content;
    
    panel.classList.add('active');
}

function closeInfoPanel() {
    document.getElementById('info-panel').classList.remove('active');
}

// ===== TOGGLE LAYER (MEJORADO) =====
// ===== TOGGLE LAYER CON CARGA BAJO DEMANDA =====
async function toggleLayer(layerId, visible) {
    const config = LAYER_CONFIG[layerId];
    
    // Si se está activando y la capa no está cargada, cargarla primero
    if (visible && !dataLayers[layerId]) {
        if (!layerData[layerId]) {
            // Capa no cargada - cargar bajo demanda
            showLoading(true, `Cargando ${config.name}...`);
            
            try {
                console.log(`📥 Cargando bajo demanda: ${config.name}`);
                
                const response = await fetch(config.file);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const geojsonData = await response.json();
                
                // Guardar datos
                layerData[layerId] = geojsonData;
                
                // Crear capa
                createLayerFromData(layerId, geojsonData);
                
                // Actualizar contador
                const count = geojsonData.features.length;
                updateLayerCount(layerId, count);
                
                showLoading(false);
                console.log(`✓ ${config.name}: ${count.toLocaleString()} elementos cargados`);
                
            } catch (error) {
                showLoading(false);
                console.error(`✗ Error cargando ${config.name}:`, error);
                showToast(`Error al cargar ${config.name}`, 'error');
                
                // Desmarcar el toggle
                const toggle = document.getElementById(`toggle-${layerId}`);
                if (toggle) toggle.checked = false;
                return;
            }
        }
    }
    
    // Ahora activar/desactivar la capa
    if (!dataLayers[layerId]) {
        showToast('Capa no disponible', 'warning');
        return;
    }
    
    if (visible) {
        map.addLayer(dataLayers[layerId]);
        document.getElementById(`card-${layerId}`).classList.add('active');
        showToast(`${config.name} activada`, 'info');
    } else {
        map.removeLayer(dataLayers[layerId]);
        document.getElementById(`card-${layerId}`).classList.remove('active');
        showToast(`${config.name} desactivada`, 'info');
    }
    
    updateLegend();
}

// ===== ZOOM TO LAYER =====
function zoomToLayer(layerId) {
    if (!dataLayers[layerId]) {
        showToast('Capa no disponible', 'warning');
        return;
    }
    
    // Activar la capa si no está activa
    const toggle = document.getElementById(`toggle-${layerId}`);
    if (!toggle.checked) {
        toggle.checked = true;
        toggleLayer(layerId, true);
    }
    
    if (dataLayers[layerId].getBounds) {
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
    if (!geojsonData || !geojsonData.features) return;
    
    const zonas = new Set();
    const zonasUZ = new Set();
    const provincias = new Set();
    const cantones = new Set();
    const nmt25s = new Set();
    
    geojsonData.features.forEach(feature => {
        const props = feature.properties;
        
        // Diferentes nombres de campos posibles
        const zona = props.zona || props.ZONA || props.Zona;
        // Zonas (UZ) - campo típico: "Zonas" (ej: UZ6)
        const zonaUZ = props.Zonas || props.ZONAS || props.zonas;
        const provincia = props.provincia || props.PROVINCIA || props.Provincia || props.DPA_DESPRO;
        const canton = props.canton || props.CANTON || props.Canton || props.DPA_DESCAN;
        const nmt25 = props.NMT_25 || props.nmt_25 || props.NMT25;
        
        if (zona) zonas.add(zona);
        if (zonaUZ) zonasUZ.add(zonaUZ);
        if (provincia) provincias.add(provincia);
        if (canton) cantones.add(canton);
        if (nmt25) nmt25s.add(nmt25);
    });
    
    // Actualizar selectores
    updateFilterSelect('filter-zona', Array.from(zonas).sort());
    updateFilterSelect('filter-uz', Array.from(zonasUZ).sort((a,b)=>String(a).localeCompare(String(b), undefined, { numeric: true })));
    updateFilterSelect('filter-provincia', Array.from(provincias).sort());
    updateFilterSelect('filter-canton', Array.from(cantones).sort());
    updateFilterSelect('filter-nmt25', Array.from(nmt25s).sort());
}

function updateFilterSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    const currentOptions = Array.from(select.options).slice(1).map(o => o.value);
    
    // Solo agregar opciones nuevas
    options.forEach(option => {
        if (!currentOptions.includes(option)) {
            const optElement = document.createElement('option');
            optElement.value = option;
            optElement.textContent = option;
            select.appendChild(optElement);
        }
    });
}

function applyFilters() {
    const zona = document.getElementById('filter-zona')?.value || '';
    const zonaUZ = document.getElementById('filter-uz')?.value || '';
    const provincia = document.getElementById('filter-provincia')?.value || '';
    const canton = document.getElementById('filter-canton')?.value || '';
    const anio = document.getElementById('filter-anio')?.value || '';
    const nmt25 = document.getElementById('filter-nmt25')?.value || '';
    
    let activeFilters = 0;
    let filteredCount = 0;
    
    Object.keys(dataLayers).forEach(layerId => {
        if (!dataLayers[layerId]) return;
        
        const layer = dataLayers[layerId];
        
        layer.eachLayer(sublayer => {
            // Evita errores con MarkerCluster / markers (no tienen setStyle)
            if (!sublayer || typeof sublayer.setStyle !== 'function' || !sublayer.feature || !sublayer.feature.properties) return;
            const props = sublayer.feature.properties;
            let visible = true;
            
            if (zona && (props.zona !== zona && props.ZONA !== zona)) visible = false;

            // Filtro Zonas (UZ) SOLO afecta a la capa de zonas UZ
            if (zonaUZ && layerId === 'zonas_uz') {
                const uz = props.Zonas || props.ZONAS || props.zonas;
                if (String(uz) !== String(zonaUZ)) visible = false;
            }
            if (provincia && (props.provincia !== provincia && props.PROVINCIA !== provincia && props.DPA_DESPRO !== provincia)) visible = false;
            if (canton && (props.canton !== canton && props.CANTON !== canton && props.DPA_DESCAN !== canton)) visible = false;
            if (anio && (props.anio != anio && props.ANIO != anio)) visible = false;
            
            if (visible) {
                sublayer.setStyle({ opacity: 1, fillOpacity: LAYER_CONFIG[layerId].style?.fillOpacity || 0.4 });
                filteredCount++;
            } else {
                sublayer.setStyle({ opacity: 0, fillOpacity: 0 });
            }
        });
    });
    
    if (zona) activeFilters++;
    if (zonaUZ) activeFilters++;
    if (provincia) activeFilters++;
    if (canton) activeFilters++;
    if (anio) activeFilters++;
    
    // Aplicar filtros a capas de puntos (MarkerCluster)
    applyCantonesPointFilter({ nmt25, provincia, canton });

    const statsEl = document.getElementById('filter-stats');
    if (activeFilters > 0) {
        statsEl.innerHTML = `<i class="fas fa-filter"></i> ${activeFilters} filtros activos | ${filteredCount} elementos`;
        showToast(`Filtros aplicados: ${filteredCount} elementos`, 'info');
    } else {
        statsEl.innerHTML = '<i class="fas fa-info-circle"></i> Sin filtros activos';
    }
}

// ===== Filtros para capa de puntos Cantones (NMTD_OT) =====
function buildCantonesClusterLayer(geojsonData) {
    const clusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 45,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
                html: `<div>${count}</div>`,
                className: 'marker-cluster marker-cluster-custom',
                iconSize: L.point(40, 40)
            });
        }
    });

    const geoLayer = L.geoJSON(geojsonData, {
        pointToLayer: function(feature, latlng) {
            const nmt = feature?.properties?.NMT_25;
            return L.marker(latlng, { icon: createNmt25Icon(nmt) });
        },
        onEachFeature: function(feature, layer) {
            const popupContent = createDynamicPopup(feature, 'cantones');
            layer.bindPopup(popupContent, { maxWidth: 400, className: 'custom-popup' });
            layer.on('click', function() {
                showFeatureInfo(feature, 'cantones');
            });
        }
    });

    clusterGroup.addLayer(geoLayer);
    return clusterGroup;
}

function applyCantonesPointFilter({ nmt25, provincia, canton }) {
    if (!layerData || !layerData.cantones) return;

    // Construir GeoJSON filtrado
    const src = layerData.cantones;
    const features = (src.features || []).filter(f => {
        const p = f.properties || {};
        let ok = true;

        if (nmt25) {
            ok = ok && String(p.NMT_25 || '').trim() === String(nmt25).trim();
        }
        if (provincia) {
            const pv = p.provincia || p.PROVINCIA || p.Provincia || p.DPA_DESPRO;
            ok = ok && String(pv || '') === String(provincia);
        }
        if (canton) {
            const ct = p.canton || p.CANTON || p.Canton || p.DPA_DESCAN;
            ok = ok && String(ct || '') === String(canton);
        }
        return ok;
    });

    const filtered = { ...src, features };

    // Si la capa ya existe, reconstruirla para que el cluster refleje el filtro
    const wasVisible = !!(dataLayers.cantones && map.hasLayer(dataLayers.cantones));
    if (dataLayers.cantones) {
        map.removeLayer(dataLayers.cantones);
    }

    dataLayers.cantones = buildCantonesClusterLayer(filtered);

    // Mantener el estado del toggle
    const toggle = document.getElementById('toggle-cantones');
    const shouldShow = toggle ? toggle.checked : wasVisible;
    if (shouldShow) {
        dataLayers.cantones.addTo(map);
    }

    updateLegend();
}



function clearAllFilters() {
    const elZona = document.getElementById('filter-zona');
    const elUZ = document.getElementById('filter-uz');
    const elProv = document.getElementById('filter-provincia');
    const elCant = document.getElementById('filter-canton');
    const elAnio = document.getElementById('filter-anio');

    if (elZona) elZona.value = '';
    if (elUZ) elUZ.value = '';
    if (elProv) elProv.value = '';
    if (elCant) elCant.value = '';
    if (elAnio) elAnio.value = '';
    
    // Restaurar visibilidad
    Object.keys(dataLayers).forEach(layerId => {
        const layer = dataLayers[layerId];
        if (!layer || typeof layer.eachLayer !== 'function') return;

        layer.eachLayer(sublayer => {
            if (!sublayer || typeof sublayer.setStyle !== 'function') return;
            const config = LAYER_CONFIG[layerId] || {};
            sublayer.setStyle({
                opacity: config.style?.opacity ?? 1,
                fillOpacity: config.style?.fillOpacity ?? 0.4
            });
        });
    });
    
    document.getElementById('filter-stats').innerHTML = '<i class="fas fa-info-circle"></i> Sin filtros activos';
    showToast('Filtros limpiados', 'info');
}

// ===== EXPORT =====
function exportFilteredData() {
    const filteredFeatures = [];
    
    Object.keys(dataLayers).forEach(layerId => {
        if (dataLayers[layerId] && document.getElementById(`toggle-${layerId}`).checked) {
            dataLayers[layerId].eachLayer(sublayer => {
                const style = sublayer.options;
                if (style.opacity !== 0) {
                    filteredFeatures.push(sublayer.feature);
                }
            });
        }
    });
    
    if (filteredFeatures.length === 0) {
        showToast('No hay datos filtrados para exportar', 'warning');
        return;
    }
    
    const geojson = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
    
    const dataStr = JSON.stringify(geojson, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apit_filtered_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exportando ${filteredFeatures.length} elementos`, 'success');
}

function exportAllData() {
    const allFeatures = [];
    
    Object.keys(layerData).forEach(layerId => {
        if (layerData[layerId] && layerData[layerId].features) {
            allFeatures.push(...layerData[layerId].features);
        }
    });
    
    const geojson = {
        type: 'FeatureCollection',
        features: allFeatures
    };
    
    const dataStr = JSON.stringify(geojson, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apit_all_data_${Date.now()}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exportando ${allFeatures.length} elementos`, 'success');
}

function exportToExcel() {
    // Recolectar todos los datos en formato tabular
    const rows = [];
    
    Object.keys(layerData).forEach(layerId => {
        if (layerData[layerId] && layerData[layerId].features) {
            layerData[layerId].features.forEach(feature => {
                const row = {
                    capa: LAYER_CONFIG[layerId].name,
                    tipo_geometria: feature.geometry.type,
                    ...feature.properties
                };
                rows.push(row);
            });
        }
    });
    
    if (rows.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    // Crear worksheet
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos APIT');
    
    // Descargar
    XLSX.writeFile(wb, `apit_export_${Date.now()}.xlsx`);
    showToast(`Exportando ${rows.length} registros a Excel`, 'success');
}

// ===== LEGEND =====
function updateLegend() {
    const content = document.getElementById('legend-content');
    content.innerHTML = '';

    Object.keys(dataLayers).forEach(layerId => {
        const toggle = document.getElementById(`toggle-${layerId}`);
        if (dataLayers[layerId] && toggle && toggle.checked) {
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
    
    if (content.children.length === 0) {
        content.innerHTML = '<p style="color: #8a9299; font-size: 12px; padding: 8px;">No hay capas activas</p>';
    }
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

// ===== SEARCH =====
function searchLocation(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    showLoading(true, 'Buscando ubicación...');
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const results = await response.json();
        
        if (results.length > 0) {
            const { lat, lon, display_name } = results[0];
            map.setView([parseFloat(lat), parseFloat(lon)], 13);
            
            if (geocodeMarker) {
                map.removeLayer(geocodeMarker);
            }
            geocodeMarker = L.circleMarker([parseFloat(lat), parseFloat(lon)], {
                radius: 6,
                color: '#0d6efd',
                weight: 2,
                fillColor: '#0d6efd',
                fillOpacity: 0.85
            })
                .addTo(map)
                .bindPopup(display_name)
                .openPopup();
            
            showToast('Ubicación encontrada', 'success');
        } else {
            showToast('No se encontró la ubicación', 'warning');
        }
    } catch (error) {
        showToast('Error en la búsqueda', 'error');
    } finally {
        showLoading(false);
    }
}

// ===== STATISTICS =====
function showStats() {
    let totalFeatures = 0;
    let statsHtml = '<div class="stats-content">';
    
    Object.keys(layerData).forEach(layerId => {
        const config = LAYER_CONFIG[layerId];
        const count = layerData[layerId] ? layerData[layerId].features.length : 0;
        totalFeatures += count;
        
        statsHtml += `
            <div class="stat-item">
                <i class="${config.icon}" style="color: ${config.style?.fillColor || config.style?.color}"></i>
                <strong>${config.name}:</strong>
                <span>${count.toLocaleString()} elementos</span>
            </div>
        `;
    });
    
    statsHtml += `
        <div class="stat-total">
            <strong>Total:</strong>
            <span>${totalFeatures.toLocaleString()} elementos</span>
        </div>
    </div>`;
    
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const body = document.getElementById('info-body');
    
    title.innerHTML = '<i class="fas fa-chart-line"></i> Estadísticas del Sistema';
    body.innerHTML = statsHtml;
    panel.classList.add('active');
}

function toggleHelp() {
    const helpContent = `
        <div class="help-content">
            <h4><i class="fas fa-question-circle"></i> Ayuda del Sistema APIT</h4>
            
            <div class="help-section">
                <h5>Capas Geográficas</h5>
                <p>Usa los interruptores para activar/desactivar las capas en el mapa.</p>
            </div>
            
            <div class="help-section">
                <h5>Controles del Mapa</h5>
                <ul>
                    <li><i class="fas fa-home"></i> Centrar en Ecuador</li>
                    <li><i class="fas fa-search-location"></i> Hacer zoom a capa</li>
                    <li><i class="fas fa-camera"></i> Captura de pantalla</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h5>Filtros</h5>
                <p>Usa los filtros para mostrar solo los datos que necesitas.</p>
            </div>
            
            <div class="help-section">
                <h5>Exportar</h5>
                <p>Descarga los datos en formato GeoJSON o Excel.</p>
            </div>
        </div>
    `;
    
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const body = document.getElementById('info-body');
    
    title.innerHTML = '<i class="fas fa-question-circle"></i> Ayuda';
    body.innerHTML = helpContent;
    panel.classList.add('active');
}

// ===== MEASURE TOOL =====
let measureActive = false;
let measureLine = null;
let measurePoints = [];

function toggleMeasure() {
    measureActive = !measureActive;
    
    if (measureActive) {
        map.getContainer().style.cursor = 'crosshair';
        showToast('Haz clic en el mapa para medir distancias', 'info');
        map.on('click', measureClick);
    } else {
        map.getContainer().style.cursor = '';
        map.off('click', measureClick);
        if (measureLine) {
            map.removeLayer(measureLine);
            measureLine = null;
        }
        measurePoints = [];
    }
}

function measureClick(e) {
    measurePoints.push(e.latlng);
    
    if (measureLine) {
        map.removeLayer(measureLine);
    }
    
    if (measurePoints.length > 1) {
        measureLine = L.polyline(measurePoints, { color: '#4264fb', weight: 3 }).addTo(map);
        
        let totalDistance = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
            totalDistance += measurePoints[i].distanceTo(measurePoints[i + 1]);
        }
        
        const distanceKm = (totalDistance / 1000).toFixed(2);
        showToast(`Distancia: ${distanceKm} km`, 'info');
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
        uploadArea.addEventListener('click', () => {
            document.getElementById('file-upload').click();
        });
        
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

// ===== FILE UPLOAD (OPCIONAL) =====
function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
                    const geojsonData = JSON.parse(e.target.result);
                    // Aquí podrías agregar lógica para cargar archivos adicionales
                    showToast(`Archivo ${file.name} cargado`, 'success');
                }
            } catch (error) {
                showToast(`Error al procesar ${file.name}`, 'error');
            }
        };
        reader.readAsText(file);
    });
}

function toggleFolder(element) {
    const folder = element.parentElement;
    folder.classList.toggle('expanded');
}

function viewFile(filename) {
    showToast(`Abriendo ${filename}...`, 'info');
}

function downloadFile(filename) {
    showToast(`Descargando ${filename}...`, 'info');
}

function refreshDocuments() {
    showToast('Actualizando documentos...', 'info');
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
    .custom-popup .leaflet-popup-tip {
        background: #0f1419;
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
    .popup-row:last-child {
        border-bottom: none;
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
    .info-content {
        padding: 16px;
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
        border-bottom: none;
    }
    .info-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 2px solid #e5e7eb;
    }
    .info-section h5 {
        margin: 0 0 12px 0;
        color: #4264fb;
    }
    .stats-content {
        padding: 16px;
    }
    .stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 8px;
    }
    .stat-total {
        margin-top: 16px;
        padding: 16px;
        background: #4264fb;
        color: white;
        border-radius: 6px;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
    }
    .help-content {
        padding: 16px;
    }
    .help-section {
        margin-bottom: 20px;
    }
    .help-section h5 {
        color: #4264fb;
        margin-bottom: 8px;
    }
    .help-section ul {
        list-style: none;
        padding-left: 0;
    }
    .help-section li {
        padding: 4px 0;
    }
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🗺️ APIT System Loaded Successfully - Capas Precargadas');