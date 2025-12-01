// src/App.jsx
import React, { useEffect, useState } from "react";
import { getEmigrants } from "./services/emigrantsService";
import DashboardLayout from "./layouts/DashboardLayout";
import "./Dashboard.css";

function App() {
  const [civilStatusData, setCivilStatusData] = useState([]);
  const [sexData, setSexData] = useState([]);
  const [educationData, setEducationData] = useState([]);
  const [occuData, setOccuData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [placeOfOriginData, setPlaceOfOriginData] = useState([]);
  const [majorCountryData, setMajorCountryData] = useState([]);
  const [allCountryData, setAllCountryData] = useState([]);
  const [activeSection, setActiveSection] = useState("civilStatus");

  useEffect(() => {
    const fetchData = async () => {
      const civil = await getEmigrants("civilStatus");
      setCivilStatusData(civil);

      const sex = await getEmigrants("sex");
      setSexData(sex);

      const educ = await getEmigrants("education");
      setEducationData(educ);

      const occu = await getEmigrants("occupation");
      setOccuData(occu);

      const age = await getEmigrants("age_data");
      setAgeData(age);

      const placeOfOrigin = await getEmigrants("place_of_origin");
      setPlaceOfOriginData(placeOfOrigin);

      const majorCountry = await getEmigrants("majorCountries");
      setMajorCountryData(majorCountry);

      const allCountry = await getEmigrants("allCountries");
      setAllCountryData(allCountry);
    };
    fetchData();
  }, []);

  // === Totals for civil_status ===
  const civilTotals = civilStatusData.reduce(
    (acc, cur) => {
      acc.single += cur.single || 0;
      acc.married += cur.married || 0;
      acc.widower += cur.widower || 0;
      acc.separated += cur.separated || 0;
      acc.divorced += cur.divorced || 0;
      return acc;
    },
    { single: 0, married: 0, widower: 0, separated: 0, divorced: 0 }
  );

  const civilTotalEmigrants = Object.values(civilTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for sex_data ===
  const sexTotals = sexData.reduce(
    (acc, cur) => {
      acc.male += cur.male || 0;
      acc.female += cur.female || 0;
      return acc;
    },
    { male: 0, female: 0 }
  );

  const sexTotalEmigrants = Object.values(sexTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for education ===
  const educationTotals = educationData.reduce(
    (acc, cur) => {
      acc.notOfSchoolingAge += cur.notOfSchoolingAge || 0;
      acc.noFormalEducation += cur.noFormalEducation || 0;
      acc.elementaryLevel += cur.elementaryLevel || 0;
      acc.elementaryGraduate += cur.elementaryGraduate || 0;
      acc.highSchoolLevel += cur.highSchoolLevel || 0;
      acc.highSchoolGraduate += cur.highSchoolGraduate || 0;
      acc.vocationalLevel += cur.vocationalLevel || 0;
      acc.vocationalGraduate += cur.vocationalGraduate || 0;
      acc.collegeLevel += cur.collegeLevel || 0;
      acc.collegeGraduate += cur.collegeGraduate || 0;
      acc.postGraduateLevel += cur.postGraduateLevel || 0;
      acc.nonFormalEducation += cur.nonFormalEducation || 0;
      acc.notReported += cur.notReported || 0;
      return acc;
    },
    {notOfSchoolingAge:0, noFormalEducation:0, elementaryLevel:0, elementaryGraduate:0, highSchoolLevel:0, highSchoolGraduate:0, vocationalLevel:0, vocationalGraduate:0, collegeLevel:0, collegeGraduate:0, postGraduateLevel:0, nonFormalEducation:0, notReported:0 }
  );

  const educationTotalEmigrants = Object.values(educationTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for occupation ===
  const occupationTotals = occuData.reduce(
    (acc, cur) => {
      acc.profTechRelated += cur.profTechRelated || 0;
      acc.managerial += cur.managerial || 0;
      acc.clerical += cur.clerical || 0;
      acc.sales += cur.sales || 0;
      acc.services += cur.services || 0;
      acc.agriculture += cur.agriculture || 0;
      acc.production += cur.production || 0;
      acc.armedForces += cur.armedForces || 0;
      acc.housewives += cur.housewives || 0;
      acc.retirees += cur.retirees || 0;
      acc.students += cur.students || 0;
      acc.minors += cur.minors || 0;
      acc.outOfSchoolYouth += cur.outOfSchoolYouth || 0;
      acc.noOccupationReported += cur.noOccupationReported || 0;
      return acc;
    },
    {profTechRelated:0, managerial:0, clerical:0, sales:0, services:0, agriculture:0, production:0, armedForces:0, housewives:0, retirees:0, students:0, minors:0, outOfSchoolYouth:0, noOccupationReported:0 }
  );

  const occupationTotalEmigrants = Object.values(occupationTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for age ===
  const ageTotals = ageData.reduce(
    (acc, cur) => {
      acc["14below"] += cur["14below"] || 0;
      acc["1519"] += cur["1519"] || 0;
      acc["2024"] += cur["2024"] || 0;
      acc["2529"] += cur["2529"] || 0;
      acc["3034"] += cur["3034"] || 0;
      acc["3539"] += cur["3539"] || 0;
      acc["4044"] += cur["4044"] || 0;
      acc["4549"] += cur["4549"] || 0;
      acc["5054"] += cur["5054"] || 0;
      acc["5559"] += cur["5559"] || 0;
      acc["6064"] += cur["6064"] || 0;
      acc["6569"] += cur["6569"] || 0;
      acc["70Above"] += cur["70Above"] || 0;
      acc["notReported"] += cur["notReported"] || 0;
      return acc;
    },
    {"14below": 0,"1519": 0,"2024": 0,"2529": 0,"3034": 0,"3539": 0,"4044": 0,"4549": 0,"5054": 0,"5559": 0,"6064": 0,"6569": 0,"70Above": 0, "notReported": 0}
  );

  const ageTotalEmigrants = Object.values(ageTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for place of origin ===
  const placeOfOriginTotals = placeOfOriginData.reduce(
    (acc, cur) => {
      acc.ncr += cur.ncr || 0;
      acc.car += cur.car || 0;
      acc.regioni += cur.regioni || 0;
      acc.regionii += cur.regionii || 0;
      acc.regioniii += cur.regioniii || 0;
      acc.regioniva += cur.regioniva || 0;
      acc.regionivb += cur.regionivb || 0;
      acc.regionv += cur.regionv || 0;
      acc.regionvi += cur.regionvi || 0;
      acc.regionvii += cur.regionvii || 0;
      acc.regionviii += cur.regionviii || 0;
      acc.regionix += cur.regionix || 0;
      acc.regionx += cur.regionx || 0;
      acc.regionxi += cur.regionxi || 0;
      acc.regionxii += cur.regionxii || 0;
      acc.regionxiii += cur.regionxiii || 0;
      acc.armm += cur.armm || 0;
      return acc;
    },
    {ncr: 0, car: 0, regioni: 0, regionii: 0, regioniii: 0, regioniva: 0, regionivb: 0, regionv: 0, regionvi: 0, regionvii: 0, regionviii: 0, regionix: 0, regionx: 0, regionxi: 0, regionxii: 0, regionxiii: 0, armm: 0}
  );

  const placeOfOriginTotalEmigrants = Object.values(placeOfOriginTotals).reduce((sum, val) => sum + val, 0);

  // === Totals for major countries ===
const majorCountryTotals = majorCountryData.reduce(
  (acc, cur) => {
    // Safe value extraction with validation
    const getSafeValue = (record, keys) => {
      for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          // Validate it's a reasonable number (less than 1 million)
          if (!isNaN(numValue) && numValue < 1000000) {
            return numValue;
          }
        }
      }
      return 0;
    };

    acc["USA"] += getSafeValue(cur, ["USA", "U S A", "usa"]);
    acc["CANADA"] += getSafeValue(cur, ["CANADA", "C A N A D A", "canada"]);
    acc["JAPAN"] += getSafeValue(cur, ["JAPAN", "J A P A N", "japan"]);
    acc["AUSTRALIA"] += getSafeValue(cur, ["AUSTRALIA", "A U S T R A L I A", "australia"]);
    acc["ITALY"] += getSafeValue(cur, ["ITALY", "I T A L Y", "italy"]);
    acc["NEW ZEALAND"] += getSafeValue(cur, ["NEW ZEALAND", "N E W Z E A L A N D", "newZealand"]);
    acc["UNITED KINGDOM"] += getSafeValue(cur, ["UNITED KINGDOM", "U N I T E D K I N G D O M", "unitedKingdom"]);
    acc["GERMANY"] += getSafeValue(cur, ["GERMANY", "G E R M A N Y", "germany"]);
    acc["SOUTH KOREA"] += getSafeValue(cur, ["SOUTH KOREA", "S O U T H K O R E A", "southKorea", "SOUTH_KOREA"]);
    acc["SPAIN"] += getSafeValue(cur, ["SPAIN", "S P A I N", "spain"]);
    acc["OTHERS"] += getSafeValue(cur, ["OTHERS", "O T H E R S", "others"]);
    
    return acc;
  },
  {
    "USA": 0,"CANADA": 0,"JAPAN": 0,"AUSTRALIA": 0,"ITALY": 0,"NEW ZEALAND": 0,
    "UNITED KINGDOM": 0,"GERMANY": 0,"SOUTH KOREA": 0,"SPAIN": 0,"OTHERS": 0
  }
);

  const majorCountryTotalEmigrants = Object.values(majorCountryTotals).reduce((sum, val) => sum + val, 0);

  // === All Countries Data - Calculate total emigrants ===
  const allCountryTotalEmigrants = allCountryData.reduce((total, record) => {
    // Sum all country values excluding id, year, and notReported fields
    const recordTotal = Object.keys(record).reduce((sum, key) => {
      if (key !== 'id' && key !== 'year' && key !== 'notReported' && typeof record[key] === 'number') {
        return sum + record[key];
      }
      return sum;
    }, 0);
    return total + recordTotal;
  }, 0);

  const allCountryTotals = {
    totalEmigrants: allCountryTotalEmigrants,
    totalCountries: allCountryData.length > 0 ? Object.keys(allCountryData[0]).filter(key => 
      key !== 'id' && key !== 'year' && key !== 'notReported'
    ).length : 0
  };

  const sectionData = {
    civilStatus: { 
      title: "Civil Status", 
      data: civilTotals, 
      totalEmigrants: civilTotalEmigrants,
      records: civilStatusData.length 
    },
    sexData: { 
      title: "Gender Data", 
      data: sexTotals, 
      totalEmigrants: sexTotalEmigrants,
      records: sexData.length 
    },
    education: { 
      title: "Education Data", 
      data: educationTotals, 
      totalEmigrants: educationTotalEmigrants,
      records: educationData.length 
    },
    occupation: { 
      title: "Occupation Data", 
      data: occupationTotals, 
      totalEmigrants: occupationTotalEmigrants,
      records: occuData.length 
    },
    ageData: { 
      title: "Age Data", 
      data: ageTotals, 
      totalEmigrants: ageTotalEmigrants,
      records: ageData.length 
    },
    placeOfOrigin: { 
      title: "Place of Origin", 
      data: placeOfOriginTotals, 
      totalEmigrants: placeOfOriginTotalEmigrants,
      records: placeOfOriginData.length 
    },
    majorCountries: { 
      title: "Major Countries", 
      data: majorCountryTotals, 
      totalEmigrants: majorCountryTotalEmigrants,
      records: majorCountryData.length 
    },
    allCountries: { 
      title: "All Countries", 
      data: allCountryTotals, 
      totalEmigrants: allCountryTotalEmigrants,
      records: allCountryData.length 
    }
  };

  const renderActiveSection = () => {
    const section = sectionData[activeSection];
    return (
      <div className="section-content">
        <h2>{section.title}</h2>
        <div className="summary-grid">
          {Object.entries(section.data)
            .filter(([key]) => key.toLowerCase() !== "totalemigrants" && key.toLowerCase() !== "total")
            .map(([key, value]) => (
              <div key={key} className="summary-box">
                <h3>{key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
                <p>{value.toLocaleString()}</p>
              </div>
          ))}

          <div className="summary-box total">
            <h3>Total Emigrants</h3>
            <p>{section.totalEmigrants.toLocaleString()}</p>
          </div>
          <div className="summary-box total">
            <h3>Total Records</h3>
            <p>{section.records.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="head-title">
        <div className="left">
          <h1>Filipino Emigrants Dashboard</h1>
          <ul className="breadcrumb">
            <li><a href="#">Dashboard</a></li>
            <li><span className="custom-icon icon-chevron"></span></li>
            <li className="active"><a href="#">Overview</a></li>
          </ul>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Navigation Tabs */}
        <div className="section-nav">
          {Object.keys(sectionData).map(sectionKey => (
            <button
              key={sectionKey}
              className={`nav-btn ${activeSection === sectionKey ? 'active' : ''}`}
              onClick={() => setActiveSection(sectionKey)}
            >
              {sectionData[sectionKey].title}
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        {renderActiveSection()}
      </div>
    </DashboardLayout>
  );
}

export default App;