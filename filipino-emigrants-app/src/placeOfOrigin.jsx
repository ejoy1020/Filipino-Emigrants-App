import React, { useEffect, useState, useMemo } from "react";
import {
  addEmigrant,
  getEmigrants,
  updateEmigrant,
  deleteEmigrant,
  parseFileToRecords,
  bulkUploadEmigrants
} from "./services/emigrantsService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,LineChart, Line, Cell
} from "recharts";

import DashboardLayout from "./layouts/DashboardLayout";
import Modal from "react-modal";
import { scaleLinear } from "d3-scale";
import PhilippineChoroplethMap from "./PhilippineChoroplethMap";
import "./App.css";
import "./PhilippineMap.css";

Modal.setAppElement("#root");

// --- NEW COMPONENT: Choropleth Legend (same as MajorCountry) ---
const ChoroplethLegend = ({ colorScale, maxTotal }) => {
  const minColor = colorScale.range()[0];
  const maxColor = colorScale.range()[1];
  const formattedMax = maxTotal.toLocaleString();

  return (
    <div style={{ margin: "20px auto", padding: "10px", width: "90%", maxWidth: "400px", border: "1px solid #ddd", borderRadius: "4px" }}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}>Total Emigrants per Region</h4>
      
      {/* Color Gradient Bar */}
      <div
        style={{
          height: "20px",
          backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
          borderRadius: "3px",
          marginBottom: "5px",
        }}
      ></div>

      {/* Value Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <span>0</span>
        <span>{formattedMax}</span>
      </div>
      <p style={{ margin: "5px 0 0 0", fontSize: "10px", color: "#666" }}>
        (Lighter colors indicate fewer emigrants, darker colors indicate more.)
      </p>
    </div>
  );
};

// Map of data keys to display names
const REGION_MAP = {
  ncr: "NCR (National Capital Region)",
  car: "CAR (Cordillera Admin. Region)",
  regioni: "Region I (Ilocos)",
  regionii: "Region II (Cagayan Valley)",
  regioniii: "Region III (Central Luzon)",
  regioniva: "Region IV-A (CALABARZON)",
  regionivb: "Region IV-B (MIMAROPA)",
  regionv: "Region V (Bicol)",
  regionvi: "Region VI (Western Visayas)",
  regionvii: "Region VII (Central Visayas)",
  regionviii: "Region VIII (Eastern Visayas)",
  regionix: "Region IX (Zamboanga Peninsula)",
  regionx: "Region X (Northern Mindanao)",
  regionxi: "Region XI (Davao Region)",
  regionxii: "Region XII (SOCCSKSARGEN)",
  regionxiii: "Region XIII (Caraga)",
  armm: "BARMM (Bangsamoro/ARMM)",
};

const REGION_KEYS = Object.keys(REGION_MAP).filter(key => key !== 'year');

function PlaceOfOrigin() {
  const COLLECTION = "place_of_origin";
  
  const initialForm = useMemo(() => REGION_KEYS.reduce((acc, key) => ({ ...acc, [key]: "" }), { year: "" }), []);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    year: "",
    regioni: "",
    regionii: "",
    regioniii: "",
    regioniva: "",
    regionivb: "",
    regionv: "",
    regionvi: "",
    regionvii: "",
    regionviii: "",
    regionix: "",
    regionx: "",
    regionxi: "",
    regionxii: "",
    regionxiii: "",
    armm: "",
    car: "",
    ncr: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1988, to: 2050 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [rankYear, setRankYear] = useState("total");
const [rankRegion, setRankRegion] = useState("all");
const [trendRegion, setTrendRegion] = useState("all");


  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const openEditModal = (record) => {
    setEditId(record.id);
    setForm({
      year: record.year || "",
      regioni: record.regionI || record.regioni || "",
      regionii: record.regionII || record.regionii || "",
      regioniii: record.regionIII || record.regioniii || "",
      regioniva: record.regionIVA || record.regioniva || "",
      regionivb: record.regionIVB || record.regionivb || "",
      regionv: record.regionV || record.regionv || "",
      regionvi: record.regionVI || record.regionvi || "",
      regionvii: record.regionVII || record.regionvii || "",
      regionviii: record.regionVIII || record.regionviii || "",
      regionix: record.regionIX || record.regionix || "",
      regionx: record.regionX || record.regionx || "",
      regionxi: record.regionXI || record.regionxi || "",
      regionxii: record.regionXII || record.regionxii || "",
      regionxiii: record.regionXIII || record.regionxiii || "",
      armm: record.armm || "",
      car: record.car || "",
      ncr: record.ncr || "",
      notReported: record.notReported || record.notreported || ""
    });
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => setIsEditModalOpen(false);

  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    const sorted = [...data].sort((a, b) => a.year - b.year);
    setRecords(sorted);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = records.filter((e) => {
    const year = Number(e.year) || 0;
    return year >= selectedYearRange.from && year <= selectedYearRange.to;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totals = filteredData.reduce((acc, cur) => {
    Object.keys(form).forEach((key) => {
      if (key !== "year") acc[key] = (acc[key] || 0) + (Number(cur[key]) || 0);
    });
    return acc;
  }, {});

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    const payload = { year: Number(form.year) || 0 };
    REGION_KEYS.forEach(key => {
      payload[key] = Number(form[key]) || 0;
    });
    await addEmigrant(payload, COLLECTION);
    setForm({
      year: "",
      regioni: "",
      regionii: "",
      regioniii: "",
      regioniva: "",
      regionivb: "",
      regionv: "",
      regionvi: "",
      regionvii: "",
      regionviii: "",
      regionix: "",
      regionx: "",
      regionxi: "",
      regionxii: "",
      regionxiii: "",
      armm: "",
      car: "",
      ncr: "",
      notReported: ""
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const payload = { year: Number(form.year) || 0 };
    REGION_KEYS.forEach(key => {
      payload[key] = Number(form[key]) || 0;
    });
    await updateEmigrant(editId, payload, COLLECTION);
    closeEditModal();
    fetchData();
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleBulkUpload = async () => {
    if (!file) return alert("Please select a CSV/XLSX file first.");
    setLoadingUpload(true);
    try {
      const records = await parseFileToRecords(file);
      const normalizedRecords = records.map(rec => {
        const fixed = {};
        for (const key in rec) {
          fixed[key.charAt(0).toLowerCase() + key.slice(1)] = rec[key];
        }
        return fixed;
      });
      await bulkUploadEmigrants(normalizedRecords, COLLECTION);
      alert("Upload successful!");
      fetchData();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  // Generate gradient colors from light to dark blue (same as Age.jsx)
const generateGradientColors = (dataLength) => {
  const colors = [];
  for (let i = 0; i < dataLength; i++) {
    const intensity = Math.floor(255 - (i / dataLength) * 180);
    colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
  }
  return colors;
};

const COLORS = generateGradientColors(14);



  // Aggregate total emigrants per region across all years
  const { regionalTotalsMap, maxEmigrants } = useMemo(() => {
    const totals = new Map();
    let currentMax = 1;

    records.forEach(record => {
      REGION_KEYS.forEach(key => {
        const emigrants = parseInt(record[key] || 0);
        const currentTotal = totals.get(key) || 0;
        const newTotal = currentTotal + emigrants;
        totals.set(key, newTotal);

        if (newTotal > currentMax) {
          currentMax = newTotal;
        }
      });
    });

    return { regionalTotalsMap: totals, maxEmigrants: currentMax };
  }, [records]);

  // Convert Map to Object for the new component
  const regionalDataObject = useMemo(() => {
    return Object.fromEntries(regionalTotalsMap);
  }, [regionalTotalsMap]);

  // D3 scale for coloring (matching MajorCountry color scheme)
  const colorScale = scaleLinear()
    .domain([0, maxEmigrants])
    .range(["#E0F2F7", "#056976"]) // Light to Dark Cyan/Teal
    .clamp(true);

  const chartData = Object.entries(totals)
    .filter(([key]) => key !== "year" && key !== "notReported")
    .map(([key, value]) => ({ region: key, count: value }));

  return (
    <DashboardLayout activeMenu="Place of Origin">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants by Region of Origin</h1>
            <ul className="breadcrumb">
              <li><a href="#">Dashboard</a></li>
              <li><span className="custom-icon icon-chevron"></span></li>
              <li className="active"><a href="#">Place of Origin</a></li>
            </ul>
          </div>
        </div>

        <div className="crud-content">
          <div className="form-actions">
            <button onClick={openModal} className="btn-add">Add Record</button>
            <div className="upload-section">
              <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
              <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
                {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
              </button>
            </div>
          </div>

          <div className="year-filter">
            <h3>Filter by Year Range</h3>
            <div className="year-inputs">
              <label>From: </label>
              <input
                type="number"
                value={selectedYearRange.from}
                onChange={(e) => setSelectedYearRange({ ...selectedYearRange, from: Number(e.target.value) })}
                placeholder="From"
              />
              <span>to</span>
              <input
                type="number"
                value={selectedYearRange.to}
                onChange={(e) => setSelectedYearRange({ ...selectedYearRange, to: Number(e.target.value) })}
                placeholder="To"
              />
            </div>
          </div>

          <h2>Records</h2>
          <div className="table-container">
            <table className="emigrants-table">
              <thead>
                <tr>
                  <th>Year</th>
                  {Object.keys(form).filter((k) => k !== "year").map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((e) => (
                  <tr key={e.id}>
                    <td>{e.year}</td>
                    {Object.keys(form)
                      .filter((k) => k !== "year")
                      .map((key) => (
                        <td key={key}>{e[key] || 0}</td>
                      ))}
                    <td>
                      <button onClick={() => openEditModal(e)} className="btn-update">Update</button>
                      <button onClick={() => handleDelete(e.id)} className="btn-delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="btn-add"
              >
                Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="btn-add"
              >
                Next
              </button>
            </div>
          </div>

          {/* === RANKING (Horizontal Bar Chart) === */}
<h2 style={{ marginTop: "50px" }}>Ranking (Horizontal Bar Chart)</h2>

{/* Filters for Ranking Chart */}
<div
  style={{
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
  }}
>
  {/* Year Selector */}
  <label>Year:</label>
  <select
    value={rankYear}
    onChange={(e) => setRankYear(e.target.value)}
    style={{ padding: "5px 8px", borderRadius: "6px" }}
  >
    <option value="total">Total (All Years)</option>
    {[...new Set(records.map((r) => Number(r.year)).filter((y) => !isNaN(y)))].sort(
      (a, b) => a - b
    ).map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>

  {/* Region Selector */}
  <label>Region:</label>
  <select
    value={rankRegion}
    onChange={(e) => setRankRegion(e.target.value)}
    style={{ padding: "5px 8px", borderRadius: "6px" }}
  >
    <option value="all">All</option>
    {REGION_KEYS.map((key) => (
      <option key={key} value={key}>
        {REGION_MAP[key]?.split("(")[0].trim() || key}
      </option>
    ))}
  </select>
</div>

<ResponsiveContainer width="100%" height={420}>
  {rankRegion === "all" ? (
    // ✅ All Regions
    <BarChart
      data={
        rankYear === "total"
          ? REGION_KEYS.map((key) => ({
              name: REGION_MAP[key]?.split("(")[0].trim() || key,
              value: records.reduce((sum, r) => sum + (Number(r[key]) || 0), 0),
            }))
          : (() => {
              const yearRec = records.find((r) => Number(r.year) === Number(rankYear));
              if (!yearRec) return [];
              return REGION_KEYS.map((key) => ({
                name: REGION_MAP[key]?.split("(")[0].trim() || key,
                value: Number(yearRec[key]) || 0,
              }));
            })()
      }
      layout="vertical"
      margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" barSize={18}>
        {REGION_KEYS.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  ) : (
    // ✅ Selected Region Across All Years
    <BarChart
      data={records
        .filter((r) => !isNaN(Number(r.year)))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .map((r) => ({
          year: r.year,
          value: Number(r[rankRegion]) || 0,
        }))}
      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        fill={COLORS[REGION_KEYS.indexOf(rankRegion) % COLORS.length]}
        name={REGION_MAP[rankRegion]?.split("(")[0].trim() || rankRegion}
        barSize={25}
      />
    </BarChart>
  )}
</ResponsiveContainer>

{/* === LINE CHART === */}
<h2 style={{ marginTop: "40px" }}>Trends (Region per Year)</h2>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  }}
>
  <label>Filter Region:</label>
  <select
    value={trendRegion}
    onChange={(e) => setTrendRegion(e.target.value)}
    style={{ padding: "5px 8px", borderRadius: "6px" }}
  >
    <option value="all">All</option>
    {REGION_KEYS.map((key) => (
      <option key={key} value={key}>
        {REGION_MAP[key]?.split("(")[0].trim() || key}
      </option>
    ))}
  </select>
</div>

<ResponsiveContainer width="100%" height={400}>
  {trendRegion === "all" ? (
    <LineChart
      data={records.map((r) => ({
        year: r.year,
        ...REGION_KEYS.reduce((acc, key) => {
          acc[key] = Number(r[key]) || 0;
          return acc;
        }, {}),
      }))}
      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // sort dynamically by value descending
      const sorted = [...payload].sort((a, b) => b.value - a.value);
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
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
      {REGION_KEYS.map((key, i) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={COLORS[i % COLORS.length]}
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name={REGION_MAP[key]?.split("(")[0].trim() || key}
        />
      ))}
    </LineChart>
  ) : (
    <LineChart
      data={records
        .filter((r) => !isNaN(Number(r.year)))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .map((r) => ({
          year: r.year,
          value: Number(r[trendRegion]) || 0,
        }))}
      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="value"
        stroke={COLORS[REGION_KEYS.indexOf(trendRegion) % COLORS.length]}
        strokeWidth={3}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
        name={REGION_MAP[trendRegion]?.split("(")[0].trim() || trendRegion}
      />
    </LineChart>
  )}
</ResponsiveContainer>



          {/* ======================= */}
          {/* === Philippine Choropleth Map === */}
          {/* ======================= */}
          <h2>Emigrant Distribution Map - Philippine Regions</h2>
          
          {/* New: Legend added (matching MajorCountry style) */}
          <ChoroplethLegend colorScale={colorScale} maxTotal={maxEmigrants} />

          <div className="mb-8">
            <div className="map-container">
              <div className="map-wrapper">
                {/* Map */}
                <div style={{ width: "100%", height: "600px", border: "1px solid #ccc", marginBottom: "30px" }}>
                  {records.length === 0 ? (
                    <div className="map-empty-state">
                      Map data not available. Please add records to see visualization.
                    </div>
                  ) : (
                    <PhilippineChoroplethMap 
                      regionalData={regionalDataObject}
                      colorScale={colorScale}
                      regionMap={REGION_MAP}
                    />
                  )}
                </div>

                {/* Top Regions Sidebar */}
                {records.length > 0 && (
                  <div className="top-regions" style={{ marginTop: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "4px" }}>
                    <h3>Top 5 Regions</h3>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {Array.from(regionalTotalsMap.entries())
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([key, value]) => (
                          <li key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                            <span className="region-name">
                              {REGION_MAP[key].split('(')[0].trim()}
                            </span>
                            <span className="region-value" style={{ fontWeight: "bold" }}>{value.toLocaleString()}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
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
  <h2>Add Region Record</h2>
  <div className="modal-form four-columns" style={{ maxHeight: "70vh", overflowY: "auto" }}>
    {[
      "year",
      "ncr", "car", "regioni", "regionii",
      "regioniii", "regioniva", "regionivb", "regionv",
      "regionvi", "regionvii", "regionviii", "regionix",
      "regionx", "regionxi", "regionxii", "regionxiii",
      "armm"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{REGION_MAP[key] || key}</label>
        <input
          name={key}
          placeholder={REGION_MAP[key] || key}
          value={form[key]}
          onChange={handleChange}
          type="number"
          className="form-input"
        />
      </div>
    ))}
    <div className="modal-actions full-width">
      <button onClick={async () => { await handleAdd(); closeModal(); }} className="btn-add">Save</button>
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
  <h2>Edit Region Record</h2>
  <div className="modal-form four-columns" style={{ maxHeight: "70vh", overflowY: "auto" }}>
    {[
      "year",
      "ncr", "car", "regioni", "regionii",
      "regioniii", "regioniva", "regionivb", "regionv",
      "regionvi", "regionvii", "regionviii", "regionix",
      "regionx", "regionxi", "regionxii", "regionxiii",
      "armm"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{REGION_MAP[key] || key}</label>
        <input
          name={key}
          value={form[key]}
          onChange={handleChange}
          type="number"
          className="form-input"
        />
      </div>
    ))}
    <div className="modal-actions full-width">
      <button onClick={handleEditSave} className="btn-add">Save Changes</button>
      <button onClick={closeEditModal} className="btn-cancel">Cancel</button>
    </div>
  </div>
</Modal>
      </main>
    </DashboardLayout>
  );
}

export default PlaceOfOrigin;