'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DriverDetail {
  reference_number: string;
  account_number: string;
  date: string;
  amount: number;
  load_type: 'front_load' | 'back_load';
  route: string;
  description: string;
}

interface Driver {
  driver_name: string;
  front_load_amount: number;
  back_load_amount: number;
  allowance_amount: number;
  total_loads: number;
  details: DriverDetail[];
}

interface DriversSummary {
  drivers: Driver[];
  total_drivers: number;
  summary: {
    total_front_load: number;
    total_back_load: number;
    total_allowance: number;
    total_loads: number;
  };
}

export default function DriversPage() {
  const [driversData, setDriversData] = useState<DriversSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  useEffect(() => {
    fetchDriversData();
  }, []);

  const fetchDriversData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://gno-backend.onrender.com/api/v1/drivers/summary/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers data');
      }
      
      const data = await response.json();
      setDriversData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverDetails = (driverName: string) => {
    setExpandedDriver(expandedDriver === driverName ? null : driverName);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-4">Error</div>
              <p className="text-gray-700">{error}</p>
              <button
                onClick={fetchDriversData}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!driversData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-700">No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Drivers Summary</h1>
              <p className="text-gray-600">Overview of drivers' front load, back load, and allowance amounts</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={fetchDriversData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Drivers</div>
            <div className="text-2xl font-bold text-gray-900">{driversData.total_drivers}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Front Load</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(driversData.summary.total_front_load)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Back Load</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(driversData.summary.total_back_load)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Allowance</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(driversData.summary.total_allowance)}
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Drivers List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Front Load
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Back Load
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Loads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driversData.drivers.map((driver) => {
                  const totalAmount = driver.front_load_amount + driver.back_load_amount + driver.allowance_amount;
                  return (
                    <>
                      <tr key={driver.driver_name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.driver_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 font-medium">
                            {formatCurrency(driver.front_load_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600 font-medium">
                            {formatCurrency(driver.back_load_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-600 font-medium">
                            {formatCurrency(driver.allowance_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {driver.total_loads}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleDriverDetails(driver.driver_name)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            {expandedDriver === driver.driver_name ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {expandedDriver === driver.driver_name && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="bg-white rounded-lg border p-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Transaction Details for {driver.driver_name}
                              </h3>
                              
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ref #
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Account #
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Type
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Amount
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Route
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Description
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {driver.details.map((detail, index) => (
                                      <tr key={index}>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {detail.reference_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {detail.account_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {detail.date}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            detail.load_type === 'front_load' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {detail.load_type.replace('_', ' ')}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                          {formatCurrency(detail.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {detail.route}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {detail.description}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
