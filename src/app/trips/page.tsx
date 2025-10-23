'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface Trip {
  plate_number: string;
  truck_type: string;
  date: string;
  trip_route: string;
  driver: string;
  allowance: number;
  reference_numbers: string[];
  fuel_liters: number;
  fuel_price: number;
  front_load: string;
  front_load_reference_numbers: string[];
  front_load_amount: number;
  back_load_reference_numbers: string[];
  back_load_amount: number;
  front_and_back_load_amount: number;
  income: number;
  remarks: string;
  insurance_expense: number;
  repairs_maintenance_expense: number;
  taxes_permits_licenses_expense: number;
  salaries_allowance: number;
  account_types: string[];
}

interface TripsData {
  trips: Trip[];
  total_trips: number;
}

export default function TripsPage() {
  const [tripsData, setTripsData] = useState<TripsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [selectedTruckType, setSelectedTruckType] = useState<string>('all');

  useEffect(() => {
    fetchTripsData();
  }, []);

  // Reset truck filter when truck type changes
  useEffect(() => {
    if (selectedTruckType !== 'all') {
      // Check if current selected truck is still valid for the new truck type
      const validTrucks = tripsData?.trips
        .filter(trip => trip.truck_type === selectedTruckType)
        .map(trip => trip.plate_number) || [];
      
      if (selectedTruck !== 'all' && !validTrucks.includes(selectedTruck)) {
        setSelectedTruck('all');
      }
    }
  }, [selectedTruckType, selectedTruck, tripsData]);

  const fetchTripsData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/trucking/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucking data');
      }
      
      const truckingData: TruckingRecord[] = await response.json();
      
      // Process trucking data to create trips
      const processedData = processTruckingData(truckingData);
      setTripsData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const standardizePlateNumber = (plateNumber: string): string => {
    if (!plateNumber) return '';
    
    // Remove all spaces, hyphens, and convert to uppercase
    return plateNumber
      .replace(/[\s\-]/g, '')  // Remove spaces and hyphens
      .toUpperCase()           // Convert to uppercase
      .trim();                 // Remove any remaining whitespace
  };

  const processTruckingData = (data: TruckingRecord[]): TripsData => {
    // Group by plate number and date
    const tripMap = new Map<string, Trip>();

    data.forEach((record) => {
      // Skip records without plate number or with empty plate number
      if (!record.plate_number || record.plate_number.trim() === '' || record.plate_number.toLowerCase() === 'nan') {
        return;
      }

      // Skip records with "Beginning Balance" description
      if (record.description && record.description.toLowerCase().includes('beginning balance')) {
        return;
      }

      const plateNumber = standardizePlateNumber(record.plate_number);
      const date = record.date;
      const tripKey = `${plateNumber}_${date}`;

      // Initialize trip if not exists
      if (!tripMap.has(tripKey)) {
        tripMap.set(tripKey, {
          plate_number: plateNumber,
          truck_type: record.truck_type || '',
          date: date,
          trip_route: '',
          driver: '',
          allowance: 0,
          reference_numbers: [],
          fuel_liters: 0,
          fuel_price: 0,
          front_load: '',
          front_load_reference_numbers: [],
          front_load_amount: 0,
          back_load_reference_numbers: [],
          back_load_amount: 0,
          front_and_back_load_amount: 0,
          income: 0,
          remarks: '',
          insurance_expense: 0,
          repairs_maintenance_expense: 0,
          taxes_permits_licenses_expense: 0,
          salaries_allowance: 0,
          account_types: [],
        });
      }

      const trip = tripMap.get(tripKey)!;
      const finalTotal = parseFloat(record.final_total.toString());

      // Add reference number if not already present
      if (record.reference_number && !trip.reference_numbers.includes(record.reference_number)) {
        trip.reference_numbers.push(record.reference_number);
      }

      // Add account type if not already present
      // if (!trip.account_types.includes(record.account_type)) {
      //   trip.account_types.push(record.account_type);
      // }

      // Set driver and route from first valid record
      if (!trip.driver && record.driver) {
        trip.driver = record.driver;
      }
      if (!trip.trip_route && record.route) {
        trip.trip_route = record.route;
      }

      // Process based on account type
      const accountTypeLower = record.account_type.toLowerCase();

      if (accountTypeLower.includes('hauling income')) {
        // Add hauling income to trip income
        trip.income += finalTotal;
        
        // Handle Hauling Income - loads
        const hasFrontLoad = record.front_load && 
          record.front_load.trim() !== '' && 
          record.front_load.toLowerCase() !== 'nan' &&
          record.front_load.toLowerCase() !== 'n' &&
          record.front_load.toLowerCase() !== 'none';
        
        const hasBackLoad = record.back_load && 
          record.back_load.trim() !== '' && 
          record.back_load.toLowerCase() !== 'nan' &&
          record.back_load.toLowerCase() !== 'none';

        // Special case: If front_load is "Strike", all amount goes to back_load
        if (hasFrontLoad && record.front_load && record.front_load.toLowerCase() === 'strike') {
          // Strike case - all amount goes to back load, front load amount stays 0
          trip.back_load_amount += finalTotal;
          if (record.front_load) trip.front_load = record.front_load;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasFrontLoad && hasBackLoad) {
          // Both loads present - split amount
          const halfAmount = finalTotal / 2;
          trip.front_load_amount += halfAmount;
          trip.back_load_amount += halfAmount;
          
          if (record.front_load) trip.front_load = record.front_load;
          if (record.reference_number && !trip.front_load_reference_numbers.includes(record.reference_number)) {
            trip.front_load_reference_numbers.push(record.reference_number);
          }
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasFrontLoad) {
          // Only front load
          trip.front_load_amount += finalTotal;
          if (record.front_load) trip.front_load = record.front_load;
          if (record.reference_number && !trip.front_load_reference_numbers.includes(record.reference_number)) {
            trip.front_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasBackLoad) {
          // Only back load
          trip.back_load_amount += finalTotal;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        }
      } 
      else if (accountTypeLower.includes('fuel')) {
        // Handle Fuel
        trip.fuel_liters += parseFloat((record.quantity || 0).toString());
        trip.fuel_price = parseFloat((record.price || 0).toString());
      } 
      else if (accountTypeLower.includes('driver\'s allowance')) {
        // Handle Driver's Allowance
        trip.allowance += finalTotal;
        trip.salaries_allowance += finalTotal;
      } else if (accountTypeLower.includes('insurance')) {
        // Handle Insurance
        trip.insurance_expense += finalTotal;
      } else if (accountTypeLower.includes('repair') || accountTypeLower.includes('maintenance')) {
        // Handle Repairs & Maintenance
        trip.repairs_maintenance_expense += finalTotal;
      } else if (accountTypeLower.includes('tax') || accountTypeLower.includes('permit') || accountTypeLower.includes('license')) {
        // Handle Taxes/Permits/Licenses
        trip.taxes_permits_licenses_expense += finalTotal;
      }

      // Add remarks from first record
      if (!trip.remarks && record.remarks) {
        trip.remarks = record.remarks;
      }
    });

    // Calculate front_and_back_load_amount and convert to array
    const trips = Array.from(tripMap.values()).map(trip => {
      trip.front_and_back_load_amount = trip.front_load_amount + trip.back_load_amount;
      return trip;
    });

    // Sort by date and plate number
    trips.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.plate_number.localeCompare(b.plate_number);
    });

    return {
      trips,
      total_trips: trips.length,
    };
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

  // Get unique truck types
  const uniqueTruckTypes = Array.from(new Set(tripsData.trips.map(trip => trip.truck_type))).sort();
  
  // Get unique truck plate numbers based on selected truck type
  const uniqueTrucks = selectedTruckType === 'all' 
    ? Array.from(new Set(tripsData.trips.map(trip => trip.plate_number))).sort()
    : Array.from(new Set(tripsData.trips
        .filter(trip => trip.truck_type === selectedTruckType)
        .map(trip => trip.plate_number)
      )).sort();

  // Filter trips based on selected truck and truck type
  const filteredTrips = tripsData.trips.filter(trip => {
    const truckMatch = selectedTruck === 'all' || trip.plate_number === selectedTruck;
    const truckTypeMatch = selectedTruckType === 'all' || trip.truck_type === selectedTruckType;
    return truckMatch && truckTypeMatch;
  });

  // Calculate totals for filtered trips
  const totals = filteredTrips.reduce((acc, trip) => ({
    allowance: acc.allowance + trip.allowance,
    fuel_liters: acc.fuel_liters + trip.fuel_liters,
    fuel_total: acc.fuel_total + (trip.fuel_liters * trip.fuel_price),
    front_load_amount: acc.front_load_amount + trip.front_load_amount,
    back_load_amount: acc.back_load_amount + trip.back_load_amount,
    front_and_back_load_amount: acc.front_and_back_load_amount + trip.front_and_back_load_amount,
    income: acc.income + trip.income,
    insurance_expense: acc.insurance_expense + trip.insurance_expense,
    repairs_maintenance_expense: acc.repairs_maintenance_expense + trip.repairs_maintenance_expense,
    taxes_permits_licenses_expense: acc.taxes_permits_licenses_expense + trip.taxes_permits_licenses_expense,
    salaries_allowance: acc.salaries_allowance + trip.salaries_allowance
  }), {
    allowance: 0,
    fuel_liters: 0,
    fuel_total: 0,
    front_load_amount: 0,
    back_load_amount: 0,
    front_and_back_load_amount: 0,
    income: 0,
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
              <p className="text-gray-600">Consolidated view of all trips from trucking data (same date entries combined per truck)</p>
              <p className="text-sm text-gray-500 mt-1">
                Total Trips: {tripsData.total_trips}
                {(selectedTruck !== 'all' || selectedTruckType !== 'all') && (
                  <span className="ml-2 text-blue-600 font-medium">
                    (Showing {filteredTrips.length} trips
                    {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                    {selectedTruckType !== 'all' && ` - ${selectedTruckType} type`})
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-4 items-center">
              <div className="flex flex-col">
                <label htmlFor="truck-filter" className="text-xs font-medium text-gray-700 mb-1">
                  Filter by Truck
                </label>
                <select
                  id="truck-filter"
                  value={selectedTruck}
                  onChange={(e) => setSelectedTruck(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">
                    {selectedTruckType === 'all' 
                      ? `All Trucks (${tripsData.total_trips} trips)` 
                      : `All ${selectedTruckType} Trucks (${uniqueTrucks.length} trucks)`
                    }
                  </option>
                  {uniqueTrucks.map((truck) => {
                    const truckTrips = tripsData.trips.filter(t => 
                      t.plate_number === truck && 
                      (selectedTruckType === 'all' || t.truck_type === selectedTruckType)
                    );
                    return (
                      <option key={truck} value={truck}>
                        {truck} ({truckTrips.length} trips)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="truck-type-filter" className="text-xs font-medium text-gray-700 mb-1">
                  Filter by Truck Type
                </label>
                <select
                  id="truck-type-filter"
                  value={selectedTruckType}
                  onChange={(e) => setSelectedTruckType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Types ({tripsData.total_trips} trips)</option>
                  {uniqueTruckTypes.map((truckType) => {
                    const truckTypeTrips = tripsData.trips.filter(t => t.truck_type === truckType);
                    return (
                      <option key={truckType} value={truckType}>
                        {truckType} ({truckTypeTrips.length} trips)
                      </option>
                    );
                  })}
                </select>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors self-end"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={fetchTripsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors self-end"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Trips Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">
              {(selectedTruck === 'all' && selectedTruckType === 'all') ? 'All Trips' : 'Filtered Trips'}
            </h2>
            {(selectedTruck !== 'all' || selectedTruckType !== 'all') && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredTrips.length} of {tripsData.total_trips} total trips
                {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                {selectedTruckType !== 'all' && ` (${selectedTruckType} type)`}
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Types
                  </th> */}
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
                    Fuel Total
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
                    Income
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
                  {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salaries/Allowance
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrips.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {index + 1}
                    </td>
                    {/* <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.account_types.length > 0 ? trip.account_types.join(', ') : '-'}
                    </td> */}
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
                      {trip.reference_numbers.length > 0 ? trip.reference_numbers.join(', ') : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.fuel_liters > 0 ? trip.fuel_liters.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-orange-600 font-medium">
                      {trip.fuel_liters > 0 && trip.fuel_price > 0 ? formatCurrency(trip.fuel_liters * trip.fuel_price) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.front_load || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.front_load_reference_numbers.length > 0 ? trip.front_load_reference_numbers.join(', ') : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-blue-600 font-medium">
                      {trip.front_load_amount > 0 ? formatCurrency(trip.front_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {trip.back_load_reference_numbers.length > 0 ? trip.back_load_reference_numbers.join(', ') : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-green-600 font-medium">
                      {trip.back_load_amount > 0 ? formatCurrency(trip.back_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-purple-600 font-bold">
                      {trip.front_and_back_load_amount > 0 ? formatCurrency(trip.front_and_back_load_amount) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-green-600 font-bold">
                      {trip.income > 0 ? formatCurrency(trip.income) : '-'}
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
                    {/* <td className="px-3 py-2 whitespace-nowrap text-red-600">
                      {trip.salaries_allowance > 0 ? formatCurrency(trip.salaries_allowance) : '-'}
                    </td> */}
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
                  <td className="px-3 py-3 whitespace-nowrap text-orange-600">
                    {formatCurrency(totals.fuel_total)}
                  </td>
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
                  <td className="px-3 py-3 whitespace-nowrap text-green-600">
                    {formatCurrency(totals.income)}
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
                  {/* <td className="px-3 py-3 whitespace-nowrap text-red-600">
                    {formatCurrency(totals.salaries_allowance)}
                  </td> */}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


