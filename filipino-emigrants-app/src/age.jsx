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
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Treemap,
} from "recharts";
import DashboardLayout from "./layouts/DashboardLayout";
import Modal from "react-modal";
import "./App.css";

Modal.setAppElement("#root");

function Age() {
  const COLLECTION = "age_data";

  // ---- data + forms ----
  const [ageData, setAgeData] = useState([]);
  const [form, setForm] = useState({
  year: "",
  "14below": "",
  "1519": "",
  "2024": "",
  "2529": "",
  "3034": "",
  "3539": "",
  "4044": "",
  "4549": "",
  "5054": "",
  "5559": "",
  "6064": "",
  "6569": "",
  "70Above": "",
  "notReported": "",
});
  // ---- UI state ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [rankYear, setRankYear] = useState("total");
const [rankCategory, setRankCategory] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");



  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Table year-range filter (separate)
  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });

  // Graph filters (separate)
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pieYear, setPieYear] = useState("total");
  const [rankAgeGroup, setRankAgeGroup] = useState("all");
const [trendAgeGroup, setTrendAgeGroup] = useState("all");
  const [selectedLineAge, setSelectedLineAge] = useState("all");

  // age categories list - MATCHING FIREBASE FIELD NAMES

 // age categories list - MATCHING FIREBASE FIELD NAMES (KEEP AS ARRAY)
const categories = [
  "14below",
  "1519", 
  "2024",
  "2529",
  "3034",
  "3539",
  "4044",
  "4549",
  "5054",
  "5559",
  "6064",
  "6569",
  "70Above",
  "notReported",
];

const categoryLabels = {
  year: "Year",
  "14below": "Below 14",
  "1519": "15-19",
  "2024": "20-24", 
  "2529": "25-29",
  "3034": "30-34",
  "3539": "35-39",
  "4044": "40-44",
  "4549": "45-49",
  "5054": "50-54",
  "5559": "55-59",
  "6064": "60-64",
  "6569": "65-69",
  "70Above": "70+",
  "notReported": "Not Reported",
};

  // Generate gradient colors from light to dark blue
  const generateGradientColors = (dataLength) => {
    const colors = [];
    for (let i = 0; i < dataLength; i++) {
      const intensity = Math.floor(255 - (i / dataLength) * 180);
      colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
    }
    return colors;
  };

  const COLORS = generateGradientColors(14);

  // ---- fetch data (CRUD) ----
  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    // normalize year to number when possible
    const normalized = data.map((d) => ({ ...d, year: Number(d.year) || d.year }));
    normalized.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    setAgeData(normalized);

    if ((selectedYearRange.from === null || selectedYearRange.from === undefined) && normalized.length) {
      const yrs = normalized.map((r) => Number(r.year)).filter((y) => !Number.isNaN(y));
      if (yrs.length) {
        setSelectedYearRange({ from: Math.min(...yrs), to: Math.max(...yrs) });
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // ---- handlers ----
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    await addEmigrant(
      {
        year: Number(form.year) || 0,
        "14below": Number(form["14below"]) || 0,
        "1519": Number(form["1519"]) || 0,
        "2024": Number(form["2024"]) || 0,
        "2529": Number(form["2529"]) || 0,
        "3034": Number(form["3034"]) || 0,
        "3539": Number(form["3539"]) || 0,
        "4044": Number(form["4044"]) || 0,
        "4549": Number(form["4549"]) || 0,
        "5054": Number(form["5054"]) || 0,
        "5559": Number(form["5559"]) || 0,
        "6064": Number(form["6064"]) || 0,
        "6569": Number(form["6569"]) || 0,
        "70Above": Number(form["70Above"]) || 0,
        "notReported": Number(form["notReported"]) || 0,
      },
      COLLECTION
    );
    setForm({
      year: "",
      "14below": "",
      "1519": "",
      "2024": "",
      "2529": "",
      "3034": "",
      "3539": "",
      "4044": "",
      "4549": "",
      "5054": "",
      "5559": "",
      "6064": "",
      "6569": "",
      "70Above": "",
      "notReported": "",
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };

  const openEditModal = (record) => {
  if (!record) return;
  
  setEditId(record.id || null);
  setForm({
    year: record.year?.toString() || "",
    "14below": record["14below"]?.toString() || "",
    "1519": record["1519"]?.toString() || "",
    "2024": record["2024"]?.toString() || "",
    "2529": record["2529"]?.toString() || "",
    "3034": record["3034"]?.toString() || "",
    "3539": record["3539"]?.toString() || "",
    "4044": record["4044"]?.toString() || "",
    "4549": record["4549"]?.toString() || "",
    "5054": record["5054"]?.toString() || "",
    "5559": record["5559"]?.toString() || "",
    "6064": record["6064"]?.toString() || "",
    "6569": record["6569"]?.toString() || "",
    "70Above": record["70Above"]?.toString() || "",
    "notReported": record["notReported"]?.toString() || "",
  });
  setIsEditModalOpen(true);
};

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditId(null);
  };

  const handleEditSave = async () => {
    if (!editId) return;
    await updateEmigrant(
      editId,
      {
        year: Number(form.year) || 0,
        "14below": Number(form["14below"]) || 0,
        "1519": Number(form["1519"]) || 0,
        "2024": Number(form["2024"]) || 0,
        "2529": Number(form["2529"]) || 0,
        "3034": Number(form["3034"]) || 0,
        "3539": Number(form["3539"]) || 0,
        "4044": Number(form["4044"]) || 0,
        "4549": Number(form["4549"]) || 0,
        "5054": Number(form["5054"]) || 0,
        "5559": Number(form["5559"]) || 0,
        "6064": Number(form["6064"]) || 0,
        "6569": Number(form["6569"]) || 0,
        "70Above": Number(form["70Above"]) || 0,
        "notReported": Number(form["notReported"]) || 0,
      },
      COLLECTION
    );
    closeEditModal();
    fetchData();
  };

  const getRankingData = (year) => {
  if (year === "total") {
    return categories.map((k) => ({
      name: categoryLabels[k],
      value: globalTotals[k] || 0,
    }));
  }
  const yearData = ageData.find((d) => Number(d.year) === Number(year));
  if (!yearData) return [];
  return categories.map((k) => ({
    name: categoryLabels[k],
    value: Number(yearData[k]) || 0,
  }));
};

  // upload - FIXED TO MATCH FIREBASE FIELD NAMES
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleBulkUpload = async () => {
  if (!file) return alert("Please select a CSV/XLSX file first.");
  setLoadingUpload(true);
  try {
    let records = await parseFileToRecords(file);

    // DEBUG: Log the first record to see actual keys
    console.log("First record keys:", Object.keys(records[0] || {}));
    console.log("First record:", records[0]);

    // 🔁 SIMPLE MAPPING - Just convert to numbers, no field name changes
    records = records.map((row) => {
      const mapped = {};
      
      // Map each field, converting to number
      Object.keys(row).forEach(key => {
        // Keep the original field names from CSV
        mapped[key] = Number(row[key]?.toString().trim()) || 0;
      });
      
      return mapped;
    });

    await bulkUploadEmigrants(records, COLLECTION);
    alert("✅ Upload successful!");
    fetchData();
  } catch (err) {
    alert("❌ Upload failed: " + err.message);
  } finally {
    setLoadingUpload(false);
  }
};

  // ---- Table data: filtered by selectedYearRange ONLY ----
  const fromYearNum = selectedYearRange.from === "" || selectedYearRange.from === null ? -Infinity : Number(selectedYearRange.from);
  const toYearNum = selectedYearRange.to === "" || selectedYearRange.to === null ? Infinity : Number(selectedYearRange.to);

  const tableData = ageData.filter((r) => {
    const yr = Number(r.year);
    return !Number.isNaN(yr) && yr >= fromYearNum && yr <= toYearNum;
  });

  // ---- Graph data: filtered by graph filters ----
  const graphFiltered = ageData.filter((r) => {
    if (selectedYear === "all") return true;
    const yr = Number(r.year);
    return !Number.isNaN(yr) && yr === Number(selectedYear);
  });

  const chartData = [...graphFiltered].sort((a, b) => Number(a.year) - Number(b.year)).map((d) => ({ ...d, year: Number(d.year) }));

  const globalTotals = ageData.reduce((acc, cur) => {
    categories.forEach((k) => {
      acc[k] = (acc[k] || 0) + (Number(cur[k]) || 0);
    });
    return acc;
  }, {});

  const graphTotals = graphFiltered.reduce((acc, cur) => {
    categories.forEach((k) => {
      acc[k] = (acc[k] || 0) + (Number(cur[k]) || 0);
    });
    return acc;
  }, {});

  const compositionData = (() => {
    if (String(pieYear) === "total") {
      return categories.map((k) => ({ name: categoryLabels[k], value: globalTotals[k] || 0 }));
    }
    const yearNum = Number(pieYear);
    if (!Number.isNaN(yearNum)) {
      const rec = ageData.find((r) => Number(r.year) === yearNum) || {};
      return categories.map((k) => ({ name: categoryLabels[k], value: Number(rec[k]) || 0 }));
    }
    return categories.map((k) => ({ name: categoryLabels[k], value: graphTotals[k] || 0 }));
  })();

  const treemapData = categories.map((k, i) => ({
    name: categoryLabels[k],
    size: Number(globalTotals[k]) || 0,
    color: COLORS[i % COLORS.length],
  }));

  const rankingData = categories.map((k, i) => ({
    name: categoryLabels[k],
    value: compositionData[i]?.value || 0,
  }));

  const displayedCategories = selectedCategory === "all" ? categories : [selectedCategory];

  const legendPayload = displayedCategories.map((cat, i) => ({ 
    value: categoryLabels[cat], 
    type: "square", 
    id: cat, 
    color: COLORS[categories.indexOf(cat) % COLORS.length] 
  }));
  
  const rankingLegendPayload = categories.map((cat, i) => ({ 
    value: categoryLabels[cat], 
    type: "square", 
    id: cat, 
    color: COLORS[i % COLORS.length] 
  }));

  const compositionTotal = compositionData.reduce((s, it) => s + (Number(it.value) || 0), 0);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = tableData.slice(startIndex, startIndex + itemsPerPage);

  // ---- render ----
  return (
    <DashboardLayout activeMenu="Age">
      <div className="head-title">
        <div className="left">
          <h1>Registered Filipino Emigrants by Age</h1>
          <ul className="breadcrumb">
            <li><a href="#">Dashboard</a></li>
            <li><span className="custom-icon icon-chevron"></span></li>
            <li className="active"><a href="#">Age</a></li>
          </ul>
        </div>
      </div>

      <div className="crud-content">
        {/* === Actions: Add + Upload === */}
        <div className="form-actions" style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setIsModalOpen(true)} className="btn-add">Add Record</button>
          <div>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
            <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
              {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
            </button>
          </div>
        </div>

        {/* === Table Year Range === */}
        <div style={{ marginTop: "20px" }}>
          <h3>Filter by Year Range</h3>
          <label>From: </label>
          <input
            type="number"
            value={selectedYearRange.from}
            onChange={(e) => setSelectedYearRange({ ...selectedYearRange, from: Number(e.target.value) })}
            style={{ width: "100px", marginRight: "10px" }}
          />
          <label>To: </label>
          <input
            type="number"
            value={selectedYearRange.to}
            onChange={(e) => setSelectedYearRange({ ...selectedYearRange, to: Number(e.target.value) })}
            style={{ width: "100px" }}
          />
        </div>

        {/* === Table === */}
        <h2>Records</h2>
        <div className="table-container">
          <table className="emigrants-table">
            <thead>
              <tr>
                <th>Year</th>
                {categories.map((key) => <th key={key}>{categoryLabels[key]}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((e) => (
                <tr key={e.id}>
                  <td>{e.year}</td>
                  {categories.map((k) => <td key={k}>{e[k] || 0}</td>)}
                  <td>
                    <button onClick={() => openEditModal(e)} className="btn-update">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10, gap: 10 }}>
            <button
              className="btn-add"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span style={{ alignSelf: "center" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-add"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        

     {/* === RANKING (Horizontal Bar Chart) === */}
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
    {[...new Set(ageData.map((r) => Number(r.year)).filter((y) => !isNaN(y)))].sort(
      (a, b) => a - b
    ).map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>

  {/* Age Group Filter */}
  <label>Age Group:</label>
  <select
    value={rankAgeGroup}
    onChange={(e) => setRankAgeGroup(e.target.value)}
    style={{ padding: "5px 8px", borderRadius: "6px" }}
  >
    <option value="all">All</option>
    {categories.map((c) => (
      <option key={c} value={c}>
        {categoryLabels[c]}
      </option>
    ))}
  </select>
</div>

<ResponsiveContainer width="100%" height={420}>
  {rankAgeGroup === "all" ? (
    // ✅ Show all age groups ranked (same as Occupation.jsx)
    <BarChart
      data={
        rankYear === "total"
          ? categories.map((key) => ({
              name: categoryLabels[key],
              value: ageData.reduce(
                (sum, d) => sum + (Number(d[key]) || 0),
                0
              ),
            }))
          : (() => {
              const yearRecord = ageData.find(
                (r) => Number(r.year) === Number(rankYear)
              );
              if (!yearRecord) return [];
              return categories.map((key) => ({
                name: categoryLabels[key],
                value: Number(yearRecord[key]) || 0,
              }));
            })()
      }
      layout="vertical"
      margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis
        dataKey="name"
        type="category"
        width={150}
        tick={{ fontSize: 12 }}
      />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" barSize={18}>
        {categories.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  ) : (
    // ✅ Show selected age group across all years (as bar chart, not line)
    <BarChart
      data={ageData
        .filter((r) => !Number.isNaN(Number(r.year)))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .map((r) => ({
          year: r.year,
          value: Number(r[rankAgeGroup]) || 0,
        }))}
      layout="horizontal"
      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        fill={COLORS[categories.indexOf(rankAgeGroup) % COLORS.length]}
        name={categoryLabels[rankAgeGroup]}
        barSize={25}
      />
    </BarChart>
  )}
</ResponsiveContainer>



      {/* === LINE CHART === */}
<h2 style={{ marginTop: "40px" }}>Trends (Age Group per Year)</h2>

{/* Filter beside chart title */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  }}
>
  <label>Filter Age Group:</label>
<select
  value={trendAgeGroup}
  onChange={(e) => setTrendAgeGroup(e.target.value)}
  style={{ padding: "5px 8px", borderRadius: "6px" }}
>
  <option value="all">All</option>
  {categories.map((cat) => (
    <option key={cat} value={cat}>
      {categoryLabels[cat]}
    </option>
  ))}
</select>

</div>

<ResponsiveContainer width="100%" height={400}>
  {trendAgeGroup === "all" ? (
    // === Show all age groups
    <LineChart
      data={ageData || []}
      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
     <Tooltip
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // sort by value descending
      const sorted = [...payload].sort((a, b) => b.value - a.value);
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "6px" }}>
            Year: {label}
          </p>
          {sorted.map((entry, i) => (
            <p key={i} style={{ margin: 0, color: entry.stroke }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }}
/>

      <Legend />
      {categories.map((cat, i) => (
        <Line
          key={cat}
          type="monotone"
          dataKey={cat}
          stroke={COLORS[i % COLORS.length]}
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name={categoryLabels[cat]}
        />
      ))}
    </LineChart>
  ) : (
    // === Filtered: one age group across years
    <LineChart
      data={
        (ageData || [])
          .filter((r) => !Number.isNaN(Number(r.year)))
          .sort((a, b) => Number(a.year) - Number(b.year))
          .map((r) => ({
            year: r.year,
            value: Number(r[trendAgeGroup]) || 0,
          })) || []
      }
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
        stroke={COLORS[categories.indexOf(trendAgeGroup) % COLORS.length]}
        strokeWidth={3}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
        name={categoryLabels[trendAgeGroup]}
      />
    </LineChart>
  )}
</ResponsiveContainer>

{/* === TREEMAP === */}
<h2 style={{ marginTop: "40px" }}>Age Group Composition (TreeMap)</h2>
<ResponsiveContainer width="100%" height={450}>
  {(() => {
    // Calculate total per category across all years
    const treeMapData = categories.map((cat) => {
      const total = ageData.reduce((sum, r) => sum + (Number(r[cat]) || 0), 0);
      return { name: categoryLabels[cat], size: total };
    });

    const grandTotal = treeMapData.reduce((sum, item) => sum + item.size, 0);

    return (
      <Treemap
        data={treeMapData}
        dataKey="size"
        nameKey="name"
        stroke="#fff"
        fill="#4A90E2"
      >
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null;
            const { name, size } = payload[0].payload;
            const pct = ((size / grandTotal) * 100).toFixed(2);
            return (
              <div
                style={{
                  background: "white",
                  border: "1px solid #ccc",
                  padding: "6px 8px",
                  borderRadius: "5px",
                }}
              >
                <strong>{name}</strong>
                <br />
                Count: {size.toLocaleString()}
                <br />
                Percent: {pct}%
              </div>
            );
          }}
        />
      </Treemap>
    );
  })()}
</ResponsiveContainer>

      </div>

      {/* === ADD MODAL === */}
<Modal
  isOpen={isModalOpen}
  onRequestClose={() => setIsModalOpen(false)}
  contentLabel="Add Age Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Add Age Record</h2>
  <div className="modal-form three-columns">
    {/* Define the exact order you want */}
    {[
      "year",
      "14below", 
      "1519",
      "2024",
      "2529",
      "3034", 
      "3539",
      "4044",
      "4549",
      "5054",
      "5559",
      "6064",
      "6569",
      "70Above",
      "notReported"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{categoryLabels[key]}</label>
        <input
          name={key}
          placeholder={categoryLabels[key]}
          value={form[key]}
          onChange={handleChange}
          className="form-input"
          type="number"
        />
      </div>
    ))}
    
    <div className="modal-actions full-width">
      <button
        onClick={async () => {
          await handleAdd();
          setIsModalOpen(false);
        }}
        className="btn-add"
      >
        Save
      </button>
      <button onClick={() => setIsModalOpen(false)} className="btn-cancel">
        Cancel
      </button>
    </div>
  </div>
</Modal>

      {/* === EDIT MODAL === */}
<Modal
  isOpen={isEditModalOpen}
  onRequestClose={closeEditModal}
  contentLabel="Edit Age Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Edit Age Record</h2>
  <div className="modal-form three-columns">
    {/* Same exact order */}
    {[
      "year",
      "14below", 
      "1519",
      "2024",
      "2529",
      "3034", 
      "3539",
      "4044",
      "4549",
      "5054",
      "5559",
      "6064",
      "6569",
      "70Above",
      "notReported"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{categoryLabels[key]}</label>
        <input
          name={key}
          value={form[key]}
          onChange={handleChange}
          className="form-input"
          type="number"
        />
      </div>
    ))}
    
    <div className="modal-actions full-width">
      <button onClick={handleEditSave} className="btn-add">
        Save Changes
      </button>
      <button onClick={closeEditModal} className="btn-cancel">
        Cancel
      </button>
    </div>
  </div>
</Modal>
    </DashboardLayout>
  );
}

export default Age;