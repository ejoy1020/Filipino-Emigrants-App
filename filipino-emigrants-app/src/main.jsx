import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './App.jsx'; // make sure the filename matches
import Sex from "./sex";
import CivilStatus from "./civilStatus.jsx";
import Educ from "./educ.jsx";
import Age from "./age.jsx";
import AllCountries from './allCountry.jsx';
import PlaceOfOrigin from './placeOfOrigin.jsx';
import MajorCountry from './majorCountry.jsx';
import Occu from './occu.jsx';




ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />       
      <Route path="/sex" element={<Sex />} />     
      <Route path="/civilStatus" element={<CivilStatus />} />
      <Route path="/educ" element={<Educ />} />
      <Route path="/age" element={<Age />} />
      <Route path="/allCountries" element={<AllCountries />} />
      <Route path="/placeOfOrigin" element={<PlaceOfOrigin />} />
      <Route path="/majorCountry" element={<MajorCountry />} /> 
      <Route path="/occu" element={<Occu />} />


    </Routes>
  </BrowserRouter>
);