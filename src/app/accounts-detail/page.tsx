'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/accounts/detail/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts detail data');
      }
      
      const data = await response.json();
      setAccountsData(data);
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
                onClick={fetchAccountsData}
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

  if (!accountsData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-700">No accounts detail data available</div>
          </div>
        </div>
      </div>
    );
  }

  const currentAccount = accountsData.accounts[selectedAccount];
  const totalDebit = currentAccount?.entries.reduce((sum, entry) => sum + entry.debit, 0) || 0;
  const totalCredit = currentAccount?.entries.reduce((sum, entry) => sum + entry.credit, 0) || 0;
  const totalFinal = currentAccount?.entries.reduce((sum, entry) => sum + entry.final_total, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Detail</h1>
              <p className="text-gray-600">Detailed view of all account entries</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/accounts"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Summary
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={fetchAccountsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Account Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(accountsData.accounts).map(([key, account]) => (
              <button
                key={key}
                onClick={() => setSelectedAccount(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedAccount === key
                    ? getAccountColor(key)
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{account.name}</div>
                <div className="text-xs mt-1">{account.entries.length} entries</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Account Totals */}
        {currentAccount && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-500">Total Entries</div>
              <div className="text-2xl font-bold text-gray-900">{currentAccount.entries.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-500">Total Debit</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDebit)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-500">Total Credit</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCredit)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-500">Total Final</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalFinal)}
              </div>
            </div>
          </div>
        )}

        {/* Entries Table */}
        {currentAccount && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentAccount.name} - All Entries ({currentAccount.entries.length})
              </h2>
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
                  {currentAccount.entries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.account_number}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.truck_type}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.plate_number}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.date}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
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
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.reference_number}
                      </td>
                      {selectedAccount === 'fuel' && (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.driver || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.route || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.liters || '-'}
                          </td>
                        </>
                      )}
                      {selectedAccount === 'income' && (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.driver || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.route || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {entry.quantity || '-'}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {entry.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



