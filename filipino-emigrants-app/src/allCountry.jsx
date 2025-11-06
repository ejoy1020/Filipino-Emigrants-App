import React, { useEffect, useState } from "react";
import {
  addEmigrant,
  getEmigrants,
  updateEmigrant,
  deleteEmigrant,
  parseFileToRecords,
  bulkUploadEmigrants,
} from "./services/emigrantsService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Cell,
} from "recharts";
import DashboardLayout from "./layouts/DashboardLayout";
import Modal from "react-modal";
import "./App.css";
import "./allCountry.css";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

Modal.setAppElement("#root");

// === Simple Map Legend ===
const ChoroplethLegend = ({ colorScale, maxTotal }) => {
  const minColor = colorScale.range()[0];
  const maxColor = colorScale.range()[1];
  const formattedMax = maxTotal.toLocaleString();

  return (
    <div style={{ margin: "20px auto", padding: "10px", width: "90%", maxWidth: "400px", border: "1px solid #ddd", borderRadius: "4px" }}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}>Total Emigrants per Country</h4>
      <div style={{ height: "20px", backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`, borderRadius: "3px", marginBottom: "5px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <span>0</span>
        <span>{formattedMax}</span>
      </div>
      <p style={{ margin: "5px 0 0 0", fontSize: "10px", color: "#666" }}>
        (Lighter = fewer emigrants, darker = more.)
      </p>
    </div>
  );
};

function AllCountry() {
  const COLLECTION = "allCountries";
  const WORLD_TOPO_JSON = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  // Extract country columns from CSV (excluding YEAR) - SORTED ALPHABETICALLY
  const countryColumns = [
    "ALBANIA", "ANGOLA", "ARGENTINA", "ARMENIA", "AUSTRALIA", "AUSTRIA", "AZERBAIJAN", "BAHAMAS", "BAHRAIN", "BANGLADESH",
    "BARBADOS", "BELARUS", "BELGIUM", "BELIZE", "BENIN", "BHUTAN", "BOLIVIA (PLURINATIONAL STATE OF)", "BOSNIA AND HERZEGOVINA",
    "BOTSWANA", "BRAZIL", "BULGARIA", "CAMBODIA", "CANADA", "CHILE", "CHINA", "COLOMBIA", "CONGO", "COSTA RICA", "CROATIA",
    "CYPRUS", "CZECHIA", "DENMARK", "DOMINICAN REPUBLIC", "ECUADOR", "EGYPT", "EL SALVADOR", "ESTONIA", "FIJI", "FINLAND",
    "FRANCE", "GEORGIA", "GERMANY", "GREECE", "GUATEMALA", "HONDURAS", "HUNGARY", "ICELAND", "INDIA", "INDONESIA",
    "IRAN (ISLAMIC REPUBLIC OF)", "IRAQ", "IRELAND", "ISRAEL", "ITALY", "JAMAICA", "JAPAN", "JORDAN", "KAZAKHSTAN", "KENYA",
    "KIRIBATI", "KUWAIT", "KYRGYZSTAN", "LATVIA", "LEBANON", "LIBERIA", "LITHUANIA", "LUXEMBOURG", "MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)",
    "MALAYSIA", "MALDIVES", "MALI", "MALTA", "MAURITANIA", "MAURITIUS", "MEXICO", "MOLDOVA", "MONACO", "MONTENEGRO", "MOROCCO",
    "MYANMAR", "NAMIBIA", "NETHERLANDS", "NEW ZEALAND", "NICARAGUA", "NORWAY", "OMAN", "PAKISTAN", "PANAMA", "PARAGUAY", "PERU",
    "POLAND", "PORTUGAL", "QATAR", "REPUBLIC OF KOREA", "ROMANIA", "RUSSIAN FEDERATION", "SAUDI ARABIA", "SERBIA", "SINGAPORE",
    "SLOVAKIA", "SLOVENIA", "SOUTH AFRICA", "SPAIN", "SRI LANKA", "SWEDEN", "SWITZERLAND", "TAJIKISTAN", "THAILAND", "TURKEY",
    "UGANDA", "UKRAINE", "UNITED ARAB EMIRATES", "UNITED KINGDOM", "UNITED STATES OF AMERICA", "URUGUAY", "UZBEKISTAN",
    "VENEZUELA (BOLIVARIAN REPUBLIC OF)", "VIET NAM", "YEMEN", "ZAMBIA", "ZIMBABWE"
  ].sort((a, b) => a.localeCompare(b)); // SORT ALPHABETICALLY

  const allColumns = ["year", ...countryColumns];

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(Object.fromEntries(allColumns.map((c) => [c, ""])));
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [rankYear, setRankYear] = useState("total");
  const [rankCountry, setRankCountry] = useState("all");
  const [trendCountry, setTrendCountry] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState(["UNITED STATES OF AMERICA", "CANADA", "AUSTRALIA", "UNITED KINGDOM", "JAPAN"]);

  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });
  
  // 🔹 Filter by year range
  const filteredRecords = records.filter((r) => {
    const year = Number(r.year) || 0;
    return year >= selectedYearRange.from && year <= selectedYearRange.to;
  });

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5; // Reduced due to wide table
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // fetch & normalize
  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    const cleaned = data.map((e) => {
      const record = { id: e.id, year: Number(e.year) || 0 };
      countryColumns.forEach(country => {
        record[country] = Number(e[country] ?? e[country.toLowerCase()] ?? 0);
      });
      return record;
    });
    cleaned.sort((a, b) => a.year - b.year);
    setRecords(cleaned);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD handlers
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAdd = async () => {
    if (!form.year) return alert("Please input the year.");
    await addEmigrant(
      Object.fromEntries(allColumns.map((c) => [c, c === "year" ? Number(form[c]) : Number(form[c]) || 0])),
      COLLECTION
    );
    setForm(Object.fromEntries(allColumns.map((c) => [c, ""])));
    setIsModalOpen(false);
    fetchData();
  };
  const openEditModal = (record) => {
    setEditId(record.id);
    setForm(Object.fromEntries(allColumns.map((c) => [c, record[c] ?? ""])));
    setIsEditModalOpen(true);
  };
  const handleEditSave = async () => {
    if (!editId) return;
    await updateEmigrant(
      editId,
      Object.fromEntries(allColumns.map((c) => [c, c === "year" ? Number(form[c]) : Number(form[c]) || 0])),
      COLLECTION
    );
    setIsEditModalOpen(false);
    fetchData();
  };
  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleBulkUpload = async () => {
    if (!file) return alert("Please select a CSV/XLSX file first.");
    setLoadingUpload(true);
    try {
      const parsed = await parseFileToRecords(file);
      await bulkUploadEmigrants(parsed, COLLECTION);
      alert("Upload successful!");
      fetchData();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoadingUpload(false);
      setFile(null);
    }
  };

  // Generate gradient colors from light to dark blue (same as placeOfOrigin)
  const generateGradientColors = (dataLength) => {
    const colors = [];
    for (let i = 0; i < dataLength; i++) {
      const intensity = Math.floor(255 - (i / dataLength) * 180);
      colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
    }
    return colors;
  };

  const COLORS = generateGradientColors(countryColumns.length);

  // === Data Helpers (safe) ===
  const getRankingData = (year) => {
    if (!records || records.length === 0) return [];
    if (year === "total") {
      return countryColumns.map((key) => ({
        name: key,
        value: records.reduce((sum, d) => sum + (Number(d[key]) || 0), 0),
      })).filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 20); // Show top 20 countries
    }
    const yr = Number(year);
    const yearRecord = records.find((r) => Number(r.year) === yr);
    if (!yearRecord) return [];
    return countryColumns.map((key) => ({
      name: key,
      value: Number(yearRecord[key]) || 0,
    })).filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Show top 20 countries
  };

  const getCountryAcrossYears = (countryKey) => {
    if (!records || records.length === 0) return [];
    return records
      .filter((r) => Number(r.year))
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        year: r.year,
        value: Number(r[countryKey]) || 0,
      }));
  };

  const getTrendSelectedCountries = () => {
    if (!records || records.length === 0) return [];
    return records
      .filter((r) => Number(r.year))
      .sort((a, b) => a.year - b.year)
      .map((r) => {
        const result = { year: r.year };
        selectedCountries.forEach(country => {
          result[country] = Number(r[country]) || 0;
        });
        return result;
      });
  };

  const COUNTRY_NAME_MAP = {
    "UNITED STATES OF AMERICA": "United States of America",
    "CANADA": "Canada",
    "AUSTRALIA": "Australia",
    "UNITED KINGDOM": "United Kingdom",
    "JAPAN": "Japan",
    "ITALY": "Italy",
    "NEW ZEALAND": "New Zealand",
    "GERMANY": "Germany",
    "REPUBLIC OF KOREA": "South Korea",
    "SPAIN": "Spain",
    "FRANCE": "France",
    "SAUDI ARABIA": "Saudi Arabia",
    "UNITED ARAB EMIRATES": "United Arab Emirates",
    "SINGAPORE": "Singapore",
    "QATAR": "Qatar",
    "KUWAIT": "Kuwait",
    "BAHRAIN": "Bahrain",
    "MALAYSIA": "Malaysia",
    "RUSSIAN FEDERATION": "Russia"
  };

  const chartDataForMap = countryColumns.map((country) => ({
    country,
    total: records.reduce((sum, r) => sum + (r[country] || 0), 0),
  }));

  const dataForMap = chartDataForMap.reduce((acc, item) => {
    const geoName = COUNTRY_NAME_MAP[item.country] || item.country;
    if (item.total > 0) acc[geoName] = item.total;
    return acc;
  }, {});

  const maxTotal = Math.max(1, ...chartDataForMap.map(d => d.total));
  const colorScale = scaleLinear().domain([0, maxTotal]).range(["#E0F2F7", "#056976"]);

  // Calculate top 10 countries for sidebar
  const topCountries = chartDataForMap
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Group countries for better table organization - SORTED ALPHABETICALLY
  const groupedCountries = {
    "Americas": ["ARGENTINA", "BAHAMAS", "BARBADOS", "BELIZE", "BOLIVIA (PLURINATIONAL STATE OF)", "BRAZIL", "CANADA", "CHILE", "COLOMBIA", "COSTA RICA", "DOMINICAN REPUBLIC", "ECUADOR", "EL SALVADOR", "GUATEMALA", "HONDURAS", "JAMAICA", "MEXICO", "NICARAGUA", "PANAMA", "PARAGUAY", "PERU", "UNITED STATES OF AMERICA", "URUGUAY", "VENEZUELA (BOLIVARIAN REPUBLIC OF)"].sort((a, b) => a.localeCompare(b)),
    "Europe": ["ALBANIA", "ARMENIA", "AUSTRIA", "AZERBAIJAN", "BELARUS", "BELGIUM", "BOSNIA AND HERZEGOVINA", "BULGARIA", "CROATIA", "CYPRUS", "CZECHIA", "DENMARK", "ESTONIA", "FINLAND", "FRANCE", "GEORGIA", "GERMANY", "GREECE", "HUNGARY", "ICELAND", "IRELAND", "ITALY", "LATVIA", "LITHUANIA", "LUXEMBOURG", "MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)", "MALTA", "MOLDOVA", "MONTENEGRO", "NETHERLANDS", "NORWAY", "POLAND", "PORTUGAL", "ROMANIA", "RUSSIAN FEDERATION", "SERBIA", "SLOVAKIA", "SLOVENIA", "SPAIN", "SWEDEN", "SWITZERLAND", "TURKEY", "UKRAINE", "UNITED KINGDOM"].sort((a, b) => a.localeCompare(b)),
    "Asia & Middle East": ["BAHRAIN", "BANGLADESH", "BHUTAN", "CAMBODIA", "CHINA", "INDIA", "INDONESIA", "IRAN (ISLAMIC REPUBLIC OF)", "IRAQ", "ISRAEL", "JAPAN", "JORDAN", "KAZAKHSTAN", "KUWAIT", "KYRGYZSTAN", "LEBANON", "MALAYSIA", "MALDIVES", "MYANMAR", "OMAN", "PAKISTAN", "PHILIPPINES", "QATAR", "REPUBLIC OF KOREA", "SAUDI ARABIA", "SINGAPORE", "SRI LANKA", "TAJIKISTAN", "THAILAND", "UNITED ARAB EMIRATES", "UZBEKISTAN", "VIET NAM", "YEMEN"].sort((a, b) => a.localeCompare(b)),
    "Africa": ["ALGERIA", "ANGOLA", "BENIN", "BOTSWANA", "CONGO", "EGYPT", "ETHIOPIA", "GABON", "GHANA", "KENYA", "LIBERIA", "LIBYA", "MALI", "MAURITANIA", "MAURITIUS", "MOROCCO", "NAMIBIA", "NIGERIA", "SENEGAL", "SOUTH AFRICA", "TUNISIA", "UGANDA", "ZAMBIA", "ZIMBABWE"].sort((a, b) => a.localeCompare(b)),
    "Oceania": ["AUSTRALIA", "FIJI", "KIRIBATI", "NEW ZEALAND", "PAPUA NEW GUINEA"].sort((a, b) => a.localeCompare(b))
  };

  // Flatten grouped countries for table header
  const tableCountryGroups = Object.entries(groupedCountries);

  // === Render ===
  return (
    <DashboardLayout activeMenu="All Countries">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants — All Countries</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button onClick={() => setIsModalOpen(true)} className="btn-add">Add Record</button>
          <div>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
            <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
              {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
            </button>
          </div>
        </div>
        
        {/* ✅ Year Range Filter */}
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <h3>Filter by Year Range</h3>
          <label>From: </label>
          <input
            type="number"
            value={selectedYearRange.from}
            onChange={(e) =>
              setSelectedYearRange({ ...selectedYearRange, from: Number(e.target.value) })
            }
            style={{ width: "100px", marginRight: "10px" }}
          />
          <label>To: </label>
          <input
            type="number"
            value={selectedYearRange.to}
            onChange={(e) =>
              setSelectedYearRange({ ...selectedYearRange, to: Number(e.target.value) })
            }
            style={{ width: "100px" }}
          />
        </div>

        {/* Table - Showing ALL Countries */}
        <h2>Records (Showing all {countryColumns.length} countries)</h2>
        <div className="table-container">
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table className="emigrants-table" style={{ minWidth: '3000px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ minWidth: '80px', position: 'sticky', left: 0, background: 'white', zIndex: 10 }}>Year</th>
                  <th rowSpan="2" style={{ minWidth: '100px', position: 'sticky', left: '80px', background: 'white', zIndex: 10 }}>Total</th>
                  {tableCountryGroups.map(([region, countries]) => (
                    <th 
                      key={region} 
                      colSpan={countries.length} 
                      style={{ 
                        textAlign: 'center', 
                        background: '#f5f5f5',
                        position: 'sticky',
                        top: 0,
                        zIndex: 5
                      }}
                    >
                      {region}
                    </th>
                  ))}
                  <th rowSpan="2" style={{ minWidth: '120px', position: 'sticky', right: 0, background: 'white', zIndex: 10 }}>Actions</th>
                </tr>
                <tr>
                  {tableCountryGroups.map(([region, countries]) =>
                    countries.map(country => (
                      <th 
                        key={country} 
                        style={{ 
                          minWidth: '120px', 
                          fontSize: '11px',
                          background: '#f9f9f9',
                          position: 'sticky',
                          top: '30px',
                          zIndex: 4
                        }}
                        title={country}
                      >
                        {country.length > 15 ? `${country.substring(0, 12)}...` : country}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((rec) => {
                  const total = countryColumns.reduce((sum, country) => sum + (rec[country] || 0), 0);
                  
                  return (
                    <tr key={rec.id}>
                      <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: 'bold' }}>
                        {rec.year}
                      </td>
                      <td style={{ position: 'sticky', left: '80px', background: 'white', fontWeight: 'bold' }}>
                        {total.toLocaleString()}
                      </td>
                      
                      {tableCountryGroups.map(([region, countries]) =>
                        countries.map(country => (
                          <td key={country} style={{ textAlign: 'center' }}>
                            {rec[country] > 0 ? rec[country].toLocaleString() : '-'}
                          </td>
                        ))
                      )}
                      
                      <td style={{ position: 'sticky', right: 0, background: 'white' }}>
                        <button onClick={() => openEditModal(rec)} className="btn-update" style={{ padding: '2px 6px', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => handleDelete(rec.id)} className="btn-delete" style={{ padding: '2px 6px', fontSize: '11px', marginLeft: '4px' }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="btn-add">Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="btn-add">Next</button>
          </div>
          
          <div style={{ marginTop: "10px", textAlign: "center", color: "#666", fontSize: "12px" }}>
            <p>Scroll horizontally to view all {countryColumns.length} countries. Table organized by region for better navigation.</p>
          </div>
        </div>

        {/* Ranking Chart */}
        <h2>Top 20 Countries Ranking</h2>
        <div className="chart-card">
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <label>Year:</label>
            <select value={rankYear} onChange={(e) => setRankYear(e.target.value)} style={{ padding: "5px 8px", borderRadius: "6px" }}>
              <option value="total">Total (All Years)</option>
              {[...new Set(records.map((r) => r.year))].sort((a, b) => a - b).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <label>Country:</label>
            <select value={rankCountry} onChange={(e) => setRankCountry(e.target.value)} style={{ padding: "5px 8px", borderRadius: "6px" }}>
              <option value="all">Top 20</option>
              {countryColumns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {records.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              {rankCountry === "all" ? (
                <BarChart data={getRankingData(rankYear)} layout="vertical" margin={{ left: 150, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="value" barSize={18}>
                    {getRankingData(rankYear).map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={getCountryAcrossYears(rankCountry)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Bar dataKey="value" fill={COLORS[countryColumns.indexOf(rankCountry) % COLORS.length]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center" }}>No data available</p>
          )}
        </div>

        {/* Map */}
        <h2>Emigrant Distribution Map</h2>
        <div className="chart-card">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Map Section */}
            <div style={{ flex: 2 }}>
              <ChoroplethLegend colorScale={colorScale} maxTotal={maxTotal} />
              <div style={{ width: "100%", height: "500px" }}>
                <ComposableMap projection="geoMercator" style={{ width: "100%", height: "100%" }}>
                  <ZoomableGroup>
                    <Geographies geography={WORLD_TOPO_JSON}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const name = geo.properties.name;
                          const value = dataForMap[name];
                          const fill = value ? colorScale(value) : "#EEEEEE";
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fill}
                              style={{ default: { stroke: "#fff", strokeWidth: 0.5 }, hover: { fill: "#a8dadc" } }}
                            >
                              <title>{`${name}: ${value ? value.toLocaleString() : "No Data"}`}</title>
                            </Geography>
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              </div>
            </div>

            {/* Top 10 Countries Sidebar */}
            {records.length > 0 && (
              <div style={{ 
                flex: 1, 
                marginTop: "20px", 
                padding: "15px", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                background: '#f9f9f9',
                minWidth: '250px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>Top 10 Countries</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {topCountries.map((item, index) => (
                    <li 
                      key={item.country} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        padding: "10px 0", 
                        borderBottom: "1px solid #eee",
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: '#666',
                          minWidth: '20px',
                          textAlign: 'right'
                        }}>
                          {index + 1}.
                        </span>
                        <span className="country-name" style={{ fontSize: '14px' }}>
                          {item.country.length > 20 ? `${item.country.substring(0, 18)}...` : item.country}
                        </span>
                      </div>
                      <span className="country-value" style={{ 
                        fontWeight: "bold", 
                        fontSize: '14px',
                        color: '#056976'
                      }}>
                        {item.total.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  background: '#e8f4f8', 
                  borderRadius: '3px',
                  fontSize: '12px',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  Source: Philippine Statistics Authority
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modals - FIXED OVERLAY */}
<Modal
  isOpen={isModalOpen}
  onRequestClose={() => setIsModalOpen(false)}
  contentLabel="Add Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Add New Record</h2>
  <div className="modal-form three-columns">
    {allColumns.map((column) => (
      <div key={column} className="modal-field">
        <label>{column}:</label>
        <input
          type={column === 'year' ? 'number' : 'number'}
          name={column}
          value={form[column]}
          onChange={handleChange}
          placeholder={column}
          className="form-input"
        />
      </div>
    ))}
    <div className="modal-actions full-width">
      <button onClick={handleAdd} className="btn-add">Add</button>
      <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
    </div>
  </div>
</Modal>

<Modal
  isOpen={isEditModalOpen}
  onRequestClose={() => setIsEditModalOpen(false)}
  contentLabel="Edit Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Edit Record</h2>
  <div className="modal-form three-columns">
    {allColumns.map((column) => (
      <div key={column} className="modal-field">
        <label>{column}:</label>
        <input
          type={column === 'year' ? 'number' : 'number'}
          name={column}
          value={form[column]}
          onChange={handleChange}
          placeholder={column}
          className="form-input"
        />
      </div>
    ))}
    <div className="modal-actions full-width">
      <button onClick={handleEditSave} className="btn-update">Save</button>
      <button onClick={() => setIsEditModalOpen(false)} className="btn-cancel">Cancel</button>
    </div>
  </div>
</Modal>
      </main>
    </DashboardLayout>
  );
}

export default AllCountry;