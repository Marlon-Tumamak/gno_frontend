'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
      blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      green: 'bg-green-500/20 border-green-500/30 text-green-400',
      orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      red: 'bg-red-500/20 border-red-500/30 text-red-400',
      purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
    };
    return colorMap[color] || 'bg-gray-500/20 border-gray-500/30 text-gray-400';
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
              <div className="text-center text-gray-300">No accounts data available</div>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Accounts Summary</h1>
                <p className="text-gray-300">Overview of all account types with financial totals</p>
              </div>
              <div className="flex space-x-4">
                {/* <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Back to Dashboard
                </Link> */}
                <Link
                  href="/accounts-detail"
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  View Details
                </Link>
                {/* <button
                  onClick={fetchAccountsData}
                  className="px-4 py-2 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white rounded-md transition-all duration-200"
                >
                  Refresh Data
                </button> */}
              </div>
            </div>
          </div>

          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Accounts</div>
              <div className="text-2xl font-bold text-white">{accountsData.summary.total_count}</div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Debit</div>
              <div className="text-2xl font-bold text-red-400">
                {formatCurrency(accountsData.summary.total_debit)}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Credit</div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(accountsData.summary.total_credit)}
              </div>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border border-white/10">
              <div className="text-sm font-medium text-gray-300">Total Final</div>
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(accountsData.summary.total_final)}
              </div>
            </div>
          </div>

          {/* Account Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(accountsData.accounts).map(([key, account]) => (
              <div key={key} className={`bg-black/60 backdrop-blur-sm rounded-lg p-6 shadow-2xl border-2 ${getColorClasses(account.color)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white drop-shadow-lg">{account.name}</h3>
                  <span className="text-sm font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-gray-300">
                    {account.count} entries
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Total Debit:</span>
                    <span className="font-bold text-red-400">
                      {formatCurrency(account.total_debit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Total Credit:</span>
                    <span className="font-bold text-green-400">
                      {formatCurrency(account.total_credit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-white/10 pt-2">
                    <span className="text-sm font-bold text-white">Final Total:</span>
                    <span className="font-bold text-lg text-white">
                      {formatCurrency(account.total_final)}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar showing relative size */}
                <div className="mt-4">
                  <div className="w-full bg-black/40 backdrop-blur-sm rounded-full h-2">
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
          <div className="mt-8 bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-black/40">
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">Detailed Summary</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Account Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Entries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Debit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Credit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Final Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-black/20 divide-y divide-white/10">
                  {Object.entries(accountsData.accounts).map(([key, account]) => (
                    <tr key={key} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {account.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {account.count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-400 font-medium">
                          {formatCurrency(account.total_debit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400 font-medium">
                          {formatCurrency(account.total_credit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          {formatCurrency(account.total_final)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-black/40 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">TOTAL</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">
                        {accountsData.summary.total_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-red-400">
                        {formatCurrency(accountsData.summary.total_debit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-400">
                        {formatCurrency(accountsData.summary.total_credit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-400">
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
    </div>
  );
}
