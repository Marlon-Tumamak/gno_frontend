'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SkeletonLoader from '@/components/SkeletonLoader';

interface TruckingRecord {
  id: number;
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
  date: string;
  quantity: number | null;
  price: number | null;
  driver: string | null;
  route: string | null;
  front_load: string | null;
  back_load: string | null;
}

interface DriverDetail {
  reference_number: string;
  account_number: string;
  date: string;
  amount: number;
  load_type: 'front_load' | 'back_load' | 'fuel_and_oil' | 'allowance';
  route: string;
  description: string;
  account_type: string;
}

interface Driver {
  driver_name: string;
  front_load_amount: number;
  back_load_amount: number;
  fuel_and_oil_amount: number;
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
    total_fuel_and_oil: number;
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/trucking/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucking data');
      }
      
      const truckingData: TruckingRecord[] = await response.json();
      
      // Process trucking data to create driver summary
      const processedData = processTruckingData(truckingData);
      setDriversData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processTruckingData = (data: TruckingRecord[]): DriversSummary => {
    // Group by driver
    const driverMap = new Map<string, Driver>();

    data.forEach((record) => {
      // Get driver name from either string or object
      const driverNameStr = typeof record.driver === 'object' && record.driver?.name ? record.driver.name : (record.driver || '');
      
      // Skip records without driver or with empty driver
      if (!driverNameStr || driverNameStr.trim() === '' || driverNameStr.toLowerCase() === 'nan') {
        return;
      }

      const driverName = driverNameStr.trim();

      // Initialize driver if not exists
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, {
          driver_name: driverName,
          front_load_amount: 0,
          back_load_amount: 0,
          fuel_and_oil_amount: 0,
          allowance_amount: 0,
          total_loads: 0,
          details: [],
        });
      }

      const driver = driverMap.get(driverName)!;
      const finalTotal = parseFloat(record.final_total.toString());

      // Check if this is a Hauling Income (load-related)
      const isHaulingIncome = record.account_type.toLowerCase().includes('hauling income');
      
      if (isHaulingIncome) {
        // For Hauling Income, check front_load and back_load
        const hasFrontLoad = record.front_load && 
          record.front_load.trim() !== '' && 
          record.front_load.toLowerCase() !== 'nan' &&
          record.front_load.toLowerCase() !== 'n' &&
          record.front_load.toLowerCase() !== 'none';
        
        const hasBackLoad = record.back_load && 
          record.back_load.trim() !== '' && 
          record.back_load.toLowerCase() !== 'nan' &&
          record.back_load.toLowerCase() !== 'none';

        if (hasFrontLoad && hasBackLoad) {
          // Both loads present - split amount
          const halfAmount = finalTotal / 2;
          driver.front_load_amount += halfAmount;
          driver.back_load_amount += halfAmount;
          driver.total_loads += 2;

          // Add detail for front load
          driver.details.push({
            reference_number: record.reference_number || 'N/A',
            account_number: record.account_number,
            date: record.date,
            amount: halfAmount,
            load_type: 'front_load',
            route: (typeof record.route === 'object' && record.route?.name) || record.route || 'N/A',
            description: `${record.description} (Front: ${record.front_load})`,
            account_type: record.account_type,
          });

          // Add detail for back load
          driver.details.push({
            reference_number: record.reference_number || 'N/A',
            account_number: record.account_number,
            date: record.date,
            amount: halfAmount,
            load_type: 'back_load',
            route: (typeof record.route === 'object' && record.route?.name) || record.route || 'N/A',
            description: `${record.description} (Back: ${record.back_load})`,
            account_type: record.account_type,
          });
        } else if (hasFrontLoad) {
          // Only front load
          driver.front_load_amount += finalTotal;
          driver.total_loads += 1;

          driver.details.push({
            reference_number: record.reference_number || 'N/A',
            account_number: record.account_number,
            date: record.date,
            amount: finalTotal,
            load_type: 'front_load',
            route: (typeof record.route === 'object' && record.route?.name) || record.route || 'N/A',
            description: `${record.description} (Front: ${record.front_load})`,
            account_type: record.account_type,
          });
        } else if (hasBackLoad) {
          // Only back load
          driver.back_load_amount += finalTotal;
          driver.total_loads += 1;

          driver.details.push({
            reference_number: record.reference_number || 'N/A',
            account_number: record.account_number,
            date: record.date,
            amount: finalTotal,
            load_type: 'back_load',
            route: (typeof record.route === 'object' && record.route?.name) || record.route || 'N/A',
            description: `${record.description} (Back: ${record.back_load})`,
            account_type: record.account_type,
          });
        }
      } else if (record.account_type.toLowerCase().includes('driver\'s allowance')) {
        // Driver's Allowance - treat as actual allowance
        driver.allowance_amount += finalTotal;

        driver.details.push({
          reference_number: record.reference_number || 'N/A',
          account_number: record.account_number,
          date: record.date,
          amount: finalTotal,
          load_type: 'allowance',
          route: record.route || 'N/A',
          description: record.description,
          account_type: record.account_type,
        });
      } else {
        // Other expenses (fuel, oil, etc.) - treat as fuel and oil
        driver.fuel_and_oil_amount += finalTotal;

        driver.details.push({
          reference_number: record.reference_number || 'N/A',
          account_number: record.account_number,
          date: record.date,
          amount: finalTotal,
          load_type: 'fuel_and_oil',
          route: record.route || 'N/A',
          description: record.description,
          account_type: record.account_type,
        });
      }
    });

    // Convert map to array and calculate summary
    const drivers = Array.from(driverMap.values());
    
    const summary = {
      total_front_load: drivers.reduce((sum, d) => sum + d.front_load_amount, 0),
      total_back_load: drivers.reduce((sum, d) => sum + d.back_load_amount, 0),
      total_fuel_and_oil: drivers.reduce((sum, d) => sum + d.fuel_and_oil_amount, 0),
      total_allowance: drivers.reduce((sum, d) => sum + d.allowance_amount, 0),
      total_loads: drivers.reduce((sum, d) => sum + d.total_loads, 0),
    };

    return {
      drivers: drivers.sort((a, b) => a.driver_name.localeCompare(b.driver_name)),
      total_drivers: drivers.length,
      summary,
    };
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
    return <SkeletonLoader variant="drivers" />;
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center">
                <div className="text-red-400 text-lg font-semibold mb-4">Error</div>
                <p className="text-gray-300">{error}</p>
                <button
                  onClick={fetchDriversData}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!driversData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center text-gray-300">No data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          display: none;
        }
        .elevated-box {
          box-shadow: 
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        .elevated-box:hover {
          box-shadow: 
            0 20px 40px -10px rgba(0, 0, 0, 0.15),
            0 8px 12px -4px rgba(0, 0, 0, 0.08);
          transform: translateY(-4px);
        }
        .gradient-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .metric-card {
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          border: 1px solid rgba(226, 232, 240, 0.6);
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <Navbar />
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="glass-effect rounded-2xl p-8 elevated-box">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">Drivers Summary</h1>
              <p className="text-gray-600 text-lg">Overview of drivers' front load, back load, and allowance amounts</p>
            </div>
          </div>

          {/* Drivers Overview Cards */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Total Drivers Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Drivers</h3>
                  <p className="text-gray-600 text-sm">Active drivers</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {driversData.total_drivers}
              </div>
            </div>

            {/* Total Front Load Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Front Load</h3>
                  <p className="text-gray-600 text-sm">Front load revenue</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-white text-lg">🚛</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(driversData.summary.total_front_load)}
              </div>
            </div>

            {/* Total Back Load Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Back Load</h3>
                  <p className="text-gray-600 text-sm">Back load revenue</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg">🚚</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(driversData.summary.total_back_load)}
              </div>
            </div>

            {/* Total Fuel & Oil Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Fuel & Oil</h3>
                  <p className="text-gray-600 text-sm">Fuel expenses</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-lg">⛽</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(driversData.summary.total_fuel_and_oil)}
              </div>
            </div>

            {/* Total Allowance Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Allowance</h3>
                  <p className="text-gray-600 text-sm">Driver allowances</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(driversData.summary.total_allowance)}
              </div>
            </div>
          </div>

          {/* Drivers List */}
          <div className="gradient-card rounded-2xl p-8 elevated-box">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Drivers List</h3>
                <p className="text-gray-600">Detailed breakdown of driver performance and earnings</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
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
                      Fuel & Oil
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
                  const totalAmount = driver.front_load_amount + driver.back_load_amount + driver.fuel_and_oil_amount + driver.allowance_amount;
                  return (
                    <>
                      <tr key={driver.driver_name} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
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
                          <div className="text-sm text-orange-600 font-medium">
                            {formatCurrency(driver.fuel_and_oil_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-600 font-medium">
                            {formatCurrency(driver.allowance_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {driver.total_loads}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-bold">
                            {formatCurrency(totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleDriverDetails(driver.driver_name)}
                            className="text-orange-600 hover:text-orange-900 text-sm font-medium transition-colors duration-200"
                          >
                            {expandedDriver === driver.driver_name ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {expandedDriver === driver.driver_name && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Transaction Details for {driver.driver_name}
                              </h3>
                              
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
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
                                        Load Type
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Account Type
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
                                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {detail.reference_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {detail.account_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {detail.date}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            detail.load_type === 'front_load' 
                                              ? 'bg-green-100 text-green-800 border border-green-200' 
                                              : detail.load_type === 'back_load'
                                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                              : detail.load_type === 'fuel_and_oil'
                                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                                          }`}>
                                            {detail.load_type.replace('_', ' ')}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {detail.account_type}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium">
                                          <span className={`${
                                            detail.load_type === 'front_load' 
                                              ? 'text-green-600' 
                                              : detail.load_type === 'back_load'
                                              ? 'text-blue-600'
                                              : detail.load_type === 'fuel_and_oil'
                                              ? 'text-orange-600'
                                              : 'text-purple-600'
                                          }`}>
                                            {formatCurrency(detail.amount)}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {detail.route}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
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
    </div>
  );
}
