'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface AccountEntry {
  id: number;
  account_number: string;
  truck_type: string;
  account_type: string;
  plate_number: string;
  debit: number;
  credit: number;
  final_total: number;
  reference_number: string;
  date: string;
  description: string;
  remarks: string;
  driver?: string;
  route?: string;
  liters?: number;
  price?: number;
  front_load?: string;
  back_load?: string;
  quantity?: number;
}

interface AccountDetail {
  name: string;
  entries: AccountEntry[];
}

interface AccountsDetail {
  accounts: {
    [key: string]: AccountDetail;
  };
}

export default function AccountsDetailPage() {
  const [accountsData, setAccountsData] = useState<AccountsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('repair_maintenance');
  const [selectedPlateNumber, setSelectedPlateNumber] = useState<string>('all');
  const [showAllAccounts, setShowAllAccounts] = useState<boolean>(false);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/accounts/detail/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts detail data');
      }
      
      const data = await response.json();
      setAccountsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  const getAccountColor = (accountType: string) => {
    const colorMap: { [key: string]: string } = {
      repair_maintenance: 'bg-blue-50 border-blue-200 text-blue-800',
      insurance: 'bg-green-50 border-green-200 text-green-800',
      fuel: 'bg-orange-50 border-orange-200 text-orange-800',
      tax: 'bg-red-50 border-red-200 text-red-800',
      allowance: 'bg-purple-50 border-purple-200 text-purple-800',
      income: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };
    return colorMap[accountType] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  // Get unique plate numbers from all accounts
  const getUniquePlateNumbers = () => {
    if (!accountsData) return [];
    const plateNumbers = new Set<string>();
    Object.values(accountsData.accounts).forEach(account => {
      account.entries.forEach(entry => {
        if (entry.plate_number) {
          plateNumbers.add(entry.plate_number);
        }
      });
    });
    return Array.from(plateNumbers).sort();
  };

  // Filter entries based on selected plate number
  const getFilteredEntries = (entries: AccountEntry[]) => {
    if (selectedPlateNumber === 'all') return entries;
    return entries.filter(entry => entry.plate_number === selectedPlateNumber);
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
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center">
                <div className="text-red-400 text-lg font-semibold mb-4">Error</div>
                <p className="text-gray-300">{error}</p>
                <button
                  onClick={fetchAccountsData}
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

  if (!accountsData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center text-gray-300">No accounts detail data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentAccount = accountsData.accounts[selectedAccount];
  const filteredEntries = currentAccount ? getFilteredEntries(currentAccount.entries) : [];
  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const totalFinal = filteredEntries.reduce((sum, entry) => sum + entry.final_total, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
      <Navbar />
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Accounts Detail</h1>
                <p className="text-gray-300">Detailed view of all account entries</p>
              </div>
              {/* <div className="flex space-x-4">
                <Link
                  href="/accounts"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Back to Summary
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Dashboard
                </Link>
                <button
                  onClick={fetchAccountsData}
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Refresh Data
                </button>
              </div> */}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 drop-shadow-lg">Filter Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plate Number Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Plate Number</label>
                <select
                  value={selectedPlateNumber}
                  onChange={(e) => setSelectedPlateNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-white/20 rounded-md bg-black/40 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                <option value="all">All Plate Numbers</option>
                {getUniquePlateNumbers().map(plateNumber => (
                  <option key={plateNumber} value={plateNumber}>{plateNumber}</option>
                ))}
              </select>
            </div>

              {/* All Accounts Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">View Options</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showAllAccounts}
                      onChange={(e) => setShowAllAccounts(e.target.checked)}
                      className="mr-2 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300">Show All Accounts Combined</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Type Selector */}
          {!showAllAccounts && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 drop-shadow-lg">Select Account Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(accountsData.accounts).map(([key, account]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAccount(key)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAccount === key
                        ? getAccountColor(key)
                        : 'bg-black/40 border-white/20 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-sm font-medium">{account.name}</div>
                    <div className="text-xs mt-1">{account.entries.length} entries</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Account Totals */}
          {!showAllAccounts && currentAccount && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Entries</div>
                <div className="text-2xl font-bold text-white">{filteredEntries.length}</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Debit</div>
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(totalDebit)}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Credit</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(totalCredit)}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Final</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(totalFinal)}
                </div>
              </div>
            </div>
          )}

          {/* All Accounts Combined Totals */}
          {showAllAccounts && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Entries</div>
                <div className="text-2xl font-bold text-white">
                  {Object.values(accountsData.accounts).reduce((sum, account) => 
                    sum + getFilteredEntries(account.entries).length, 0
                  )}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Debit</div>
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(
                    Object.values(accountsData.accounts).reduce((sum, account) => 
                      sum + getFilteredEntries(account.entries).reduce((acc, entry) => acc + entry.debit, 0), 0
                    )
                  )}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Credit</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(
                    Object.values(accountsData.accounts).reduce((sum, account) => 
                      sum + getFilteredEntries(account.entries).reduce((acc, entry) => acc + entry.credit, 0), 0
                    )
                  )}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
                <div className="text-sm font-medium text-gray-300">Total Final</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(
                    Object.values(accountsData.accounts).reduce((sum, account) => 
                      sum + getFilteredEntries(account.entries).reduce((acc, entry) => acc + entry.final_total, 0), 0
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Entries Table */}
          {!showAllAccounts && currentAccount && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-black/40">
                <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                  {currentAccount.name} - Filtered Entries ({filteredEntries.length})
                  {selectedPlateNumber !== 'all' && ` for ${selectedPlateNumber}`}
                </h2>
              </div>
            
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Account #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Truck Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plate #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Final Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ref #
                      </th>
                      {selectedAccount === 'fuel' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Driver
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Route
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Liters
                          </th>
                        </>
                      )}
                      {selectedAccount === 'income' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Driver
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Route
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Quantity
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/20 divide-y divide-white/10">
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {entry.account_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {entry.truck_type}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-white font-medium">
                          {entry.plate_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {entry.date}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-400 font-medium">
                          {formatCurrency(entry.debit)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-400 font-medium">
                          {formatCurrency(entry.credit)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-white">
                          {formatCurrency(entry.final_total)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {entry.reference_number}
                        </td>
                        {selectedAccount === 'fuel' && (
                          <>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.driver || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.route || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.liters || '-'}
                            </td>
                          </>
                        )}
                        {selectedAccount === 'income' && (
                          <>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.driver || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.route || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {entry.quantity || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                          {entry.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Accounts Combined Table */}
          {showAllAccounts && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-black/40">
                <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                  All Accounts Combined - Filtered Entries
                  {selectedPlateNumber !== 'all' && ` for ${selectedPlateNumber}`}
                </h2>
              </div>
            
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Account Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Account #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Truck Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plate #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Final Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ref #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/20 divide-y divide-white/10">
                    {Object.entries(accountsData.accounts).flatMap(([accountKey, account]) => 
                      getFilteredEntries(account.entries).map((entry, index) => (
                        <tr key={`${accountKey}-${entry.id}`} className="hover:bg-white/5">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountColor(accountKey).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                              {account.name}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {entry.account_number}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {entry.truck_type}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-white font-medium">
                            {entry.plate_number}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {entry.date}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-red-400 font-medium">
                            {formatCurrency(entry.debit)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-green-400 font-medium">
                            {formatCurrency(entry.credit)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-white">
                            {formatCurrency(entry.final_total)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {entry.reference_number}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                            {entry.remarks}
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}



