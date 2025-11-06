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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DashboardLayout from "./layouts/DashboardLayout";
import Modal from "react-modal";
import { Treemap } from "recharts";

Modal.setAppElement("#root");

function Occu() {
  const COLLECTION = "occupation";

  // main data + form
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    year: "",
    profTechRelated: "",
    managerial: "",
    clerical: "",
    sales: "",
    service: "",
    agriculture: "",
    production: "",
    armedForces: "",
    housewives: "",
    retirees: "",
    students: "",
    minors: "",
    outOfSchoolYouth: "",
    noOccupationReported: "",
  });

  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });
  const [selectedOccuCategory, setSelectedOccuCategory] = useState("all");


  const [barYear, setBarYear] = useState("all");
  const [rankYear, setRankYear] = useState("total");
  const [barCategory, setBarCategory] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pieYear, setPieYear] = useState("total");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedLineOccu, setSelectedLineOccu] = useState("all");


  // category setup
  const categories = Object.keys(form).filter((k) => k !== "year");
  const categoryLabels = {
    profTechRelated: "Prof'l, Tech'l, & Related Workers",
    managerial: "Managerial",
    clerical: "Clerical",
    sales: "Sales",
    service: "Service",
    agriculture: "Agriculture",
    production: "Production",
    armedForces: "Armed Forces",
    housewives: "Housewives",
    retirees: "Retirees",
    students: "Students",
    minors: "Minors",
    outOfSchoolYouth: "Out of School Youth",
    noOccupationReported: "No Occupation Reported",
  };

  // blue gradient palette
  const generateGradientColors = (dataLength) => {
    const colors = [];
    for (let i = 0; i < dataLength; i++) {
      const intensity = Math.floor(255 - (i / dataLength) * 180);
      colors.push(`rgb(${intensity - 100}, ${intensity - 50}, ${intensity})`);
    }
    return colors;
  };
  const COLORS = generateGradientColors(categories.length);

  // === Fetch data ===
  const fetchData = async () => {
    const data = await getEmigrants(COLLECTION);
    const normalized = data.map((d) => ({ ...d, year: Number(d.year) || d.year }));
    normalized.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    setRecords(normalized);

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
  }, []);

  // === CRUD ===
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    await addEmigrant(
      { ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v) || 0])) },
      COLLECTION
    );
    setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
    fetchData();
  };

  const openEditModal = (record) => {
  setEditId(record.id);
  
  // Create a new form object with only the data fields (exclude id)
  const formData = {};
  Object.keys(form).forEach(key => {
    formData[key] = record[key] || "";
  });
  
  setForm(formData);
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

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
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

  // === Filters & pagination ===
  const filteredData = records.filter((r) => {
  const year = Number(r.year) || 0;
  return year >= selectedYearRange.from && year <= selectedYearRange.to;
});

const itemsPerPage = 10;
const totalPages = Math.ceil(filteredData.length / itemsPerPage);
const paginatedData = filteredData.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);


  // === Chart data ===
  const graphFilteredData = records.filter((r) => {
    if (selectedYear === "all") return true;
    return Number(r.year) === Number(selectedYear);
  });
  const chartData = [...graphFilteredData].sort((a, b) => Number(a.year) - Number(b.year));
  const displayedCategories = selectedCategory === "all" ? categories : [selectedCategory];

  const legendPayload = displayedCategories.map((cat, i) => ({
    value: categoryLabels[cat],
    type: "square",
    id: cat,
    color: COLORS[i % COLORS.length],
  }));

  const totalsAll = graphFilteredData.reduce((acc, cur) => {
    categories.forEach((k) => (acc[k] = (acc[k] || 0) + (Number(cur[k]) || 0)));
    return acc;
  }, {});

  const compositionData =
    pieYear === "total"
      ? categories.map((k) => ({ name: categoryLabels[k], value: totalsAll[k] || 0 }))
      : (() => {
          const rec = records.find((r) => Number(r.year) === Number(pieYear)) || {};
          return categories.map((k) => ({ name: categoryLabels[k], value: Number(rec[k]) || 0 }));
        })();

  const rankingData = [...compositionData].sort((a, b) => b.value - a.value);

  // === TreeMap Data ===
// === TreeMap Total Data (sum of all years) ===
const treeMapTotalData = categories.map((cat) => {
  const total = records.reduce((sum, r) => sum + (Number(r[cat]) || 0), 0);
  return { name: categoryLabels[cat], size: total };
});

// Compute available years
const years = Array.from(
  new Set(records.map((r) => Number(r.year)).filter((y) => !isNaN(y)))
).sort((a, b) => a - b);

// === Function to get filtered chart data ===
const getFilteredChartData = (category) => {
  if (category === "all") return records;
  return records.map((r) => ({
    year: r.year,
    [category]: Number(r[category]) || 0,
  }));
};

// === Ranking data generator ===
const getRankingData = (year) => {
  if (year === "total") {
    return categories.map((cat) => ({
      name: categoryLabels[cat],
      value: records.reduce((sum, r) => sum + (Number(r[cat]) || 0), 0),
    }));
  }
  const record = records.find((r) => Number(r.year) === Number(year));
  if (!record) return [];
  return categories.map((cat) => ({
    name: categoryLabels[cat],
    value: Number(record[cat]) || 0,
  }));
};


// Legend for ranking chart
const rankingLegendPayload = categories.map((cat, i) => ({
  value: categoryLabels[cat],
  type: "square",
  id: cat,
  color: COLORS[i % COLORS.length],
}));




  // === Render ===
  return (
    <DashboardLayout activeMenu="Occupation">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants by Occupation</h1>
            <ul className="breadcrumb">
              <li><a href="#">Dashboard</a></li>
              <li><span className="custom-icon icon-chevron"></span></li>
              <li className="active"><a href="#">Occupation</a></li>
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

          {/* Year Filter */}
            <div style={{ marginTop: "20px" }}>
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


          {/* === TABLE === */}
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
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="btn-add">
                Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="btn-add">
                Next
              </button>
            </div>
          </div>

 {/* === TREND (LINE CHART) === */}
<h2>Trends (Occupation per Year)</h2>

{/* Filter for Line Chart */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  }}
>
  <label>Occupation Category:</label>
  <select
    value={selectedOccuCategory}
    onChange={(e) => setSelectedOccuCategory(e.target.value)}
    style={{ padding: "6px 10px", borderRadius: "6px" }}
  >
    <option value="all">All</option>
    {categories.map((cat) => (
      <option key={cat} value={cat}>
        {categoryLabels[cat]}
      </option>
    ))}
  </select>
</div>

{/* Line Chart */}
<ResponsiveContainer width="100%" height={400}>
  <LineChart
    data={records
      .filter((r) => !Number.isNaN(Number(r.year)))
      .sort((a, b) => Number(a.year) - Number(b.year))}
    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
  >
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
                  {`${categoryLabels[entry.dataKey] || entry.dataKey}: ${entry.value.toLocaleString()}`}
                </p>
              ))}
            </div>
          );
        }
        return null;
      }}
    />
    <Legend
      payload={
        selectedOccuCategory === "all"
          ? categories.map((cat, i) => ({
              value: categoryLabels[cat],
              type: "square",
              id: cat,
              color: COLORS[i % COLORS.length],
            }))
          : [
              {
                value: categoryLabels[selectedOccuCategory],
                type: "square",
                id: selectedOccuCategory,
                color:
                  COLORS[categories.indexOf(selectedOccuCategory) %
                  COLORS.length],
              },
            ]
      }
    />

    {/* Lines */}
    {(selectedOccuCategory === "all"
      ? categories
      : [selectedOccuCategory]
    ).map((cat, i) => (
      <Line
        key={cat}
        type="monotone"
        dataKey={cat}
        stroke={COLORS[i % COLORS.length]}
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    ))}
  </LineChart>
</ResponsiveContainer>



{/* === RANKING (Horizontal Bar Chart) === */}
<h2>Ranking (Horizontal Bar Chart)</h2>

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


  {/* Occupation Filter */}
  <label>Occupation Category:</label>
  <select
    value={selectedOccuCategory}
    onChange={(e) => setSelectedOccuCategory(e.target.value)}
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

<ResponsiveContainer width="100%" height={400}>
  {selectedOccuCategory === "all" ? (
    // === Default: Show all categories for chosen year (ranking view)
    <BarChart
      data={getRankingData(rankYear)}
      layout="vertical"
      margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={220} />
      <Tooltip />
      <Legend payload={rankingLegendPayload.slice(0, 14)} />
      <Bar dataKey="value" barSize={18}>
        {getRankingData(rankYear).map((entry, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  ) : (
    // === Filtered: Show chosen occupation across all years
    <BarChart
  data={records
    .filter((r) => !Number.isNaN(Number(r.year)))
    .sort((a, b) => Number(a.year) - Number(b.year))
    .map((r) => ({
      year: r.year,
      value: Number(r[selectedOccuCategory]) || 0,
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
        fill={COLORS[categories.indexOf(selectedOccuCategory) % COLORS.length]}
        name={categoryLabels[selectedOccuCategory]}
        barSize={30}
      />
    </BarChart>
  )}
</ResponsiveContainer>




{/* === TREEMAP WITH PERCENTAGES === */}
<h2 style={{ marginTop: "50px" }}>Overall Employment Composition (TreeMap)</h2>
<ResponsiveContainer width="100%" height={450}>
  {(() => {
    // Calculate total per category across all years
    const employedCats = categories.filter(
      (c) =>
        ![
          "housewives",
          "retirees",
          "students",
          "minors",
          "outOfSchoolYouth",
          "refugees",
          "noOccupationReported",
        ].includes(c)
    );
    const unemployedCats = [
      "housewives",
      "retirees",
      "students",
      "minors",
      "outOfSchoolYouth",
      "refugees",
      "noOccupationReported",
    ];

    const employedTotal = employedCats.reduce(
      (sum, c) => sum + records.reduce((s, r) => s + (Number(r[c]) || 0), 0),
      0
    );
    const unemployedTotal = unemployedCats.reduce(
      (sum, c) => sum + records.reduce((s, r) => s + (Number(r[c]) || 0), 0),
      0
    );
    const grandTotal = employedTotal + unemployedTotal;

    const employedPercent = ((employedTotal / grandTotal) * 100).toFixed(1);
    const unemployedPercent = ((unemployedTotal / grandTotal) * 100).toFixed(1);

    const data = [
      {
        name: `Employed (${employedPercent}%)`,
        children: employedCats.map((c) => ({
          name: categoryLabels[c],
          size: records.reduce((s, r) => s + (Number(r[c]) || 0), 0),
        })),
      },
      {
        name: `Unemployed (${unemployedPercent}%)`,
        children: unemployedCats.map((c) => ({
          name: categoryLabels[c],
          size: records.reduce((s, r) => s + (Number(r[c]) || 0), 0),
        })),
      },
    ];

    return (
      <Treemap
        data={data}
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
        contentLabel="Add Occupation Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Add Occupation Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
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
            <button onClick={async () => { await handleAdd(); setIsModalOpen(false); }} className="btn-add">Save</button>
            <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* === EDIT MODAL === */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        contentLabel="Edit Occupation Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Edit Occupation Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key.replace(/([A-Z])/g, " $1")}</label>
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
            <button onClick={() => setIsEditModalOpen(false)} className="btn-cancel">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Occu;
