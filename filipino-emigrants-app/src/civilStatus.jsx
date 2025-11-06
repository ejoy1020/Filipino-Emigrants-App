import React, { useEffect, useState } from "react";
import {
  addEmigrant,
  getEmigrants,
  updateEmigrant,
  deleteEmigrant,
  parseFileToRecords,
  bulkUploadEmigrants
} from './services/emigrantsService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import { useNavigate } from "react-router-dom";
import './App.css';
import DashboardLayout from "./layouts/DashboardLayout";
import Modal from "react-modal";
Modal.setAppElement("#root");



function CivilStatus() {
  const [emigrants, setEmigrants] = useState([]);
  const [form, setForm] = useState({
    year: "",
    single: "",
    married: "",
    widower: "",
    separated: "",
    divorced: "",
    notReported: ""
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
const closeModal = () => setIsModalOpen(false);
const [selectedCivilStatus, setSelectedCivilStatus] = useState("all");

  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });
  const [selectedPieYear, setSelectedPieYear] = useState("all");
  const [selectedBarYear, setSelectedBarYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [selectedLineCivilStatus, setSelectedLineCivilStatus] = useState("all");

  const navigate = useNavigate();
  
  const COLLECTION = "civilStatus";

  // Categories in logical order
  const categories = ["single", "married", "widower", "separated", "divorced", "notReported"];
  const categoryLabels = {
    single: "Single",
    married: "Married",
    widower: "Widower",
    separated: "Separated",
    divorced: "Divorced",
    notReported: "Not Reported"
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

  const COLORS = generateGradientColors(6);

  // 🔹 Fetch data (fixed for notReported casing)
const fetchData = async () => {
  const data = await getEmigrants(COLLECTION);

  // Normalize field names so "notReported" always exists
  const cleaned = data.map(e => ({
    ...e,
    notReported: Number(
      e.notReported ?? e.notreported ?? e["not Reported"] ?? e["not_reported"] ?? 0
    ),
    single: Number(e.single ?? 0),
    married: Number(e.married ?? 0),
    widower: Number(e.widower ?? 0),
    separated: Number(e.separated ?? 0),
    divorced: Number(e.divorced ?? 0),
  }));

  const sorted = [...cleaned].sort((a, b) => a.year - b.year);

  console.log("✅ Sample record after cleaning:", cleaned[0]);
  setEmigrants(sorted);
};

  // 🔹 Filter by year range
  const filteredData = emigrants.filter((e) => {
    const year = Number(e.year) || 0;
    return year >= selectedYearRange.from && year <= selectedYearRange.to;
  });

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );



  const openEditModal = (record) => {
    setEditId(record.id);
    setForm({
      year: record.year || "",
      single: record.single || "",
      married: record.married || "",
      widower: record.widower || "",
      separated: record.separated || "",
      divorced: record.divorced || "",
      notReported: record.notReported || "",
    });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditId(null);
  };

 
  useEffect(() => {
    fetchData();
  }, []);



  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    await addEmigrant({
      year: Number(form.year) || 0,
      single: Number(form.single) || 0,
      married: Number(form.married) || 0,
      widower: Number(form.widower) || 0,
      separated: Number(form.separated) || 0,
      divorced: Number(form.divorced) || 0,
      notReported: Number(form.notReported) || 0
    }, COLLECTION);
    setForm({ year: "", single: "", married: "", widower: "", separated: "", divorced: "", notReported: "" });
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };

  const handleEditSave = async () => {
  if (!editId) return;
  await updateEmigrant(editId, {
    year: Number(form.year) || 0,
    single: Number(form.single) || 0,
    married: Number(form.married) || 0,
    widower: Number(form.widower) || 0,
    separated: Number(form.separated) || 0,
    divorced: Number(form.divorced) || 0,
    notReported: Number(form.notReported) || 0,
  }, COLLECTION); // ← Add COLLECTION as third parameter
  closeEditModal();
  fetchData();
};


  const handleUpdate = async (id) => {
    const newYear = prompt("Enter new year:");
    if (newYear) {
      await updateEmigrant(id, { year: Number(newYear) });
      fetchData();
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // ✅ NEW: File Upload Handlers
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleBulkUpload = async () => {
  if (!file) return alert("Please select a CSV or XLSX file first.");
  setLoadingUpload(true);
  try {
    // 1️⃣ Parse CSV or Excel file
    const records = await parseFileToRecords(file);

    // 2️⃣ Upload all records to Firestore (use the correct collection!)
    await bulkUploadEmigrants(records, COLLECTION);

    // 3️⃣ Refresh table AFTER upload completes
    await fetchData();

    alert("Upload successful!");
    setFile(null); // optional: reset file input
  } catch (err) {
    alert("Upload failed: " + err.message);
  } finally {
    setLoadingUpload(false);
  }
};



  

  // Compute totals for bar chart (in category order)
  const totals = filteredData.reduce((acc, cur) => {
    acc.single += cur.single || 0;
    acc.married += cur.married || 0;
    acc.widower += cur.widower || 0;
    acc.separated += cur.separated || 0;
    acc.divorced += cur.divorced || 0;
    acc.notReported += cur.notReported ?? cur.notreported ?? 0;
    return acc;
  }, { single: 0, married: 0, widower: 0, separated: 0, divorced: 0, notReported: 0 });

  const chartData = categories.map((cat, i) => ({
    category: categoryLabels[cat],
    count: totals[cat],
    fill: COLORS[i]
  }));

  const pieData = categories.map((cat, i) => ({
    name: categoryLabels[cat],
    value: totals[cat]
  }));

  const trendData = filteredData
  .map(e => {
    const single = Number(e.single) || 0;
    const married = Number(e.married) || 0;
    const widower = Number(e.widower) || 0;
    const separated = Number(e.separated) || 0;
    const divorced = Number(e.divorced) || 0;
    const notReported = Number(e.notReported ?? e.notreported) || 0;


    return {
      year: Number(e.year) || 0,
      total: single + married + widower + separated + divorced + notReported,
    };
  })
  .sort((a, b) => a.year - b.year);



  const scatterData = filteredData.map(e => ({
    x: e.single + e.married,
    y: e.divorced + e.widower,
    year: e.year
  }));

  return (
  <DashboardLayout activeMenu="CivilStatus">
    <main>
      <div className='head-title'>
        <div className='left'>
          <h1>Registered Filipino Emigrants by Civil Status</h1>
          <ul className='breadcrumb'>
            <li><a href='#'>Dashboard</a></li>
            <li><span className="custom-icon icon-chevron"></span></li>
            <li className="active"><a href="#">Civil Status</a></li>
          </ul>
        </div>
      </div>

      <div className="crud-content">
        {/* === CRUD FORM === */}
        <div className="form-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <button onClick={openModal} className="btn-add">Add Record</button>

  {/* Upload beside Add */}
  <div>
    <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
    <button onClick={handleBulkUpload} disabled={loadingUpload} className="btn-add">
      {loadingUpload ? "Uploading..." : "Upload CSV/XLSX"}
    </button>
  </div>
</div>




        {/* ✅ Year Filter */}
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

        {/* === TABLE === */}
        <h2>Records</h2>
        <div className="table-container">
          <table className="emigrants-table">
            <thead>
              <tr>
                <th>Year</th>
                {categories.map(cat => (
                  <th key={cat}>{categoryLabels[cat]}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(e => (
                <tr key={e.id}>
                  <td>{e.year || 0}</td>
                  {categories.map(cat => (
                    <td key={cat}>{e[cat] || 0}</td>
                  ))}
                  <td>
                    <button onClick={() => openEditModal(e)} className="btn-update">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          {/* Pagination Controls */}
<div
  style={{
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  }}
>
  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((prev) => prev - 1)}
    className="btn-add"
  >
    Prev
  </button>
  <span>
    Page {currentPage} of {totalPages}
  </span>
  <button
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage((prev) => prev + 1)}
    className="btn-add"
  >
    Next
  </button>
</div>


        </div>

        {/* === GRAPHS === */}

{/* Filters for Grouped Bar Chart */}
<div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "20px" }}>
  {/* Year Selector */}
  <div>
    <label style={{ marginRight: "10px" }}>Select Year for Grouped Bar Chart:</label>
    <select
      value={selectedBarYear}
      onChange={(e) => setSelectedBarYear(e.target.value)}
      style={{ padding: "5px", borderRadius: "5px" }}
    >
      <option value="all">Show All</option>
      <option value="total">Show Total</option>
      {[...new Set(emigrants.map(e => e.year))].sort((a, b) => a - b).map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>

  {/* Civil Status Selector */}
  <div>
    <label style={{ marginRight: "10px" }}>Select Civil Status:</label>
    <select
      value={selectedCivilStatus}
      onChange={(e) => setSelectedCivilStatus(e.target.value)}
      style={{ padding: "5px", borderRadius: "5px" }}
    >
      <option value="all">All Categories</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
      ))}
    </select>
  </div>
</div>


{/* Filtered data for Grouped Bar */}
{(() => {
  let barData = [];

  if (selectedBarYear === "all") {
    // Show all years for selected category (if any)
    barData = emigrants.map(e => {
      const entry = { year: e.year };
      if (selectedCivilStatus === "all") {
        categories.forEach(cat => entry[cat] = e[cat] || 0);
      } else {
        entry[selectedCivilStatus] = e[selectedCivilStatus] || 0;
      }
      return entry;
    }).sort((a, b) => a.year - b.year);
  } else if (selectedBarYear === "total") {
    // Combine all years into one total
    barData = categories.map(cat => ({
      category: categoryLabels[cat],
      count: emigrants.reduce((sum, e) => sum + (e[cat] || 0), 0)
    }));
  } else {
    // Filter by single year
    barData = emigrants.filter(e => e.year === Number(selectedBarYear));
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        {selectedBarYear === "total" ? (
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Total Emigrants">
              {barData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {(selectedCivilStatus === "all"
              ? categories
              : [selectedCivilStatus]
            ).map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                fill={COLORS[i % COLORS.length]}
                name={categoryLabels[cat]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
})()}


{/* ✅ Trends (Line Chart with Civil Status Filter) */}
<h2 style={{ marginTop: "50px" }}>Trends (Civil Status per Year)</h2>

{/* 🔹 Filter for Line Chart */}
<div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "20px" }}>
  <label style={{ marginRight: "10px" }}>Select Civil Status:</label>
  <select
    value={selectedLineCivilStatus}
    onChange={(e) => setSelectedLineCivilStatus(e.target.value)}
    style={{ padding: "5px", borderRadius: "5px" }}
  >
    <option value="all">All Civil Status</option>
    {categories.map((cat) => (
      <option key={cat} value={cat}>
        {categoryLabels[cat]}
      </option>
    ))}
  </select>
</div>

<ResponsiveContainer width="100%" height={300}>
  <LineChart
    width={730}
    height={250}
    data={[...emigrants].sort((a, b) => a.year - b.year)}
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
                background: "white",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <p style={{ fontWeight: "bold", marginBottom: "6px" }}>Year: {label}</p>
              {sorted.map((entry, i) => (
                <div key={i} style={{ color: entry.color }}>
                  {categoryLabels[entry.dataKey] || entry.dataKey}:{" "}
                  <strong>{entry.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          );
        }
        return null;
      }}
    />
    <Legend />

    {/* 🟦 Show all lines OR only selected one */}
    {(selectedLineCivilStatus === "all"
      ? categories
      : [selectedLineCivilStatus]
    ).map((cat, i) => (
      <Line
        key={cat}
        type="monotone"
        dataKey={cat}
        stroke={COLORS[i % COLORS.length]}
        name={categoryLabels[cat]}
        strokeWidth={2}
      />
    ))}
  </LineChart>
</ResponsiveContainer>


      </div>
    </main>

    {/*Add Modal*/}
<Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Add Civil Status Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Add Civil Status Record</h2>
  <div className="modal-form three-columns" style={{ maxHeight: "70vh", overflowY: "auto" }}>
    {[
      "year",
      "single", 
      "married",
      "widower",
      "separated",
      "divorced",
      "notReported"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{categoryLabels[key] || key}</label>
        <input
          name={key}
          placeholder={categoryLabels[key] || key}
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
          closeModal();
        }}
        className="btn-add"
      >
        Save
      </button>
      <button onClick={closeModal} className="btn-cancel">
        Cancel
      </button>
    </div>
  </div>
</Modal>

      {/* === EDIT MODAL === */}
<Modal
  isOpen={isEditModalOpen}
  onRequestClose={closeEditModal}
  contentLabel="Edit Record"
  className="modal"
  overlayClassName="overlay"
>
  <h2>Edit Civil Status Record</h2>
  <div className="modal-form three-columns" style={{ maxHeight: "70vh", overflowY: "auto" }}>
    {[
      "year",
      "single", 
      "married",
      "widower",
      "separated",
      "divorced",
      "notReported"
    ].map((key) => (
      <div key={key} className="modal-field">
        <label>{categoryLabels[key] || key}</label>
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
      

  </DashboardLayout>
);

}

export default CivilStatus;