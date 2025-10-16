'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Trip {
  account_number: string;
  plate_number: string;
  date: string;
  trip_route: string;
  driver: string;
  allowance: number;
  reference_number: string;
  fuel_liters: number;
  fuel_price: number;
  front_load: string;
  front_load_reference_number: string;
  front_load_amount: number;
  back_load_reference_number: string;
  back_load_amount: number;
  front_and_back_load_amount: number;
  remarks: string;
  insurance_expense: number;
  repairs_maintenance_expense: number;
  taxes_permits_licenses_expense: number;
  salaries_allowance: number;
}

interface TripsData {
  trips: Trip[];
  total_trips: number;
}

export default function TripsPage() {
  const [tripsData, setTripsData] = useState<TripsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTripsData();
  }, []);

  const fetchTripsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/trips/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips data');
      }
      
      const data = await response.json();
      setTripsData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              <div className="h-64 bg-gray-200 rounded"></div>
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
                onClick={fetchTripsData}
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

  if (!tripsData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-700">No trips data available</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = tripsData.trips.reduce((acc, trip) => ({
    allowance: acc.allowance + trip.allowance,
    fuel_liters: acc.fuel_liters + trip.fuel_liters,
    front_load_amount: acc.front_load_amount + trip.front_load_amount,
    back_load_amount: acc.back_load_amount + trip.back_load_amount,
    front_and_back_load_amount: acc.front_and_back_load_amount + trip.front_and_back_load_amount,
    insurance_expense: acc.insurance_expense + trip.insurance_expense,
    repairs_maintenance_expense: acc.repairs_maintenance_expense + trip.repairs_maintenance_expense,
    taxes_permits_licenses_expense: acc.taxes_permits_licenses_expense + trip.taxes_permits_licenses_expense,
    salaries_allowance: acc.salaries_allowance + trip.salaries_allowance
  }), {
    allowance: 0,
    fuel_liters: 0,
    front_load_amount: 0,
    back_load_amount: 0,
    front_and_back_load_amount: 0,
    insurance_expense: 0,
    repairs_maintenance_expense: 0,
    taxes_permits_licenses_expense: 0,
    salaries_allowance: 0
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trips Summary</h1>
              <p className="text-gray-600">Consolidated view of all trips (1 day = 1 trip per truck)</p>
              <p className="text-sm text-gray-500 mt-1">Total Trips: {tripsData.total_trips}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={fetchTripsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Trips Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">All Trips</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plate #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip/Route
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowance
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Liters
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Front Load
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Front Load Ref#
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Front Load Amt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Back Load Ref#
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Back Load Amt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Front & Back Amt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance Exp
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repairs & Maint Exp
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxes/Permits Exp
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salaries/Allowance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tripsData.trips.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.account_number || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-medium">
                      {trip.plate_number}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.trip_route || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.driver || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.allowance > 0 ? formatCurrency(trip.allowance) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.reference_number || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.fuel_liters > 0 ? trip.fuel_liters.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.front_load || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.front_load_reference_number || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-blue-600 font-medium">
                      {trip.front_load_amount > 0 ? formatCurrency(trip.front_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.back_load_reference_number || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-green-600 font-medium">
                      {trip.back_load_amount > 0 ? formatCurrency(trip.back_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-purple-600 font-bold">
                      {trip.front_and_back_load_amount > 0 ? formatCurrency(trip.front_and_back_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-900 max-w-xs truncate">
                      {trip.remarks || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-red-600">
                      {trip.insurance_expense > 0 ? formatCurrency(trip.insurance_expense) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-red-600">
                      {trip.repairs_maintenance_expense > 0 ? formatCurrency(trip.repairs_maintenance_expense) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-red-600">
                      {trip.taxes_permits_licenses_expense > 0 ? formatCurrency(trip.taxes_permits_licenses_expense) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-red-600">
                      {trip.salaries_allowance > 0 ? formatCurrency(trip.salaries_allowance) : '-'}
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={6} className="px-3 py-3 text-right text-gray-900">
                    TOTALS:
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-900">
                    {formatCurrency(totals.allowance)}
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-900">
                    {totals.fuel_liters.toFixed(2)}
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 whitespace-nowrap text-blue-600">
                    {formatCurrency(totals.front_load_amount)}
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 whitespace-nowrap text-green-600">
                    {formatCurrency(totals.back_load_amount)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-purple-600">
                    {formatCurrency(totals.front_and_back_load_amount)}
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {formatCurrency(totals.insurance_expense)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {formatCurrency(totals.repairs_maintenance_expense)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {formatCurrency(totals.taxes_permits_licenses_expense)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {formatCurrency(totals.salaries_allowance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


