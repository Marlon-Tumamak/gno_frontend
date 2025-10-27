'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Analytics() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month (YYYY-MM)
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in via localStorage
    const loggedIn = localStorage.getItem('isLoggedIn');
    const email = localStorage.getItem('userEmail');

    if (loggedIn === 'true' && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
      
      // Fetch data from API
      fetchData();
    } else {
      router.push('/');
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/trucking/');
      
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
      } else {
        console.error('API Error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#296c77' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Calculate monthly revenue and expenses from trucking data
  const calculateMonthlyData = () => {
    if (!apiData) return { monthlyRevenue: 0, monthlyExpenses: 0 };

    let accounts = [];
    if (apiData.accounts) {
      accounts = apiData.accounts;
    } else if (Array.isArray(apiData)) {
      accounts = apiData;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      accounts = apiData.data;
    }

    if (accounts.length === 0) return { monthlyRevenue: 0, monthlyExpenses: 0 };

    // Filter accounts by selected month
    const filteredAccounts = accounts.filter((account: any) => {
      if (!account.date) return false;
      const accountDate = new Date(account.date);
      const accountMonth = accountDate.toISOString().slice(0, 7);
      return accountMonth === selectedMonth;
    });

    let monthlyRevenue = 0;
    let monthlyExpenses = 0;

    filteredAccounts.forEach((account: any) => {
      const finalTotal = parseFloat(account.final_total?.toString() || '0');
      const accountType = account.account_type?.toLowerCase() || '';

      if (accountType.includes('hauling income')) {
        // Check if it's Rice Hull Ton (other income) - exclude from regular revenue
        if (!account.remarks?.toLowerCase().includes('rice hull ton')) {
          monthlyRevenue += finalTotal;
        }
      } else if (
        accountType.includes('fuel') ||
        accountType.includes('driver\'s allowance') ||
        accountType.includes('insurance') ||
        accountType.includes('repair') ||
        accountType.includes('maintenance') ||
        accountType.includes('tax') ||
        accountType.includes('permit') ||
        accountType.includes('license')
      ) {
        monthlyExpenses += finalTotal;
      }
    });

    return { monthlyRevenue, monthlyExpenses };
  };

  // Calculate data from API or use mock data
  const calculateData = () => {
    if (apiData) {
      // Handle different possible API response structures
      let accounts = [];
      if (apiData.accounts) {
        accounts = apiData.accounts;
      } else if (Array.isArray(apiData)) {
        accounts = apiData;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        accounts = apiData.data;
      }
      
      if (accounts.length > 0) {
        const totalAccounts = accounts.length;
        
        // Count unique drivers by driver name (remove duplicates)
        const uniqueDriverNames = new Set(
          accounts
            .filter((acc: any) => acc.driver && acc.driver.trim() !== '')
            .map((acc: any) => acc.driver.trim().toLowerCase())
        );
        const totalDrivers = uniqueDriverNames.size;
        
        // Count unique trucks by plate numbers (remove duplicates)
        const uniquePlateNumbers = new Set(
          accounts
            .filter((acc: any) => acc.plate_number && acc.plate_number.trim() !== '')
            .map((acc: any) => acc.plate_number.trim().toLowerCase())
        );
        const totalTrucks = uniquePlateNumbers.size;
        
        // Count entries per account type
        const accountTypeCounts = accounts.reduce((acc: any, account: any) => {
          const accountType = account.account_type || 'Unknown';
          acc[accountType] = (acc[accountType] || 0) + 1;
          return acc;
        }, {});
        
        return {
          totalTrucks,
          totalDrivers,
          totalAccounts,
          accountTypeCounts,
          monthlyRevenue: 285000, // Mock data
          pendingDeliveries: 18, // Mock data
          completedTrips: 342 // Mock data
        };
      }
    }
    
    // Fallback mock data
    return {
      totalTrucks: 125,
      totalDrivers: 52,
      totalAccounts: 200,
      accountTypeCounts: { Truck: 125, Driver: 52, Other: 23 },
      monthlyRevenue: 285000,
      pendingDeliveries: 18,
      completedTrips: 342
    };
  };

  const data = calculateData();

  const chartData = [
    { month: 'Jan', revenue: 180000 },
    { month: 'Feb', revenue: 220000 },
    { month: 'Mar', revenue: 195000 },
    { month: 'Apr', revenue: 250000 },
    { month: 'May', revenue: 280000 },
    { month: 'Jun', revenue: 285000 }
  ];

  // Get first 3 unique trucks from API data
  const getActiveTrucks = () => {
    if (apiData) {
      let accounts = [];
      if (apiData.accounts) {
        accounts = apiData.accounts;
      } else if (Array.isArray(apiData)) {
        accounts = apiData;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        accounts = apiData.data;
      }
      
      // Get unique trucks with plate numbers
      const uniqueTrucks = new Map();
      accounts.forEach((acc: any) => {
        if (acc.plate_number && acc.plate_number.trim() !== '') {
          const plate = acc.plate_number.trim();
          if (!uniqueTrucks.has(plate)) {
            uniqueTrucks.set(plate, {
              plate: plate,
              driver: acc.driver || 'Unknown Driver'
            });
          }
        }
      });
      
      // Return first 3 trucks
      return Array.from(uniqueTrucks.values()).slice(0, 3);
    }
    
    // Fallback mock data
    return [
      { plate: 'TR-001', driver: 'John Smith' },
      { plate: 'TR-002', driver: 'Maria Garcia' },
      { plate: 'TR-003', driver: 'David Johnson' }
    ];
  };

  const activeTrucks = getActiveTrucks();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#296c77' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
      <Navbar />
      <div className="pt-16 p-8">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto mt-5">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-300">Comprehensive fleet analytics and performance metrics.</p>
          </div>

          {/* Top Row - Metrics and Truck Illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Fleet Overview Card */}
            <div className="lg:col-span-2 rounded-lg p-6 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-no-repeat bg-center bg-cover"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
              <div 
                className="absolute inset-0 bg-no-repeat bg-center bg-cover"
                style={{
                  backgroundImage: 'url(/images/truck_background2.png)',
                  position: 'absolute',
                  top: -150,
                  left: 0,
                  zIndex: 1
                }}
              >



                
              </div>


                
              </div>
              {/* <div className="relative z-10">
                <h3 className="text-white text-xl font-semibold mb-4 drop-shadow-lg">Fleet Overview</h3>
                <div className="flex items-center justify-center">
                  <div className="text-6xl drop-shadow-lg">🚛</div>
                </div>
                <p className="text-white text-center mt-4 drop-shadow-lg">Your trucks are on the move</p>
              </div> */}
            </div>

            {/* Total Trucks Metric */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-lg font-semibold">Total Trucks</h3>
                <Link
                  href="/accounts-detail"
                  className="px-3 py-1 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="text-4xl font-bold text-white">{data.totalTrucks}</div>
              <p className="text-gray-400 text-sm mt-2">Active fleet</p>
            </div>

            {/* Total Drivers Metric */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-lg font-semibold">Total Drivers</h3>
                <Link
                  href="/drivers"
                  className="px-3 py-1 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="text-4xl font-bold text-orange-500">{data.totalDrivers}</div>
              <p className="text-gray-400 text-sm mt-2">Registered drivers</p>
            </div>
          </div>

          {/* Bottom Row - Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Types Pie Chart */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white text-xl font-semibold">Accounts Entries</h3>
                <Link
                  href="/accounts"
                  className="px-3 py-1 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Pie Chart SVG */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const entries = Object.entries(data.accountTypeCounts);
                      const total = entries.reduce((sum, [, count]) => sum + (count as number), 0);
                      let currentAngle = 0;
                      const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#84cc16'];
                      
                      return entries.map(([type, count], index) => {
                        const percentage = (count as number) / total;
                        const angle = percentage * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M 50 50`,
                          `L ${x1} ${y1}`,
                          `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        currentAngle += angle;
                        
                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white text-lg font-bold">Total</div>
                      <div className="text-orange-500 text-2xl font-bold">
                        {Object.values(data.accountTypeCounts).reduce((sum: number, count) => sum + (count as number), 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {Object.entries(data.accountTypeCounts).map(([type, count], index) => {
                  const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#84cc16'];
                  const percentage = ((count as number) / Object.values(data.accountTypeCounts).reduce((sum: number, c) => sum + (c as number), 0) * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <span className="text-gray-300 truncate">{type}</span>
                      <span className="text-white font-medium ml-auto">{count as number}</span>
                      <span className="text-gray-400">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Financial Cards */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white text-xl font-semibold">Monthly Financials</h3>
                <Link
                  href="/revenue"
                  className="px-3 py-1 bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              
              {/* Month Filter */}
              <div className="mb-4 flex items-center space-x-4">
                <label htmlFor="month-filter" className="text-white font-medium text-sm">
                  Filter by Month:
                </label>
                <input
                  type="month"
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 text-sm border border-white/20 rounded-md bg-black/40 text-white hover:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white text-sm font-semibold mb-2">Monthly Revenue</h4>
                  <div className="text-2xl font-bold text-green-500">
                    ₱{calculateMonthlyData().monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white text-sm font-semibold mb-2">Monthly Expenses</h4>
                  <div className="text-2xl font-bold text-red-500">
                    ₱{calculateMonthlyData().monthlyExpenses.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white text-sm font-semibold mb-2">Net Profit</h4>
                  <div className={`text-2xl font-bold ${calculateMonthlyData().monthlyRevenue - calculateMonthlyData().monthlyExpenses >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₱{(calculateMonthlyData().monthlyRevenue - calculateMonthlyData().monthlyExpenses).toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Trucks Section */}
          <div className="mt-8">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-white text-xl font-semibold mb-4">Active Trucks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeTrucks.map((truck, index) => (
                  <div key={index} className="flex flex-col items-center space-y-3 p-4 bg-slate-700 rounded-lg">
                    <img src="/images/truck1.png" alt="Truck" className="w-16 h-16" />
                    <div className="text-center">
                      <div className="text-white font-medium text-lg">{truck.plate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
