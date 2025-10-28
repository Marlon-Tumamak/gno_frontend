'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Analytics() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [apiData, setApiData] = useState<any>(null);
  const [tripsData, setTripsData] = useState<any>(null);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/trucking/`);
      
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
        setTripsData(data); // Use the same data for trips summary
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

  // Calculate monthly financial data based on selected month
  const calculateMonthlyFinancials = (month: string) => {
    if (!apiData) {
      return {
        revenue: 0,
        expenses: 0,
        profit: 0,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    }

    let accounts = [];
    if (apiData.accounts) {
      accounts = apiData.accounts;
    } else if (Array.isArray(apiData)) {
      accounts = apiData;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      accounts = apiData.data;
    }

    // Filter accounts for the selected month
    const monthAccounts = accounts.filter((acc: any) => {
      if (!acc.date) return false;
      const accountDate = new Date(acc.date);
      const selectedDate = new Date(month + '-01');
      return accountDate.getMonth() === selectedDate.getMonth() && 
             accountDate.getFullYear() === selectedDate.getFullYear();
    });

    // Calculate revenue (positive amounts)
    const revenue = monthAccounts
      .filter((acc: any) => {
        const amount = parseFloat(acc.final_total || acc.amount || 0);
        return amount > 0;
      })
      .reduce((sum: number, acc: any) => sum + parseFloat(acc.final_total || acc.amount || 0), 0);

    // Calculate expenses (negative amounts or specific expense types)
    const expenses = monthAccounts
      .filter((acc: any) => {
        const amount = parseFloat(acc.final_total || acc.amount || 0);
        const accountType = (acc.account_type || '').toLowerCase();
        return amount < 0 || accountType.includes('expense') || accountType.includes('fuel') || accountType.includes('maintenance');
      })
      .reduce((sum: number, acc: any) => sum + Math.abs(parseFloat(acc.final_total || acc.amount || 0)), 0);

    const profit = revenue - expenses;

    return {
      revenue,
      expenses,
      profit,
      monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  };

  const monthlyFinancials = calculateMonthlyFinancials(selectedMonth);

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
        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="glass-effect rounded-2xl p-8 elevated-box">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">Analytics Dashboard</h1>
              <p className="text-gray-600 text-lg">Comprehensive fleet analytics and performance metrics</p>
            </div>
          </div>

          {/* Account Entries Cards Section */}
          <div className="mb-8">
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Entries Overview</h3>
                  <p className="text-gray-600">Track all account types and their entries</p>
                </div>
                <Link
                  href="/accounts"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  See Details
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(data.accountTypeCounts).map(([type, count], index) => {
                  const colors = [
                    { bg: 'bg-blue-500', border: 'border-blue-400', icon: '🚛' },
                    { bg: 'bg-red-500', border: 'border-red-400', icon: '⏰' },
                    { bg: 'bg-purple-500', border: 'border-purple-400', icon: '✅' },
                    { bg: 'bg-blue-600', border: 'border-blue-500', icon: '❌' },
                    { bg: 'bg-green-500', border: 'border-green-400', icon: '✈️' },
                    { bg: 'bg-orange-500', border: 'border-orange-400', icon: '🔄' },
                    { bg: 'bg-green-400', border: 'border-green-300', icon: '⏸️' },
                    { bg: 'bg-orange-600', border: 'border-orange-500', icon: '⚠️' }
                  ];
                  
                  const colorScheme = colors[index % colors.length];
                  
                  return (
                    <div key={index} className={`${colorScheme.bg} ${colorScheme.border} border rounded-2xl p-6 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[120px]`}>
                      <div className="flex items-center space-x-4 h-full">
                        {/* Icon with circular background */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-inner">
                            <div className="text-white text-2xl">{colorScheme.icon}</div>
                          </div>
                        </div>
                        
                        {/* Text content */}
                        <div className="flex-1 flex flex-col justify-center items-start">
                          <div className="text-white/90 text-sm font-medium mb-1">{type}</div>
                          <div className="text-white text-4xl font-bold drop-shadow-sm">{count as number}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monthly Financials Section */}
          <div className="mb-8">
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Monthly Financials</h3>
                  <p className="text-gray-600">Track revenue, expenses, and profit for the selected month</p>
                </div>
                <Link
                  href="/revenue"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  See Details
                </Link>
              </div>
              
              {/* Month Filter */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <label className="text-gray-700 font-semibold">Filter by Month:</label>
                  <div className="relative">
                    <input
                      type="month"
                      className="px-4 py-3 bg-white border-2 border-orange-500 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-600 font-semibold cursor-pointer hover:border-orange-600 transition-all duration-200"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                      }}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Revenue */}
                <div className="metric-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Monthly Revenue</h4>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <span className="text-white text-xl">💰</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">₱{monthlyFinancials.revenue.toLocaleString()}</div>
                  <div className="text-gray-600 text-sm">{monthlyFinancials.monthName}</div>
                </div>

                {/* Monthly Expenses */}
                <div className="metric-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Monthly Expenses</h4>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-xl">💸</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-2">₱{monthlyFinancials.expenses.toLocaleString()}</div>
                  <div className="text-gray-600 text-sm">{monthlyFinancials.monthName}</div>
                </div>

                {/* Net Profit */}
                <div className="metric-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Net Profit</h4>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xl">📊</span>
                    </div>
                  </div>
                  <div className={`text-3xl font-bold mb-2 ${monthlyFinancials.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₱{monthlyFinancials.profit.toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">{monthlyFinancials.monthName}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Trips Summary Section */}
          <div className="mb-12">
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Recent Trips Summary</h3>
                  <p className="text-gray-600">Latest fleet activities and transactions</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <Link
                    href="/trips"
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    See All Trips
                  </Link>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                {(() => {
                  if (tripsData) {
                    let accounts = [];
                    if (tripsData.accounts) {
                      accounts = tripsData.accounts;
                    } else if (Array.isArray(tripsData)) {
                      accounts = tripsData;
                    } else if (tripsData.data && Array.isArray(tripsData.data)) {
                      accounts = tripsData.data;
                    }
                    
                    // Get recent trips (limit to 10)
                    const recentTrips = accounts.slice(0, 10);
                    
                    return recentTrips.map((trip: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="text-gray-800 font-semibold text-lg">
                              {trip.driver || 'Unknown Driver'} - {trip.plate_number || 'No Plate'}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {trip.account_type || 'Unknown Type'} • {trip.date ? new Date(trip.date).toLocaleDateString() : 'No Date'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-800 font-bold text-lg">
                            ₱{trip.final_total ? parseFloat(trip.final_total).toLocaleString() : '0'}
                          </div>
                          <div className="text-gray-600 text-sm">
                            {trip.remarks || 'No remarks'}
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  
                  // Fallback mock data
                  return [
                    { driver: 'John Smith', plate: 'TR-001', type: 'Hauling Income', amount: 15000, date: '2024-01-15', remarks: 'Delivery to Manila' },
                    { driver: 'Maria Garcia', plate: 'TR-002', type: 'Fuel Expense', amount: 5000, date: '2024-01-14', remarks: 'Fuel refill' },
                    { driver: 'David Johnson', plate: 'TR-003', type: 'Hauling Income', amount: 12000, date: '2024-01-13', remarks: 'Cargo transport' },
                    { driver: 'Sarah Wilson', plate: 'TR-004', type: 'Maintenance', amount: 8000, date: '2024-01-12', remarks: 'Engine repair' },
                    { driver: 'Michael Brown', plate: 'TR-005', type: 'Hauling Income', amount: 18000, date: '2024-01-11', remarks: 'Long distance haul' }
                  ].map((trip, index) => (
                    <div key={index} className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-gray-800 font-semibold text-lg">
                            {trip.driver} - {trip.plate}
                          </div>
                          <div className="text-gray-600 text-sm">
                            {trip.type} • {new Date(trip.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-800 font-bold text-lg">
                          ₱{trip.amount.toLocaleString()}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {trip.remarks}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
          
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drivers Box */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Active Drivers</h3>
                  <p className="text-gray-600">Current fleet drivers</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">👨‍💼</span>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {(() => {
                  if (apiData) {
                    let accounts = [];
                    if (apiData.accounts) {
                      accounts = apiData.accounts;
                    } else if (Array.isArray(apiData)) {
                      accounts = apiData;
                    } else if (apiData.data && Array.isArray(apiData.data)) {
                      accounts = apiData.data;
                    }
                    
                    // Get unique drivers
                    const uniqueDrivers = new Set();
                    accounts.forEach((acc: any) => {
                      if (acc.driver && acc.driver.trim() !== '') {
                        uniqueDrivers.add(acc.driver.trim());
                      }
                    });
                    
                    return Array.from(uniqueDrivers).map((driver, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="text-gray-800 font-semibold">{driver as string}</div>
                      </div>
                    ));
                  }
                  
                  // Fallback mock data
                  return ['John Smith', 'Maria Garcia', 'David Johnson', 'Sarah Wilson', 'Michael Brown'].map((driver, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="text-gray-800 font-semibold">{driver}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Trucks Box */}
            <div className="gradient-card rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Fleet Trucks</h3>
                  <p className="text-gray-600">Active vehicle fleet</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-white text-xl">🚛</span>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {(() => {
                  if (apiData) {
                    let accounts = [];
                    if (apiData.accounts) {
                      accounts = apiData.accounts;
                    } else if (Array.isArray(apiData)) {
                      accounts = apiData;
                    } else if (apiData.data && Array.isArray(apiData.data)) {
                      accounts = apiData.data;
                    }
                    
                    // Get unique trucks
                    const uniqueTrucks = new Set();
                    accounts.forEach((acc: any) => {
                      if (acc.plate_number && acc.plate_number.trim() !== '') {
                        uniqueTrucks.add(acc.plate_number.trim());
                      }
                    });
                    
                    return Array.from(uniqueTrucks).map((truck, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="text-gray-800 font-semibold">{truck as string}</div>
                      </div>
                    ));
                  }
                  
                  // Fallback mock data
                  return ['TR-001', 'TR-002', 'TR-003', 'TR-004', 'TR-005'].map((truck, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="text-gray-800 font-semibold">{truck}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Top Row - Metrics and Truck Illustration */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Fleet Overview Card */}
            {/* <div className="lg:col-span-2 rounded-lg p-6 relative overflow-hidden">
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
            {/* </div>

            {/* Total Trucks Metric */}
            {/* <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-lg font-semibold">Total Trucks</h3>
                <Link
                  href="/accounts-detail"
                  className="px-3 py-1 bg-orange-600 hover:bg-black text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="text-4xl font-bold text-white">{data.totalTrucks}</div>
              <p className="text-gray-400 text-sm mt-2">Active fleet</p>
            </div>

            {/* Total Drivers Metric */}
            {/* <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-lg font-semibold">Total Drivers</h3>
                <Link
                  href="/drivers"
                  className="px-3 py-1 bg-orange-600 hover:bg-black text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="text-4xl font-bold text-orange-500">{data.totalDrivers}</div>
              <p className="text-gray-400 text-sm mt-2">Registered drivers</p>
            </div>
          </div> */}

          {/* Bottom Row - Charts and Lists */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Types Pie Chart */}
            {/* <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white text-xl font-semibold">Accounts Entries</h3>
                <Link
                  href="/accounts"
                  className="px-3 py-1 bg-orange-600 hover:bg-black text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Pie Chart SVG */}
                  {/* <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                  </svg> */}
                  
                  {/* Center text */}
                  {/* <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white text-lg font-bold">Total</div>
                      <div className="text-orange-500 text-2xl font-bold">
                        {Object.values(data.accountTypeCounts).reduce((sum: number, count) => sum + (count as number), 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              
              {/* Legend */}
              {/* <div className="mt-6 grid grid-cols-2 gap-2">
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
            </div> */}

            {/* Monthly Financial Cards */}
            {/* <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white text-xl font-semibold">Monthly Financials</h3>
                <Link
                  href="/revenue"
                  className="px-3 py-1 bg-orange-600 hover:bg-black text-white text-sm rounded-md transition-all duration-200"
                >
                  See Details
                </Link>
              </div> */}
              
              {/* Month Filter */}
              {/* <div className="mb-4 flex items-center space-x-4">
                <label htmlFor="month-filter" className="text-white font-medium text-sm">
                  Filter by Month:
                </label>
                <input
                  type="month"
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 text-sm border border-orange-500 rounded-md bg-orange-600 text-white hover:bg-black hover:border-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div> */}

              {/* <div className="space-y-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white text-sm font-semibold mb-2">Monthly Revenue</h4>
                  <div className="text-2xl font-bold text-green-500">
                    ₱{calculateMonthlyData().monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div> */}

                {/* <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-white text-sm font-semibold mb-2">Monthly Expenses</h4>
                  <div className="text-2xl font-bold text-red-500">
                    ₱{calculateMonthlyData().monthlyExpenses.toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div> */}

                {/* <div className="p-4 bg-slate-700 rounded-lg">
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
          </div> */}
        </div>
      </div>
    </div>
  );
}
