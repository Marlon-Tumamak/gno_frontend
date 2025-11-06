'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface TruckingRecord {
  id: number;
  account_number: string;
  account_type: string | { id: number; name: string };
  description: string;
  debit: number;
  credit: number;
  final_total: number;
  remarks: string;
  reference_number: string | null;
  date: string;
  quantity: number | null;
  price: number | null;
  driver?: string | { id?: number; name: string } | null;
  route?: string | { id?: number; name: string } | null;
  front_load: string | { id: number; name: string } | null;
  back_load: string | { id: number; name: string } | null;
}

interface TripDetailsModalProps {
  isOpen: boolean;
  trip: {
    plate_number: string;
    date: string;
    driver: string;
    trip_route: string;
  } | null;
  sourceRecords: TruckingRecord[];
  onClose: () => void;
  onUpdate?: (updatedRecords: TruckingRecord[], field: string, value: string) => void; // Callback to update parent state without reload
  uniqueDrivers?: string[];
  uniqueTripRoutes?: string[];
  loadTypes?: { id: number; name: string }[];
}

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

const getDriverName = (driver: string | { id?: number; name: string } | null | undefined): string => {
  if (!driver) return '';
  if (typeof driver === 'string') return driver;
  if (typeof driver === 'object' && driver !== null && 'name' in driver) {
    return driver.name;
  }
  return '';
};

const getRouteName = (route: string | { id?: number; name: string } | null | undefined): string => {
  if (!route) return '';
  if (typeof route === 'string') return route;
  if (typeof route === 'object' && route !== null && 'name' in route) {
    return route.name;
  }
  return '';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export default function TripDetailsModal({ 
  isOpen, 
  trip, 
  sourceRecords, 
  onClose, 
  onUpdate,
  uniqueDrivers = [],
  uniqueTripRoutes = [],
  loadTypes = []
}: TripDetailsModalProps) {
  const [localRecords, setLocalRecords] = useState<TruckingRecord[]>(sourceRecords);
  const [updatingField, setUpdatingField] = useState<{ recordId: number; field: string } | null>(null);

  // Update local records when sourceRecords changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalRecords(sourceRecords);
    }
  }, [sourceRecords, isOpen]);

  if (!isOpen || !trip) return null;

  const normalizeDate = (dateStr: string): string => {
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

  const handleFieldUpdate = async (
    record: TruckingRecord,
    field: 'trip_route' | 'driver' | 'front_load' | 'back_load',
    value: string
  ) => {
    setUpdatingField({ recordId: record.id, field });
    
    // Optimistically update local state
    const updatedRecords = localRecords.map(r => {
      if (r.id === record.id) {
        const updated = { ...r };
        if (field === 'driver') {
          updated.driver = value || null;
        } else if (field === 'trip_route') {
          updated.route = value || null;
        } else if (field === 'front_load') {
          updated.front_load = value || null;
        } else if (field === 'back_load') {
          updated.back_load = value || null;
        }
        return updated;
      }
      return r;
    });
    setLocalRecords(updatedRecords);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to update field' }));
        throw new Error(errorData.error || 'Failed to update field');
      }

      // Update parent state with new records without reloading
      if (onUpdate) {
        onUpdate(updatedRecords, field, value);
      }
    } catch (err) {
      // Revert on error
      setLocalRecords(sourceRecords);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update field';
      toast.error(errorMessage);
      console.error('Error updating field:', err);
    } finally {
      setUpdatingField(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Trip Details</h2>
              <p className="text-orange-100 text-sm mt-1">
                {trip.plate_number} • {trip.date}
                {trip.driver && ` • ${trip.driver}`}
                {trip.trip_route && ` • ${trip.trip_route}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-100 transition-colors duration-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 text-sm text-gray-600">
              Showing {sourceRecords.length} record{sourceRecords.length !== 1 ? 's' : ''} that make up this trip
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[300px]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localRecords.map((record, index) => {
                    const accountTypeName = getAccountTypeName(record.account_type);
                    const accountTypeLower = accountTypeName.toLowerCase();
                    const frontLoadName = getLoadTypeName(record.front_load);
                    const backLoadName = getLoadTypeName(record.back_load);
                    const driverName = getDriverName(record.driver);
                    const routeName = getRouteName(record.route);
                    const finalTotal = parseFloat(record.final_total.toString());
                    
                    // Calculate values based on account type (similar to trips page logic)
                    const isHaulingIncome = accountTypeLower.includes('hauling income');
                    const isRiceHullTon = record.remarks && record.remarks.toLowerCase().includes('rice hull ton');
                    const isFuelAndOil = accountTypeLower.includes('fuel') && accountTypeLower.includes('oil');
                    const isDriverAllowance = accountTypeLower.includes('driver') && accountTypeLower.includes('allowance');
                    
                    const hasFrontLoad = frontLoadName && 
                      frontLoadName.trim() !== '' && 
                      frontLoadName.toLowerCase() !== 'nan' &&
                      frontLoadName.toLowerCase() !== 'n' &&
                      frontLoadName.toLowerCase() !== 'none';
                    
                    const hasBackLoad = backLoadName && 
                      backLoadName.trim() !== '' && 
                      backLoadName.toLowerCase() !== 'nan' &&
                      backLoadName.toLowerCase() !== 'none';
                    
                    // Calculate front load amount
                    let frontLoadAmount = 0;
                    if (isHaulingIncome) {
                      if (isRiceHullTon) {
                        frontLoadAmount = finalTotal;
                      } else if (hasFrontLoad && frontLoadName.toLowerCase() === 'strike') {
                        frontLoadAmount = 0;
                      } else if (hasFrontLoad && hasBackLoad) {
                        frontLoadAmount = finalTotal / 2;
                      } else if (hasFrontLoad) {
                        frontLoadAmount = finalTotal;
                      } else if (!hasFrontLoad && !hasBackLoad) {
                        frontLoadAmount = finalTotal;
                      }
                    }
                    
                    // Calculate back load amount
                    let backLoadAmount = 0;
                    if (isHaulingIncome && !isRiceHullTon) {
                      if (hasFrontLoad && frontLoadName.toLowerCase() === 'strike') {
                        backLoadAmount = finalTotal;
                      } else if (hasFrontLoad && hasBackLoad) {
                        backLoadAmount = finalTotal / 2;
                      } else if (hasBackLoad) {
                        backLoadAmount = finalTotal;
                      }
                    }
                    
                    const frontAndBackAmount = frontLoadAmount + backLoadAmount;
                    
                    // Fuel calculations
                    const fuelLiters = isFuelAndOil ? (parseFloat((record.quantity || 0).toString())) : 0;
                    const fuelAmount = isFuelAndOil ? finalTotal : 0;
                    const fuelTotal = isFuelAndOil ? finalTotal : 0;
                    
                    // Allowance
                    const allowance = isDriverAllowance ? finalTotal : 0;
                    
                    return (
                      <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {trip.plate_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {record.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                          <select
                            value={routeName || ''}
                            onChange={(e) => handleFieldUpdate(record, 'trip_route', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingField?.recordId === record.id && updatingField?.field === 'trip_route'}
                            className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                            style={{ width: '100%', minWidth: '120px' }}
                          >
                            <option value="">Blank</option>
                            {uniqueTripRoutes.map((route) => (
                              <option key={route} value={route}>
                                {route}
                              </option>
                            ))}
                            {routeName && !uniqueTripRoutes.includes(routeName) && (
                              <option value={routeName}>{routeName}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                          <select
                            value={driverName || ''}
                            onChange={(e) => handleFieldUpdate(record, 'driver', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingField?.recordId === record.id && updatingField?.field === 'driver'}
                            className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                            style={{ width: '100%', minWidth: '120px' }}
                          >
                            <option value="">Blank</option>
                            {uniqueDrivers.map((driver) => (
                              <option key={driver} value={driver}>
                                {driver}
                              </option>
                            ))}
                            {driverName && !uniqueDrivers.includes(driverName) && (
                              <option value={driverName}>{driverName}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {allowance > 0 ? formatCurrency(allowance) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {record.reference_number || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {fuelLiters > 0 ? fuelLiters.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {fuelAmount > 0 ? formatCurrency(fuelAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-semibold text-right">
                          {fuelTotal > 0 ? formatCurrency(fuelTotal) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                          <select
                            value={frontLoadName || ''}
                            onChange={(e) => handleFieldUpdate(record, 'front_load', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingField?.recordId === record.id && updatingField?.field === 'front_load'}
                            className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                            style={{ width: '100%', minWidth: '120px' }}
                          >
                            <option value="">Blank</option>
                            {loadTypes.map((loadType) => (
                              <option key={loadType.id} value={loadType.name}>
                                {loadType.name}
                              </option>
                            ))}
                            {frontLoadName && !loadTypes.some((lt) => lt.name === frontLoadName) && (
                              <option value={frontLoadName}>{frontLoadName}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold text-right">
                          {frontLoadAmount > 0 ? formatCurrency(frontLoadAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                          <select
                            value={backLoadName || ''}
                            onChange={(e) => handleFieldUpdate(record, 'back_load', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingField?.recordId === record.id && updatingField?.field === 'back_load'}
                            className="w-full min-w-[120px] px-2 py-1 text-xs bg-white border border-gray-300 rounded text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                            style={{ width: '100%', minWidth: '120px' }}
                          >
                            <option value="">Blank</option>
                            {loadTypes.map((loadType) => (
                              <option key={loadType.id} value={loadType.name}>
                                {loadType.name}
                              </option>
                            ))}
                            {backLoadName && !loadTypes.some((lt) => lt.name === backLoadName) && (
                              <option value={backLoadName}>{backLoadName}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-semibold text-right">
                          {backLoadAmount > 0 ? formatCurrency(backLoadAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600 font-bold text-right">
                          {frontAndBackAmount > 0 ? formatCurrency(frontAndBackAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 min-w-[300px] max-w-2xl whitespace-normal">
                          <div className="break-words">{record.remarks || '-'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

