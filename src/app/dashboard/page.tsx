'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in via localStorage
    const loggedIn = localStorage.getItem('isLoggedIn');
    const email = localStorage.getItem('userEmail');

    if (loggedIn === 'true' && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    } else {
      router.push('/');
    }
    
    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [router]);

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

  if (loading) {
    return <SkeletonLoader variant="dashboard" />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#296c77' }}>
      <Navbar />
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto mt-5">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to Myrrh Dashboard
              </h1>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{userEmail}</span>!
              </p>
              <p className="text-sm text-gray-500">
                Your logistics platform is ready to use.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Shipments</h3>
                  <p className="text-blue-700">Manage your shipments and track deliveries</p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Inventory</h3>
                  <p className="text-green-700">Monitor inventory levels and stock management</p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Analytics</h3>
                  <p className="text-purple-700">View reports and supply chain analytics</p>
                </div>
                
                <Link href="/upload" className="block">
                  <div className="bg-indigo-50 p-6 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Upload Data</h3>
                    <p className="text-indigo-700">Upload Excel files for accounts and transactions</p>
                  </div>
                </Link>
                
                <Link href="/drivers" className="block">
                  <div className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Drivers Summary</h3>
                    <p className="text-orange-700">View drivers&apos; front load, back load, and allowances</p>
                  </div>
                </Link>
                
                <Link href="/revenue" className="block">
                  <div className="bg-emerald-50 p-6 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">Revenue Streams</h3>
                    <p className="text-emerald-700">View revenue and expense streams with charts</p>
                  </div>
                </Link>
                
                <Link href="/accounts" className="block">
                  <div className="bg-teal-50 p-6 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-teal-900 mb-2">Accounts Summary</h3>
                    <p className="text-teal-700">View all account types with financial totals</p>
                  </div>
                </Link>
                
                <Link href="/trips" className="block">
                  <div className="bg-cyan-50 p-6 rounded-lg hover:bg-cyan-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-cyan-900 mb-2">Trips Summary</h3>
                    <p className="text-cyan-700">Consolidated view of all trips (1 day = 1 trip)</p>
                  </div>
                </Link>
                
                {/* <Link href="/salary" className="block">
                  <div className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Salary Accounts</h3>
                    <p className="text-purple-700">View salary account data with drivers and routes</p>
                  </div>
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}