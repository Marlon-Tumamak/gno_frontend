'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
      // Skip records without driver or with empty driver
      if (!record.driver || record.driver.trim() === '' || record.driver.toLowerCase() === 'nan') {
        return;
      }

      const driverName = record.driver.trim();

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
            route: record.route || 'N/A',
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
            route: record.route || 'N/A',
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
            route: record.route || 'N/A',
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
            route: record.route || 'N/A',
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
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
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
      </div>
    );
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
    <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
      <Navbar />
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto mt-5">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Drivers Summary</h1>
                <p className="text-gray-300">Overview of drivers&apos; front load, back load, and allowance amounts</p>
              </div>
              {/* <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={fetchDriversData}
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Refresh Data
                </button>
              </div> */}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Drivers</div>
              <div className="text-2xl font-bold text-white">{driversData.total_drivers}</div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Front Load</div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(driversData.summary.total_front_load)}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Back Load</div>
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(driversData.summary.total_back_load)}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Fuel & Oil</div>
              <div className="text-2xl font-bold text-orange-400">
                {formatCurrency(driversData.summary.total_fuel_and_oil)}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Allowance</div>
              <div className="text-2xl font-bold text-purple-400">
                {formatCurrency(driversData.summary.total_allowance)}
              </div>
            </div>
          </div>

          {/* Drivers Table */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">Drivers List</h2>
            </div>
          
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Driver Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Front Load
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Back Load
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fuel & Oil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Allowance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Loads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-black/20 divide-y divide-white/10">
                {driversData.drivers.map((driver) => {
                  const totalAmount = driver.front_load_amount + driver.back_load_amount + driver.fuel_and_oil_amount + driver.allowance_amount;
                  return (
                    <>
                      <tr key={driver.driver_name} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {driver.driver_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-400 font-medium">
                            {formatCurrency(driver.front_load_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-400 font-medium">
                            {formatCurrency(driver.back_load_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-orange-400 font-medium">
                            {formatCurrency(driver.fuel_and_oil_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-400 font-medium">
                            {formatCurrency(driver.allowance_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {driver.total_loads}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-white">
                            {formatCurrency(totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleDriverDetails(driver.driver_name)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors duration-200"
                          >
                            {expandedDriver === driver.driver_name ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {expandedDriver === driver.driver_name && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-black/30">
                            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                              <h3 className="text-lg font-semibold text-white mb-4 drop-shadow-lg">
                                Transaction Details for {driver.driver_name}
                              </h3>
                              
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                  <thead className="bg-black/60">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Ref #
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Account #
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Date
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Load Type
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Account Type
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Amount
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Route
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                        Description
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-black/20 divide-y divide-white/10">
                                    {driver.details.map((detail, index) => (
                                      <tr key={index} className="hover:bg-white/5">
                                        <td className="px-3 py-2 text-sm text-gray-300">
                                          {detail.reference_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-300">
                                          {detail.account_number}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-300">
                                          {detail.date}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            detail.load_type === 'front_load' 
                                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                              : detail.load_type === 'back_load'
                                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                              : detail.load_type === 'fuel_and_oil'
                                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                          }`}>
                                            {detail.load_type.replace('_', ' ')}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-300">
                                          {detail.account_type}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-white">
                                          {formatCurrency(detail.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-300">
                                          {detail.route}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-300">
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
