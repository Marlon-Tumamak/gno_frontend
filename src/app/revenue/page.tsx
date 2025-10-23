'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RevenueData {
  revenue_streams: {
    front_load_amount: number;
    back_load_amount: number;
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

  useEffect(() => {
    fetchRevenueData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-200 rounded"></div>
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
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-4">Error</div>
              <p className="text-gray-700">{error}</p>
              <button
                onClick={fetchRevenueData}
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

  if (!revenueData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-700">No revenue data available</div>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = revenueData.revenue_streams.front_load_amount + revenueData.revenue_streams.back_load_amount;
  const totalExpenses = revenueData.expense_streams.allowance + 
                       // revenueData.expense_streams.add_allowance + 
                       revenueData.expense_streams.fuel_amount + 
                       // revenueData.expense_streams.add_fuel_amount + 
                       revenueData.expense_streams.total_opex;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Streams</h1>
              <p className="text-gray-600">Financial overview of revenue and expense streams</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={fetchRevenueData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-500">Total Expenses</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
        </div>

        {/* Revenue and Expense Tables with Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Streams */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <h2 className="text-xl font-semibold text-green-800">Revenue Streams</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Frontload Amount</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(revenueData.revenue_streams.front_load_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Backload Amount</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(revenueData.revenue_streams.back_load_amount)}
                  </span>
                </div>
              </div>
              
              {/* Revenue Pie Chart */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Revenue Streams</h3>
                <div className="flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Backload (76%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="20"
                        strokeDasharray={`${76 * 2.51} ${100 * 2.51}`}
                        className="animate-pulse"
                      />
                      {/* Frontload (24%) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="20"
                        strokeDasharray={`${24 * 2.51} ${100 * 2.51}`}
                        strokeDashoffset={`-${76 * 2.51}`}
                        className="animate-pulse"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {((revenueData.revenue_streams.front_load_amount / totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Frontload ({(revenueData.revenue_streams.front_load_amount / totalRevenue * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Backload ({(revenueData.revenue_streams.back_load_amount / totalRevenue * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Streams */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h2 className="text-xl font-semibold text-red-800">Expense Streams</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Allowance</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(revenueData.expense_streams.allowance)}
                  </span>
                </div>
                {/* <div className="flex justify-between items-center">
                  <span className="text-gray-700">Add Allowance</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(revenueData.expense_streams.add_allowance)}
                  </span>
                </div> */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Fuel Amount</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(revenueData.expense_streams.fuel_amount)}
                  </span>
                </div>
                {/* <div className="flex justify-between items-center">
                  <span className="text-gray-700">Add Fuel Amount</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(revenueData.expense_streams.add_fuel_amount)}
                  </span>
                </div> */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total OPEX</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-red-600">
                      {formatCurrency(revenueData.expense_streams.total_opex)}
                    </span>
                    <Link
                      href="/revenue/opex"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      See Details
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Expense Pie Chart */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Expense Streams</h3>
                <div className="flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Fuel Amount (largest) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="20"
                        strokeDasharray={`${(revenueData.expense_streams.fuel_amount / totalExpenses) * 251} 251`}
                        className="animate-pulse"
                      />
                      {/* Allowance */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="20"
                        strokeDasharray={`${(revenueData.expense_streams.allowance / totalExpenses) * 251} 251`}
                        strokeDashoffset={`-${(revenueData.expense_streams.fuel_amount / totalExpenses) * 251}`}
                        className="animate-pulse"
                      />
                      {/* Add Allowance - Commented out */}
                      {/* <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="20"
                        strokeDasharray={`${(revenueData.expense_streams.add_allowance / totalExpenses) * 251} 251`}
                        strokeDashoffset={`-${((revenueData.expense_streams.fuel_amount + revenueData.expense_streams.allowance) / totalExpenses) * 251}`}
                        className="animate-pulse"
                      /> */}
                      {/* Add Fuel Amount - Commented out */}
                      {/* <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="20"
                        strokeDasharray={`${(revenueData.expense_streams.add_fuel_amount / totalExpenses) * 251} 251`}
                        strokeDashoffset={`-${((revenueData.expense_streams.fuel_amount + revenueData.expense_streams.allowance + revenueData.expense_streams.add_allowance) / totalExpenses) * 251}`}
                        className="animate-pulse"
                      /> */}
                      {/* Total OPEX */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="20"
                        strokeDasharray={`${(revenueData.expense_streams.total_opex / totalExpenses) * 251} 251`}
                        strokeDashoffset={`-${((revenueData.expense_streams.fuel_amount + revenueData.expense_streams.allowance) / totalExpenses) * 251}`}
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Allowance</span>
                  </div>
                  {/* <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Add Allowance</span>
                  </div> */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Fuel Amount</span>
                  </div>
                  {/* <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Add Fuel</span>
                  </div> */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Total OPEX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit and Loss Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Profit and Loss Analysis</h2>
          </div>
          
          <div className="p-6">
            {/* P&L Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Total of All Entries */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Total of All Entries</h3>
                
                {/* Income Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Income</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Frontload Amount</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(revenueData.revenue_streams.front_load_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Backload Amount</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(revenueData.revenue_streams.back_load_amount)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-gray-900">Total Income</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(revenueData.revenue_streams.front_load_amount + revenueData.revenue_streams.back_load_amount)}
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
                        {formatCurrency(revenueData.expense_streams.allowance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fuel Amount</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(revenueData.expense_streams.fuel_amount)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-gray-900">Total Cost of Service</span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(revenueData.expense_streams.allowance + revenueData.expense_streams.fuel_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gross Profit Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Gross Profit</h4>
                  <div className="border-t border-gray-300 pt-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-gray-900">Gross Profit</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency((revenueData.revenue_streams.front_load_amount + revenueData.revenue_streams.back_load_amount) - (revenueData.expense_streams.allowance + revenueData.expense_streams.fuel_amount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Filtered by Truck */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtered by Truck</h3>
                
                {/* Truck Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Truck</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Trucks</option>
                    <option value="NGS4340">NGS4340</option>
                    <option value="NGS4341">NGS4341</option>
                    <option value="NGS4342">NGS4342</option>
                    {/* Add more truck options as needed */}
                  </select>
                </div>

                {/* Income Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Income</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Frontload Amount</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(revenueData.revenue_streams.front_load_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Backload Amount</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(revenueData.revenue_streams.back_load_amount)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-gray-900">Total Income</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(revenueData.revenue_streams.front_load_amount + revenueData.revenue_streams.back_load_amount)}
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
                        {formatCurrency(revenueData.expense_streams.allowance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fuel Amount</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(revenueData.expense_streams.fuel_amount)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-gray-900">Total Cost of Service</span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(revenueData.expense_streams.allowance + revenueData.expense_streams.fuel_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gross Profit Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Gross Profit</h4>
                  <div className="border-t border-gray-300 pt-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-bold text-gray-900">Gross Profit</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency((revenueData.revenue_streams.front_load_amount + revenueData.revenue_streams.back_load_amount) - (revenueData.expense_streams.allowance + revenueData.expense_streams.fuel_amount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
