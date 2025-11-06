import React from "react";
import "./PhilippineMap.css";

export default function PhilippineMap({ data, mapType }) {
  // Approximate coordinates for bubble centers (for demo overlay)
  const regionCenters = {
    NCR: { x: 390, y: 280 },
    CAR: { x: 360, y: 200 },
    "Region I": { x: 340, y: 250 },
    "Region II": { x: 380, y: 230 },
    "Region III": { x: 380, y: 270 },
    "Region IV-A": { x: 410, y: 290 },
    "Region IV-B": { x: 440, y: 310 },
    "Region V": { x: 460, y: 330 },
    "Region VI": { x: 350, y: 350 },
    "Region VII": { x: 400, y: 370 },
    "Region VIII": { x: 450, y: 370 },
    "Region IX": { x: 280, y: 400 },
    "Region X": { x: 320, y: 330 },
    "Region XI": { x: 340, y: 360 },
    "Region XII": { x: 360, y: 340 },
    "Region XIII": { x: 360, y: 310 },
    BARMM: { x: 300, y: 420 },
  };

  const regions = Object.keys(regionCenters).map((key) => ({
    id: key,
    name: key,
    value: data[key] || 0,
    ...regionCenters[key],
  }));

  const maxValue = Math.max(...regions.map((r) => r.value || 1));
  const colorScale = (value) => {
    const intensity = Math.min(1, value / maxValue);
    const blue = 226 - Math.floor(intensity * 80);
    return `rgba(74, ${blue}, 226, ${0.4 + intensity * 0.4})`;
  };

  return (
    <div className="map-container">
      <svg
        viewBox="200 100 500 500"
        className="philippines-map"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Real SVG Map of the Philippines (simplified) */}
        <path
          d="M370,150 L390,160 L400,180 L420,190 L430,210 L420,230 L410,250 L390,260 L370,250 L360,230 L355,210 Z"
          fill="#eef3f8"
          stroke="#999"
          strokeWidth="1"
        />
        <path
          d="M400,270 L410,290 L430,300 L440,320 L450,340 L430,350 L410,340 L400,320 L390,300 Z"
          fill="#eef3f8"
          stroke="#999"
          strokeWidth="1"
        />
        <path
          d="M300,350 L320,360 L340,380 L360,400 L340,410 L320,390 L310,370 Z"
          fill="#eef3f8"
          stroke="#999"
          strokeWidth="1"
        />
        <path
          d="M450,380 L460,400 L470,420 L460,440 L440,440 L430,420 L440,400 Z"
          fill="#eef3f8"
          stroke="#999"
          strokeWidth="1"
        />

        {/* Dynamic overlay depending on map type */}
        {regions.map((region) =>
          mapType === "bubble" ? (
            <circle
              key={region.id}
              cx={region.x}
              cy={region.y}
              r={Math.sqrt(region.value) / 20 + 4}
              fill="rgba(74,144,226,0.6)"
              stroke="#2c5aa0"
            >
              <title>
                {region.name}: {region.value.toLocaleString()} emigrants
              </title>
            </circle>
          ) : (
            <circle
              key={region.id}
              cx={region.x}
              cy={region.y}
              r={10}
              fill={colorScale(region.value)}
              stroke="#999"
            >
              <title>
                {region.name}: {region.value.toLocaleString()} emigrants
              </title>
            </circle>
          )
        )}

        {/* Region Labels */}
        {regions.map((r) => (
          <text
            key={r.id + "-label"}
            x={r.x}
            y={r.y - 15}
            className="region-label"
            textAnchor="middle"
          >
            {r.name}
          </text>
        ))}
      </svg>

      {/* Legend Section */}
      <div className="map-legend">
        <h4>Legend</h4>
        {mapType === "bubble" ? (
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-bubble small"></div>
              <span>Few emigrants</span>
            </div>
            <div className="legend-item">
              <div className="legend-bubble medium"></div>
              <span>Moderate</span>
            </div>
            <div className="legend-item">
              <div className="legend-bubble large"></div>
              <span>Many emigrants</span>
            </div>
          </div>
        ) : (
          <div className="legend-items">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: colorScale(maxValue * 0.2) }}
              ></div>
              <span>Low</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: colorScale(maxValue * 0.8) }}
              ></div>
              <span>High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
