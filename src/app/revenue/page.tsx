'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SkeletonLoader from '@/components/SkeletonLoader';

interface RevenueData {
  revenue_streams: {
    front_load_amount: number;
    back_load_amount: number;
    other_income_amount: number;
  };
  expense_streams: {
    allowance: number;
    add_allowance: number;
    fuel_amount: number;
    add_fuel_amount: number;
    total_opex: number;
  };
}

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [truckingData, setTruckingData] = useState<any>(null);

  useEffect(() => {
    fetchRevenueData();
    fetchTruckingData();
  }, []);

  const fetchTruckingData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/trucking/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucking data');
      }
      
      const data = await response.json();
      setTruckingData(data);
    } catch (err) {
      console.error('Error fetching trucking data:', err);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/revenue/streams/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      
      const data = await response.json();
      setRevenueData(data);
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

  // Calculate overall summary data based on selected month
  const calculateOverallSummary = () => {
    if (!truckingData) return null;

    let accounts = [];
    if (truckingData.accounts) {
      accounts = truckingData.accounts;
    } else if (Array.isArray(truckingData)) {
      accounts = truckingData;
    } else if (truckingData.data && Array.isArray(truckingData.data)) {
      accounts = truckingData.data;
    }

    if (accounts.length === 0) return null;

    // Filter by month (if not 'all')
    let filteredAccounts = accounts;
    if (selectedMonth !== 'all') {
      filteredAccounts = accounts.filter((account: any) => {
        if (!account.date) return false;
        const accountDate = new Date(account.date);
        const accountMonth = accountDate.toISOString().slice(0, 7);
        return accountMonth === selectedMonth;
      });
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    let frontloadAmount = 0;
    let backloadAmount = 0;
    let otherIncomeAmount = 0;
    let allowanceAmount = 0;
    let fuelAmount = 0;
    let totalOpex = 0;

    filteredAccounts.forEach((account: any) => {
      const finalTotal = parseFloat(account.final_total?.toString() || '0');
      const accountType = account.account_type?.toLowerCase() || '';

      if (accountType.includes('hauling income')) {
        // Use the same calculation as the backend (revenue_streams)
        const route = (typeof account.route === 'object' && account.route?.name) || account.route || '';
        const frontLoad = account.front_load?.toString() || '';
        const backLoad = account.back_load?.toString() || '';
        
        // Check if it's Rice Hull Ton (other income)
        if (account.remarks?.toLowerCase().includes('rice hull ton')) {
          otherIncomeAmount += finalTotal;
        } else {
          // Apply backend logic for frontload/backload categorization
          if (frontLoad.includes('Strike')) {
            // If front_load is Strike, amount goes to back_load
            backloadAmount += finalTotal;
          } else if (backLoad.includes('Strike')) {
            // If back_load is Strike, amount goes to front_load
            frontloadAmount += finalTotal;
          } else if (frontLoad && backLoad) {
            // Split amount between front and back
            const halfAmount = finalTotal / 2;
            frontloadAmount += halfAmount;
            backloadAmount += halfAmount;
          } else if (frontLoad) {
            frontloadAmount += finalTotal;
          } else if (backLoad) {
            backloadAmount += finalTotal;
          }
        }
      } else if (accountType.includes('driver\'s allowance')) {
        allowanceAmount += finalTotal;
        totalExpenses += finalTotal;
      } else if (accountType.includes('fuel')) {
        fuelAmount += finalTotal;
        totalExpenses += finalTotal;
      } else if (
        accountType === 'insurance expense' ||
        accountType === 'repairs and maintenance expense' ||
        accountType === 'taxes, permits and licenses expense' ||
        accountType === 'salaries and wages' ||
        accountType === 'tax expense'
      ) {
        totalOpex += finalTotal;
        // Don't include OPEX in total expenses for Cost of Service
      }
    });

    // Calculate total revenue using the same formula as the top cards
    totalRevenue = frontloadAmount + backloadAmount + otherIncomeAmount;

    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit - totalOpex;

    return {
      totalRevenue,
      totalExpenses,
      frontloadAmount,
      backloadAmount,
      otherIncomeAmount,
      allowanceAmount,
      fuelAmount,
      totalOpex,
      grossProfit,
      netProfit,
      recordCount: filteredAccounts.length
    };
  };

  // Calculate filtered profit and loss data
  const calculateFilteredPL = () => {
    if (!truckingData) return null;

    let accounts = [];
    if (truckingData.accounts) {
      accounts = truckingData.accounts;
    } else if (Array.isArray(truckingData)) {
      accounts = truckingData;
    } else if (truckingData.data && Array.isArray(truckingData.data)) {
      accounts = truckingData.data;
    }

    if (accounts.length === 0) return null;

    // Filter by month (if not 'all')
    let filteredAccounts = accounts;
    if (selectedMonth !== 'all') {
      filteredAccounts = accounts.filter((account: any) => {
        if (!account.date) return false;
        const accountDate = new Date(account.date);
        const accountMonth = accountDate.toISOString().slice(0, 7);
        return accountMonth === selectedMonth;
      });
    }

    // Filter by truck if not 'all'
    if (selectedTruck !== 'all') {
      filteredAccounts = filteredAccounts.filter((account: any) => 
        account.plate_number === selectedTruck
      );
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    let frontloadAmount = 0;
    let backloadAmount = 0;
    let otherIncomeAmount = 0;
    let allowanceAmount = 0;
    let fuelAmount = 0;
    let totalOpex = 0;

    filteredAccounts.forEach((account: any) => {
      const finalTotal = parseFloat(account.final_total?.toString() || '0');
      const accountType = account.account_type?.toLowerCase() || '';

      if (accountType.includes('hauling income')) {
        // Use the same calculation as calculateOverallSummary
        const frontLoad = account.front_load?.toString() || '';
        const backLoad = account.back_load?.toString() || '';
        
        // Check if it's Rice Hull Ton (other income)
        if (account.remarks?.toLowerCase().includes('rice hull ton')) {
          otherIncomeAmount += finalTotal;
        } else {
          // Apply backend logic for frontload/backload categorization
          if (frontLoad.includes('Strike')) {
            backloadAmount += finalTotal;
          } else if (backLoad.includes('Strike')) {
            frontloadAmount += finalTotal;
          } else if (frontLoad && backLoad) {
            const halfAmount = finalTotal / 2;
            frontloadAmount += halfAmount;
            backloadAmount += halfAmount;
          } else if (frontLoad) {
            frontloadAmount += finalTotal;
          } else if (backLoad) {
            backloadAmount += finalTotal;
          }
        }
      } else if (accountType.includes('fuel')) {
        fuelAmount += finalTotal;
        totalExpenses += finalTotal;
      } else if (accountType.includes('driver\'s allowance')) {
        allowanceAmount += finalTotal;
        totalExpenses += finalTotal;
      } else if (
        accountType === 'insurance expense' ||
        accountType === 'repairs and maintenance expense' ||
        accountType === 'taxes, permits and licenses expense' ||
        accountType === 'salaries and wages' ||
        accountType === 'tax expense'
      ) {
        totalOpex += finalTotal;
        // Don't include OPEX in total expenses for Cost of Service
      }
    });

    // Calculate total revenue using the same formula
    totalRevenue = frontloadAmount + backloadAmount + otherIncomeAmount;

    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit - totalOpex;

    return {
      totalRevenue,
      totalExpenses,
      frontloadAmount,
      backloadAmount,
      otherIncomeAmount,
      allowanceAmount,
      fuelAmount,
      totalOpex,
      grossProfit,
      netProfit,
      recordCount: filteredAccounts.length
    };
  };

  // Get unique months for filter dropdown
  const getUniqueMonths = () => {
    if (!truckingData) return [];

    let accounts = [];
    if (truckingData.accounts) {
      accounts = truckingData.accounts;
    } else if (Array.isArray(truckingData)) {
      accounts = truckingData;
    } else if (truckingData.data && Array.isArray(truckingData.data)) {
      accounts = truckingData.data;
    }

    const months = new Set<string>();
    accounts.forEach((account: any) => {
      if (account.date) {
        const accountDate = new Date(account.date);
        const monthKey = accountDate.toISOString().slice(0, 7);
        months.add(monthKey);
      }
    });

    return Array.from(months).sort().reverse(); // Most recent first
  };

  // Get unique trucks for filter dropdown
  const getUniqueTrucks = () => {
    if (!truckingData) return [];

    let accounts = [];
    if (truckingData.accounts) {
      accounts = truckingData.accounts;
    } else if (Array.isArray(truckingData)) {
      accounts = truckingData;
    } else if (truckingData.data && Array.isArray(truckingData.data)) {
      accounts = truckingData.data;
    }

    const trucks = new Set<string>();
    accounts.forEach((account: any) => {
      if (account.plate_number) {
        trucks.add(account.plate_number);
      }
    });

    return Array.from(trucks).sort();
  };

  if (loading) {
    return <SkeletonLoader variant="revenue" />;
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
                  onClick={fetchRevenueData}
                  className="mt-4 px-4 py-2 bg-gradient-to-r bg-orange-600 hover:bg-black text-white rounded-md transition-all duration-200"
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

  if (!revenueData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
        <Navbar />
        <div className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
              <div className="text-center text-gray-300">No revenue data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate revenue streams from trucking data
  const calculateRevenueStreams = () => {
    if (!truckingData) return null;

    let accounts = [];
    if (truckingData.accounts) {
      accounts = truckingData.accounts;
    } else if (Array.isArray(truckingData)) {
      accounts = truckingData;
    } else if (truckingData.data && Array.isArray(truckingData.data)) {
      accounts = truckingData.data;
    }

    if (accounts.length === 0) return null;

    let frontloadAmount = 0;
    let backloadAmount = 0;
    let otherIncomeAmount = 0;
    let allowanceAmount = 0;
    let fuelAmount = 0;
    let totalOpex = 0;

    accounts.forEach((account: any) => {
      const finalTotal = parseFloat(account.final_total?.toString() || '0');
      const accountType = account.account_type?.toLowerCase() || '';

      if (accountType.includes('hauling income')) {
        const frontLoad = account.front_load?.toString() || '';
        const backLoad = account.back_load?.toString() || '';
        const remarks = account.remarks || '';
        
        // Check if it's Rice Hull Ton (other income)
        if (remarks.toLowerCase().includes('rice hull ton')) {
          otherIncomeAmount += finalTotal;
        } else {
          // Apply backend logic for frontload/backload categorization
          if (frontLoad.includes('Strike')) {
            backloadAmount += finalTotal;
          } else if (backLoad.includes('Strike')) {
            frontloadAmount += finalTotal;
          } else if (frontLoad && backLoad) {
            const halfAmount = finalTotal / 2;
            frontloadAmount += halfAmount;
            backloadAmount += halfAmount;
          } else if (frontLoad) {
            frontloadAmount += finalTotal;
          } else if (backLoad) {
            backloadAmount += finalTotal;
          }
        }
      } else if (accountType.includes('driver\'s allowance')) {
        allowanceAmount += finalTotal;
      } else if (accountType.includes('fuel')) {
        fuelAmount += finalTotal;
      } else if (
        accountType === 'insurance expense' ||
        accountType === 'repairs and maintenance expense' ||
        accountType === 'taxes, permits and licenses expense' ||
        accountType === 'salaries and wages' ||
        accountType === 'tax expense'
      ) {
        totalOpex += finalTotal;
      }
    });

    return {
      frontloadAmount,
      backloadAmount,
      otherIncomeAmount,
      allowanceAmount,
      fuelAmount,
      totalOpex,
      totalRevenue: frontloadAmount + backloadAmount + otherIncomeAmount,
      totalExpenses: allowanceAmount + fuelAmount + totalOpex
    };
  };

  const revenueStreams = calculateRevenueStreams();
  const totalRevenue = revenueStreams?.totalRevenue || 0;
  const totalExpenses = revenueStreams?.totalExpenses || 0;

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
              <h1 className="text-4xl font-bold text-gray-800 mb-3">Revenue Streams</h1>
              <p className="text-gray-600 text-lg">Financial overview of revenue and expense streams</p>
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Total Revenue Card */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Total Revenue</h3>
                  <p className="text-gray-600">All revenue streams combined</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-gray-600 text-sm">Current period</div>
            </div>

            {/* Total Expenses Card */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Total Expenses</h3>
                  <p className="text-gray-600">All expense streams combined</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-xl">💸</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {formatCurrency(totalExpenses)}
              </div>
              <div className="text-gray-600 text-sm">Current period</div>
            </div>
          </div>

          {/* Revenue and Expense Streams */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Streams */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Revenue Streams</h3>
                  <p className="text-gray-600">Breakdown of revenue sources</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-white text-xl">📈</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">F</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Frontload Amount</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-lg">
                    {formatCurrency(revenueStreams?.frontloadAmount || 0)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">B</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Backload Amount</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-lg">
                    {formatCurrency(revenueStreams?.backloadAmount || 0)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">O</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Other Income</div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-lg">
                    {formatCurrency(revenueStreams?.otherIncomeAmount || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Streams */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Expense Streams</h3>
                  <p className="text-gray-600">Breakdown of expense categories</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-xl">📉</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Allowance</div>
                    </div>
                  </div>
                  <div className="text-red-600 font-bold text-lg">
                    {formatCurrency(revenueStreams?.allowanceAmount || 0)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">F</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Fuel Amount</div>
                    </div>
                  </div>
                  <div className="text-red-600 font-bold text-lg">
                    {formatCurrency(revenueStreams?.fuelAmount || 0)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">O</span>
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold">Total OPEX</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-red-600 font-bold text-lg">
                      {formatCurrency(revenueStreams?.totalOpex || 0)}
                    </div>
                    <Link
                      href="/revenue/opex"
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      See Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit and Loss Section */}
          <div className="gradient-card rounded-2xl p-8 elevated-box mt-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Profit and Loss Analysis</h2>
              <p className="text-gray-600">Detailed breakdown of income, expenses, and profit</p>
            </div>
          
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Months</option>
                  {getUniqueMonths().map((month) => (
                    <option key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Truck</label>
                <select 
                  value={selectedTruck}
                  onChange={(e) => setSelectedTruck(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Trucks</option>
                  {getUniqueTrucks().map((truck) => (
                    <option key={truck} value={truck}>{truck}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* P&L Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Total of All Entries */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Overall Summary
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    ({selectedMonth === 'all' ? 'All Months' : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                  </span>
                </h3>
                
                {calculateOverallSummary() ? (
                  <>
                    {/* Income Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Income</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Frontload Amount</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateOverallSummary()?.frontloadAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Backload Amount</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateOverallSummary()?.backloadAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Other Income</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateOverallSummary()?.otherIncomeAmount || 0)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-800">Total Income</span>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(calculateOverallSummary()?.totalRevenue || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost of Service Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cost of Service</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Allowance</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateOverallSummary()?.allowanceAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fuel Amount</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateOverallSummary()?.fuelAmount || 0)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-800">Total Cost of Service</span>
                            <span className="text-sm font-bold text-red-600">
                              {formatCurrency(calculateOverallSummary()?.totalExpenses || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gross Profit Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Gross Profit</h4>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-gray-800">Gross Profit</span>
                          <span className={`text-sm font-bold ${(calculateOverallSummary()?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculateOverallSummary()?.grossProfit || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operating Expenses Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Operating Expenses</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total OPEX</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateOverallSummary()?.totalOpex || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Net Profit Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Net Profit</h4>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-gray-800">Net Profit</span>
                          <span className={`text-sm font-bold ${(calculateOverallSummary()?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(calculateOverallSummary()?.netProfit || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No data available for {selectedMonth === 'all' ? 'all months' : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Box 2: Filtered Analysis */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Filtered Analysis
                  {selectedTruck !== 'all' && (
                    <span className="text-sm text-orange-600 font-normal ml-2">({selectedTruck})</span>
                  )}
                </h3>
                
                {calculateFilteredPL() ? (
                  <>
                    <div className="mb-4 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                      Showing data for {selectedMonth === 'all' ? 'all months' : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      {calculateFilteredPL()?.recordCount && (
                        <span className="ml-2 font-medium">({calculateFilteredPL()?.recordCount} records)</span>
                      )}
                    </div>

                    {/* Income Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Frontload Amount</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateFilteredPL()?.frontloadAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Backload Amount</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateFilteredPL()?.backloadAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Other Income</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(calculateFilteredPL()?.otherIncomeAmount || 0)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-800">Total Revenue</span>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(calculateFilteredPL()?.totalRevenue || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost of Service Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Expenses</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Allowance</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateFilteredPL()?.allowanceAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Fuel Amount</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateFilteredPL()?.fuelAmount || 0)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-800">Total Expenses</span>
                            <span className="text-sm font-bold text-red-600">
                              {formatCurrency(calculateFilteredPL()?.totalExpenses || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gross Profit Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Gross Profit</h4>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-gray-800">Gross Profit</span>
                          <span className={`text-sm font-bold ${(calculateFilteredPL()?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculateFilteredPL()?.grossProfit || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operating Expenses Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Operating Expenses</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total OPEX</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(calculateFilteredPL()?.totalOpex || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Net Profit Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Net Profit</h4>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-gray-800">Net Profit</span>
                          <span className={`text-sm font-bold ${(calculateFilteredPL()?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(calculateFilteredPL()?.netProfit || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No data available for the selected filters
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
