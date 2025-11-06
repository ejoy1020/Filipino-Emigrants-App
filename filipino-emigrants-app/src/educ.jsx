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

Modal.setAppElement("#root");

function Educ() {
  const COLLECTION = "education";

  // main data + form
  const [emigrants, setEmigrants] = useState([]);
  const [form, setForm] = useState({
    year: "",
    notOfSchoolingAge: "",
    noFormalEducation: "",
    elementaryLevel: "",
    elementaryGraduate: "",
    highSchoolLevel: "",
    highSchoolGraduate: "",
    vocationalLevel: "",
    vocationalGraduate: "",
    collegeLevel: "",
    collegeGraduate: "",
    postGraduateLevel: "",
    postGraduate: "",
    nonFormalEducation: "",
    notReported: "",
  });

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [barYear, setBarYear] = useState("all");
  const [barCategory, setBarCategory] = useState("all");
  const [areaYear, setAreaYear] = useState("all");
  const [areaCategory, setAreaCategory] = useState("all");
  const [lineYear, setLineYear] = useState("all");
  const [lineCategory, setLineCategory] = useState("all");
  const [rankYear, setRankYear] = useState("total");



  // Table year-range filter (separate from graph filters)
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");

  // Graph filters
  const [selectedYear, setSelectedYear] = useState("all"); // "all" or a year
  const [selectedCategory, setSelectedCategory] = useState("all"); // "all" or a category
  const [pieYear, setPieYear] = useState("total"); // "total" or a year for pie chart
  const [selectedEducCategory, setSelectedEducCategory] = useState("all");
  const [selectedLineEduc, setSelectedLineEduc] = useState("all");

  // categories and labels
  const categories = Object.keys(form).filter((k) => k !== "year");
  const categoryLabels = {
    notOfSchoolingAge: "Not of Schooling Age",
    noFormalEducation: "No Formal Education",
    elementaryLevel: "Elementary Level",
    elementaryGraduate: "Elementary Graduate",
    highSchoolLevel: "High School Level",
    highSchoolGraduate: "High School Graduate",
    vocationalLevel: "Vocational Level",
    vocationalGraduate: "Vocational Graduate",
    collegeLevel: "College Level",
    collegeGraduate: "College Graduate",
    postGraduateLevel: "Post Graduate Level",
    postGraduate: "Post Graduate",
    nonFormalEducation: "Non-Formal Education",
    notReported: "Not Reported",
  };
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Generate gradient colors from light to dark blue based on data values
  const generateGradientColors = (dataLength) => {
    const colors = [];
    for (let i = 0; i < dataLength; i++) {
      const intensity = Math.floor(255 - (i / dataLength) * 180);
      colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
    }
    return colors;
  };

  // color palette (used across all charts) - blue gradient
  const COLORS = generateGradientColors(14);

  
  // fetch and sort by year
  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    // make sure year stored as number where possible, and sort
    const normalized = data.map((d) => ({ ...d, year: Number(d.year) || d.year }));
    normalized.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    setEmigrants(normalized);

    // initialize table range defaults on first load if not set
    if ((fromYear === "" || toYear === "") && normalized.length > 0) {
      const years = normalized.map((r) => Number(r.year)).filter((y) => !Number.isNaN(y));
      if (years.length > 0) {
        const min = Math.min(...years);
        const max = Math.max(...years);
        setFromYear(String(min));
        setToYear(String(max));
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line

  // CRUD handlers unchanged
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    await addEmigrant(
      {
        ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v) || 0])),
      },
      COLLECTION
    );
    setForm(Object.fromEntries(Object.keys(form).map((key) => [key, ""])));
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };

  const openEditModal = (record) => {
  setEditId(record.id);
  setForm({
    year: record.year || "",
    notOfSchoolingAge: record.notOfSchoolingAge || "",
    noFormalEducation: record.noFormalEducation || "",
    elementaryLevel: record.elementaryLevel || "",
    elementaryGraduate: record.elementaryGraduate || "",
    highSchoolLevel: record.highSchoolLevel || "",
    highSchoolGraduate: record.highSchoolGraduate || "",
    vocationalLevel: record.vocationalLevel || "",
    vocationalGraduate: record.vocationalGraduate || "",
    collegeLevel: record.collegeLevel || "",
    collegeGraduate: record.collegeGraduate || "",
    postGraduateLevel: record.postGraduateLevel || "",
    postGraduate: record.postGraduate || "",
    nonFormalEducation: record.nonFormalEducation || "",
    notReported: record.notReported || "",
  });
  setIsEditModalOpen(true);
};

  const handleEditSave = async () => {
    if (!editId) return;
    await updateEmigrant(
      editId,
      Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v) || 0])),
      COLLECTION
    );
    setIsEditModalOpen(false);
    setEditId(null);
    fetchData();
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleBulkUpload = async () => {
    if (!file) return alert("Please select a CSV or XLSX file first.");
    setLoadingUpload(true);
    try {
      const records = await parseFileToRecords(file);
      await bulkUploadEmigrants(records, COLLECTION);
      alert("Upload successful!");
      fetchData();
      setFile(null);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  // ----------------------
  // Table filtering (by year range) - separate from graph filters
  // ----------------------
  const fromYearNum = fromYear === "" ? -Infinity : Number(fromYear);
  const toYearNum = toYear === "" ? Infinity : Number(toYear);

  const tableData = emigrants.filter((r) => {
    const yr = Number(r.year);
    return !Number.isNaN(yr) && yr >= fromYearNum && yr <= toYearNum;
  });

  // ----------------------
  // Graph data (affected by graph filters only)
  // ----------------------
  const graphFilteredData = emigrants.filter((r) => {
    if (selectedYear === "all") return true;
    const yr = Number(r.year);
    return !Number.isNaN(yr) && yr === Number(selectedYear);
  });

  // ensure chart data sorted by year
  const chartData = [...graphFilteredData].sort((a, b) => Number(a.year) - Number(b.year)).map((e) => ({
    ...e,
    year: Number(e.year),
  }));

  // totals used by pie and ranking (based on graphFilteredData OR pieYear)
  // For pie we also support pieYear === 'total' vs a specific year
  const totalsAll = graphFilteredData.reduce((acc, cur) => {
    categories.forEach((k) => {
      acc[k] = (acc[k] || 0) + (Number(cur[k]) || 0);
    });
    return acc;
  }, {});

  // Composition for Pie: if pieYear === 'total', use totals across graphFilteredData, else per chosen year
  const compositionData =
    pieYear === "total"
      ? categories.map((k) => ({ name: categoryLabels[k], value: totalsAll[k] || 0 }))
      : (() => {
          const rec = emigrants.find((r) => Number(r.year) === Number(pieYear));
          const base = rec || {};
          return categories.map((k) => ({ name: categoryLabels[k], value: Number(base[k]) || 0 }));
        })();

  // Ranking data (compositionData sorted) — copy so we don't mutate original
  const rankingData = [...compositionData].sort((a, b) => b.value - a.value);

  // displayedCategories for area/line/grouped bar: either all or selected
  const displayedCategories = selectedCategory === "all" ? categories : [selectedCategory];

  // Legend payload for grouped charts to ensure legend colors match
  const legendPayload = displayedCategories.map((cat, i) => ({
    value: categoryLabels[cat],
    type: "square",
    id: cat,
    color: COLORS[i % COLORS.length],
  }));

  // Legend payload for ranking (use composition categories)
  const rankingLegendPayload = compositionData.map((entry, i) => ({
    value: entry.name,
    type: "square",
    id: entry.name,
    color: COLORS[i % COLORS.length],
  }));

  // Pagination logic
const totalPages = Math.ceil(tableData.length / rowsPerPage);
const paginatedData = tableData.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);

const handlePrevPage = () => {
  if (currentPage > 1) setCurrentPage(currentPage - 1);
};
const handleNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
};

const years = [...new Set(emigrants.map(r => Number(r.year)).filter(y => !isNaN(y)))].sort((a, b) => a - b);

const getFilteredChartData = (year, category) => {
  const filtered = emigrants.filter(r => (year === "all" ? true : Number(r.year) === Number(year)));
  return filtered.sort((a, b) => Number(a.year) - Number(b.year));
};

const getDisplayedCategories = (category) => (category === "all" ? categories : [category]);

const getRankingData = (year) => {
  const rec = year === "total"
    ? emigrants.reduce((acc, cur) => {
        categories.forEach((k) => {
          acc[k] = (acc[k] || 0) + (Number(cur[k]) || 0);
        });
        return acc;
      }, {})
    : emigrants.find((r) => Number(r.year) === Number(year)) || {};

  return categories.map((k) => ({
    name: categoryLabels[k],
    value: Number(rec[k]) || 0,
  })).sort((a, b) => b.value - a.value);
};

  // ----------------------
  // Render
  // ----------------------
  return (
    <DashboardLayout activeMenu="Education">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants by Educational Attainment</h1>
            <ul className="breadcrumb">
              <li><a href="#">Dashboard</a></li>
              <li><span className="custom-icon icon-chevron"></span></li>
              <li className="active"><a href="#">Education</a></li>
            </ul>
          </div>
        </div>

        <div className="crud-content">
          {/* === ACTIONS === */}
          <div className="form-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setIsModalOpen(true)} className="btn-add">Add Record</button>
            <div>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
              <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
                {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Filter by Year Range</h3> 
            <label>From: </label>
              <input
                type="number"
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                style={{ width: "100px", marginRight: "10px" }}
              />

              <label>To: </label>
              <input
                type="number"
                value={toYear}
                onChange={(e) => setToYear(e.target.value)}
                style={{ width: "100px" }}
              />
            
          </div>

          {/* === TABLE with From-To Year Range (separate from graph filters) === */}
          <h2>Records</h2>

          

          <div className="table-container">
            <table className="emigrants-table">
              <thead>
                <tr>
                  {Object.keys(form).map((key) => (
                    <th key={key}>{key.replace(/([A-Z])/g, " $1")}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                 {paginatedData.map((e) => (
                  <tr key={e.id}>
                    {Object.keys(form).map((key) => (
                      <td key={key}>{e[key]}</td>
                    ))}
                    <td>
                      <button onClick={() => openEditModal(e)} className="btn-update">Edit</button>
                      <button onClick={() => handleDelete(e.id)} className="btn-delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 10, gap: 10 }}>
  <button onClick={handlePrevPage} disabled={currentPage === 1} className="btn-add">
    Prev
  </button>
  <span>Page {currentPage} of {totalPages}</span>
  <button onClick={handleNextPage} disabled={currentPage === totalPages} className="btn-add">
    Next
  </button>
</div>

          </div>


         

          {/* === RANKING (Horizontal Bar Chart) === */}
{/* Filters for Ranking Bar Chart */}
<div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
  {/* Year Selector */}
  <label>Year:</label>
 <select
  value={rankYear}
  onChange={(e) => setRankYear(e.target.value)}
  style={{ padding: "5px 8px", borderRadius: "6px" }}
>
  <option value="total">Total (All Years)</option>
  {[...new Set(emigrants.map((r) => Number(r.year)).filter((y) => !Number.isNaN(y)))].sort((a, b) => a - b)
    .map((y) => (
      <option key={y} value={y}>{y}</option>
    ))}
</select>


  {/* Education Filter */}
  <label>Education Category:</label>
  <select
    value={selectedEducCategory}
    onChange={(e) => setSelectedEducCategory(e.target.value)}
    style={{ padding: "5px 8px", borderRadius: "6px" }}
  >
    <option value="all">All</option>
    {categories.map((c) => (
      <option key={c} value={c}>{categoryLabels[c]}</option>
    ))}
  </select>
</div>
<ResponsiveContainer width="100%" height={400}>
  {selectedEducCategory === "all" ? (
    // === Default: Show all categories (like before)
    <BarChart
      data={getRankingData(rankYear)}
      layout="vertical"
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={220} />
      <Tooltip />
      <Legend payload={rankingLegendPayload.slice(0, 14)} />
      <Bar dataKey="value">
        {getRankingData(rankYear).map((entry, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  ) : (
    // === Filtered: Show chosen education category across all years ===
    <BarChart
      data={emigrants
        .filter((r) => !Number.isNaN(Number(r.year)))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .map((r) => ({
          year: r.year,
          value: Number(r[selectedEducCategory]) || 0,
        }))
      }
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        fill={COLORS[categories.indexOf(selectedEducCategory) % COLORS.length]}
        name={categoryLabels[selectedEducCategory]}
      />
    </BarChart>
  )}
</ResponsiveContainer>


{/* === LINE CHART === */}
<h2 style={{ marginTop: "40px" }}>Trend (Line Chart)</h2>

{/* 🔹 Filter for Line Chart */}
<div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
  <label>Education Category:</label>
  <select
    value={selectedLineEduc}
    onChange={(e) => setSelectedLineEduc(e.target.value)}
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

<ResponsiveContainer width="100%" height={350}>
  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="year" />
    <YAxis />
    <Tooltip
      content={({ active, payload, label }) => {
        if (active && payload && payload.length) {
          const sorted = [...payload].sort((a, b) => b.value - a.value);
          return (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <p style={{ marginBottom: "6px", fontWeight: "bold" }}>{`Year: ${label}`}</p>
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

    {/* 🟦 Show all or selected education line(s) */}
    {(selectedLineEduc === "all" ? categories : [selectedLineEduc]).map((cat, i) => (
      <Line
        key={cat}
        type="monotone"
        dataKey={cat}
        stroke={COLORS[i % COLORS.length]}
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
        name={categoryLabels[cat]}
      />
    ))}
  </LineChart>
</ResponsiveContainer>

{/* === TREEMAP === */}
<h2 style={{ marginTop: "40px" }}>Educational Attainment Composition (TreeMap)</h2>
<ResponsiveContainer width="100%" height={450}>
  {(() => {
    // Calculate total per category across all years
    const treeMapData = categories.map((cat) => {
      const total = emigrants.reduce((sum, r) => sum + (Number(r[cat]) || 0), 0);
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
      </main>

      {/* === ADD MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add Education Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Add Educational Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
              <input
                name={key}
                placeholder={key}
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
        onRequestClose={() => setIsEditModalOpen(false)}
        contentLabel="Edit Education Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Edit Educational Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
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
            <button onClick={() => setIsEditModalOpen(false)} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Educ;