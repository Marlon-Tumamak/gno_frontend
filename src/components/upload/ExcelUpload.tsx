'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface UploadResponse {
  message: string;
  created_count: number;
  parsing_stats?: {
    drivers_extracted: number;
    routes_extracted: number;
    loads_extracted: number;
  };
  errors: string[];
}

interface PreviewData {
  headers: string[];
  rows: (string | number | undefined)[][];
}

interface BackendPreviewData {
  row_number: number;
  account_number: string;
  account_type: string;
  truck_type: string;
  plate_number: string | null;
  description: string;
  debit: number;
  credit: number;
  final_total: number;
  remarks: string;
  reference_number: string | null;
  date: string | null;
  quantity: number | null;
  price: number | null;
  driver: string | null;
  route: string | null;
  front_load: string | null;
  back_load: string | null;
}

interface BackendPreviewResponse {
  preview_data: BackendPreviewData[];
  parsing_stats: {
    drivers_extracted: number;
    routes_extracted: number;
    loads_extracted: number;
    total_rows: number;
  };
  message: string;
}

const uploadTypes = [
  {
    value: 'repair-maintenance',
    label: 'Repair & Maintenance',
    endpoint: 'repair-maintenance/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'Final Total', 'Remarks', 'Reference Number', 'Date'
    ]
  },
  {
    value: 'insurance',
    label: 'Insurance',
    endpoint: 'insurance/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date', 'Unit Cost'
    ]
  },
  {
    value: 'fuel',
    label: 'Fuel & Oil',
    endpoint: 'fuel/upload/',
    columns: [
      'Account', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date',
      'Liters', 'Price', 'Driver', 'Route', 'Front_Loa', 'Back_Load'
    ]
  },
  {
    value: 'tax',
    label: 'Tax Account',
    endpoint: 'tax/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date',
      'Price', 'Quantity'
    ]
  },
  {
    value: 'allowance',
    label: 'Allowance Account',
    endpoint: 'allowance/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date'
    ]
  },
  {
    value: 'income',
    label: 'Income Account',
    endpoint: 'income/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date',
      'Driver', 'Route', 'Quantity', 'Price', 'Front_Loa', 'Back_Load'
    ]
  },
  {
    value: 'trucking',
    label: 'Trucking Account',
    endpoint: 'trucking/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date',
      'Quantity', 'Price', 'Driver', 'Route', 'Front_Load', 'Back_Load'
    ]
  },
  {
    value: 'salary',
    label: 'Salary Account',
    endpoint: 'salary/upload/',
    columns: [
      'AccountNumber', 'AccountType', 'TruckType', 'PlateNumber', 'Description',
      'Debit', 'Credit', 'FinalTotal', 'Remarks', 'ReferenceNumber', 'Date',
      'Quantity', 'Price', 'Driver', 'Route', 'Front_Load', 'Back_Load'
    ]
  }
];

export default function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('repair-maintenance');
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [backendPreviewData, setBackendPreviewData] = useState<BackendPreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fix hydration error by ensuring component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-6"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResponse(null);
      setError(null);
      setPreviewData(null);
      setBackendPreviewData(null);
      setSearchTerm('');
    }
  };

  const handleUploadTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadType(e.target.value);
    setResponse(null);
    setError(null);
    setPreviewData(null);
    setBackendPreviewData(null);
    setSearchTerm('');
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setPreviewing(true);
    setError(null);
    setResponse(null);
    setBackendPreviewData(null);

    try {
      // For trucking accounts, use backend preview endpoint to get parsed data
      if (uploadType === 'trucking') {
        const formData = new FormData();
        formData.append('file', file);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const previewUrl = `${apiUrl}/api/v1/trucking/preview/`;

        const res = await fetch(previewUrl, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          setBackendPreviewData(data);
        } else {
          setError(data.error || 'Preview failed');
        }
      } else {
        // For other upload types, use client-side preview
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: 'MM/DD/YYYY'
        });

        if (jsonData.length === 0) {
          setError('The Excel file is empty');
          setPreviewing(false);
          return;
        }

        // First row is headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

        setPreviewData({ headers, rows });
      }
    } catch (err) {
      setError('Failed to parse Excel file. Please make sure it\'s a valid Excel file.');
      console.error('Preview error:', err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    const selectedType = uploadTypes.find(type => type.value === uploadType);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const uploadUrl = `${apiUrl}/api/v1/${selectedType?.endpoint}`;

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: Could not connect to server');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatCellValue = (value: any, column: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    // Format currency columns
    if (['Debit', 'Credit', 'FinalTotal', 'Final Total', 'Price'].includes(column)) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(numValue);
      }
    }
    
    // Format date columns - show in MM/DD/YYYY format
    if (column === 'Date') {
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
      }
      if (typeof value === 'string') {
        // Try to parse and format the date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
          });
        }
        return value; // Return as-is if can't parse
      }
    }
    
    return String(value);
  };

  // Filter backend preview data based on search term - search across ALL columns
  const filteredBackendData = backendPreviewData?.preview_data.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search across all columns in the row
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  }) || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Upload Excel File
          </h2>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-white text-xl">📤</span>
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="upload-type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Upload Type
          </label>
          <select
            id="upload-type"
            value={uploadType}
            onChange={handleUploadTypeChange}
            className="block w-full px-4 py-3 border-2 border-orange-500 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-600 transition-all duration-200"
          >
            {uploadTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Excel File (.xlsx or .xls)
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-orange-500 file:to-orange-600 file:text-white hover:file:from-orange-600 hover:file:to-orange-700 file:transition-all file:duration-200"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {!previewData && !backendPreviewData ? (
          <button
            onClick={handlePreview}
            disabled={!file || previewing}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
              !file || previewing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800'
            }`}
          >
            {previewing ? 'Loading Preview...' : 'Preview Data'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
            <button
              onClick={() => {
                setPreviewData(null);
                setBackendPreviewData(null);
                setSearchTerm('');
              }}
              disabled={uploading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200 disabled:opacity-50"
            >
              Cancel / Choose Different File
            </button>
          </div>
        )}

        {/* Backend Preview Data Table for Trucking Accounts */}
        {backendPreviewData && (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                📋 Data Preview (with Parsed Fields)
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Review the parsed data below before confirming the upload. Total rows: {backendPreviewData.parsing_stats.total_rows}
              </p>
              <p className="text-xs text-blue-600 mb-2">
                📜 Showing all {backendPreviewData.preview_data.length} entries. Scroll down to see more data.
              </p>
              <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                <p className="text-green-800 font-semibold text-sm">📊 Parsing Statistics:</p>
                <ul className="text-green-700 text-xs mt-1">
                  <li>• Drivers extracted: {backendPreviewData.parsing_stats.drivers_extracted}</li>
                  <li>• Routes extracted: {backendPreviewData.parsing_stats.routes_extracted}</li>
                  <li>• Loads extracted: {backendPreviewData.parsing_stats.loads_extracted}</li>
                </ul>
              </div>
            </div>
            
            {/* Search Box */}
            <div className="mb-4">
              <div className="relative">
                  <input
                    type="text"
                    placeholder="Search across all columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500"
                  />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {searchTerm && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredBackendData.length} of {backendPreviewData?.preview_data.length} entries
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Show All
                  </button>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {backendPreviewData.preview_data.length > 0 && Object.keys(backendPreviewData.preview_data[0]).map((column, index) => (
                        <th
                          key={column}
                          className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            index < Object.keys(backendPreviewData.preview_data[0]).length - 1 ? 'border-r border-gray-200' : ''
                          }`}
                        >
                          {column === 'row_number' ? '#' : column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBackendData.map((row, rowIndex) => (
                      <tr key={row.row_number || rowIndex} className="hover:bg-gray-50">
                        {Object.entries(row).map(([column, value], colIndex) => (
                          <td
                            key={column}
                            className={`px-4 py-2 whitespace-nowrap text-sm border-r border-gray-200 ${
                              colIndex === Object.keys(row).length - 1 ? 'border-r-0' : ''
                            }`}
                          >
                            {column === 'row_number' ? (
                              <span className="text-gray-500 font-medium">{value}</span>
                            ) : column === 'driver' && value ? (
                              <span className="text-green-700 font-semibold">{value}</span>
                            ) : column === 'route' && value ? (
                              <span className="text-blue-700 font-semibold">{value}</span>
                            ) : column === 'front_load' && value ? (
                              <span className="text-purple-700 font-semibold">{value}</span>
                            ) : column === 'back_load' && value ? (
                              <span className="text-orange-700 font-semibold">{value}</span>
                            ) : column === 'remarks' && value ? (
                              <div className="max-w-xs truncate text-gray-900" title={String(value)}>
                                {String(value)}
                              </div>
                            ) : column === 'final_total' && value ? (
                              <span className="text-gray-900">₱{Number(value).toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-900">{value || '-'}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Preview Data Table */}
        {previewData && (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                📋 Data Preview
              </h3>
              <p className="text-sm text-blue-700">
                Review the data below before confirming the upload. Total rows: {previewData.rows.length}
              </p>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        #
                      </th>
                      {previewData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200 font-medium">
                          {rowIndex + 1}
                        </td>
                        {previewData.headers.map((header, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                          >
                            {row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '' 
                              ? formatCellValue(row[colIndex], header)
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Success Response */}
        {response && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {response.message}
            </h3>
            <div className="text-sm text-green-700">
              <p>✅ Successfully created: {response.created_count} records</p>
              {response.errors && response.errors.length > 0 && (
                <p className="text-red-600">❌ Errors: {response.errors.length}</p>
              )}
              {response.parsing_stats && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-xl">
                  <p className="text-blue-800 font-semibold">📊 Parsing Statistics:</p>
                  <ul className="text-blue-700 text-xs mt-1">
                    <li>• Drivers extracted: {response.parsing_stats.drivers_extracted}</li>
                    <li>• Routes extracted: {response.parsing_stats.routes_extracted}</li>
                    <li>• Loads extracted: {response.parsing_stats.loads_extracted}</li>
                  </ul>
                </div>
              )}
            </div>
            {response.errors && response.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-700 mb-2">Error Details:</h4>
                <ul className="list-disc list-inside text-sm text-red-600 max-h-40 overflow-y-auto">
                  {response.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Excel Format Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Excel File Format for {uploadTypes.find(type => type.value === uploadType)?.label}
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            Your Excel file should have the following columns (exact names):
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            {uploadTypes.find(type => type.value === uploadType)?.columns.map((column, index) => (
              <div key={index} className="flex items-center">
                <span className="font-semibold">{column}</span>
                {column === 'AccountNumber' && <span className="ml-2 text-xs">- Account number</span>}
                {column === 'AccountType' && <span className="ml-2 text-xs">- Account type</span>}
                {column === 'TruckType' && <span className="ml-2 text-xs">- Truck type</span>}
                {column === 'PlateNumber' && <span className="ml-2 text-xs">- Plate number</span>}
                {column === 'Description' && <span className="ml-2 text-xs">- Description</span>}
                {column === 'Debit' && <span className="ml-2 text-xs">- Debit amount</span>}
                {column === 'Credit' && <span className="ml-2 text-xs">- Credit amount</span>}
                {column === 'FinalTotal' && <span className="ml-2 text-xs">- Final total</span>}
                {column === 'Final Total' && <span className="ml-2 text-xs">- Final total</span>}
                {column === 'Remarks' && <span className="ml-2 text-xs">- Remarks</span>}
                {column === 'ReferenceNumber' && <span className="ml-2 text-xs">- Reference number</span>}
                {column === 'Reference Number' && <span className="ml-2 text-xs">- Reference number</span>}
                {column === 'Date' && <span className="ml-2 text-xs">- Date (MM/DD/YYYY)</span>}
                    {column === 'Liters' && <span className="ml-2 text-xs">- Liters</span>}
                    {column === 'Price' && <span className="ml-2 text-xs">- Price per liter</span>}
                    {column === 'Driver' && <span className="ml-2 text-xs">- Driver name</span>}
                    {column === 'Route' && <span className="ml-2 text-xs">- Route</span>}
                    {column === 'Quantity' && <span className="ml-2 text-xs">- Quantity</span>}
                    {column === 'Unit Cost' && <span className="ml-2 text-xs">- Unit cost</span>}
                    {column === 'Front_Loa' && <span className="ml-2 text-xs">- Front load</span>}
                    {column === 'Front_Load' && <span className="ml-2 text-xs">- Front load</span>}
                    {column === 'Back_Load' && <span className="ml-2 text-xs">- Back load</span>}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

