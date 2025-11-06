import React, { useState } from 'react';
import { scaleLinear } from 'd3-scale';

// More accurate Philippine regional boundaries based on actual geography
// These paths represent the approximate shape and location of each region
const philippineRegionPaths = {
  // LUZON - Northern regions
  regionI: "M165,45 L175,40 L185,42 L195,48 L198,58 L195,70 L188,80 L178,85 L168,83 L160,75 L158,65 L160,55 Z", // Ilocos (west coast north)
  
  regionII: "M200,38 L215,35 L230,40 L238,50 L240,65 L235,78 L225,88 L210,90 L200,85 L195,75 L195,60 L198,48 Z", // Cagayan Valley (northeast)
  
  car: "M178,55 L188,52 L195,58 L198,68 L195,78 L185,82 L175,80 L170,72 L170,62 Z", // Cordillera (mountain region center-north)
  
  // LUZON - Central regions
  regionIII: "M160,88 L180,85 L195,90 L205,100 L208,115 L205,130 L195,140 L180,142 L165,138 L155,128 L152,115 L155,100 Z", // Central Luzon
  
  ncr: "M175,145 L188,143 L195,148 L197,157 L193,165 L183,168 L173,166 L168,158 L170,150 Z", // NCR (Manila - small)
  
  regionIVA: "M155,145 L175,142 L190,145 L200,155 L205,170 L208,188 L205,205 L195,218 L180,225 L165,225 L150,218 L143,205 L142,188 L145,170 L150,155 Z", // CALABARZON (south of NCR)
  
  regionV: "M210,145 L228,148 L242,158 L250,175 L252,195 L248,215 L238,230 L225,238 L210,235 L200,225 L195,210 L195,190 L200,170 L205,158 Z", // Bicol (southeast peninsula)
  
  // LUZON - Island region
  regionIVB: "M110,175 L130,172 L142,180 L148,195 L148,215 L142,232 L130,242 L115,245 L100,240 L92,228 L90,210 L92,192 L100,180 Z", // MIMAROPA (Mindoro, Palawan - west islands)
  
  // VISAYAS - Central islands
  regionVI: "M145,260 L165,258 L180,265 L188,278 L190,295 L185,310 L173,318 L158,318 L145,310 L138,295 L138,278 L142,268 Z", // Western Visayas (Panay, Negros west)
  
  regionVII: "M195,268 L215,266 L232,275 L242,290 L245,308 L240,325 L228,335 L212,338 L198,333 L190,318 L188,300 L190,283 Z", // Central Visayas (Cebu, Bohol, Negros east)
  
  regionVIII: "M248,280 L268,278 L285,288 L295,305 L298,325 L293,342 L280,352 L263,354 L248,348 L240,333 L238,315 L242,298 Z", // Eastern Visayas (Leyte, Samar)
  
  // MINDANAO - Northern regions
  regionIX: "M125,365 L145,363 L160,370 L168,385 L170,403 L165,420 L153,432 L138,435 L123,430 L113,418 L110,403 L112,385 L118,373 Z", // Zamboanga Peninsula (southwest)
  
  regionX: "M175,365 L195,363 L212,372 L222,388 L225,408 L220,425 L208,438 L193,442 L178,438 L168,425 L165,408 L168,390 Z", // Northern Mindanao (north coast)
  
  caraga: "M230,370 L250,368 L268,378 L278,395 L280,415 L275,433 L263,445 L248,448 L233,443 L223,430 L220,413 L223,395 Z", // Caraga (northeast coast)
  
  // MINDANAO - Southern regions
  regionXI: "M190,448 L210,445 L228,453 L240,468 L245,488 L242,508 L230,523 L213,530 L195,528 L180,518 L172,503 L170,485 L175,468 Z", // Davao (southeast)
  
  regionXII: "M155,445 L175,443 L188,450 L195,465 L198,483 L195,500 L185,513 L170,518 L155,515 L143,503 L138,488 L138,470 L143,455 Z", // SOCCSKSARGEN (south central)
  
  // MINDANAO - Autonomous region
  armm: "M108,445 L128,443 L142,452 L148,470 L150,490 L145,508 L133,520 L118,523 L103,518 L93,505 L90,488 L93,470 L100,455 Z", // BARMM (southwest)
};

const REGION_NAMES = {
  ncr: "NCR (National Capital Region)",
  car: "CAR (Cordillera Admin. Region)",
  regionI: "Region I (Ilocos)",
  regionII: "Region II (Cagayan Valley)",
  regionIII: "Region III (Central Luzon)",
  regionIVA: "Region IV-A (CALABARZON)",
  regionIVB: "Region IV-B (MIMAROPA)",
  regionV: "Region V (Bicol)",
  regionVI: "Region VI (Western Visayas)",
  regionVII: "Region VII (Central Visayas)",
  regionVIII: "Region VIII (Eastern Visayas)",
  regionIX: "Region IX (Zamboanga)",
  regionX: "Region X (Northern Mindanao)",
  regionXI: "Region XI (Davao)",
  regionXII: "Region XII (SOCCSKSARGEN)",
  caraga: "Region XIII (Caraga)",
  armm: "BARMM (Bangsamoro/ARMM)",
};

const MapTooltip = ({ content }) => {
  if (!content || !content.region) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: content.y + 10,
        left: content.x + 10,
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        zIndex: 1000,
        fontSize: '14px',
        whiteSpace: 'nowrap',
        border: '1px solid #e0e0e0',
        opacity: content.visible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e40af' }}>
        {content.region}
      </div>
      <div style={{ color: '#374151' }}>
        Emigrants: <span style={{ fontWeight: '600', color: '#059669' }}>
          {content.emigrants.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const PhilippineChoroplethMap = ({ regionalData = {}, className = '' }) => {
  const [tooltipContent, setTooltipContent] = useState(null);

  // Normalize keys - handle both regionXIII and caraga
  const normalizedData = { ...regionalData };
  if (regionalData.regionXIII && !regionalData.caraga) {
    normalizedData.caraga = regionalData.regionXIII;
  }

  // Calculate max value for color scaling
  const maxValue = Math.max(...Object.values(normalizedData), 1);

  // Create color scale from light to dark blue
  const colorScale = scaleLinear()
    .domain([0, maxValue])
    .range(['#dbeafe', '#1e3a8a'])
    .clamp(true);

  const getRegionColor = (regionKey) => {
    const value = normalizedData[regionKey] || 0;
    return value > 0 ? colorScale(value) : '#f3f4f6';
  };

  const handleMouseMove = (e, regionKey) => {
    const value = normalizedData[regionKey] || 0;
    setTooltipContent({
      region: REGION_NAMES[regionKey],
      emigrants: value,
      x: e.clientX,
      y: e.clientY,
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg 
        viewBox="0 0 350 580" 
        style={{ 
          width: '100%', 
          height: '100%',
          maxHeight: '700px'
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ocean/Background */}
        <rect x="0" y="0" width="350" height="580" fill="#e0f2fe" />
        
        {/* Philippine Regions */}
        {Object.entries(philippineRegionPaths).map(([regionKey, pathData]) => (
          <path
            key={regionKey}
            d={pathData}
            fill={getRegionColor(regionKey)}
            stroke="#ffffff"
            strokeWidth="2"
            onMouseMove={(e) => handleMouseMove(e, regionKey)}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: 'pointer',
              transition: 'fill 0.3s ease, opacity 0.2s ease',
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.strokeWidth = '2.5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.strokeWidth = '2';
            }}
          />
        ))}
        
        {/* Title */}
        <text
          x="175"
          y="25"
          textAnchor="middle"
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#1e40af',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Philippine Regions
        </text>
      </svg>
      
      <MapTooltip content={tooltipContent} />
    </div>
  );
};

// Demo Component
const Demo = () => {
  const sampleData = {
    ncr: 687263,
    regionI: 242229,
    car: 47878,
    regionX: 42496,
    regionV: 35946,
    regionIVA: 180000,
    regionIII: 150000,
    regionVII: 120000,
    regionVI: 95000,
    regionII: 85000,
    regionVIII: 75000,
    regionXI: 65000,
    regionIX: 55000,
    regionXII: 45000,
    caraga: 38000,
    regionIVB: 32000,
    armm: 28000,
  };

  const maxValue = Math.max(...Object.values(sampleData));
  const colorScale = scaleLinear()
    .domain([0, maxValue])
    .range(['#dbeafe', '#1e3a8a'])
    .clamp(true);

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8fafc'
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#111827'
      }}>
        Filipino Emigrants by Region of Origin
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '24px',
        alignItems: 'start'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <PhilippineChoroplethMap regionalData={sampleData} />
        </div>
        
        <div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Emigrant Count
            </h3>
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                <span>0</span>
                <span>{maxValue.toLocaleString()}</span>
              </div>
              <div style={{
                height: '20px',
                borderRadius: '4px',
                background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(maxValue)})`,
                border: '1px solid #d1d5db'
              }} />
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              Hover over regions for details
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Top 5 Regions
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {Object.entries(sampleData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([key, value]) => (
                  <li key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#374151' }}>
                      {REGION_NAMES[key]?.split('(')[0].trim() || key}
                    </span>
                    <span style={{ 
                      fontWeight: '600',
                      color: '#059669'
                    }}>
                      {value.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;