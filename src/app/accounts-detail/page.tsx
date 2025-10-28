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
              <h1 className="text-4xl font-bold text-gray-800 mb-3">Accounts Detail</h1>
              <p className="text-gray-600 text-lg">Detailed view of all account entries</p>
            </div>
          </div>

          {/* Filter Options */}
          <div className="gradient-card rounded-2xl p-8 elevated-box mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Filter Options</h3>
                <p className="text-gray-600">Customize your view with filters and options</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">🔍</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plate Number Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Plate Number</label>
                <select
                  value={selectedPlateNumber}
                  onChange={(e) => setSelectedPlateNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="all">All Plate Numbers</option>
                  {getUniquePlateNumbers().map(plateNumber => (
                    <option key={plateNumber} value={plateNumber}>{plateNumber}</option>
                  ))}
                </select>
              </div>

              {/* All Accounts Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">View Options</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showAllAccounts}
                      onChange={(e) => setShowAllAccounts(e.target.checked)}
                      className="mr-2 w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Show All Accounts Combined</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Type Selector */}
          {!showAllAccounts && (
            <div className="gradient-card rounded-2xl p-8 elevated-box mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Select Account Type</h3>
                  <p className="text-gray-600">Choose an account type to view detailed entries</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(accountsData.accounts).map(([key, account]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAccount(key)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedAccount === key
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-lg'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-sm font-semibold">{account.name}</div>
                    <div className="text-xs mt-1 opacity-80">{account.entries.length} entries</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Account Totals */}
          {!showAllAccounts && currentAccount && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Entries Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Entries</h3>
                    <p className="text-gray-600 text-sm">Account entries</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {filteredEntries.length}
                </div>
              </div>

              {/* Total Debit Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Debit</h3>
                    <p className="text-gray-600 text-sm">Debit amounts</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <span className="text-white text-lg">📉</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebit)}
                </div>
              </div>

              {/* Total Credit Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Credit</h3>
                    <p className="text-gray-600 text-sm">Credit amounts</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <span className="text-white text-lg">📈</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCredit)}
                </div>
              </div>

              {/* Total Final Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Final</h3>
                    <p className="text-gray-600 text-sm">Final totals</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(totalFinal)}
                </div>
              </div>
            </div>
          )}

          {/* All Accounts Combined Totals */}
          {showAllAccounts && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Entries Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Entries</h3>
                    <p className="text-gray-600 text-sm">All account entries</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {Object.values(accountsData.accounts).reduce((sum, account) => 
                    sum + getFilteredEntries(account.entries).length, 0
                  )}
                </div>
              </div>

              {/* Total Debit Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Debit</h3>
                    <p className="text-gray-600 text-sm">All debit amounts</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <span className="text-white text-lg">📉</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    Object.values(accountsData.accounts).reduce((sum, account) => 
                      sum + getFilteredEntries(account.entries).reduce((acc, entry) => acc + entry.debit, 0), 0
                    )
                  )}
                </div>
              </div>

              {/* Total Credit Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Credit</h3>
                    <p className="text-gray-600 text-sm">All credit amounts</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <span className="text-white text-lg">📈</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    Object.values(accountsData.accounts).reduce((sum, account) => 
                      sum + getFilteredEntries(account.entries).reduce((acc, entry) => acc + entry.credit, 0), 0
                    )
                  )}
                </div>
              </div>

              {/* Total Final Card */}
              <div className="gradient-card rounded-2xl p-6 elevated-box">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Total Final</h3>
                    <p className="text-gray-600 text-sm">All final totals</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
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
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentAccount.name} - Filtered Entries ({filteredEntries.length})
                    {selectedPlateNumber !== 'all' && ` for ${selectedPlateNumber}`}
                  </h3>
                  <p className="text-gray-600">Detailed breakdown of account entries</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>
            
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plate #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ref #
                      </th>
                      {selectedAccount === 'fuel' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Driver
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Route
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Liters
                          </th>
                        </>
                      )}
                      {selectedAccount === 'income' && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Driver
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Route
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {entry.account_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {entry.truck_type}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {entry.plate_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {entry.date}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-medium">
                          {formatCurrency(entry.debit)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(entry.credit)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(entry.final_total)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {entry.reference_number}
                        </td>
                        {selectedAccount === 'fuel' && (
                          <>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.driver || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.route || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.liters || '-'}
                            </td>
                          </>
                        )}
                        {selectedAccount === 'income' && (
                          <>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.driver || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.route || '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                              {entry.quantity || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
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



