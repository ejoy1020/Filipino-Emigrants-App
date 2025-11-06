import React, { useEffect, useState } from "react";
import {
  addEmigrant,
  getEmigrants,
  updateEmigrant,
  deleteEmigrant,
  parseFileToRecords,
  bulkUploadEmigrants
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
  Line
} from "recharts";

import "./App.css";
import DashboardLayout from "./layouts/DashboardLayout";

import Modal from "react-modal";


Modal.setAppElement("#root");

function Sex() {
  const COLLECTION = "sex";

  const [sexData, setSexData] = useState([]);
  const [form, setForm] = useState({
    year: "",
    male: "",
    female: ""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [selectedBarYear, setSelectedBarYear] = useState("all");
  const [selectedSex, setSelectedSex] = useState("all");
  const [selectedPieYear, setSelectedPieYear] = useState("combined");

  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedYearRange, setSelectedYearRange] = useState({ from: 1981, to: 2050 });
  const [selectedLineSex, setSelectedLineSex] = useState("all");


  

  // YEAR FILTER
  const filteredData = sexData.filter((e) => {
    const year = Number(e.year) || 0;
    return year >= selectedYearRange.from && year <= selectedYearRange.to;
  });

  const withRatio = filteredData.map((d) => {
    const ratio = d.female > 0 ? ((d.male / d.female) * 100).toFixed(1) : "N/A";
    return { ...d, ratio };
  });

  // Pagination logic (add before return)
const itemsPerPage = 10;
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(withRatio.length / itemsPerPage);

const paginatedData = withRatio.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);



  const openEditModal = (record) => {
    setEditId(record.id);
    setForm({
      year: record.year || "",
      male: record.male || "",
      female: record.female || ""
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditId(null);
  };

  
  const fetchData = async () => {
  const data = await getEmigrants(COLLECTION);
  const filtered = data
    .filter((item) => item.male !== undefined && item.female !== undefined)
    .sort((a, b) => a.year - b.year);
  setSexData(filtered);
};


  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    await addEmigrant(
      {
        year: Number(form.year) || 0,
        male: Number(form.male) || 0,
        female: Number(form.female) || 0
      },
      COLLECTION
    );
    setForm({ year: "", male: "", female: "" });
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteEmigrant(id, COLLECTION);
    fetchData();
  };

  const handleEditSave = async () => {
    if (!editId) return;
    await updateEmigrant(
      editId,
      {
        year: Number(form.year) || 0,
        male: Number(form.male) || 0,
        female: Number(form.female) || 0
      },
      COLLECTION
    );
    closeEditModal();
    fetchData();
  };

  

  // FILE UPLOAD HANDLERS
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleBulkUpload = async () => {
  if (!file) return alert("Please select a CSV or XLSX file first.");
  setLoadingUpload(true);
  try {
    let records = await parseFileToRecords(file);

    // ✅ Normalize keys and convert to numbers
    records = records.map((r) => ({
      year: Number(r.year) || 0,
      male: Number(r.male) || 0,
      female: Number(r.female) || 0,
    }));

    await bulkUploadEmigrants(records, COLLECTION);
    alert("Upload successful!");
    await fetchData(); // ✅ ensure refresh after upload
  } catch (err) {
    alert("Upload failed: " + err.message);
  } finally {
    setLoadingUpload(false);
  }
};

const chartData = withRatio
  .map((d) => ({
    year: Number(d.year),
    male: Number(d.male),
    female: Number(d.female),
  }))
  .filter(d => !isNaN(d.year) && !isNaN(d.male) && !isNaN(d.female))
  .sort((a, b) => a.year - b.year);


  return (
    <DashboardLayout activeMenu="Sex">
      <main>
        <div className="head-title">
          <div className="left">
            <h1>Registered Filipino Emigrants by Sex</h1>
            <ul className="breadcrumb">
              <li><a href="#">Dashboard</a></li>
              <li><span className="custom-icon icon-chevron"></span></li>
              <li className="active"><a href="#">Sex</a></li>
            </ul>
          </div>
        </div>

        <div className="crud-content">
          {/* === ACTIONS === */}
          <div className="form-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={openModal} className="btn-add">Add Record</button>

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

          {/* TABLE */}
          <h2>Records</h2>
          <div className="table-container">
            <table className="emigrants-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Sex Ratio (m per 100f)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((e) => (
                  <tr key={e.id}>
                    <td>{e.year || 0}</td>
                    <td>{e.male || 0}</td>
                    <td>{e.female || 0}</td>
                    <td>{e.ratio !== "N/A" ? `${e.ratio}m / 100f` : "N/A"}</td>
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

          {/* === CHARTS === */}

{/* ✅ Side-by-Side Bar Chart with Year Filter */}
<h2 style={{ marginTop: "40px" }}>Side-by-Side Bar Chart (Male vs Female per Year)</h2>

{/* Filters for Bar Chart */}
<div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "20px" }}>
  {/* Year Selector */}
  <div>
    <label style={{ marginRight: "10px" }}>Select Year for Bar Chart:</label>
    <select
      value={selectedBarYear}
      onChange={(e) => setSelectedBarYear(e.target.value)}
      style={{ padding: "5px", borderRadius: "5px" }}
    >
      <option value="all">Show All</option>
      {[...new Set(sexData.map((d) => d.year))].sort((a, b) => a - b).map((year) => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>

  {/* Sex Selector */}
  <div>
    <label style={{ marginRight: "10px" }}>Select Sex:</label>
    <select
      value={selectedSex}
      onChange={(e) => setSelectedSex(e.target.value)}
      style={{ padding: "5px", borderRadius: "5px" }}
    >
      <option value="all">All</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
    </select>
  </div>
</div>


{(() => {
  let barData = [];

  if (selectedBarYear === "all") {
    // Show all years
    barData = sexData.map((d) => {
      const entry = { year: d.year };
      if (selectedSex === "all") {
        entry.male = d.male;
        entry.female = d.female;
      } else {
        entry[selectedSex] = d[selectedSex];
      }
      return entry;
    });
  } else {
    // Single year
    barData = sexData.filter((d) => d.year === Number(selectedBarYear));
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={barData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        {(selectedSex === "all"
          ? ["male", "female"]
          : [selectedSex]
        ).map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={key === "male" ? "#4A90E2" : "#F6A623"}
            name={key.charAt(0).toUpperCase() + key.slice(1)}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
})()}


{/* ✅ Pie Chart Section */}
<h2 style={{ marginTop: "50px" }}>Sex Composition (Pie Chart)</h2>

<div style={{ marginBottom: "10px" }}>
  <label style={{ marginRight: "10px" }}>Select Year for Pie Chart:</label>
  <select
    value={selectedPieYear}
    onChange={(e) => setSelectedPieYear(e.target.value)}
    style={{ padding: "5px", borderRadius: "5px" }}
  >
    <option value="combined">Total Combined</option>
    {[...new Set(sexData.map((d) => d.year))].sort((a, b) => a - b).map((year) => (
      <option key={year} value={year}>{year}</option>
    ))}
  </select>
</div>

{(() => {
  let pieData = [];
  if (selectedPieYear === "combined") {
    const totalMale = sexData.reduce((sum, d) => sum + (d.male || 0), 0);
    const totalFemale = sexData.reduce((sum, d) => sum + (d.female || 0), 0);
    pieData = [
      { name: "Male", value: totalMale },
      { name: "Female", value: totalFemale },
    ];
  } else {
    const record = sexData.find((d) => d.year === Number(selectedPieYear));
    if (record) {
      pieData = [
        { name: "Male", value: record.male },
        { name: "Female", value: record.female },
      ];
    }
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          outerRadius={120}
          label
        >
          <Cell fill="#4A90E2" />
          <Cell fill="#F6A623" />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
})()}

{/* ✅ Line Chart: Trend Over Time with Sex Filter */}
<h2 style={{ marginTop: "50px" }}>Trend Over Time (Male vs Female)</h2>

{/* 🔹 Filter for Line Chart */}
<div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "20px" }}>
  <label style={{ marginRight: "10px" }}>Select Sex:</label>
  <select
    value={selectedLineSex}
    onChange={(e) => setSelectedLineSex(e.target.value)}
    style={{ padding: "5px", borderRadius: "5px" }}
  >
    <option value="all">All</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </select>
</div>

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
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
                  {entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}:{" "}
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

    {/* 🟦 Show all or selected line */}
    {(selectedLineSex === "all" ? ["male", "female"] : [selectedLineSex]).map((key) => (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={key === "male" ? "#4A90E2" : "#F6A623"}
        name={key.charAt(0).toUpperCase() + key.slice(1)}
        strokeWidth={2}
      />
    ))}
  </LineChart>
</ResponsiveContainer>



      </div>
      
      </main>

      {/* === ADD MODAL === */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Sex Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Add Sex Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key}</label>
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
        contentLabel="Edit Sex Record"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Edit Sex Record</h2>
        <div className="modal-form three-columns">
          {Object.keys(form).map((key) => (
            <div key={key} className="modal-field">
              <label>{key}</label>
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

export default Sex;
