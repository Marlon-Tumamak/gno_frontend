'use client';

import { useState, useEffect } from 'react';

interface AccountDetail {
  account_number: string;
  amount: number;
}

interface OPEXBreakdown {
  account_type: string;
  amount: number;
  percentage: number;
  account_details: AccountDetail[];
}

interface OPEXData {
  opex_breakdown: OPEXBreakdown[];
  total_opex: number;
  summary: {
    total_categories: number;
    largest_category: OPEXBreakdown | null;
    smallest_category: OPEXBreakdown | null;
  };
}

export default function OPEXPage() {
  const [opexData, setOpexData] = useState<OPEXData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOPEXData();
  }, []);

  const fetchOPEXData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/revenue/opex/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOpexData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-orange-500'
    ];
    return colors[index % colors.length];
  };

  const toggleExpanded = (accountType: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(accountType)) {
      newExpanded.delete(accountType);
    } else {
      newExpanded.add(accountType);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading OPEX data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchOPEXData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!opexData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No OPEX data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operating Expenses (OPEX)</h1>
          <p className="mt-2 text-gray-600">Breakdown of expenses by account type</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">₱</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total OPEX</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(opexData.total_opex)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {opexData.summary.total_categories}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Largest Category</p>
                <p className="text-lg font-semibold text-gray-900">
                  {opexData.summary.largest_category?.account_type || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* OPEX Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">OPEX Breakdown by Category</h2>
          </div>
          
          <div className="p-6">
            {opexData.opex_breakdown.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <p className="text-gray-500">No OPEX data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {opexData.opex_breakdown.map((item, index) => (
                  <div key={item.account_type} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${getCategoryColor(index)}`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.account_type}</h3>
                          <p className="text-sm text-gray-500">
                            {item.percentage.toFixed(2)}% of total OPEX
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleExpanded(item.account_type)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {expandedItems.has(item.account_type) ? 'Hide Details' : 'See Details'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Account Details Section */}
                    {expandedItems.has(item.account_type) && (
                      <div className="border-t border-gray-200 bg-white">
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Account Number Breakdown</h4>
                          <div className="space-y-2">
                            {item.account_details.map((account, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                <span className="text-sm text-gray-700">{account.account_number}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(account.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        {opexData.opex_breakdown.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">OPEX Distribution</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Amount by Category</h3>
                  <div className="space-y-3">
                    {opexData.opex_breakdown.map((item, index) => (
                      <div key={item.account_type} className="flex items-center space-x-3">
                        <div className="w-24 text-sm text-gray-600 truncate">
                          {item.account_type}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className={`${getCategoryColor(index)} h-6 rounded-full flex items-center justify-end pr-2`}
                            style={{ width: `${item.percentage}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-20 text-sm text-gray-900 text-right">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-700 font-medium">Total OPEX</span>
                      <span className="text-blue-900 font-semibold">
                        {formatCurrency(opexData.total_opex)}
                      </span>
                    </div>
                    
                    {opexData.summary.largest_category && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-700 font-medium">Largest Category</span>
                        <span className="text-green-900 font-semibold">
                          {opexData.summary.largest_category.account_type}
                        </span>
                      </div>
                    )}
                    
                    {opexData.summary.smallest_category && (
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700 font-medium">Smallest Category</span>
                        <span className="text-yellow-900 font-semibold">
                          {opexData.summary.smallest_category.account_type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
