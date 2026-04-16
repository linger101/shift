import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { PRICE_LABELS } from '../data/bars'

function createIcon(bar, isFav, isSel) {
  const cls = isSel ? 'selected' : isFav ? 'favorite' : 'default'
  const size = isSel ? 32 : 26
  const label = bar.music ? '♪' : PRICE_LABELS[bar.price]
  return L.divIcon({
    className: '',
    html: `<div class="bar-marker ${cls}" style="width:${size}px;height:${size}px;">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FlyTo({ center }) {
  const map = useMap()
  if (center) map.flyTo(center, 15, { duration: 0.5 })
  return null
}

function BarPopup({ bar, onOpen, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 9999,
      background: '#1C1710', borderRadius: 6, padding: 16,
      border: '1px solid #8B7647', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      borderLeft: '3px solid #C8A96E'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 8, right: 10, background: 'none',
        border: 'none', color: '#7A6E5E', cursor: 'pointer', fontSize: 16
      }}>✕</button>
      <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)', color: '#E8DCC8', fontWeight: 700 }}>{bar.name}</h3>
      <p style={{ margin: '2px 0 6px', fontSize: 10, color: '#7A6E5E', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>{bar.hood} · {bar.area}</p>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#B8A88E', lineHeight: 1.5 }}>{bar.desc}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        <span style={{ background: 'rgba(74,103,65,0.3)', color: '#6B9B5E', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid #3A5233' }}>{bar.type}</span>
        <span style={{ background: 'rgba(200,169,110,0.15)', color: '#C8A96E', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-display)', border: '1px solid rgba(200,169,110,0.25)' }}>{PRICE_LABELS[bar.price]}</span>
        {bar.music && <span style={{ background: 'rgba(160,82,45,0.2)', color: '#C0623A', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', border: '1px solid rgba(160,82,45,0.3)' }}>♪ Live</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#C8A96E', fontSize: 14 }}>{'★'.repeat(Math.round(bar.rating))}</span>
          <span style={{ fontSize: 11, color: '#7A6E5E' }}>{bar.rating}</span>
        </div>
        <button onClick={() => onOpen(bar)} style={{
          padding: '6px 16px', background: '#4A6741', border: 'none', borderRadius: 3,
          color: '#E8DCC8', fontWeight: 700, cursor: 'pointer', fontSize: 11,
          fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>Full Details →</button>
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
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

      {selected && (
        <BarPopup
          bar={selected}
          onOpen={(bar) => { onOpen(bar); setSelected(null) }}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', borderRadius: 4, padding: '8px 12px',
        border: '1px solid #ddd', fontSize: 10, color: '#666',
        fontFamily: 'var(--font-display)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4A6741', border: '1.5px solid #fff' }} />
          <span>Bar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C8A96E', border: '1.5px solid #fff' }} />
          <span>Favorited</span>
        </div>
      </div>
    </div>
  )
}
