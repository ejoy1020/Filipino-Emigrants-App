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

function MajorCountry() {
  const COLLECTION = "majorCountries";
  const WORLD_TOPO_JSON = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  const countriesOrder = [
    "year",
    "USA",
    "CANADA",
    "JAPAN",
    "AUSTRALIA",
    "ITALY",
    "NEW ZEALAND",
    "UNITED KINGDOM",
    "GERMANY",
    "SOUTH KOREA",
    "SPAIN",
    "OTHERS",
  ];

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(Object.fromEntries(countriesOrder.map((c) => [c, ""])));
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [rankYear, setRankYear] = useState("total");
  const [rankCountry, setRankCountry] = useState("all");
  const [trendCountry, setTrendCountry] = useState("all");

  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });

  // 🔹 Filter records by selected year range
const filteredRecords = records.filter((r) => {
  const year = Number(r.year) || 0;
  return year >= selectedYearRange.from && year <= selectedYearRange.to;
});

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Modal handlers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openEditModal = (record) => {
    setEditId(record.id);
    setForm(Object.fromEntries(countriesOrder.map((c) => [c, record[c] ?? ""])));
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  // fetch & normalize
  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    const cleaned = data.map((e) => ({
      id: e.id,
      year: Number(e.year) || 0,
      USA: Number(e.USA ?? e.usa ?? 0),
      CANADA: Number(e.CANADA ?? e.canada ?? 0),
      JAPAN: Number(e.JAPAN ?? e.japan ?? 0),
      AUSTRALIA: Number(e.AUSTRALIA ?? e.australia ?? 0),
      ITALY: Number(e.ITALY ?? e.italy ?? 0),
      "NEW ZEALAND": Number(e["NEW ZEALAND"] ?? e.newZealand ?? 0),
      "UNITED KINGDOM": Number(e["UNITED KINGDOM"] ?? e.unitedKingdom ?? 0),
      GERMANY: Number(e.GERMANY ?? e.germany ?? 0),
      "SOUTH KOREA": Number(e["SOUTH KOREA"] ?? e.southKorea ?? 0),
      SPAIN: Number(e.SPAIN ?? e.spain ?? 0),
      OTHERS: Number(e.OTHERS ?? e.others ?? 0),
    }));
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
    const payload = Object.fromEntries(
      countriesOrder.map((c) => [c, c === "year" ? Number(form[c]) : Number(form[c]) || 0])
    );
    await addEmigrant(payload, COLLECTION);
    setForm(Object.fromEntries(countriesOrder.map((c) => [c, ""])));
    closeModal();
    fetchData();
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const payload = Object.fromEntries(
      countriesOrder.map((c) => [c, c === "year" ? Number(form[c]) : Number(form[c]) || 0])
    );
    await updateEmigrant(editId, payload, COLLECTION);
    closeEditModal();
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

  // colors
  const generateGradientColors = (dataLength) => {
    const colors = [];
    for (let i = 0; i < dataLength; i++) {
      const intensity = Math.floor(255 - (i / dataLength) * 180);
      colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
    }
    return colors;
  };
  const countriesList = countriesOrder.filter((c) => c !== "year");
  const COLORS = generateGradientColors(countriesList.length);

  // === Data Helpers (safe) ===
  const getRankingData = (year) => {
    if (!records || records.length === 0) return [];
    if (year === "total") {
      return countriesList.map((key) => ({
        name: key,
        value: records.reduce((sum, d) => sum + (Number(d[key]) || 0), 0),
      }));
    }
    const yr = Number(year);
    const yearRecord = records.find((r) => Number(r.year) === yr);
    if (!yearRecord) return [];
    return countriesList.map((key) => ({
      name: key,
      value: Number(yearRecord[key]) || 0,
    }));
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

  const getTrendAllCountries = () => {
    if (!records || records.length === 0) return [];
    return records
      .filter((r) => Number(r.year))
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ ...r }));
  };

  // Get top 5 countries data
  const getTop5Countries = () => {
    if (!records || records.length === 0) return [];
    
    const countryTotals = countriesList.map((country) => ({
      name: country,
      value: records.reduce((sum, record) => sum + (Number(record[country]) || 0), 0),
    }));

    // Sort by value descending and take top 5
    return countryTotals
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const COUNTRY_NAME_MAP = {
    USA: "United States of America",
    CANADA: "Canada",
    JAPAN: "Japan",
    AUSTRALIA: "Australia",
    ITALY: "Italy",
    "NEW ZEALAND": "New Zealand",
    "UNITED KINGDOM": "United Kingdom",
    GERMANY: "Germany",
    "SOUTH KOREA": "South Korea",
    SPAIN: "Spain",
  };

  const chartDataForMap = countriesList.map((country) => ({
    country,
    total: records.reduce((sum, r) => sum + (r[country] || 0), 0),
  }));

  const dataForMap = chartDataForMap.reduce((acc, item) => {
    if (item.country === "OTHERS") return acc;
    const geoName = COUNTRY_NAME_MAP[item.country];
    if (geoName) acc[geoName] = item.total;
    return acc;
  }, {});

  const maxTotal = Math.max(1, ...chartDataForMap.filter(d => d.country !== "OTHERS").map(d => d.total));
  const colorScale = scaleLinear().domain([0, maxTotal]).range(["#E0F2F7", "#056976"]);

  const top5Countries = getTop5Countries();

  // === Render ===
  return (
    <DashboardLayout activeMenu="Major Countries">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants — Major Countries</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button onClick={openModal} className="btn-add">Add Record</button>
          <div>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
            <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
              {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
            </button>
          </div>
        </div>

        {/* Table */}
        {/* ✅ Year Filter */}
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

        <h2>Records</h2>
        <div className="table-container">
          <table className="emigrants-table">
            <thead>
              <tr>
                {countriesOrder.map((c) => (<th key={c}>{c}</th>))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((rec) => (
                <tr key={rec.id}>
                  {countriesOrder.map((c) => (<td key={c}>{rec[c]}</td>))}
                  <td>
                    <button onClick={() => openEditModal(rec)} className="btn-update">Edit</button>
                    <button onClick={() => handleDelete(rec.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="btn-add">Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="btn-add">Next</button>
          </div>
        </div>

        {/* ADD MODAL */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Add Record"
          className="modal"
          overlayClassName="overlay"
        >
          <h2>Add Major Country Record</h2>
          <div className="modal-form three-columns">
            {countriesOrder.map((key) => (
              <div key={key} className="modal-field">
                <label>{key}</label>
                <input
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  type="number"
                  className="form-input"
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
            <div className="modal-actions full-width">
              <button onClick={handleAdd} className="btn-add">Save</button>
              <button onClick={closeModal} className="btn-cancel">Cancel</button>
            </div>
          </div>
        </Modal>

        {/* EDIT MODAL */}
        <Modal
          isOpen={isEditModalOpen}
          onRequestClose={closeEditModal}
          contentLabel="Edit Record"
          className="modal"
          overlayClassName="overlay"
        >
          <h2>Edit Major Country Record</h2>
          <div className="modal-form three-columns">
            {countriesOrder.map((key) => (
              <div key={key} className="modal-field">
                <label>{key}</label>
                <input
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  type="number"
                  className="form-input"
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
            <div className="modal-actions full-width">
              <button onClick={handleEditSave} className="btn-add">Save Changes</button>
              <button onClick={closeEditModal} className="btn-cancel">Cancel</button>
            </div>
          </div>
        </Modal>

        {/* Ranking Chart */}
        <h2>Ranking</h2>
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
              <option value="all">All</option>
              {countriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {records.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              {rankCountry === "all" ? (
                <BarChart data={getRankingData(rankYear)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
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
                  <Bar dataKey="value" fill={COLORS[countriesList.indexOf(rankCountry) % COLORS.length]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center" }}>No data available</p>
          )}
        </div>

        {/* Map and Top 5 Countries Side by Side - SIMPLE DESIGN LIKE PLACEOFORIGIN */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginBottom: '20px' }}>
          {/* Map */}
          <div style={{ flex: 2 }}>
            <h2>Emigrant Distribution Map</h2>
            <div className="chart-card">
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
          </div>

          {/* Top 5 Countries - SIMPLE DESIGN LIKE PLACEOFORIGIN */}
          <div style={{ flex: 1 }}>
            <h2>Top 5 Countries</h2>
            <div className="chart-card" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
              {records.length > 0 ? (
                <div>
                  <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Top 5 Destination Countries</h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {top5Countries.map((country, index) => (
                      <li 
                        key={country.name} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          padding: "8px 0", 
                          borderBottom: "1px solid #eee" 
                        }}
                      >
                        <span className="country-name">
                          {country.name}
                        </span>
                        <span className="country-value" style={{ fontWeight: "bold" }}>
                          {country.value.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ textAlign: "center" }}>No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <h2 style={{ marginTop: "50px" }}>Trends (Line Chart)</h2>
        <div className="chart-card">
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <label>Country:</label>
            <select value={trendCountry} onChange={(e) => setTrendCountry(e.target.value)} style={{ padding: "5px 8px", borderRadius: "6px" }}>
              <option value="all">All</option>
              {countriesOrder.filter((c) => c !== "year" && c !== "OTHERS").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {records.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {trendCountry === "all" ? (
                <LineChart data={getTrendAllCountries()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const sorted = [...payload].sort((a, b) => b.value - a.value);
                        return (
                          <div style={{
                            background: "rgba(255,255,255,0.95)",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}>
                            <p style={{ fontWeight: "bold", marginBottom: "6px" }}>Year: {label}</p>
                            {sorted.map((entry, i) => (
                              <div key={i} style={{ color: entry.color || entry.stroke }}>
                                {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {countriesOrder
                    .filter((c) => c !== "year" && c !== "OTHERS")
                    .map((c, i) => (
                      <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                </LineChart>
              ) : (
                <LineChart data={getCountryAcrossYears(trendCountry)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke={COLORS[countriesList.indexOf(trendCountry) % COLORS.length]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center" }}>No data available</p>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default MajorCountry;