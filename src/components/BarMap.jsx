import { useState } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { PRICE_LABELS } from '../data/bars'

const NEIGHBORHOODS = [
  // Boston
  { name: 'Downtown', lat: 42.3555, lng: -71.0605 },
  { name: 'Downtown Crossing', lat: 42.3551, lng: -71.0605 },
  { name: 'Financial District', lat: 42.3560, lng: -71.0540 },
  { name: 'Faneuil Hall', lat: 42.3600, lng: -71.0568 },
  { name: 'West End', lat: 42.3647, lng: -71.0668 },
  { name: 'Beacon Hill', lat: 42.3588, lng: -71.0707 },
  { name: 'Back Bay', lat: 42.3503, lng: -71.0810 },
  { name: 'North End', lat: 42.3647, lng: -71.0542 },
  { name: 'Chinatown', lat: 42.3515, lng: -71.0620 },
  { name: 'South End', lat: 42.3388, lng: -71.0765 },
  { name: 'Fenway', lat: 42.3467, lng: -71.0972 },
  { name: 'Kenmore', lat: 42.3492, lng: -71.0955 },
  { name: 'Seaport', lat: 42.3520, lng: -71.0466 },
  { name: 'South Boston', lat: 42.3352, lng: -71.0477 },
  { name: 'East Boston', lat: 42.3750, lng: -71.0392 },
  { name: 'Charlestown', lat: 42.3782, lng: -71.0602 },
  { name: 'Allston', lat: 42.3532, lng: -71.1330 },
  { name: 'Brighton', lat: 42.3464, lng: -71.1627 },
  { name: 'Jamaica Plain', lat: 42.3100, lng: -71.1170 },
  { name: 'Roxbury', lat: 42.3125, lng: -71.0926 },
  { name: 'Dorchester', lat: 42.3000, lng: -71.0700 },
  { name: 'Roslindale', lat: 42.2845, lng: -71.1306 },
  { name: 'Lower Mills', lat: 42.2828, lng: -71.0685 },
  // Cambridge
  { name: 'Harvard Square', lat: 42.3736, lng: -71.1189 },
  { name: 'Central Square', lat: 42.3653, lng: -71.1037 },
  { name: 'Kendall Square', lat: 42.3626, lng: -71.0843 },
  { name: 'Porter Square', lat: 42.3882, lng: -71.1199 },
  { name: 'Inman Square', lat: 42.3739, lng: -71.1012 },
  { name: 'East Cambridge', lat: 42.3720, lng: -71.0810 },
  { name: 'North Cambridge', lat: 42.3970, lng: -71.1330 },
  { name: 'West Cambridge', lat: 42.3798, lng: -71.1420 },
  { name: 'Cambridgeport', lat: 42.3590, lng: -71.1100 },
  { name: 'Mid-Cambridge', lat: 42.3710, lng: -71.1080 },
  { name: 'Riverside', lat: 42.3620, lng: -71.1150 },
  { name: 'Agassiz', lat: 42.3820, lng: -71.1180 },
  // Somerville
  { name: 'Davis Square', lat: 42.3963, lng: -71.1220 },
  { name: 'Union Square', lat: 42.3797, lng: -71.0946 },
  { name: 'Assembly Row', lat: 42.3926, lng: -71.0777 },
  { name: 'Teele Square', lat: 42.4017, lng: -71.1266 },
  { name: 'Magoun Square', lat: 42.3996, lng: -71.1133 },
  { name: 'Bow Market', lat: 42.3795, lng: -71.0947 },
  { name: 'East Somerville', lat: 42.3849, lng: -71.0820 },
  // Brookline
  { name: 'Coolidge Corner', lat: 42.3410, lng: -71.1210 },
  { name: 'Brookline Village', lat: 42.3318, lng: -71.1173 },
  { name: 'Washington Square', lat: 42.3354, lng: -71.1396 },
  // Medford / Everett
  { name: 'Medford', lat: 42.4260, lng: -71.1089 },
  { name: 'Medford Square', lat: 42.4184, lng: -71.1061 },
  { name: 'West Medford', lat: 42.4191, lng: -71.1370 },
  { name: 'Tufts', lat: 42.4085, lng: -71.1183 },
  { name: 'Everett', lat: 42.4084, lng: -71.0537 },
]

function labelIcon(name) {
  const safe = name.replace(/"/g, '&quot;')
  return L.divIcon({
    className: 'hood-label',
    html: `<span style="
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%);
      font-family: var(--font-display);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #5A4F42;
      text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff;
      white-space: nowrap;
      pointer-events: none;
    ">${safe}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function NeighborhoodLabels() {
  const [zoom, setZoom] = useState(13)
  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  })
  if (zoom < 13) return null
  return NEIGHBORHOODS.map(n => (
    <Marker
      key={n.name}
      position={[n.lat, n.lng]}
      icon={labelIcon(n.name)}
      interactive={false}
      keyboard={false}
    />
  ))
}

function createIcon(bar, isFav, isSel) {
  const size = isSel ? 14 : 10
  const color = isSel ? '#C8A96E' : isFav ? '#C8A96E' : '#4A6741'
  const ring = isSel ? 3 : isFav ? 2 : 0
  const shadow = isSel ? '0 0 0 4px rgba(200,169,110,0.25)' : '0 1px 3px rgba(0,0,0,0.3)'

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:${ring ? ring + 'px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.8)'};
      box-shadow:${shadow};
      transition:all 0.2s ease;
      cursor:pointer;
    "></div>`,
    iconSize: [size + ring * 2, size + ring * 2],
    iconAnchor: [(size + ring * 2) / 2, (size + ring * 2) / 2],
  })
}

function BarCard({ bar, user, onOpen, onClose, onFav }) {
  const isFav = user?.favorites?.includes(bar.id)

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 440, margin: '0 auto',
      zIndex: 9999, background: '#fff', borderRadius: 12, padding: '20px 22px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
        {user && (
          <button onClick={() => onFav(bar.id)} style={{
            background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
            width: 28, height: 28, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 14,
            color: isFav ? '#C8A96E' : '#ccc', transition: 'color 0.2s',
          }}>{isFav ? '★' : '☆'}</button>
        )}
        <button onClick={onClose} style={{
          background: 'rgba(0,0,0,0.04)', border: 'none', color: '#999', cursor: 'pointer',
          fontSize: 13, width: 28, height: 28, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      <div style={{ marginBottom: 4, paddingRight: 70 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1C1710', fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>{bar.name}</h3>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9A8E80', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{bar.hood} · {bar.area}</p>
      </div>

      <p style={{ margin: '10px 0 12px', fontSize: 13, color: '#6B6055', lineHeight: 1.55 }}>{bar.desc}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        <span style={{ background: '#F0EDE8', color: '#4A6741', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{bar.type}</span>
        <span style={{ background: '#F0EDE8', color: '#8B7647', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{PRICE_LABELS[bar.price]}</span>
        {bar.music && <span style={{ background: '#F0EDE8', color: '#C0623A', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Live Music</span>}
        {bar.karaoke && <span style={{ background: '#F0EDE8', color: '#8B7647', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Karaoke</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#C8A96E', fontSize: 13, letterSpacing: 1 }}>{'★'.repeat(Math.round(bar.rating))}<span style={{ color: '#E0DAD0' }}>{'★'.repeat(5 - Math.round(bar.rating))}</span></span>
          <span style={{ fontSize: 13, color: '#1C1710', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{bar.rating}</span>
          <span style={{ fontSize: 11, color: '#9A8E80' }}>({bar.revCt.toLocaleString()})</span>
        </div>
        <button onClick={() => onOpen(bar)} style={{
          padding: '8px 18px', background: '#1C1710', border: 'none', borderRadius: 8,
          color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12,
          fontFamily: 'var(--font-display)', letterSpacing: '0.3px',
        }}>View Details</button>
      </div>
    </div>
  )
}

export default function BarMap({ bars, user, onOpen, onFav }) {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapContainer
        center={[42.355, -71.08]}
        zoom={13}
        style={{ width: '100%', height: '100%', borderRadius: 4 }}
        zoomControl={false}
        attributionControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <NeighborhoodLabels />
        {bars.map(bar => {
          const isFav = user?.favorites?.includes(bar.id)
          const isSel = selected?.id === bar.id
          return (
            <Marker
              key={bar.id}
              position={[bar.lat, bar.lng]}
              icon={createIcon(bar, isFav, isSel)}
              eventHandlers={{
                mouseover: () => setSelected(bar),
                click: () => setSelected(bar),
              }}
            />
          )
        })}
      </MapContainer>

      {/* Bar count pill */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
        borderRadius: 20, padding: '6px 14px',
        fontSize: 11, color: '#6B6055', fontWeight: 600,
        fontFamily: 'var(--font-display)', letterSpacing: '0.5px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {bars.length} bars
      </div>

      {selected && (
        <BarCard
          bar={selected}
          user={user}
          onFav={onFav}
          onOpen={(bar) => { onOpen(bar); setSelected(null) }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
