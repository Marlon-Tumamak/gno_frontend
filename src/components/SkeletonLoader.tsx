'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'analytics' | 'dashboard' | 'accounts' | 'revenue' | 'drivers' | 'trips' | 'upload';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'analytics', 
  className = '' 
}) => {
  // Common skeleton elements
  const SkeletonBox = ({ className: boxClassName = '', children }: { className?: string; children?: React.ReactNode }) => (
    <div className={`animate-pulse ${boxClassName}`}>
      {children}
    </div>
  );

  const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }: { width?: string; height?: string; className?: string }) => (
    <div className={`bg-gray-300 rounded-lg ${width} ${height} ${className}`}></div>
  );

  const SkeletonCard = ({ className: cardClassName = '' }: { className?: string }) => (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${cardClassName}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <SkeletonText width="w-32" height="h-6" />
          <SkeletonText width="w-48" height="h-4" />
        </div>
        <SkeletonText width="w-24" height="h-10" />
      </div>
    </div>
  );

  const SkeletonMetricCard = ({ color = 'bg-gray-300' }: { color?: string }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <SkeletonText width="w-24" height="h-5" />
        <div className={`w-12 h-12 rounded-2xl ${color}`}></div>
      </div>
      <SkeletonText width="w-32" height="h-8" />
      <SkeletonText width="w-20" height="h-4" className="mt-2" />
    </div>
  );

  const SkeletonAccountCard = ({ bgColor = 'bg-gray-300' }: { bgColor?: string }) => (
    <div className={`${bgColor} rounded-2xl p-6 min-h-[120px] relative overflow-hidden shadow-lg`}>
      <div className="flex items-center space-x-4 h-full">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30"></div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-start space-y-2">
          <div className="w-24 h-4 bg-white/30 rounded"></div>
          <div className="w-16 h-8 bg-white/30 rounded"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonTripItem = () => (
    <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-gray-300"></div>
        <div className="space-y-2">
          <SkeletonText width="w-48" height="h-5" />
          <SkeletonText width="w-32" height="h-4" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <SkeletonText width="w-24" height="h-5" />
        <SkeletonText width="w-20" height="h-4" />
      </div>
    </div>
  );

  const SkeletonListItem = () => (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-300"></div>
      <SkeletonText width="w-32" height="h-5" />
    </div>
  );

  // Analytics page skeleton
  const AnalyticsSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-80" height="h-10" className="mb-3" />
              <SkeletonText width="w-96" height="h-6" />
            </div>
          </div>

          {/* Account Entries Cards Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                  <SkeletonText width="w-64" height="h-7" />
                  <SkeletonText width="w-80" height="h-5" />
                </div>
                <SkeletonText width="w-32" height="h-12" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SkeletonAccountCard bgColor="bg-blue-500" />
                <SkeletonAccountCard bgColor="bg-red-500" />
                <SkeletonAccountCard bgColor="bg-purple-500" />
                <SkeletonAccountCard bgColor="bg-blue-600" />
                <SkeletonAccountCard bgColor="bg-green-500" />
                <SkeletonAccountCard bgColor="bg-orange-500" />
                <SkeletonAccountCard bgColor="bg-green-400" />
                <SkeletonAccountCard bgColor="bg-orange-600" />
              </div>
            </div>
          </div>

          {/* Monthly Financials Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                  <SkeletonText width="w-56" height="h-7" />
                  <SkeletonText width="w-80" height="h-5" />
                </div>
                <SkeletonText width="w-32" height="h-12" />
              </div>
              
              {/* Month Filter */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <SkeletonText width="w-32" height="h-5" />
                  <SkeletonText width="w-40" height="h-12" />
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonMetricCard color="bg-green-300" />
                <SkeletonMetricCard color="bg-red-300" />
                <SkeletonMetricCard color="bg-blue-300" />
              </div>
            </div>
          </div>

          {/* Trips Summary Section */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <SkeletonText width="w-64" height="h-7" />
                  <SkeletonText width="w-80" height="h-5" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-300"></div>
                  <SkeletonText width="w-32" height="h-12" />
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {[...Array(5)].map((_, index) => (
                  <SkeletonTripItem key={index} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Drivers and Trucks Section */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drivers Box */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <SkeletonText width="w-40" height="h-7" />
                  <SkeletonText width="w-32" height="h-5" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-300"></div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...Array(5)].map((_, index) => (
                  <SkeletonListItem key={index} />
                ))}
              </div>
            </div>

            {/* Trucks Box */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <SkeletonText width="w-40" height="h-7" />
                  <SkeletonText width="w-32" height="h-5" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-300"></div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...Array(5)].map((_, index) => (
                  <SkeletonListItem key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Dashboard page skeleton
  const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-64" height="h-10" className="mb-3" />
              <SkeletonText width="w-80" height="h-6" />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, index) => (
              <SkeletonMetricCard key={index} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <SkeletonText width="w-48" height="h-7" />
                <SkeletonText width="w-24" height="h-10" />
              </div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <SkeletonText width="w-48" height="h-7" />
                <SkeletonText width="w-24" height="h-10" />
              </div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Accounts page skeleton
  const AccountsSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-48" height="h-10" className="mb-3" />
              <SkeletonText width="w-64" height="h-6" />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex flex-wrap gap-4">
              <SkeletonText width="w-32" height="h-10" />
              <SkeletonText width="w-40" height="h-10" />
              <SkeletonText width="w-28" height="h-10" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 pb-4 border-b border-gray-200">
                  {[...Array(6)].map((_, index) => (
                    <SkeletonText key={index} width="w-24" height="h-5" />
                  ))}
                </div>
                {/* Table Rows */}
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-100">
                    {[...Array(6)].map((_, cellIndex) => (
                      <SkeletonText key={cellIndex} width="w-20" height="h-4" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Revenue page skeleton
  const RevenueSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-56" height="h-10" className="mb-3" />
              <SkeletonText width="w-72" height="h-6" />
            </div>
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonMetricCard color="bg-green-300" />
            <SkeletonMetricCard color="bg-blue-300" />
            <SkeletonMetricCard color="bg-purple-300" />
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex justify-between items-center mb-6">
              <SkeletonText width="w-48" height="h-7" />
              <SkeletonText width="w-24" height="h-10" />
            </div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>

          {/* Revenue Table */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <SkeletonText width="w-48" height="h-7" />
              <SkeletonText width="w-24" height="h-10" />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-5 gap-4 pb-4 border-b border-gray-200">
                  {[...Array(5)].map((_, index) => (
                    <SkeletonText key={index} width="w-24" height="h-5" />
                  ))}
                </div>
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100">
                    {[...Array(5)].map((_, cellIndex) => (
                      <SkeletonText key={cellIndex} width="w-20" height="h-4" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Drivers page skeleton
  const DriversSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-48" height="h-10" className="mb-3" />
              <SkeletonText width="w-64" height="h-6" />
            </div>
          </div>

          {/* Driver Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, index) => (
              <SkeletonMetricCard key={index} />
            ))}
          </div>

          {/* Drivers List */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <SkeletonText width="w-48" height="h-7" />
              <SkeletonText width="w-24" height="h-10" />
            </div>
            <div className="space-y-4">
              {[...Array(10)].map((_, index) => (
                <SkeletonListItem key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Trips page skeleton
  const TripsSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-48" height="h-10" className="mb-3" />
              <SkeletonText width="w-64" height="h-6" />
            </div>
          </div>

          {/* Trip Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, index) => (
              <SkeletonMetricCard key={index} />
            ))}
          </div>

          {/* Trips List */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <SkeletonText width="w-48" height="h-7" />
              <SkeletonText width="w-24" height="h-10" />
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, index) => (
                <SkeletonTripItem key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Upload page skeleton
  const UploadSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-16 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <SkeletonText width="w-48" height="h-10" className="mb-3" />
              <SkeletonText width="w-80" height="h-6" />
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <SkeletonText width="w-48" height="h-6" className="mx-auto mb-2" />
              <SkeletonText width="w-64" height="h-5" className="mx-auto" />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <SkeletonText width="w-40" height="h-7" className="mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  <SkeletonText width="w-72" height="h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render appropriate skeleton based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'accounts':
        return <AccountsSkeleton />;
      case 'revenue':
        return <RevenueSkeleton />;
      case 'drivers':
        return <DriversSkeleton />;
      case 'trips':
        return <TripsSkeleton />;
      case 'upload':
        return <UploadSkeleton />;
      case 'analytics':
      default:
        return <AnalyticsSkeleton />;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
