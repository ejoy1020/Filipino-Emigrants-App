import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const PhilippineChoroplethMap = ({ regionalData, colorScale, regionMap }) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);

  // Using the URL you provided
  const PHILIPPINES_GEOJSON = "https://raw.githubusercontent.com/macoymejia/geojsonph/refs/heads/master/Regions/Regions.json";

  // Load GeoJSON data
  useEffect(() => {
    fetch(PHILIPPINES_GEOJSON)
      .then(response => response.json())
      .then(data => {
        setGeoData(data);
        console.log("GeoJSON loaded:", data);
        
        // Log all region names from GeoJSON for debugging
        if (data.features) {
          console.log("All GeoJSON region names:");
          data.features.forEach((feature, index) => {
            console.log(`Region ${index + 1}:`, feature.properties);
          });
        }
      })
      .catch(error => console.error("Error loading GeoJSON:", error));
  }, []);

  // Enhanced mapping function based on actual GeoJSON structure
  const getRegionKey = (geoProperties) => {
    // Get the region name from GeoJSON properties
    const regionName = geoProperties.REGION || geoProperties.NAME || geoProperties.Region;
    
    console.log("Mapping region:", regionName); // Debug log

    // Comprehensive mapping based on common GeoJSON region names
    const mapping = {
  // NCR
  "National Capital Region (NCR)": "ncr",
  "National Capital Region": "ncr",
  "NCR": "ncr",

  // CAR
  "Cordillera Administrative Region (CAR)": "car",
  "Cordillera Administrative Region": "car",
  "CAR": "car",

  // Region I - Ilocos
  "Ilocos Region (Region I)": "regioni",
  "Ilocos Region": "regioni",
  "Region I": "regioni",

  // Region II - Cagayan Valley
  "Cagayan Valley (Region II)": "regionii",
  "Cagayan Valley": "regionii",
  "Region II": "regionii",

  // Region III - Central Luzon
  "Central Luzon (Region III)": "regioniii",
  "Central Luzon": "regioniii",
  "Region III": "regioniii",

  // Region IV-A - CALABARZON
  "CALABARZON (Region IV-A)": "regioniva",
  "CALABARZON": "regioniva",
  "Region IV-A": "regioniva",

  // Region IV-B - MIMAROPA
  "MIMAROPA (Region IV-B)": "regionivb",
  "MIMAROPA Region": "regionivb",
  "Region IV-B": "regionivb",

  // Region V - Bicol
  "Bicol Region (Region V)": "regionv",
  "Bicol Region": "regionv",
  "Region V": "regionv",

  // Region VI - Western Visayas
  "Western Visayas (Region VI)": "regionvi",
  "Western Visayas": "regionvi",
  "Region VI": "regionvi",

  // Region VII - Central Visayas
  "Central Visayas (Region VII)": "regionvii",
  "Central Visayas": "regionvii",
  "Region VII": "regionvii",

  // Region VIII - Eastern Visayas
  "Eastern Visayas (Region VIII)": "regionviii",
  "Eastern Visayas": "regionviii",
  "Region VIII": "regionviii",

  // Region IX - Zamboanga Peninsula
  "Zamboanga Peninsula (Region IX)": "regionix",
  "Zamboanga Peninsula": "regionix",
  "Region IX": "regionix",

  // Region X - Northern Mindanao
  "Northern Mindanao (Region X)": "regionx",
  "Northern Mindanao": "regionx",
  "Region X": "regionx",

  // Region XI - Davao Region
  "Davao Region (Region XI)": "regionxi",
  "Davao Region": "regionxi",
  "Region XI": "regionxi",

  // Region XII - SOCCSKSARGEN
  "SOCCSKSARGEN (Region XII)": "regionxii",
  "SOCCSKSARGEN": "regionxii",
  "Region XII": "regionxii",

  // Region XIII - Caraga
  "Caraga (Region XIII)": "regionxiii",
  "Caraga": "regionxiii",
  "Region XIII": "regionxiii",

  // BARMM / ARMM
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": "armm",
  "Bangsamoro Autonomous Region in Muslim Mindanao": "armm",
  "Autonomous Region in Muslim Mindanao (ARMM)": "armm",
  "Autonomous Region of Muslim Mindanao (ARMM)": "armm",
  "ARMM": "armm",
  "BARMM": "armm"
};


    const mappedKey = mapping[regionName] || null;
    console.log("Mapped", regionName, "to key:", mappedKey); // Debug log
    return mappedKey;
  };

  useEffect(() => {
    // Log the data being passed to the map
    console.log("=== PHILIPPINE MAP DEBUG ===");
    console.log("Regional Data received:", regionalData);
    console.log("Available region keys in data:", Object.keys(regionalData || {}));
    
    if (regionalData) {
      const dataEntries = Object.entries(regionalData);
      console.log("Data values:", dataEntries);
    }
  }, [regionalData]);

  if (!geoData) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%",
        backgroundColor: "#f8f9fa"
      }}>
        Loading map data...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#f8f9fa" }}>
      

      {/* Tooltip */}
      {tooltipContent && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(2, 48, 71, 0.95)",
            color: "white",
            padding: "12px 18px",
            borderRadius: "8px",
            fontSize: "14px",
            zIndex: 1000,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
          dangerouslySetInnerHTML={{ __html: tooltipContent }}
        />
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [122, 12],
          scale: 2800,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={geoData}>
            {({ geographies }) => {
              // Log first geography for debugging
              if (geographies.length > 0 && !debugInfo) {
                const firstGeo = geographies[0];
                const debugText = `First Region Properties:\n${JSON.stringify(firstGeo.properties, null, 2)}\n\nYour Data Keys:\n${Object.keys(regionalData || {}).join(', ')}\n\nYour Data Values:\n${JSON.stringify(regionalData, null, 2)}`;
                
                console.log("First Geography:", firstGeo.properties);
                
                // Show debug info on screen
                setDebugInfo(debugText);
              }

              return geographies.map((geo) => {
                const regionKey = getRegionKey(geo.properties);
                const value = regionalData?.[regionKey] || 0;
                const fill = value > 0 && colorScale ? colorScale(value) : "#E5E7EB";

                const displayName = regionMap?.[regionKey] || 
                                  geo.properties.REGION || 
                                  geo.properties.NAME || 
                                  "Unknown Region";

                // Log unmapped regions
                if (!regionKey) {
                  console.log("UNMAPPED REGION:", geo.properties.REGION || geo.properties.NAME);
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    onMouseEnter={() => {
                      const tooltipHtml = regionKey ? 
                        `<div style="font-weight: 700; margin-bottom: 5px; color: #FFB703;">${displayName}</div>
                         <div style="color: #ADB5BD;">Data Key: <span style="color: #FFD60A;">${regionKey}</span></div>
                         <div style="color: #ADB5BD;">Emigrants: <span style="color: #FFD60A; font-weight: 800;">${(value || 0).toLocaleString()}</span></div>` :
                        `<div style="font-weight: 700; margin-bottom: 5px; color: #FF6B6B;">${displayName}</div>
                         <div style="color: #ADB5BD;">Status: <span style="color: #FF6B6B;">Not mapped to data</span></div>
                         <div style="color: #ADB5BD; font-size: 11px;">GeoJSON name: "${geo.properties.REGION || geo.properties.NAME}"</div>`;
                      
                      setTooltipContent(tooltipHtml);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    style={{
                      default: {
                        stroke: "#FFFFFF",
                        strokeWidth: 0.75,
                        outline: "none",
                      },
                
                      pressed: {
                        outline: "none",
                      },
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      

      

    
    </div>
  );
};

export default PhilippineChoroplethMap;