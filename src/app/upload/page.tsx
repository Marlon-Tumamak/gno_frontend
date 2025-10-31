'use client';

import ExcelUpload from '@/components/upload/ExcelUpload';
import DriverRouteManager from '@/components/upload/DriverRouteManager';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useState, useEffect } from 'react';

export default function UploadPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <SkeletonLoader variant="upload" />;
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
          {/* <div className="mb-8">
            <div className="glass-effect rounded-2xl p-8 elevated-box">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-3">Upload Data</h1>
                  <p className="text-gray-600 text-lg">Upload Excel files to import account data</p>
                </div>
                <Link
                  href="/analytics"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-black hover:to-gray-800 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Back to Analytics
                </Link>
              </div>
            </div>
          </div> */}
          
          <div className="space-y-8">
            {/* Top Row - Driver & Route Management */}
            <DriverRouteManager />
            
            {/* Bottom Row - Upload Component */}
            <ExcelUpload />
          </div>
        </div>
      </div>
    </div>
  );
}

