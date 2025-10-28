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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-3">Accounts Summary</h1>
                  <p className="text-gray-600 text-lg">Overview of all account types with financial totals</p>
                </div>
                <Link
                  href="/accounts-detail"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>

          {/* Accounts Overview Cards */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Accounts Card */}
            <div className="gradient-card rounded-2xl p-6 elevated-box">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Total Accounts</h3>
                  <p className="text-gray-600 text-sm">All account entries</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {accountsData.summary.total_count}
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
                {formatCurrency(accountsData.summary.total_debit)}
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
                {formatCurrency(accountsData.summary.total_credit)}
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
                {formatCurrency(accountsData.summary.total_final)}
              </div>
            </div>
          </div>

          {/* Account Type Breakdown */}
          <div className="gradient-card rounded-2xl p-8 elevated-box">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Type Breakdown</h3>
                <p className="text-gray-600">Detailed financial breakdown by account type</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(accountsData.accounts).map(([key, account]) => (
                <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">{account.name}</h4>
                      <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        {account.count} entries
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Debit:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(account.total_debit)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total Credit:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(account.total_credit)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                        <span className="text-sm font-bold text-gray-800">Final Total:</span>
                        <span className="font-bold text-lg text-gray-900">
                          {formatCurrency(account.total_final)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar showing relative size */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            account.color === 'blue' ? 'bg-blue-500' :
                            account.color === 'green' ? 'bg-green-500' :
                            account.color === 'orange' ? 'bg-orange-500' :
                            account.color === 'purple' ? 'bg-purple-500' :
                            account.color === 'red' ? 'bg-red-500' :
                            account.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-indigo-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (account.total_final / Math.max(...Object.values(accountsData.accounts).map(a => a.total_final))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Summary */}
          <div className="gradient-card rounded-2xl p-8 elevated-box">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Detailed Summary</h3>
                <p className="text-gray-600">Complete breakdown of all account types</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
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
                    <tr key={key} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {account.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
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
                  <tr className="bg-gray-100 font-bold">
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
                      <div className="text-sm font-bold text-indigo-600">
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
