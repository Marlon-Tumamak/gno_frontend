'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AccountData {
  name: string;
  total_debit: number;
  total_credit: number;
  total_final: number;
  count: number;
  color: string;
}

interface AccountsSummary {
  accounts: {
    [key: string]: AccountData;
  };
  summary: {
    total_debit: number;
    total_credit: number;
    total_final: number;
    total_count: number;
  };
}

export default function AccountsPage() {
  const [accountsData, setAccountsData] = useState<AccountsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/accounts/summary/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts data');
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

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
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
            <div className="text-center text-gray-700">No accounts data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Summary</h1>
              <p className="text-gray-600">Overview of all account types with financial totals</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/accounts-detail"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Details
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

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Accounts</div>
            <div className="text-2xl font-bold text-gray-900">{accountsData.summary.total_count}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Debit</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(accountsData.summary.total_debit)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Credit</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(accountsData.summary.total_credit)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Final</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(accountsData.summary.total_final)}
            </div>
          </div>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(accountsData.accounts).map(([key, account]) => (
            <div key={key} className={`rounded-lg shadow-md p-6 border-2 ${getColorClasses(account.color)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{account.name}</h3>
                <span className="text-sm font-medium bg-white bg-opacity-50 px-2 py-1 rounded">
                  {account.count} entries
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Debit:</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(account.total_debit)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Credit:</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(account.total_credit)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-bold">Final Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(account.total_final)}
                  </span>
                </div>
              </div>
              
              {/* Progress bar showing relative size */}
              <div className="mt-4">
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div 
                    className="bg-current h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (account.total_final / Math.max(...Object.values(accountsData.accounts).map(a => a.total_final))) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Table View */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Summary</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Debit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(accountsData.accounts).map(([key, account]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">
                        {formatCurrency(account.total_debit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-medium">
                        {formatCurrency(account.total_credit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(account.total_final)}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">TOTAL</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {accountsData.summary.total_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      {formatCurrency(accountsData.summary.total_debit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(accountsData.summary.total_credit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">
                      {formatCurrency(accountsData.summary.total_final)}
                    </div>
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
