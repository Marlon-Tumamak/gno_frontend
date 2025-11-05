'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SkeletonLoader from '@/components/SkeletonLoader';
import TransferModal from '@/components/TransferModal';
import { Toaster, toast } from 'react-hot-toast';

interface DriverObject {
  id?: number;
  name: string;
}

interface RouteObject {
  id?: number;
  name: string;
}

interface TruckObject {
  id: number;
  plate_number: string;
  truck_type: {
    id: number;
    name: string;
  } | null;
  company: string | null;
}

interface TruckingRecord {
  id: number;
  account_number: string;
  account_type: string | { id: number; name: string };
  truck_type?: string; // deprecated, use truck.truck_type instead
  plate_number?: string | null; // deprecated, use truck.plate_number instead
  truck?: TruckObject | null;
  description: string;
  debit: number;
  credit: number;
  final_total: number;
  remarks: string;
  reference_number: string | null;
  date: string;
  quantity: number | null;
  price: number | null;
  driver?: string | DriverObject | null;
  route?: string | RouteObject | null;
  front_load: string | { id: number; name: string } | null;
  back_load: string | { id: number; name: string } | null;
}

interface Trip {
  plate_number: string;
  truck_type: string;
  company: string;
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
  remarks_array: string[]; // Array to store all remarks for combining
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
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loadTypes, setLoadTypes] = useState<{ id: number; name: string }[]>([]);

  // Drag and drop state for allowance transfer
  const [draggedAllowance, setDraggedAllowance] = useState<{ trip: Trip; index: number } | null>(null);
  const [targetTripInfo, setTargetTripInfo] = useState<{ plateNumber: string; date: string } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDetails, setTransferDetails] = useState<{
    source: { plateNumber: string; date: string; entries: any[] };
    target: { plateNumber: string; date: string; entries: any[] };
  } | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);


  // Filter states for all columns
  const [filters, setFilters] = useState({
    plateNumber: '',
    date: '',
    month: '', // Month filter (YYYY-MM format)
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
    remarks: ''
  });


  useEffect(() => {
    fetchTripsData();
    fetchLoadTypes();
  }, []);


  const fetchLoadTypes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/load-types/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch load types');
      }
      
      const data = await response.json();
      setLoadTypes(data);
    } catch (err) {
      console.error('Error fetching load types:', err);
      // Don't set error state, just log it - we'll fall back to unique values
    }
  };

  // Reset truck filter when truck type or company changes
  useEffect(() => {
    if (selectedTruckType !== 'all' || selectedCompany !== 'all') {
      // Check if current selected truck is still valid for the new truck type/company
      const validTrucks = tripsData?.trips
        .filter(trip => {
          const truckTypeMatch = selectedTruckType === 'all' || trip.truck_type === selectedTruckType;
          const companyMatch = selectedCompany === 'all' || trip.company === selectedCompany;
          return truckTypeMatch && companyMatch;
        })
        .map(trip => trip.plate_number) || [];
      
      if (selectedTruck !== 'all' && !validTrucks.includes(selectedTruck)) {
        setSelectedTruck('all');
      }
    }
  }, [selectedTruckType, selectedCompany, selectedTruck, tripsData]);

  // Filter update functions
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle updating trip route, driver, front load, or back load in a row
  const handleTripFieldUpdate = async (
    trip: Trip, 
    field: 'trip_route' | 'driver' | 'front_load' | 'back_load', 
    value: string
  ) => {
    if (!tripsData) return;
    
    // Store original state for rollback on error
    const originalTripsData = tripsData;
    
    // Find the trip in the original tripsData using plate_number and date as unique identifier
    const updatedTrips = tripsData.trips.map(t => {
      if (t.plate_number === trip.plate_number && t.date === trip.date) {
        const updatedTrip = { ...t };
        const newValue = value === '' ? '' : value;
        
        if (field === 'trip_route') {
          updatedTrip.trip_route = newValue;
        } else if (field === 'driver') {
          updatedTrip.driver = newValue;
        } else if (field === 'front_load') {
          updatedTrip.front_load = newValue;
        } else if (field === 'back_load') {
          updatedTrip.back_load = newValue;
        }
        
        return updatedTrip;
      }
      return t;
    });
    
    // Update local state immediately for responsive UI (optimistic update)
    setTripsData({
      ...tripsData,
      trips: updatedTrips
    });
    
    // Update backend asynchronously without page reload
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      
      // Normalize date to YYYY-MM-DD format
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return '';
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      };
      
      const normalizedDate = normalizeDate(trip.date);
      
      const response = await fetch(`${apiUrl}/api/v1/trips/update-field/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate_number: trip.plate_number,
          date: normalizedDate,
          field: field,
          value: value === '' ? '' : value
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update trip field' }));
        throw new Error(errorData.error || 'Failed to update trip field');
      }
      
      const result = await response.json();
      
      // Show success toast (silent update, no need for loud notification)
      // toast.success(result.message || `Successfully updated ${field}`);
      
    } catch (err) {
      // Revert local state on error
      setTripsData(originalTripsData);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip field';
      toast.error(errorMessage);
      console.error('Error updating trip field:', err);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      plateNumber: '',
      date: '',
      month: '',
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
      remarks: ''
    });
    setSelectedTruck('all');
    setSelectedTruckType('all');
    setSelectedCompany('all');
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedTruck !== 'all' || 
           selectedTruckType !== 'all' ||
           selectedCompany !== 'all' ||
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

  const getDriverName = (driver: string | DriverObject | null | undefined): string => {
    if (!driver) return '';
    if (typeof driver === 'string') return driver;
    if (typeof driver === 'object' && driver !== null && 'name' in driver) {
      return driver.name;
    }
    return '';
  };

  const getRouteName = (route: string | RouteObject | null | undefined): string => {
    if (!route) return '';
    if (typeof route === 'string') return route;
    if (typeof route === 'object' && route !== null && 'name' in route) {
      return route.name;
    }
    return '';
  };

  const getAccountTypeName = (accountType: string | { id: number; name: string } | null | undefined): string => {
    if (!accountType) return '';
    if (typeof accountType === 'string') return accountType;
    if (typeof accountType === 'object' && accountType !== null && 'name' in accountType) {
      return accountType.name;
    }
    return '';
  };

  const getLoadTypeName = (loadType: string | { id: number; name: string } | null | undefined): string => {
    if (!loadType) return '';
    if (typeof loadType === 'string') return loadType;
    if (typeof loadType === 'object' && loadType !== null && 'name' in loadType) {
      return loadType.name;
    }
    return '';
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
      // Use truck object if available, fallback to old fields for backward compatibility
      let plateNumber = 'NO_PLATE';
      let truckType = '';
      let company = '';
      
      if (record.truck && record.truck.plate_number) {
        plateNumber = standardizePlateNumber(record.truck.plate_number);
        truckType = record.truck.truck_type?.name || '';
        company = record.truck.company || '';
      } else if (record.plate_number && record.plate_number.trim() !== '' && record.plate_number.toLowerCase() !== 'nan') {
        plateNumber = standardizePlateNumber(record.plate_number);
        truckType = record.truck_type || '';
        company = '';
      }

      const date = record.date;
      const tripKey = `${plateNumber}_${date}`;

      // Initialize trip if not exists
      if (!tripMap.has(tripKey)) {
        tripMap.set(tripKey, {
          plate_number: plateNumber === 'NO_PLATE' ? 'No Plate Number' : plateNumber,
          truck_type: truckType,
          company: company,
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
          remarks_array: [], // Array to collect all remarks
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
        trip.driver = getDriverName(record.driver);
      }
      if (!trip.trip_route && record.route) {
        trip.trip_route = getRouteName(record.route);
      }

      // Process based on account type
      const accountTypeName = getAccountTypeName(record.account_type);
      const accountTypeLower = accountTypeName.toLowerCase();

      // Collect remarks ONLY for specific account types (Fuel and Oil, Driver's Allowance, Hauling Income)
      // Check for these three account types specifically and exclude all others
      const isFuelAndOil = accountTypeLower.includes('fuel') && accountTypeLower.includes('oil');
      // Check for Driver's Allowance - handle both with and without apostrophe
      const isDriverAllowance = (accountTypeLower.includes('driver') && accountTypeLower.includes('allowance')) ||
                                accountTypeLower.includes("driver's allowance") ||
                                accountTypeLower.includes("drivers allowance");
      // Check for Hauling Income
      const isHaulingIncome = accountTypeLower.includes('hauling') && accountTypeLower.includes('income');
      
      // Only collect remarks for these three specific account types, exclude everything else
      const shouldCollectRemarks = isFuelAndOil || isDriverAllowance || isHaulingIncome;
      
      // Only collect remarks for the three specified account types, exclude all others
      if (shouldCollectRemarks) {
        if (record.remarks && record.remarks.trim() !== '') {
          // Add remark if not already in array (to avoid duplicates)
          const trimmedRemark = record.remarks.trim();
          if (!trip.remarks_array.includes(trimmedRemark)) {
            trip.remarks_array.push(trimmedRemark);
          }
        }
      }

      if (accountTypeLower.includes('hauling income')) {
        // Check if this is Rice Hull Ton - if so, treat as front_load
        const isRiceHullTon = record.remarks && record.remarks.toLowerCase().includes('rice hull ton');
        
        if (isRiceHullTon) {
          // Treat Rice Hull Ton as front_load
          trip.front_load = 'Rice Hull Ton';
          trip.front_load_amount += finalTotal;
          if (record.reference_number && !trip.front_load_reference_numbers.includes(record.reference_number)) {
            trip.front_load_reference_numbers.push(record.reference_number);
          }
          // Don't add to income or other_income since it's now treated as front_load
        } else {
          // Add hauling income to trip income (excluding Rice Hull Ton)
          trip.income += finalTotal;
        }
        
        // Handle Hauling Income - loads (only if not Rice Hull Ton)
        if (!isRiceHullTon) {
        const frontLoadName = getLoadTypeName(record.front_load);
        const backLoadName = getLoadTypeName(record.back_load);
        
        const hasFrontLoad = frontLoadName && 
          frontLoadName.trim() !== '' && 
          frontLoadName.toLowerCase() !== 'nan' &&
          frontLoadName.toLowerCase() !== 'n' &&
          frontLoadName.toLowerCase() !== 'none';
        
        const hasBackLoad = backLoadName && 
          backLoadName.trim() !== '' && 
          backLoadName.toLowerCase() !== 'nan' &&
          backLoadName.toLowerCase() !== 'none';

        // Special case: If front_load is "Strike", all amount goes to back_load
        if (hasFrontLoad && frontLoadName.toLowerCase() === 'strike') {
          // Strike case - all amount goes to back load, front load amount stays 0
          trip.back_load_amount += finalTotal;
          trip.front_load = frontLoadName;
          trip.back_load = backLoadName;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasFrontLoad && hasBackLoad) {
          // Both loads present - split amount
          const halfAmount = finalTotal / 2;
          trip.front_load_amount += halfAmount;
          trip.back_load_amount += halfAmount;
          
          trip.front_load = frontLoadName;
          trip.back_load = backLoadName;
          if (record.reference_number && !trip.front_load_reference_numbers.includes(record.reference_number)) {
            trip.front_load_reference_numbers.push(record.reference_number);
          }
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasFrontLoad) {
          // Only front load
          trip.front_load_amount += finalTotal;
          trip.front_load = frontLoadName;
          if (record.reference_number && !trip.front_load_reference_numbers.includes(record.reference_number)) {
            trip.front_load_reference_numbers.push(record.reference_number);
          }
        } else if (hasBackLoad) {
          // Only back load
          trip.back_load_amount += finalTotal;
          trip.back_load = backLoadName;
          if (record.reference_number && !trip.back_load_reference_numbers.includes(record.reference_number)) {
            trip.back_load_reference_numbers.push(record.reference_number);
            }
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
      }

      // Combine all collected remarks at the end
      // For now, we'll set the combined remarks string after processing all records
    });

    // Check for fuel inconsistencies - records with same date/plate but different fuel amounts
    const fuelRecordsByTrip = new Map<string, TruckingRecord[]>();
    
    data.forEach((record) => {
      if (record.description && record.description.toLowerCase().includes('beginning balance')) {
        return;
      }
      
      const accountTypeName = getAccountTypeName(record.account_type);
      const accountTypeLower = accountTypeName.toLowerCase();
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

    // Calculate front_and_back_load_amount and combine remarks
    const trips = Array.from(tripMap.values()).map(trip => {
      trip.front_and_back_load_amount = trip.front_load_amount + trip.back_load_amount;
      
      // Keep remarks as array for bullet point display
      if (trip.remarks_array.length > 0) {
        // Remove duplicates and filter out empty strings
        const uniqueRemarks = Array.from(new Set(trip.remarks_array.filter(r => r && r.trim() !== '')));
        trip.remarks_array = uniqueRemarks; // Keep as array for bullet rendering
        trip.remarks = uniqueRemarks.join('\n'); // Also keep as string for backward compatibility
      } else {
        // Fallback to original remarks if no remarks were collected in array
        trip.remarks = trip.remarks || '';
        trip.remarks_array = trip.remarks ? [trip.remarks] : [];
      }
      
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

  // Fetch allowance entries for a specific plate number and date from trucking endpoint
  const fetchAllowanceEntries = async (plateNumber: string, date: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/trucking/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucking data');
      }
      
      const allRecords: TruckingRecord[] = await response.json();
      
      // Filter by account type "Driver's Allowance", plate number and date
      const standardizedPlate = standardizePlateNumber(plateNumber);
      
      // Normalize date format - convert to YYYY-MM-DD for comparison
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return '';
        // If already in YYYY-MM-DD format, return as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        // Try to parse other formats (MM/DD/YYYY, etc.)
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      };
      
      const normalizedDate = normalizeDate(date);
      
      const filtered = allRecords.filter(record => {
        // Check if it's a Driver's Allowance account type
        const accountTypeName = getAccountTypeName(record.account_type);
        const isDriverAllowance = accountTypeName.toLowerCase().includes('driver') && 
                                  accountTypeName.toLowerCase().includes('allowance');
        
        if (!isDriverAllowance) return false;
        
        // Handle plate_number - check both truck object and old plate_number field
        let entryPlate: string | null = null;
        
        if (record.truck && record.truck.plate_number) {
          entryPlate = record.truck.plate_number;
        } else if (record.plate_number && record.plate_number.trim() !== '' && record.plate_number.toLowerCase() !== 'nan') {
          entryPlate = record.plate_number;
        }
        
        if (!entryPlate) return false;
        
        const standardizedEntryPlate = standardizePlateNumber(entryPlate);
        const plateMatch = standardizedEntryPlate === standardizedPlate;
        
        // Handle date - normalize both dates for comparison
        const entryDate = record.date || '';
        const normalizedEntryDate = normalizeDate(entryDate);
        const dateMatch = normalizedEntryDate === normalizedDate;
        
        return plateMatch && dateMatch;
      });
      
      // Convert to format expected by modal (similar to allowance entries)
      const formattedEntries = filtered.map(record => ({
        id: record.id,
        account_number: record.account_number,
        reference_number: record.reference_number,
        date: record.date,
        description: record.description,
        remarks: record.remarks,
        final_total: record.final_total,
        debit: record.debit,
        credit: record.credit
      }));
      
      console.log('Fetching allowance entries:', {
        plateNumber,
        standardizedPlate,
        date,
        normalizedDate,
        totalRecords: allRecords.length,
        filteredCount: filtered.length,
        formattedCount: formattedEntries.length
      });
      
      return formattedEntries;
    } catch (err) {
      console.error('Error fetching allowance entries:', err);
      return [];
    }
  };

  // Handle drag start for allowance
  const handleAllowanceDragStart = (e: React.DragEvent, trip: Trip, index: number) => {
    if (trip.allowance > 0) {
      setDraggedAllowance({ trip, index });
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    }
  };

  // Handle drag over for date cells
  const handleDateDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on date cell
  const handleDateDrop = async (e: React.DragEvent, targetTrip: Trip, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedAllowance) return;
    
    const sourceTrip = draggedAllowance.trip;
    
    // Don't allow dropping on the same trip
    if (sourceTrip.plate_number === targetTrip.plate_number && sourceTrip.date === targetTrip.date) {
      setDraggedAllowance(null);
      return;
    }

    // Store target trip info for modal display
    setTargetTripInfo({
      plateNumber: targetTrip.plate_number,
      date: targetTrip.date
    });

    // Fetch source and target allowance entries
    setLoadingEntries(true);
    setShowTransferModal(true);
    
    try {
      const sourceEntries = await fetchAllowanceEntries(sourceTrip.plate_number, sourceTrip.date);
      const targetEntries = await fetchAllowanceEntries(targetTrip.plate_number, targetTrip.date);
      
      setTransferDetails({
        source: {
          plateNumber: sourceTrip.plate_number,
          date: sourceTrip.date,
          entries: sourceEntries
        },
        target: {
          plateNumber: targetTrip.plate_number,
          date: targetTrip.date,
          entries: targetEntries
        }
      });
    } catch (err) {
      console.error('Error fetching entries:', err);
      toast.error('Failed to load allowance entries');
      setShowTransferModal(false);
      setTargetTripInfo(null);
    } finally {
      setLoadingEntries(false);
      setDraggedAllowance(null);
    }
  };

  // Handle transfer confirmation
  const handleTransferConfirm = async (details: typeof transferDetails) => {
    if (!details) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      
      // Normalize dates to YYYY-MM-DD format
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return '';
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      };
      
      const sourceDate = normalizeDate(details.source.date);
      const targetDate = normalizeDate(details.target.date);
      
      // Get entry IDs to transfer
      const entryIds = details.source.entries.map(entry => entry.id).filter(id => id);
      
      const response = await fetch(`${apiUrl}/api/v1/allowance/transfer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_plate_number: details.source.plateNumber,
          source_date: sourceDate,
          target_plate_number: details.target.plateNumber,
          target_date: targetDate,
          entry_ids: entryIds.length > 0 ? entryIds : undefined
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to transfer allowance entries' }));
        throw new Error(errorData.error || 'Failed to transfer allowance entries');
      }
      
      const result = await response.json();
      
      toast.success(result.message || `Successfully transferred ${result.transferred_count} allowance entries`);
      
      // Refresh trips data
      await fetchTripsData();
      
      // Close modal
      setShowTransferModal(false);
      setTransferDetails(null);
      setTargetTripInfo(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer allowance entries';
      toast.error(errorMessage);
      throw err; // Re-throw to let modal handle loading state
    }
  };

  if (loading) {
    return <SkeletonLoader variant="trips" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="glass-effect rounded-2xl p-8 elevated-box">
              <div className="text-center">
                <div className="text-red-600 text-xl font-bold mb-4">Error</div>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={fetchTripsData}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="glass-effect rounded-2xl p-8 elevated-box">
              <div className="text-center text-gray-600">No trips data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get unique truck types
  const uniqueTruckTypes = Array.from(new Set(tripsData.trips.map(trip => trip.truck_type))).sort();
  
  // Get unique companies
  const uniqueCompanies = Array.from(new Set(tripsData.trips
    .map(trip => trip.company)
    .filter(company => company && company.trim() !== '')
  )).sort();
  
  // Get unique truck plate numbers based on selected truck type and company
  const uniqueTrucks = (selectedTruckType === 'all' && selectedCompany === 'all')
    ? Array.from(new Set(tripsData.trips.map(trip => trip.plate_number))).sort()
    : Array.from(new Set(tripsData.trips
        .filter(trip => {
          const truckTypeMatch = selectedTruckType === 'all' || trip.truck_type === selectedTruckType;
          const companyMatch = selectedCompany === 'all' || trip.company === selectedCompany;
          return truckTypeMatch && companyMatch;
        })
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

  // Helper function to check if a trip has any meaningful data
  const hasMeaningfulData = (trip: Trip): boolean => {
    // Check if any data column has a value
    // Filter out rows where all data columns are empty/zero
    return (
      trip.allowance > 0 ||
      trip.fuel_liters > 0 ||
      trip.fuel_price > 0 ||
      trip.front_load_amount > 0 ||
      trip.back_load_amount > 0 ||
      trip.front_and_back_load_amount > 0 ||
      trip.income > 0 ||
      trip.other_income > 0 ||
      trip.salaries_allowance > 0 ||
      (trip.trip_route && trip.trip_route.trim() !== '') ||
      (trip.driver && trip.driver.trim() !== '') ||
      (trip.front_load && trip.front_load.trim() !== '') ||
      (trip.back_load && trip.back_load.trim() !== '') ||
      (trip.remarks && trip.remarks.trim() !== '') ||
      (trip.reference_numbers && trip.reference_numbers.length > 0)
    );
  };

  // Filter trips based on all filters
  const filteredTrips = tripsData.trips.filter(trip => {
    // First, filter out trips with no meaningful data
    if (!hasMeaningfulData(trip)) {
      return false;
    }

    // Existing truck, truck type, and company filters
    const truckMatch = selectedTruck === 'all' || trip.plate_number === selectedTruck;
    const truckTypeMatch = selectedTruckType === 'all' || trip.truck_type === selectedTruckType;
    const companyMatch = selectedCompany === 'all' || trip.company === selectedCompany;
    
    // Dropdown filters (exact matches)
    const plateNumberMatch = !filters.plateNumber || trip.plate_number === filters.plateNumber;
    
    // Date filter - normalize dates for comparison (for exact date filtering)
    const normalizeDateForComparison = (dateStr: string): string => {
      if (!dateStr) return '';
      // If already in YYYY-MM-DD format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      // Try to parse other formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // If parsing fails, return as is
      }
      return dateStr;
    };
    
    const dateMatch = !filters.date || (() => {
      const normalizedFilterDate = normalizeDateForComparison(filters.date);
      const normalizedTripDate = normalizeDateForComparison(trip.date);
      // Check for exact match or if the trip date contains the filter date (for partial matches)
      return normalizedTripDate === normalizedFilterDate || 
             normalizedTripDate.includes(normalizedFilterDate) ||
             normalizedFilterDate.includes(normalizedTripDate);
    })();
    
    // Month filter - filter trips by selected month (YYYY-MM format)
    const monthMatch = !filters.month || (() => {
      try {
        const tripDate = new Date(trip.date);
        if (isNaN(tripDate.getTime())) return false;
        
        const tripYear = String(tripDate.getFullYear());
        const tripMonth = String(tripDate.getMonth() + 1).padStart(2, '0');
        const tripMonthYear = `${tripYear}-${tripMonth}`;
        
        return tripMonthYear === filters.month;
      } catch (e) {
        return false;
      }
    })();
    
    // Trip Route filter - handle "BLANK" option for null/empty values
    const tripRouteMatch = !filters.tripRoute || 
      (filters.tripRoute === 'BLANK' 
        ? (!trip.trip_route || trip.trip_route.trim() === '' || trip.trip_route === '-')
        : trip.trip_route === filters.tripRoute);
    
    const driverMatch = !filters.driver || trip.driver === filters.driver;
    const refNumberMatch = !filters.refNumber || trip.reference_numbers.includes(filters.refNumber);
    
    // Front Load filter - handle "BLANK" option for null/empty values
    const frontLoadMatch = !filters.frontLoad || 
      (filters.frontLoad === 'BLANK' 
        ? (!trip.front_load || trip.front_load.trim() === '' || trip.front_load === '-')
        : trip.front_load === filters.frontLoad);
    
    // Back Load filter - handle "BLANK" option for null/empty values
    const backLoadMatch = !filters.backLoad || 
      (filters.backLoad === 'BLANK' 
        ? (!trip.back_load || trip.back_load.trim() === '' || trip.back_load === '-')
        : trip.back_load === filters.backLoad);
    
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
    
    return truckMatch && truckTypeMatch && companyMatch && plateNumberMatch && dateMatch && monthMatch && tripRouteMatch && 
           driverMatch && refNumberMatch && frontLoadMatch && backLoadMatch && remarksMatch && allowanceMatch && 
           fuelLitersMatch && fuelAmountMatch && frontLoadAmountMatch && backLoadAmountMatch && 
           incomeMatch;
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
    salaries_allowance: 0
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      <style jsx>{`
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
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .responsive-container {
          max-width: 1280px;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 1536px) {
          .responsive-container {
            max-width: 95%;
          }
        }
        @media (min-width: 2560px) {
          .responsive-container {
            max-width: 98%;
          }
        }
      `}</style>
      <Navbar />
      <div className="pt-16 p-4 lg:p-8">
        <div className="responsive-container">
          {/* Header */}
          <div className="glass-effect rounded-2xl p-8 elevated-box mb-6">
            <div className="flex flex-col space-y-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-black mb-3">Trips Summary</h1>
                <p className="text-black text-lg">Consolidated view of all trips from trucking data (same date entries combined per truck)</p>
                <p className="text-sm text-black mt-2">
                  Total Trips: <span className="font-semibold text-black">{tripsData.total_trips}</span>
                  {(selectedTruck !== 'all' || selectedTruckType !== 'all' || selectedCompany !== 'all') && (
                    <span className="ml-2 text-orange-600 font-medium">
                      (Showing {filteredTrips.length} trips
                      {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                      {selectedTruckType !== 'all' && ` - ${selectedTruckType} type`}
                      {selectedCompany !== 'all' && ` - ${selectedCompany}`})
                    </span>
                  )}
                </p>
              </div>
              {/* Filters Section - At bottom of header card */}
              <div className="border-t border-gray-300 pt-6">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-stretch sm:items-end">
                  {hasActiveFilters() && (
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <div className="flex flex-col flex-1">
                    <label htmlFor="truck-filter" className="text-sm font-semibold text-black mb-2">
                      Filter by Truck
                    </label>
                    <select
                      id="truck-filter"
                      value={selectedTruck}
                      onChange={(e) => setSelectedTruck(e.target.value)}
                      className="px-4 py-3 border-2 border-orange-500 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-600 font-semibold cursor-pointer hover:border-orange-600 transition-all duration-200 w-full"
                    >
                      <option value="all">
                        {(selectedTruckType === 'all' && selectedCompany === 'all')
                          ? `All Trucks (${tripsData.total_trips} trips)` 
                          : `All ${selectedTruckType !== 'all' ? selectedTruckType : ''} ${selectedCompany !== 'all' ? selectedCompany : ''} Trucks (${uniqueTrucks.length} trucks)`.trim()
                        }
                      </option>
                      {uniqueTrucks.map((truck) => {
                        const truckTrips = tripsData.trips.filter(t => 
                          t.plate_number === truck && 
                          (selectedTruckType === 'all' || t.truck_type === selectedTruckType) &&
                          (selectedCompany === 'all' || t.company === selectedCompany)
                        );
                        return (
                          <option key={truck} value={truck}>
                            {truck} ({truckTrips.length} trips)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="truck-type-filter" className="text-sm font-semibold text-black mb-2">
                      Filter by Truck Type
                    </label>
                    <select
                      id="truck-type-filter"
                      value={selectedTruckType}
                      onChange={(e) => setSelectedTruckType(e.target.value)}
                      className="px-4 py-3 border-2 border-orange-500 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-600 font-semibold cursor-pointer hover:border-orange-600 transition-all duration-200 w-full"
                    >
                      <option value="all">All Types ({tripsData.total_trips} trips)</option>
                      {uniqueTruckTypes.map((truckType) => {
                        const truckTypeTrips = tripsData.trips.filter(t => 
                          t.truck_type === truckType &&
                          (selectedCompany === 'all' || t.company === selectedCompany)
                        );
                        return (
                          <option key={truckType} value={truckType}>
                            {truckType} ({truckTypeTrips.length} trips)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label htmlFor="company-filter" className="text-sm font-semibold text-black mb-2">
                      Filter by Company
                    </label>
                    <select
                      id="company-filter"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="px-4 py-3 border-2 border-orange-500 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-600 font-semibold cursor-pointer hover:border-orange-600 transition-all duration-200 w-full"
                    >
                      <option value="all">All Companies ({tripsData.total_trips} trips)</option>
                      {uniqueCompanies.map((company) => {
                        const companyTrips = tripsData.trips.filter(t => 
                          t.company === company &&
                          (selectedTruckType === 'all' || t.truck_type === selectedTruckType)
                        );
                        return (
                          <option key={company} value={company}>
                            {company} ({companyTrips.length} trips)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trips Table */}
          <div className="gradient-card rounded-2xl shadow-2xl border border-gray-200 overflow-hidden elevated-box">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-bold text-black mb-2">
                {(selectedTruck === 'all' && selectedTruckType === 'all' && selectedCompany === 'all') ? 'All Trips' : 'Filtered Trips'}
              </h2>
              {(selectedTruck !== 'all' || selectedTruckType !== 'all' || selectedCompany !== 'all') && (
                <p className="text-black">
                  Showing {filteredTrips.length} of {tripsData.total_trips} total trips
                  {selectedTruck !== 'all' && ` for ${selectedTruck}`}
                  {selectedTruckType !== 'all' && ` (${selectedTruckType} type)`}
                  {selectedCompany !== 'all' && ` - ${selectedCompany}`}
                </p>
              )}
              <p className="text-sm text-black mt-2 lg:hidden">
                📱 Scroll horizontally to see all columns on mobile
              </p>
          </div>
          
            <div className="overflow-x-auto overflow-y-auto max-h-[100vh]">
              <table className="w-full divide-y divide-gray-200 text-sm">
                {/* Filter Row */}
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                      <div className="flex flex-col gap-1">
                        <input
                          type="date"
                          value={filters.date}
                          onChange={(e) => updateFilter('date', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
                          placeholder="Select date"
                        />
                        {/* <input
                          type="month"
                          value={filters.month}
                          onChange={(e) => updateFilter('month', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
                          placeholder="Select month"
                        /> */}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <select
                        value={filters.tripRoute}
                        onChange={(e) => updateFilter('tripRoute', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-black/40 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">All Routes</option>
                        <option value="BLANK">Blank</option>
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
                        <option value="BLANK">Blank</option>
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
                        <option value="BLANK">Blank</option>
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[300px]">
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
                  </tr>
                </thead>
                {/* Header Row */}
                <thead className="bg-white sticky top-12 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Account Types
                    </th> */}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Plate #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trip/Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Allowance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ref #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fuel Liters
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fuel Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Fuel Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Front Load
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Front Load Amt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Back Load
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Back Load Amt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Front & Back Amt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Income
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[300px]">
                      Remarks
                    </th>
                    {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Salaries/Allowance
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrips.map((trip, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3 whitespace-nowrap text-black font-medium">
                        {index + 1}
                      </td>
                      {/* <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                        {trip.account_types.length > 0 ? trip.account_types.join(', ') : '-'}
                      </td> */}
                      <td className="px-4 py-3 whitespace-nowrap text-black font-semibold">
                        {trip.plate_number}
                      </td>
                      <td 
                        className="px-4 py-3 whitespace-nowrap text-black"
                        onDragOver={handleDateDragOver}
                        onDrop={(e) => handleDateDrop(e, trip, index)}
                        style={{ cursor: draggedAllowance ? 'copy' : 'default' }}
                      >
                        {trip.date}
                      </td>
                      <td className="px-4 py-3 text-black min-w-[150px]">
                        <select
                          value={trip.trip_route || ''}
                          onChange={(e) => handleTripFieldUpdate(trip, 'trip_route', e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          style={{ width: '100%', minWidth: '120px' }}
                        >
                          <option value="">Blank</option>
                          {uniqueTripRoutes.map((route) => (
                            <option key={route} value={route}>
                              {route}
                            </option>
                          ))}
                          {/* Add current value if it's not in the unique list */}
                          {trip.trip_route && !uniqueTripRoutes.includes(trip.trip_route) && (
                            <option value={trip.trip_route}>{trip.trip_route}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-black min-w-[150px]">
                        <select
                          value={trip.driver || ''}
                          onChange={(e) => handleTripFieldUpdate(trip, 'driver', e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          style={{ width: '100%', minWidth: '120px' }}
                        >
                          <option value="">Blank</option>
                          {uniqueDrivers.map((driver) => (
                            <option key={driver} value={driver}>
                              {driver}
                            </option>
                          ))}
                          {/* Add current value if it's not in the unique list */}
                          {trip.driver && !uniqueDrivers.includes(trip.driver) && (
                            <option value={trip.driver}>{trip.driver}</option>
                          )}
                        </select>
                      </td>
                      <td 
                        className={`px-4 py-3 whitespace-nowrap text-black text-right ${trip.allowance > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        draggable={trip.allowance > 0}
                        onDragStart={(e) => handleAllowanceDragStart(e, trip, index)}
                        style={{ 
                          userSelect: trip.allowance > 0 ? 'none' : 'auto',
                          opacity: draggedAllowance?.index === index ? 0.5 : 1
                        }}
                      >
                        {trip.allowance > 0 ? formatCurrency(trip.allowance) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-black">
                        {trip.reference_numbers.length > 0 ? trip.reference_numbers.join(', ') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-black text-right">
                        {trip.fuel_liters > 0 ? trip.fuel_liters.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-black text-right">
                        {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-orange-600 font-semibold text-right">
                        {trip.fuel_price > 0 ? formatCurrency(trip.fuel_price) : '-'}
                      </td>
                      <td className="px-4 py-3 text-black min-w-[150px]">
                        <select
                          value={trip.front_load || ''}
                          onChange={(e) => handleTripFieldUpdate(trip, 'front_load', e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          style={{ width: '100%', minWidth: '120px' }}
                        >
                          <option value="">Blank</option>
                          {loadTypes.map((loadType: { id: number; name: string }) => (
                            <option key={loadType.id} value={loadType.name}>
                              {loadType.name}
                            </option>
                          ))}
                          {/* Add current value if it's not in the load types list */}
                          {trip.front_load && !loadTypes.some((lt: { id: number; name: string }) => lt.name === trip.front_load) && (
                            <option value={trip.front_load}>{trip.front_load}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-blue-600 font-semibold text-right">
                        {trip.front_load_amount > 0 ? formatCurrency(trip.front_load_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-black min-w-[150px]">
                        <select
                          value={trip.back_load || ''}
                          onChange={(e) => handleTripFieldUpdate(trip, 'back_load', e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          style={{ width: '100%', minWidth: '120px' }}
                        >
                          <option value="">Blank</option>
                          {loadTypes.map((loadType: { id: number; name: string }) => (
                            <option key={loadType.id} value={loadType.name}>
                              {loadType.name}
                            </option>
                          ))}
                          {/* Add current value if it's not in the load types list */}
                          {trip.back_load && !loadTypes.some((lt: { id: number; name: string }) => lt.name === trip.back_load) && (
                            <option value={trip.back_load}>{trip.back_load}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-600 font-semibold text-right">
                        {trip.back_load_amount > 0 ? formatCurrency(trip.back_load_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-purple-600 font-bold text-right">
                        {trip.front_and_back_load_amount > 0 ? formatCurrency(trip.front_and_back_load_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-600 font-bold text-right">
                        {trip.income > 0 ? formatCurrency(trip.income) : '-'}
                      </td>
                      <td className="px-4 py-3 text-black min-w-[300px] max-w-2xl whitespace-normal">
                        {trip.remarks_array && trip.remarks_array.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {trip.remarks_array.map((remark, idx) => (
                              <li key={idx} className="break-words">
                                {remark}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '-'
                        )}
                      </td>
                      {/* <td className="px-3 py-2 whitespace-nowrap text-red-400">
                        {trip.salaries_allowance > 0 ? formatCurrency(trip.salaries_allowance) : '-'}
                      </td> */}
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
                    <td colSpan={5} className="px-4 py-4 text-right text-black">
                      TOTALS:
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-black text-right">
                      {formatCurrency(totals.allowance)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-black text-right">
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-black text-right">
                      {totals.fuel_liters.toFixed(2)}
                    </td>
                    <td className="px-4 py-4"></td>

                    <td className="px-4 py-4 whitespace-nowrap text-orange-600 text-right">
                      {formatCurrency(totals.fuel_total)}
                    </td>
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4 whitespace-nowrap text-blue-600 text-right">
                      {formatCurrency(totals.front_load_amount)}
                    </td>
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4 whitespace-nowrap text-green-600 text-right">
                      {formatCurrency(totals.back_load_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-purple-600 text-right">
                      {formatCurrency(totals.front_and_back_load_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-green-600 text-right">
                      {formatCurrency(totals.income)}
                    </td>
                    <td className="px-4 py-4"></td>
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

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        transferDetails={transferDetails}
        loadingEntries={loadingEntries}
        sourcePlateNumber={draggedAllowance?.trip?.plate_number || transferDetails?.source?.plateNumber}
        sourceDate={draggedAllowance?.trip?.date || transferDetails?.source?.date}
        targetPlateNumber={targetTripInfo?.plateNumber || transferDetails?.target?.plateNumber}
        targetDate={targetTripInfo?.date || transferDetails?.target?.date}
        onClose={() => {
          setShowTransferModal(false);
          setTransferDetails(null);
          setDraggedAllowance(null);
          setTargetTripInfo(null);
        }}
        onConfirm={handleTransferConfirm}
      />
    </div>
  );
}

