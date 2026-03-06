import { useState, useEffect, useRef } from "react";

const STATIONS = [
  {
    id: 1,
    name: "Volta Station — Westfield",
    address: "865 Market St, San Francisco",
    distance: 0.3,
    connectors: ["CCS", "CHAdeMO"],
    power: 150,
    access: "Public",
    pricing: "Free with validation",
    status: "available",
    lat: 37.784,
    lng: -122.407,
    sponsored: true,
    bookmarked: false,
    views: 2341,
  },
  {
    id: 2,
    name: "ChargePoint Hub",
    address: "1 Embarcadero Ctr, San Francisco",
    distance: 0.8,
    connectors: ["CCS", "J1772"],
    power: 62,
    access: "Public",
    pricing: "$0.35/kWh",
    status: "available",
    lat: 37.795,
    lng: -122.397,
    sponsored: false,
    bookmarked: true,
    views: 1203,
  },
  {
    id: 3,
    name: "Tesla Supercharger V3",
    address: "680 Folsom St, San Francisco",
    distance: 1.2,
    connectors: ["Tesla", "CCS"],
    power: 250,
    access: "Tesla-only",
    pricing: "$0.28/kWh",
    status: "busy",
    lat: 37.787,
    lng: -122.395,
    sponsored: false,
    bookmarked: false,
    views: 4892,
  },
  {
    id: 4,
    name: "Blink Fast Charge",
    address: "55 Cyril Magnin St",
    distance: 1.7,
    connectors: ["J1772", "CCS"],
    power: 50,
    access: "Public",
    pricing: "$0.49/kWh",
    status: "available",
    lat: 37.783,
    lng: -122.409,
    sponsored: false,
    bookmarked: false,
    views: 891,
  },
  {
    id: 5,
    name: "EVgo Rapid Charge",
    address: "101 4th St, San Francisco",
    distance: 2.1,
    connectors: ["CCS", "CHAdeMO", "Tesla"],
    power: 350,
    access: "Public",
    pricing: "$0.31/kWh",
    status: "offline",
    lat: 37.782,
    lng: -122.398,
    sponsored: false,
    bookmarked: true,
    views: 3120,
  },
  {
    id: 6,
    name: "SF Municipal Garage",
    address: "833 Mission St",
    distance: 2.4,
    connectors: ["J1772"],
    power: 7.2,
    access: "Public",
    pricing: "$1.50/hr",
    status: "available",
    lat: 37.785,
    lng: -122.401,
    sponsored: false,
    bookmarked: false,
    views: 567,
  },
];

const CONNECTOR_COLORS = { CCS: "#00E5FF", CHAdeMO: "#7C4DFF", Tesla: "#E53935", J1772: "#00BFA5" };

const statusConfig = {
  available: { label: "Available", color: "#00E676", pulse: true },
  busy: { label: "Busy", color: "#FFD600", pulse: false },
  offline: { label: "Offline", color: "#FF1744", pulse: false },
};

function PowerBar({ power }) {
  const max = 350;
  const w = Math.min((power / max) * 100, 100);
  const color = power >= 150 ? "#00E5FF" : power >= 50 ? "#00E676" : "#FFD600";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "monospace", fontWeight: 700, minWidth: 52 }}>
        {power} kW
      </span>
    </div>
  );
}

function ConnectorTag({ type }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 3,
        border: `1px solid ${CONNECTOR_COLORS[type] || "#555"}`,
        color: CONNECTOR_COLORS[type] || "#aaa",
        letterSpacing: "0.08em",
        background: `${CONNECTOR_COLORS[type] || "#555"}18`,
      }}
    >
      {type}
    </span>
  );
}

function StatusDot({ status }) {
  const cfg = statusConfig[status];
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
          boxShadow: cfg.pulse ? `0 0 0 0 ${cfg.color}40` : "none",
          animation: cfg.pulse ? "pulse 1.8s infinite" : "none",
        }}
      />
      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, letterSpacing: "0.04em" }}>
        {cfg.label}
      </span>
    </span>
  );
}

function MapView({ stations, selected, onSelect }) {
  const svgRef = useRef();
  const lats = stations.map((s) => s.lat);
  const lngs = stations.map((s) => s.lng);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const pad = 0.002;

  const toX = (lng) => ((lng - minLng + pad) / (maxLng - minLng + pad * 2)) * 340 + 30;
  const toY = (lat) => (1 - (lat - minLat + pad) / (maxLat - minLat + pad * 2)) * 240 + 20;

  const gridLines = [];
  for (let i = 0; i <= 5; i++) {
    gridLines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={i * 56}
        x2={400}
        y2={i * 56}
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={1}
      />,
      <line
        key={`v${i}`}
        x1={i * 80}
        y1={0}
        x2={i * 80}
        y2={280}
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={1}
      />,
    );
  }

  return (
    <div
      style={{
        position: "relative",
        background: "#0A0E1A",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <svg ref={svgRef} viewBox="0 0 400 280" style={{ width: "100%", display: "block" }}>
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0D1528" />
            <stop offset="100%" stopColor="#080B14" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={400} height={280} fill="url(#bgGrad)" />
        {gridLines}
        {/* Road-like paths */}
        <path
          d="M 30 140 Q 200 100 370 150"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 80 20 Q 150 180 250 260"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 0 200 Q 200 190 400 210"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />

        {stations.map((s) => {
          const x = toX(s.lng),
            y = toY(s.lat);
          const isSel = selected?.id === s.id;
          const color = statusConfig[s.status].color;
          return (
            <g key={s.id} onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
              {isSel && (
                <circle
                  cx={x}
                  cy={y}
                  r={22}
                  fill={`${color}18`}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isSel ? 11 : 8}
                fill={s.sponsored ? "#FFD600" : color}
                filter="url(#glow)"
                style={{ transition: "r 0.2s ease" }}
                opacity={s.status === "offline" ? 0.4 : 1}
              />
              <circle cx={x} cy={y} r={isSel ? 5 : 3} fill="#0A0E1A" />
              {s.sponsored && (
                <text
                  x={x}
                  y={y - 16}
                  textAnchor="middle"
                  fill="#FFD600"
                  fontSize={8}
                  fontWeight={700}
                >
                  ★ AD
                </text>
              )}
            </g>
          );
        })}
        {/* User location */}
        <circle cx={200} cy={185} r={6} fill="#00E5FF" opacity={0.9} />
        <circle
          cx={200}
          cy={185}
          r={12}
          fill="none"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
        <text x={200} y={205} textAnchor="middle" fill="#00E5FF" fontSize={8} opacity={0.6}>
          You
        </text>

        <text x={8} y={14} fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="monospace">
          37.784°N 122.407°W
        </text>
      </svg>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 10, right: 12, display: "flex", gap: 10 }}>
        {Object.entries(statusConfig).map(([k, v]) => (
          <span
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: v.color,
                display: "inline-block",
              }}
            />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StationCard({ station, onClick, compact }) {
  if (compact) {
    return (
      <div
        onClick={() => onClick(station)}
        style={{
          padding: "14px 16px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: station.bookmarked
            ? "1px solid rgba(0,229,255,0.2)"
            : "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {station.sponsored && (
              <span
                style={{
                  fontSize: 9,
                  color: "#FFD600",
                  fontWeight: 700,
                  border: "1px solid #FFD60055",
                  padding: "1px 5px",
                  borderRadius: 3,
                }}
              >
                SPONSORED
              </span>
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#E8EEFF",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {station.name}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <StatusDot status={station.status} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>·</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {station.distance} mi
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>·</span>
            <span style={{ fontSize: 11, color: "#00E5FF", fontFamily: "monospace" }}>
              {station.power}kW
            </span>
          </div>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>›</span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      {station.sponsored && (
        <div
          style={{
            background: "linear-gradient(90deg, #FFD60022, transparent)",
            padding: "6px 16px",
            borderBottom: "1px solid #FFD60022",
          }}
        >
          <span style={{ fontSize: 10, color: "#FFD600", fontWeight: 700, letterSpacing: "0.1em" }}>
            ★ SPONSORED LOCATION
          </span>
        </div>
      )}
      <div style={{ padding: "20px 20px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#E8EEFF",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.03em",
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {station.name}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.01em" }}>
              {station.address}
            </div>
          </div>
          <StatusDot status={station.status} />
        </div>

        <PowerBar power={station.power} />

        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {station.connectors.map((c) => (
            <ConnectorTag key={c} type={c} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <InfoChip label="Access" value={station.access} />
          <InfoChip label="Distance" value={`${station.distance} mi`} />
          <InfoChip label="Pricing" value={station.pricing} />
          <InfoChip label="Views" value={station.views.toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.08em",
          marginBottom: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,8,20,0.88)",
        backdropFilter: "blur(16px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0E1424",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: 480,
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#E8EEFF",
              letterSpacing: "0.04em",
              fontFamily: "'Barlow Condensed', sans-serif",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function FilterRow({ filters, setFilters }) {
  const connectors = ["CCS", "CHAdeMO", "Tesla", "J1772"];
  const toggle = (c) => setFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]));
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {connectors.map((c) => (
        <button
          key={c}
          onClick={() => toggle(c)}
          style={{
            background: filters.includes(c) ? `${CONNECTOR_COLORS[c]}22` : "rgba(255,255,255,0.05)",
            border: filters.includes(c)
              ? `1px solid ${CONNECTOR_COLORS[c]}`
              : "1px solid rgba(255,255,255,0.1)",
            color: filters.includes(c) ? CONNECTOR_COLORS[c] : "rgba(255,255,255,0.4)",
            padding: "5px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            letterSpacing: "0.04em",
            transition: "all 0.15s",
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export default function EVChargerApp() {
  const [tab, setTab] = useState("discover");
  const [viewMode, setViewMode] = useState("map");
  const [selected, setSelected] = useState(null);
  const [stations, setStations] = useState(STATIONS);
  const [filters, setFilters] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "report" | "suggest"
  const [toast, setToast] = useState(null);
  const [reportForm, setReportForm] = useState({ issue: "", detail: "" });
  const [suggestForm, setSuggestForm] = useState({ name: "", address: "", connectors: "" });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = stations.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filters.length === 0 || filters.some((f) => s.connectors.includes(f));
    return matchSearch && matchFilter;
  });

  const bookmarked = stations.filter((s) => s.bookmarked);

  const toggleBookmark = (id) => {
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, bookmarked: !s.bookmarked } : s)));
    const s = stations.find((x) => x.id === id);
    setToast(s.bookmarked ? "Bookmark removed" : "Station bookmarked ⚡");
  };

  const submitReport = () => {
    setModal(null);
    setReportForm({ issue: "", detail: "" });
    setToast("Issue reported — thank you!");
  };

  const submitSuggest = () => {
    setModal(null);
    setSuggestForm({ name: "", address: "", connectors: "" });
    setToast("Station suggestion submitted!");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080B14; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0,230,118,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(0,230,118,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,230,118,0); }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes toastIn { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(280px); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#080B14",
          color: "#E8EEFF",
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            minHeight: "100vh",
            position: "relative",
            paddingBottom: 72,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 20px 0",
              background: "linear-gradient(180deg, #080B14 80%, transparent)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                  }}
                >
                  <span style={{ color: "#00E5FF" }}>⚡</span> CHARGE
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>FIND</span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.12em",
                    marginTop: 1,
                  }}
                >
                  San Francisco · Live Data
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {viewMode === "map" && tab === "discover" && (
                  <>
                    <button
                      onClick={() => setViewMode("list")}
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                        padding: "7px 12px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      List
                    </button>
                  </>
                )}
                {viewMode === "list" && tab === "discover" && (
                  <button
                    onClick={() => setViewMode("map")}
                    style={{
                      background: "rgba(0,229,255,0.1)",
                      border: "1px solid rgba(0,229,255,0.25)",
                      color: "#00E5FF",
                      padding: "7px 12px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Map
                  </button>
                )}
              </div>
            </div>

            {tab === "discover" && (
              <>
                {/* Search */}
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 14,
                    }}
                  >
                    ⌕
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search stations or addresses…"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "10px 12px 10px 32px",
                      color: "#E8EEFF",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
                {/* Filters */}
                <div style={{ marginBottom: 14 }}>
                  <FilterRow filters={filters} setFilters={setFilters} />
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "0 20px" }}>
            {tab === "discover" && (
              <>
                {viewMode === "map" ? (
                  <>
                    <MapView
                      stations={filtered}
                      selected={selected}
                      onSelect={(s) => {
                        setSelected(s);
                        setViewMode("detail");
                      }}
                    />
                    <div
                      style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.25)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: 2,
                        }}
                      >
                        Nearby — {filtered.length} stations
                      </div>
                      {filtered.slice(0, 4).map((s) => (
                        <StationCard
                          key={s.id}
                          station={s}
                          compact
                          onClick={(s) => {
                            setSelected(s);
                            setViewMode("detail");
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : viewMode === "list" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.25)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {filtered.length} stations found
                    </div>
                    {filtered.map((s) => (
                      <StationCard
                        key={s.id}
                        station={s}
                        compact
                        onClick={(s) => {
                          setSelected(s);
                          setViewMode("detail");
                        }}
                      />
                    ))}
                  </div>
                ) : viewMode === "detail" && selected ? (
                  <div>
                    <button
                      onClick={() => setViewMode("map")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00E5FF",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginBottom: 16,
                        padding: 0,
                      }}
                    >
                      ← Back to map
                    </button>
                    <StationCard
                      station={stations.find((s) => s.id === selected.id)}
                      onClick={() => {}}
                    />

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <button
                        style={{
                          background: "linear-gradient(135deg, #00E5FF22, #00B8D422)",
                          border: "1px solid #00E5FF44",
                          color: "#00E5FF",
                          borderRadius: 12,
                          padding: "13px 0",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.06em",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          textTransform: "uppercase",
                        }}
                      >
                        ↗ Get Directions
                      </button>
                      <button
                        onClick={() => toggleBookmark(selected.id)}
                        style={{
                          background: stations.find((s) => s.id === selected.id)?.bookmarked
                            ? "rgba(255,214,0,0.12)"
                            : "rgba(255,255,255,0.05)",
                          border: stations.find((s) => s.id === selected.id)?.bookmarked
                            ? "1px solid rgba(255,214,0,0.3)"
                            : "1px solid rgba(255,255,255,0.1)",
                          color: stations.find((s) => s.id === selected.id)?.bookmarked
                            ? "#FFD600"
                            : "rgba(255,255,255,0.5)",
                          borderRadius: 12,
                          padding: "13px 0",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.06em",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          textTransform: "uppercase",
                        }}
                      >
                        {stations.find((s) => s.id === selected.id)?.bookmarked
                          ? "★ Saved"
                          : "☆ Save"}
                      </button>
                    </div>

                    <button
                      onClick={() => setModal("report")}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        background: "rgba(255,23,68,0.08)",
                        border: "1px solid rgba(255,23,68,0.2)",
                        color: "#FF1744",
                        borderRadius: 12,
                        padding: "12px 0",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: "0.06em",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        textTransform: "uppercase",
                      }}
                    >
                      ⚠ Report an Issue
                    </button>

                    {/* Stats */}
                    <div
                      style={{
                        marginTop: 20,
                        padding: 16,
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.25)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Station Analytics
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 10,
                          textAlign: "center",
                        }}
                      >
                        {[
                          ["Views", selected.views.toLocaleString()],
                          ["Bookmarks", "48"],
                          ["Reports", "2"],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: "#00E5FF",
                                fontFamily: "'Barlow Condensed', sans-serif",
                              }}
                            >
                              {v}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {tab === "bookmarks" && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Saved Stations — {bookmarked.length}
                </div>
                {bookmarked.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
                    <div style={{ fontSize: 13 }}>No bookmarks yet</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Save stations from the map</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bookmarked.map((s) => (
                      <StationCard
                        key={s.id}
                        station={s}
                        compact
                        onClick={(s) => {
                          setSelected(s);
                          setTab("discover");
                          setViewMode("detail");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "contribute" && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Community Contributions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <ContributeCard
                    icon="＋"
                    title="Suggest a Station"
                    desc="Know a charger we're missing? Add it to the map."
                    color="#00E676"
                    onClick={() => setModal("suggest")}
                  />
                  <ContributeCard
                    icon="⚠"
                    title="Report an Issue"
                    desc="Broken hardware, wrong info, or access problems."
                    color="#FF6B35"
                    onClick={() => setModal("report")}
                  />
                  <ContributeCard
                    icon="✏"
                    title="Edit Station Data"
                    desc="Help improve connector types, pricing, and access info."
                    color="#00E5FF"
                    onClick={() => setToast("Station editor coming soon!")}
                  />
                </div>

                {/* Community stats */}
                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: "rgba(0,229,255,0.05)",
                    borderRadius: 14,
                    border: "1px solid rgba(0,229,255,0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(0,229,255,0.5)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    SF Community Stats
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      ["Stations reported", "1,204"],
                      ["Issues resolved", "347"],
                      ["Suggestions added", "89"],
                      ["Active contributors", "2.1k"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "#00E5FF",
                            fontFamily: "'Barlow Condensed', sans-serif",
                          }}
                        >
                          {v}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: 480,
              background: "rgba(8,11,20,0.92)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              zIndex: 20,
            }}
          >
            {[
              { id: "discover", icon: "◉", label: "Discover" },
              { id: "bookmarks", icon: "☆", label: "Saved" },
              { id: "contribute", icon: "⊕", label: "Contribute" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "discover") setViewMode("map");
                }}
                style={{
                  flex: 1,
                  padding: "12px 0 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: tab === t.id ? "#00E5FF" : "rgba(255,255,255,0.3)",
                  transition: "color 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t.label}
                </span>
                {tab === t.id && (
                  <span
                    style={{
                      width: 16,
                      height: 2,
                      background: "#00E5FF",
                      borderRadius: 1,
                      boxShadow: "0 0 8px #00E5FF",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {modal === "report" && (
        <Modal title="Report an Issue" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Charger offline / broken",
              "Wrong connector info",
              "Pricing incorrect",
              "Access blocked",
              "Other",
            ].map((issue) => (
              <label
                key={issue}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name="issue"
                  value={issue}
                  checked={reportForm.issue === issue}
                  onChange={() => setReportForm((f) => ({ ...f, issue }))}
                  style={{ accentColor: "#FF6B35" }}
                />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{issue}</span>
              </label>
            ))}
            <textarea
              value={reportForm.detail}
              onChange={(e) => setReportForm((f) => ({ ...f, detail: e.target.value }))}
              placeholder="Additional details…"
              rows={3}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#E8EEFF",
                fontSize: 13,
                resize: "none",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                marginTop: 4,
              }}
            />
            <button
              onClick={submitReport}
              style={{
                background: "linear-gradient(135deg, #FF6B35, #FF1744)",
                border: "none",
                color: "white",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.04em",
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Submit Report
            </button>
          </div>
        </Modal>
      )}

      {/* Suggest Modal */}
      {modal === "suggest" && (
        <Modal title="Suggest a Station" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Station name", "name", "e.g. Volta at Union Square"],
              ["Address", "address", "Full address"],
              ["Connectors available", "connectors", "CCS, CHAdeMO, Tesla…"],
            ].map(([label, field, placeholder]) => (
              <div key={field}>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}
                >
                  {label}
                </div>
                <input
                  value={suggestForm[field]}
                  onChange={(e) => setSuggestForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "#E8EEFF",
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
              </div>
            ))}
            <button
              onClick={submitSuggest}
              style={{
                background: "linear-gradient(135deg, #00E676, #00B248)",
                border: "none",
                color: "#080B14",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.04em",
                fontFamily: "'Barlow Condensed', sans-serif",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Submit Station
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 84,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(14,20,36,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            borderRadius: 12,
            padding: "11px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: "#E8EEFF",
            zIndex: 200,
            animation: "toastIn 0.3s cubic-bezier(0.22,1,0.36,1)",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

function ContributeCard({ icon, title, desc, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}0A`,
        border: `1px solid ${color}22`,
        borderRadius: 14,
        padding: "16px 18px",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}18`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = `${color}0A`)}
    >
      <span style={{ fontSize: 22, color, width: 36, textAlign: "center" }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#E8EEFF",
            marginBottom: 3,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.03em",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{desc}</div>
      </div>
    </button>
  );
}
