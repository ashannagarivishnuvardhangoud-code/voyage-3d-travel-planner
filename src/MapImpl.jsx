import React, { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = L.divIcon({ className: 'voyage-map-marker', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] })
function FitMap({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) map.setView([points[0].coordinates.lat, points[0].coordinates.lng], 10)
    else map.fitBounds(points.map(p => [p.coordinates.lat, p.coordinates.lng]), { padding: [40, 40], maxZoom: 11 })
  }, [map, points])
  return null
}
export default function MapImpl({ points, center }) {
  return <MapContainer center={center} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <FitMap points={points} />
    {points.length > 1 && <Polyline positions={points.map(p => [p.coordinates.lat, p.coordinates.lng])} pathOptions={{ className: 'voyage-route-line', color: '#3d8875', weight: 3, opacity: .8, dashArray: '7 9' }} />}
    {points.map((p, i) => <Marker key={p._id || `${p.name}-${i}`} position={[p.coordinates.lat, p.coordinates.lng]} icon={markerIcon}><Popup><div className="map-popup"><b>{p.name}</b><span>{p.location || p.country || p.category}</span><a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?from=&to=${p.coordinates.lat}%2C${p.coordinates.lng}`}>Open directions ↗</a></div></Popup></Marker>)}
  </MapContainer>
}
