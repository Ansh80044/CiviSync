import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ThumbsUp } from 'lucide-react';
import { getAllForMap } from '../../api/complaints';
import { getMarkerColor, truncate } from '../../lib/utils';
import ComplaintDrawer from '../../components/ComplaintDrawer';
import { getCurrentUserLocation } from '../../lib/location';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const STATUS_LEGEND = [
  { status: 'Pending',     color: '#D97706' },
  { status: 'Assigned',   color: '#2563EB' },
  { status: 'In Progress', color: '#7C3AED' },
  { status: 'Resolved',   color: '#16A34A' },
];

export default function OfficialMapView() {
  const { profile } = useAuth();
  const assignedDept = profile?.department || null;

  const [complaints, setComplaints] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(null);

  useEffect(() => {
    getCurrentUserLocation().then((loc) => {
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        setCenter(loc);
      }
    }).catch(() => {});
  }, []);

  const fetchComplaints = () => {
    const params = {};
    getAllForMap(params).then(setComplaints).catch(() => {});
  };

  useEffect(() => { fetchComplaints(); }, []);

  // Map is always loaded with Leaflet

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }} className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title">Map View</h1>
          {assignedDept && (
            <span style={{
              background: '#F7EDE6', color: '#C17D5A',
              fontSize: 12, fontWeight: 600, padding: '4px 12px',
              borderRadius: 100, border: '1px solid rgba(193,125,90,0.25)',
            }}>
              {assignedDept}
            </span>
          )}
        </div>
        <p className="page-subtitle">
          {complaints.length} complaints on the map
          {assignedDept ? ` for ${assignedDept}` : ''}
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_LEGEND.map(({ status, color }) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#3A3A3C', fontWeight: 500 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
            {status}
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="map-container" style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {complaints.map((c) => (
            <Marker
              key={c._id}
              position={[c.latitude, c.longitude]}
              icon={L.divIcon({
                className: 'custom-icon',
                html: `<div style="background-color: ${getMarkerColor(c.status)}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: scale(${hoverId === c._id ? 1.3 : 1}); transition: transform 0.2s;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
              eventHandlers={{
                mouseover: () => setHoverId(c._id),
                mouseout: () => setHoverId(null),
                click: () => setSelected(c),
              }}
            >
              <Popup>
                <div style={{ maxWidth: 240, fontFamily: "'Poppins', sans-serif", padding: '2px 0' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 7, color: '#1C1C1E', letterSpacing: '-0.1px' }}>
                    {truncate(c.title, 50)}
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 100,
                      background: '#DFF0D8', color: '#011410', fontWeight: 600,
                      border: '1px solid rgba(26,58,10,0.2)',
                    }}>{c.status}</span>
                    <span style={{ fontSize: 11, color: '#6B6B6B', alignSelf: 'center' }}>{c.category}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#6B6B6B', marginBottom: 8 }}>
                    {c.department}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B6B6B', marginBottom: 10 }}>
                    <ThumbsUp size={11} /> {c.support_count} supporters
                  </div>
                  <button
                    onClick={() => { setDrawerOpen(c._id); setSelected(null); }}
                    style={{
                      background: '#1C1C1E', color: '#fff', border: 'none',
                      borderRadius: 7, padding: '7px 12px', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', width: '100%',
                      fontFamily: "'Poppins', sans-serif",
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#011410'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1C1C1E'; }}
                  >
                    Open & Update Status
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {drawerOpen && (
        <ComplaintDrawer
          complaintId={drawerOpen}
          onClose={() => setDrawerOpen(null)}
          onUpdated={fetchComplaints}
        />
      )}
    </div>
  );
}
