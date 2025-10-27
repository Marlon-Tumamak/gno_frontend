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
  back_load: string;
  back_load_reference_numbers: string[];
  back_load_amount: number;
  front_and_back_load_amount: number;
  income: number;
  other_income: number;
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
  excludedRecords: TruckingRecord[];
  fuelInconsistencies: { tripKey: string; records: TruckingRecord[] }[];
}

export default function TripsPage() {
  const [tripsData, setTripsData] = useState<TripsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [selectedTruckType, setSelectedTruckType] = useState<string>('all');

  // Filter states for all columns
  const [filters, setFilters] = useState({
    plateNumber: '',
    date: '',
    tripRoute: '',
    driver: '',
    allowance: { min: '', max: '' },
    refNumber: '',
    fuelLiters: { min: '', max: '' },
    fuelAmount: { min: '', max: '' },
    frontLoad: '',
    frontLoadAmount: { min: '', max: '' },
    backLoad: '',
    backLoadAmount: { min: '', max: '' },
    income: { min: '', max: '' },
    remarks: '',
    insuranceExpense: { min: '', max: '' },
    repairsMaintenanceExpense: { min: '', max: '' },
    taxesPermitsExpense: { min: '', max: '' }
  });

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

  // Filter update functions
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      plateNumber: '',
      date: '',
      tripRoute: '',
      driver: '',
      allowance: { min: '', max: '' },
      refNumber: '',
      fuelLiters: { min: '', max: '' },
      fuelAmount: { min: '', max: '' },
      frontLoad: '',
      frontLoadAmount: { min: '', max: '' },
      backLoad: '',
      backLoadAmount: { min: '', max: '' },
      income: { min: '', max: '' },
      remarks: '',
      insuranceExpense: { min: '', max: '' },
      repairsMaintenanceExpense: { min: '', max: '' },
      taxesPermitsExpense: { min: '', max: '' }
    });
    setSelectedTruck('all');
    setSelectedTruckType('all');
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedTruck !== 'all' || 
           selectedTruckType !== 'all' ||
           Object.values(filters).some(filter => {
             if (typeof filter === 'string') {
               return filter !== '';
             } else if (typeof filter === 'object' && filter !== null) {
               return filter.min !== '' || filter.max !== '';
             }
             return false;
           });
  };

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
    const excludedRecords: TruckingRecord[] = [];
    const fuelInconsistencies: { tripKey: string; records: TruckingRecord[] }[] = [];

    data.forEach((record) => {
      // Skip records with "Beginning Balance" description
      if (record.description && record.description.toLowerCase().includes('beginning balance')) {
        excludedRecords.push(record);
        return;
      }

      // Handle records without plate number - use a default identifier
      let plateNumber = 'NO_PLATE';
      if (record.plate_number && record.plate_number.trim() !== '' && record.plate_number.toLowerCase() !== 'nan') {
        plateNumber = standardizePlateNumber(record.plate_number);
      }

      const date = record.date;
      const tripKey = `${plateNumber}_${date}`;

      // Initialize trip if not exists
      if (!tripMap.has(tripKey)) {
        tripMap.set(tripKey, {
          plate_number: plateNumber === 'NO_PLATE' ? 'No Plate Number' : plateNumber,
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
          back_load: '',
          back_load_reference_numbers: [],
          back_load_amount: 0,
          front_and_back_load_amount: 0,
          income: 0,
          other_income: 0,
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
        // Check if this is Rice Hull Ton - if so, add to other_income instead of regular income
        if (record.remarks && record.remarks.toLowerCase().includes('rice hull ton')) {
          trip.other_income += finalTotal;
        } else {
          // Add hauling income to trip income (excluding Rice Hull Ton)
          trip.income += finalTotal;
        }
        
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
          if (record.back_load) trip.back_load = record.back_load;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasFrontLoad && hasBackLoad) {
          // Both loads present - split amount
          const halfAmount = finalTotal / 2;
          trip.front_load_amount += halfAmount;
          trip.back_load_amount += halfAmount;
          
          if (record.front_load) trip.front_load = record.front_load;
          if (record.back_load) trip.back_load = record.back_load;
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
          if (record.back_load) trip.back_load = record.back_load;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        }
      } 
      else if (accountTypeLower.includes('fuel')) {
        // Handle Fuel - accumulate fuel amount instead of just setting price
        trip.fuel_liters += parseFloat((record.quantity || 0).toString());
        // For fuel, we should use the final_total (which is the total fuel amount) instead of quantity * price
        // This ensures we capture the actual fuel amount from each record
        trip.fuel_price += finalTotal; // Accumulate total fuel amount
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

    // Check for fuel inconsistencies - records with same date/plate but different fuel amounts
    const fuelRecordsByTrip = new Map<string, TruckingRecord[]>();
    
    data.forEach((record) => {
      if (record.description && record.description.toLowerCase().includes('beginning balance')) {
        return;
      }
      
      const accountTypeLower = record.account_type.toLowerCase();
      if (accountTypeLower.includes('fuel')) {
        let plateNumber = 'NO_PLATE';
        if (record.plate_number && record.plate_number.trim() !== '' && record.plate_number.toLowerCase() !== 'nan') {
          plateNumber = standardizePlateNumber(record.plate_number);
        }
        
        const tripKey = `${plateNumber}_${record.date}`;
        
        if (!fuelRecordsByTrip.has(tripKey)) {
          fuelRecordsByTrip.set(tripKey, []);
        }
        fuelRecordsByTrip.get(tripKey)!.push(record);
      }
    });
    
    // Find trips with multiple fuel records that have different amounts
    fuelRecordsByTrip.forEach((records, tripKey) => {
      if (records.length > 1) {
        const firstRecord = records[0];
        const hasInconsistency = records.some(record => 
          record.final_total !== firstRecord.final_total || 
          record.quantity !== firstRecord.quantity
        );
        
        if (hasInconsistency) {
          fuelInconsistencies.push({ tripKey, records });
        }
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
      excludedRecords,
      fuelInconsistencies,
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
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-[95%] mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-6"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
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
          <div className="max-w-[95%] mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center">
                <div className="text-red-400 text-lg font-semibold mb-4">Error</div>
                <p className="text-gray-300">{error}</p>
                <button
                  onClick={fetchTripsData}
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

  if (!tripsData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-[95%] mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center text-gray-300">No trips data available</div>
            </div>
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

  // Get unique values for dropdown filters
  const uniquePlateNumbers = Array.from(new Set(tripsData.trips.map(trip => trip.plate_number))).sort();
  const uniqueTripRoutes = Array.from(new Set(tripsData.trips
    .map(trip => trip.trip_route)
    .filter(route => route && route.trim() !== '')
  )).sort();
  const uniqueDrivers = Array.from(new Set(tripsData.trips
    .map(trip => trip.driver)
    .filter(driver => driver && driver.trim() !== '')
  )).sort();
  const uniqueRefNumbers = Array.from(new Set(tripsData.trips
    .flatMap(trip => trip.reference_numbers)
    .filter(ref => ref && ref.trim() !== '')
  )).sort();
  const uniqueFrontLoads = Array.from(new Set(tripsData.trips
    .map(trip => trip.front_load)
    .filter(load => load && load.trim() !== '')
  )).sort();
  const uniqueBackLoads = Array.from(new Set(tripsData.trips
    .map(trip => trip.back_load)
    .filter(load => load && load.trim() !== '')
  )).sort();
  const uniqueRemarks = Array.from(new Set(tripsData.trips
    .map(trip => trip.remarks)
    .filter(remark => remark && remark.trim() !== '')
  )).sort();

  // Filter trips based on all filters
  const filteredTrips = tripsData.trips.filter(trip => {
    // Existing truck and truck type filters
    const truckMatch = selectedTruck === 'all' || trip.plate_number === selectedTruck;
    const truckTypeMatch = selectedTruckType === 'all' || trip.truck_type === selectedTruckType;
    
    // Dropdown filters (exact matches)
    const plateNumberMatch = !filters.plateNumber || trip.plate_number === filters.plateNumber;
    const dateMatch = !filters.date || trip.date.includes(filters.date);
    const tripRouteMatch = !filters.tripRoute || trip.trip_route === filters.tripRoute;
    const driverMatch = !filters.driver || trip.driver === filters.driver;
    const refNumberMatch = !filters.refNumber || trip.reference_numbers.includes(filters.refNumber);
    const frontLoadMatch = !filters.frontLoad || trip.front_load === filters.frontLoad;
    const backLoadMatch = !filters.backLoad || trip.back_load === filters.backLoad;
    const remarksMatch = !filters.remarks || trip.remarks === filters.remarks;
    
    // Numeric range filters
    const allowanceMatch = (!filters.allowance.min || trip.allowance >= parseFloat(filters.allowance.min)) &&
      (!filters.allowance.max || trip.allowance <= parseFloat(filters.allowance.max));
    const fuelLitersMatch = (!filters.fuelLiters.min || trip.fuel_liters >= parseFloat(filters.fuelLiters.min)) &&
      (!filters.fuelLiters.max || trip.fuel_liters <= parseFloat(filters.fuelLiters.max));
    const fuelAmountMatch = (!filters.fuelAmount.min || trip.fuel_price >= parseFloat(filters.fuelAmount.min)) &&
      (!filters.fuelAmount.max || trip.fuel_price <= parseFloat(filters.fuelAmount.max));
    const frontLoadAmountMatch = (!filters.frontLoadAmount.min || trip.front_load_amount >= parseFloat(filters.frontLoadAmount.min)) &&
      (!filters.frontLoadAmount.max || trip.front_load_amount <= parseFloat(filters.frontLoadAmount.max));
    const backLoadAmountMatch = (!filters.backLoadAmount.min || trip.back_load_amount >= parseFloat(filters.backLoadAmount.min)) &&
      (!filters.backLoadAmount.max || trip.back_load_amount <= parseFloat(filters.backLoadAmount.max));
    const incomeMatch = (!filters.income.min || trip.income >= parseFloat(filters.income.min)) &&
      (!filters.income.max || trip.income <= parseFloat(filters.income.max));
    const insuranceExpenseMatch = (!filters.insuranceExpense.min || trip.insurance_expense >= parseFloat(filters.insuranceExpense.min)) &&
      (!filters.insuranceExpense.max || trip.insurance_expense <= parseFloat(filters.insuranceExpense.max));
    const repairsMaintenanceExpenseMatch = (!filters.repairsMaintenanceExpense.min || trip.repairs_maintenance_expense >= parseFloat(filters.repairsMaintenanceExpense.min)) &&
      (!filters.repairsMaintenanceExpense.max || trip.repairs_maintenance_expense <= parseFloat(filters.repairsMaintenanceExpense.max));
    const taxesPermitsExpenseMatch = (!filters.taxesPermitsExpense.min || trip.taxes_permits_licenses_expense >= parseFloat(filters.taxesPermitsExpense.min)) &&
      (!filters.taxesPermitsExpense.max || trip.taxes_permits_licenses_expense <= parseFloat(filters.taxesPermitsExpense.max));
    
    return truckMatch && truckTypeMatch && plateNumberMatch && dateMatch && tripRouteMatch && 
           driverMatch && refNumberMatch && frontLoadMatch && backLoadMatch && remarksMatch && allowanceMatch && 
           fuelLitersMatch && fuelAmountMatch && frontLoadAmountMatch && backLoadAmountMatch && 
           incomeMatch && insuranceExpenseMatch && repairsMaintenanceExpenseMatch && taxesPermitsExpenseMatch;
  });

  // Calculate totals for filtered trips
  const totals = filteredTrips.reduce((acc, trip) => ({
    allowance: acc.allowance + trip.allowance,
    fuel_liters: acc.fuel_liters + trip.fuel_liters,
    fuel_total: acc.fuel_total + trip.fuel_price, // Use accumulated fuel amount directly
    front_load_amount: acc.front_load_amount + trip.front_load_amount,
    back_load_amount: acc.back_load_amount + trip.back_load_amount,
    front_and_back_load_amount: acc.front_and_back_load_amount + trip.front_and_back_load_amount,
    income: acc.income + trip.income,
    other_income: acc.other_income + trip.other_income,
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
    other_income: 0,
    insurance_expense: 0,
    repairs_maintenance_expense: 0,
    taxes_permits_licenses_expense: 0,
    salaries_allowance: 0
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
      <Navbar />
      <div className="pt-16 p-8">
        <div className="max-w-[95%] mx-auto mt-5">
          {/* Header */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Trips Summary</h1>
                <p className="text-gray-300">Consolidated view of all trips from trucking data (same date entries combined per truck)</p>
                <p className="text-sm text-gray-400 mt-1">
                  Total Trips: {tripsData.total_trips}
                  {(selectedTruck !== 'all' || selectedTruckType !== 'all') && (
                    <span className="ml-2 text-orange-400 font-medium">
                      (Showing {filteredTrips.length} trips
                      {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                      {selectedTruckType !== 'all' && ` - ${selectedTruckType} type`})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-4 items-center">
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-md transition-all duration-200 text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
                <div className="flex flex-col">
                  <label htmlFor="truck-filter" className="text-xs font-medium text-gray-300 mb-1">
                    Filter by Truck
                  </label>
                  <select
                    id="truck-filter"
                    value={selectedTruck}
                    onChange={(e) => setSelectedTruck(e.target.value)}
                    className="px-4 py-2 border border-white/20 rounded-md bg-black/40 text-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                  <label htmlFor="truck-type-filter" className="text-xs font-medium text-gray-300 mb-1">
                    Filter by Truck Type
                  </label>
                  <select
                    id="truck-type-filter"
                    value={selectedTruckType}
                    onChange={(e) => setSelectedTruckType(e.target.value)}
                    className="px-4 py-2 border border-white/20 rounded-md bg-black/40 text-white hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                {/* <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200 self-end"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={fetchTripsData}
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200 self-end"
                >
                  Refresh Data
                </button> */}
              </div>
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-black/40">
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                {(selectedTruck === 'all' && selectedTruckType === 'all') ? 'All Trips' : 'Filtered Trips'}
              </h2>
              {(selectedTruck !== 'all' || selectedTruckType !== 'all') && (
                <p className="text-sm text-gray-300 mt-1">
                  Showing {filteredTrips.length} of {tripsData.total_trips} total trips
                  {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                  {selectedTruckType !== 'all' && ` (${selectedTruckType} type)`}
                </p>
              )}
          </div>
          
            <div className="overflow-auto max-h-[100vh]">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                {/* Filter Row */}
                <thead className="bg-black/60 sticky top-0 z-20">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.plateNumber}
                        onChange={(e) => updateFilter('plateNumber', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Plate #s</option>
                        {uniquePlateNumbers.map((plate) => (
                          <option key={plate} value={plate}>
                            {plate}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => updateFilter('date', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.tripRoute}
                        onChange={(e) => updateFilter('tripRoute', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Routes</option>
                        {uniqueTripRoutes.map((route) => (
                          <option key={route} value={route}>
                            {route}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.driver}
                        onChange={(e) => updateFilter('driver', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Drivers</option>
                        {uniqueDrivers.map((driver) => (
                          <option key={driver} value={driver}>
                            {driver}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.allowance.min}
                          onChange={(e) => updateFilter('allowance', { ...filters.allowance, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.allowance.max}
                          onChange={(e) => updateFilter('allowance', { ...filters.allowance, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.refNumber}
                        onChange={(e) => updateFilter('refNumber', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Ref #s</option>
                        {uniqueRefNumbers.map((ref) => (
                          <option key={ref} value={ref}>
                            {ref}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.fuelLiters.min}
                          onChange={(e) => updateFilter('fuelLiters', { ...filters.fuelLiters, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.fuelLiters.max}
                          onChange={(e) => updateFilter('fuelLiters', { ...filters.fuelLiters, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.fuelAmount.min}
                          onChange={(e) => updateFilter('fuelAmount', { ...filters.fuelAmount, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.fuelAmount.max}
                          onChange={(e) => updateFilter('fuelAmount', { ...filters.fuelAmount, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fuel Total
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.frontLoad}
                        onChange={(e) => updateFilter('frontLoad', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Front Loads</option>
                        {uniqueFrontLoads.map((load) => (
                          <option key={load} value={load}>
                            {load}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.frontLoadAmount.min}
                          onChange={(e) => updateFilter('frontLoadAmount', { ...filters.frontLoadAmount, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.frontLoadAmount.max}
                          onChange={(e) => updateFilter('frontLoadAmount', { ...filters.frontLoadAmount, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.backLoad}
                        onChange={(e) => updateFilter('backLoad', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Back Loads</option>
                        {uniqueBackLoads.map((load) => (
                          <option key={load} value={load}>
                            {load}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.backLoadAmount.min}
                          onChange={(e) => updateFilter('backLoadAmount', { ...filters.backLoadAmount, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.backLoadAmount.max}
                          onChange={(e) => updateFilter('backLoadAmount', { ...filters.backLoadAmount, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Front & Back Amt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.income.min}
                          onChange={(e) => updateFilter('income', { ...filters.income, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.income.max}
                          onChange={(e) => updateFilter('income', { ...filters.income, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Other Income
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.remarks}
                        onChange={(e) => updateFilter('remarks', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Remarks</option>
                        {uniqueRemarks.map((remark) => (
                          <option key={remark} value={remark}>
                            {remark}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.insuranceExpense.min}
                          onChange={(e) => updateFilter('insuranceExpense', { ...filters.insuranceExpense, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.insuranceExpense.max}
                          onChange={(e) => updateFilter('insuranceExpense', { ...filters.insuranceExpense, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.repairsMaintenanceExpense.min}
                          onChange={(e) => updateFilter('repairsMaintenanceExpense', { ...filters.repairsMaintenanceExpense, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.repairsMaintenanceExpense.max}
                          onChange={(e) => updateFilter('repairsMaintenanceExpense', { ...filters.repairsMaintenanceExpense, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.taxesPermitsExpense.min}
                          onChange={(e) => updateFilter('taxesPermitsExpense', { ...filters.taxesPermitsExpense, min: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.taxesPermitsExpense.max}
                          onChange={(e) => updateFilter('taxesPermitsExpense', { ...filters.taxesPermitsExpense, max: e.target.value })}
                          className="w-16 px-1 py-1 text-xs bg-black/40 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                {/* Header Row */}
                <thead className="bg-black/40 sticky top-12 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Account Types
                    </th> */}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Plate #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Trip/Route
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Allowance
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ref #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fuel Liters
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fuel Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fuel Total
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Front Load
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Front Load Amt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Back Load
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Back Load Amt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Front & Back Amt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Income
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Other Income
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Insurance Exp
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Repairs & Maint Exp
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Taxes/Permits Exp
                    </th>
                    {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Salaries/Allowance
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-black/20 divide-y divide-white/10">
                  {filteredTrips.map((trip, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-400">
                        {index + 1}
                      </td>
                      {/* <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.account_types.length > 0 ? trip.account_types.join(', ') : '-'}
                      </td> */}
                      <td className="px-3 py-2 whitespace-nowrap text-white font-medium">
                        {trip.plate_number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.date}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.trip_route || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.driver || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-right" style={{textAlign: 'right'}}>
                        {trip.allowance > 0 ? formatCurrency(trip.allowance) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.reference_numbers.length > 0 ? trip.reference_numbers.join(', ') : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-right" style={{textAlign: 'right'}}>
                        {trip.fuel_liters > 0 ? trip.fuel_liters.toFixed(2) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-right" style={{textAlign: 'right'}}>
                        {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-orange-400 font-medium text-right" style={{textAlign: 'right'}}>
                        {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.front_load || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-blue-400 font-medium text-right" style={{textAlign: 'right'}}>
                        {trip.front_load_amount > 0 ? formatCurrency(trip.front_load_amount) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.back_load || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-green-400 font-medium text-right" style={{textAlign: 'right'}}>
                        {trip.back_load_amount > 0 ? formatCurrency(trip.back_load_amount) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-purple-400 font-bold text-right" style={{textAlign: 'right'}}>
                        {trip.front_and_back_load_amount > 0 ? formatCurrency(trip.front_and_back_load_amount) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-green-400 font-bold text-right" style={{textAlign: 'right'}}>
                        {trip.income > 0 ? formatCurrency(trip.income) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-yellow-400 font-bold text-right" style={{textAlign: 'right'}}>
                        {trip.other_income > 0 ? formatCurrency(trip.other_income) : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-300 max-w-xs truncate">
                        {trip.remarks || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                        {trip.insurance_expense > 0 ? formatCurrency(trip.insurance_expense) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                        {trip.repairs_maintenance_expense > 0 ? formatCurrency(trip.repairs_maintenance_expense) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                        {trip.taxes_permits_licenses_expense > 0 ? formatCurrency(trip.taxes_permits_licenses_expense) : '-'}
                      </td>
                      {/* <td className="px-3 py-2 whitespace-nowrap text-red-400">
                        {trip.salaries_allowance > 0 ? formatCurrency(trip.salaries_allowance) : '-'}
                      </td> */}
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-black/40 font-bold">
                    <td colSpan={6} className="px-3 py-3 text-right text-white">
                      TOTALS:
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-white text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.allowance)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-white text-right" style={{textAlign: 'right'}}>
                      {totals.fuel_liters.toFixed(2)}
                    </td>
                    <td className="px-3 py-3"></td>

                    <td className="px-3 py-3 whitespace-nowrap text-orange-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.fuel_total)}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 whitespace-nowrap text-blue-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.front_load_amount)}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 whitespace-nowrap text-green-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.back_load_amount)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-purple-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.front_and_back_load_amount)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-green-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.income)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-yellow-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.other_income)}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.insurance_expense)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.repairs_maintenance_expense)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-red-400 text-right" style={{textAlign: 'right'}}>
                      {formatCurrency(totals.taxes_permits_licenses_expense)}
                    </td>
                    {/* <td className="px-3 py-3 whitespace-nowrap text-red-400">
                      {formatCurrency(totals.salaries_allowance)}
                    </td> */}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

