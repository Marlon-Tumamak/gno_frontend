import ExcelUpload from '@/components/upload/ExcelUpload';
import Link from 'next/link';

export default function UploadPage() {
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

