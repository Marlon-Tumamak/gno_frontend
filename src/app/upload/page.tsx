'use client';

import ExcelUpload from '@/components/upload/ExcelUpload';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex justify-end">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      <ExcelUpload />
    </div>
  );
}

