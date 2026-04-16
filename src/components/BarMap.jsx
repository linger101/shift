import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { PRICE_LABELS } from '../data/bars'

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

function FlyTo({ center }) {
  const map = useMap()
  if (center) map.flyTo(center, 15, { duration: 0.4 })
  return null
}

function BarCard({ bar, onOpen, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 440, margin: '0 auto',
      zIndex: 9999, background: '#fff', borderRadius: 12, padding: '20px 22px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.04)',
        border: 'none', color: '#999', cursor: 'pointer', fontSize: 13,
        width: 28, height: 28, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>✕</button>

      <div style={{ marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1C1710', fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>{bar.name}</h3>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9A8E80', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{bar.hood} · {bar.area}</p>
      </div>

      <p style={{ margin: '10px 0 12px', fontSize: 13, color: '#6B6055', lineHeight: 1.55 }}>{bar.desc}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        <span style={{ background: '#F0EDE8', color: '#4A6741', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{bar.type}</span>
        <span style={{ background: '#F0EDE8', color: '#8B7647', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{PRICE_LABELS[bar.price]}</span>
        {bar.music && <span style={{ background: '#F0EDE8', color: '#C0623A', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>♪ Live</span>}
        {bar.karaoke && <span style={{ background: '#F0EDE8', color: '#8B7647', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>🎤 Karaoke</span>}
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

export default function BarMap({ bars, user, onOpen }) {
  const [selected, setSelected] = useState(null)
  const flyCenter = selected ? [selected.lat, selected.lng] : null

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapContainer
        center={[42.355, -71.08]}
        zoom={13}
        style={{ width: '100%', height: '100%', borderRadius: 4 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        {flyCenter && <FlyTo center={flyCenter} />}
        {bars.map(bar => {
          const isFav = user?.favorites?.includes(bar.id)
          const isSel = selected?.id === bar.id
          return (
            <Marker
              key={bar.id}
              position={[bar.lat, bar.lng]}
              icon={createIcon(bar, isFav, isSel)}
              eventHandlers={{ click: () => setSelected(bar) }}
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
          onOpen={(bar) => { onOpen(bar); setSelected(null) }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
