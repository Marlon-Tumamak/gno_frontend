'use client';

import { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Navbar from '@/components/Navbar';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

  // Prepare pie chart data
  const pieChartData = opexData ? {
    labels: opexData.opex_breakdown.map(item => `${item.account_type} (${item.percentage.toFixed(1)}%)`),
    datasets: [
      {
        data: opexData.opex_breakdown.map(item => item.amount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
          '#4BC0C0',
          '#FF6384'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
          '#4BC0C0',
          '#FF6384'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
                <p className="mt-4 text-gray-300">Loading OPEX data...</p>
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
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Error Loading Data</h2>
                <p className="text-gray-300 mb-4">{error}</p>
                <button 
                  onClick={fetchOPEXData}
                  className="bg-gradient-to-r from-black bg-orange-600 hover:bg-black text-white px-4 py-2 rounded transition-all duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!opexData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center">
                <p className="text-gray-300">No OPEX data available</p>
              </div>
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
              <h1 className="text-4xl font-bold text-gray-800 mb-3">Operating Expenses (OPEX)</h1>
              <p className="text-gray-600 text-lg">Breakdown of expenses by account type</p>
            </div>
          </div>

          {/* OPEX Overview Cards */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Total OPEX Card */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Total OPEX</h3>
                  <p className="text-gray-600">All operating expenses</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {formatCurrency(opexData.total_opex)}
              </div>
              <div className="text-gray-600 text-sm">Current period</div>
            </div>

            {/* Categories Card */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Categories</h3>
                  <p className="text-gray-600">Expense categories</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {opexData.summary.total_categories}
              </div>
              <div className="text-gray-600 text-sm">Active categories</div>
            </div>

            {/* Largest Category Card */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Largest Category</h3>
                  <p className="text-gray-600">Highest expense category</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-xl">📈</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {opexData.summary.largest_category?.account_type || 'N/A'}
              </div>
              <div className="text-gray-600 text-sm">
                {opexData.summary.largest_category ? formatCurrency(opexData.summary.largest_category.amount) : 'No data'}
              </div>
            </div>
          </div>

          {/* OPEX Breakdown */}
          <div className="gradient-card rounded-2xl p-8 elevated-box">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">OPEX Breakdown by Category</h3>
                <p className="text-gray-600">Detailed expense analysis by account type</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
            
            {opexData.opex_breakdown.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <p className="text-gray-500 text-lg">No OPEX data available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pie Chart at the top */}
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">OPEX Distribution</h4>
                  <div className="h-96 mx-auto max-w-4xl">
                    {pieChartData && (
                      <Pie data={pieChartData} options={pieChartOptions} />
                    )}
                  </div>
                </div>

                {/* Category List below */}
                <div className="space-y-4">
                  {opexData.opex_breakdown.map((item, index) => (
                    <div key={item.account_type} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${getCategoryColor(index)}`}></div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{item.account_type}</h4>
                            <p className="text-sm text-gray-600">
                              {item.percentage.toFixed(2)}% of total OPEX
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleExpanded(item.account_type)}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            {expandedItems.has(item.account_type) ? 'Hide Details' : 'See Details'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Account Details Section */}
                      {expandedItems.has(item.account_type) && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-6">
                            <h5 className="font-semibold text-gray-800 mb-3">Account Number Breakdown</h5>
                            <div className="space-y-2">
                              {item.account_details.map((account, idx) => (
                                <div key={idx} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  <span className="text-sm text-gray-700">{account.account_number}</span>
                                  <span className="text-sm font-medium text-gray-800">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
