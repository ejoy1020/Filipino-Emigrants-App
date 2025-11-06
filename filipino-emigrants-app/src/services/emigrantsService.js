// src/services/emigrantsService.js
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';


// ✅ Utility to get collection dynamically
const getCollection = (name) => collection(db, name || "emigrants");

// CREATE
export const addEmigrant = async (data, collectionName = "emigrants") => {
  await addDoc(getCollection(collectionName), data);
};

// READ
export const getEmigrants = async (collectionName = "emigrants") => {
  const snapshot = await getDocs(getCollection(collectionName));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// UPDATE
export const updateEmigrant = async (id, data, collectionName = "emigrants") => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
};

// DELETE
export const deleteEmigrant = async (id, collectionName = "emigrants") => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// BULK UPLOAD
export const bulkUploadEmigrants = async (records, collectionName = "emigrants") => {
  if (!Array.isArray(records) || records.length === 0) return;
  const batchSize = 400;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = records.slice(i, i + batchSize);
    chunk.forEach(rec => {
      const ref = doc(collection(db, collectionName));
      batch.set(ref, normalizeRecord(rec));
    });
    await batch.commit();
  }
};

// Normalize numeric fields
const normalizeRecord = (rec) => {
  const out = { ...rec };
  ['year','count','single','married','widower','separated','divorced','notReported','male','female','total'].forEach(k=>{
    if (out[k] !== undefined && out[k] !== '') {
      const n = Number(out[k]);
      out[k] = Number.isFinite(n) ? n : out[k];
    }
  });
  return out;
};

// Helper: client-side CSV/XLSX parsing using Papaparse/XLSX
// This function expects a File object (from <input type="file">)
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Universal CSV/XLSX parser
 * - Cleans headers (removes spaces, lowercases, converts to camelCase)
 * - Converts numeric strings to numbers
 * - Works for all datasets (not just Civil Status)
 */
/*
export const parseFileToRecords = (file) => {
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase();

    const normalizeHeader = (header) => {
      // Remove spaces and special chars, lowercase, camelCase for consistency
      return header
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .map((word, i) =>
          i === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    };

    const normalizeRecord = (record) => {
      const cleaned = {};
      Object.keys(record).forEach((key) => {
        const cleanKey = normalizeHeader(key);
        const value = record[key];

        // Convert numeric strings to numbers
        if (typeof value === "string" && value.trim() !== "" && !isNaN(value)) {
          cleaned[cleanKey] = Number(value);
        } else {
          cleaned[cleanKey] = value;
        }
      });
      return cleaned;
    };

    const handleData = (rows) => {
      const cleaned = rows.map(normalizeRecord);
      resolve(cleaned);
    };

    if (name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => handleData(results.data),
        error: (err) => reject(err),
      });
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        handleData(json);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Upload CSV or XLSX."));
    }
  });
};
*/
export const parseFileToRecords = (file) => {
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase();

    const normalizeHeader = (header) => {
      return header
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .map((word, i) =>
          i === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    };

    const normalizeRecord = (record) => {
      const cleaned = {};
      Object.keys(record).forEach((key) => {
        const cleanKey = normalizeHeader(key);
        const value = record[key];
        if (typeof value === "string" && value.trim() !== "" && !isNaN(value)) {
          cleaned[cleanKey] = Number(value);
        } else {
          cleaned[cleanKey] = value;
        }
      });
      return cleaned;
    };

    const handleData = (rows) => {
      // ✅ Detect if this is the "AllCountry" format
      const first = rows[0];
      const headers = Object.keys(first || {});
      const isAllCountry =
        headers[0]?.toLowerCase().includes("country") &&
        headers.some((h) => /^\d{4}$/.test(h));

      if (isAllCountry) {
        // Convert from wide to long format
        const converted = [];
        rows.forEach((row) => {
          const country = row["COUNTRY"] || row["country"];
          Object.keys(row).forEach((key) => {
            if (/^\d{4}$/.test(key)) {
              converted.push({
                country,
                year: Number(key),
                emigrants: Number(row[key]) || 0,
              });
            }
          });
        });
        resolve(converted);
      } else {
        // Default path (for other datasets)
        const cleaned = rows.map(normalizeRecord);
        resolve(cleaned);
      }
    };

    if (name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => handleData(results.data),
        error: (err) => reject(err),
      });
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        handleData(json);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Upload CSV or XLSX."));
    }
  });
};
