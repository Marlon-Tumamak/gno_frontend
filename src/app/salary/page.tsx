'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExcelUpload from '@/components/upload/ExcelUpload';

interface SalaryAccount {
  id: number;
  account_number: string;
  account_type: string;
  truck_type: string;
  plate_number: string | null;
  description: string;
  debit: number;
  credit: number;
  final_total: number;
  remarks: string;
  reference_number: string | null;
  date: string;
  quantity: number | null;
  price: number | null;
  driver: string | null;
  route: string | null;
  front_load: string | null;
  back_load: string | null;
}

export default function SalaryPage() {
  const [salaryAccounts, setSalaryAccounts] = useState<SalaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchSalaryAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/v1/salary/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalaryAccount[] = await response.json();
      setSalaryAccounts(data);
    } catch (err) {
      console.error('Failed to fetch salary accounts:', err);
      setError('Failed to load salary accounts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryAccounts();
  }, []);

  const totalDebit = salaryAccounts.reduce((sum, account) => sum + account.debit, 0);
  const totalCredit = salaryAccounts.reduce((sum, account) => sum + account.credit, 0);
  const netTotal = totalDebit - totalCredit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salary accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Salary Accounts</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Upload Data
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700">Total Accounts</h2>
            <p className="text-3xl font-bold text-gray-900 mt-2">{salaryAccounts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700">Total Debit</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalDebit)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700">Total Credit</h2>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalCredit)}</p>
          </div>
        </div>

        {/* Salary Accounts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Front Load</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Back Load</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.account_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.account_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.truck_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.plate_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(account.debit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(account.credit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(account.final_total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.remarks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.reference_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.quantity !== null ? account.quantity : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.price !== null ? formatCurrency(account.price) : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(typeof account.driver === 'object' && account.driver?.name) || account.driver || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(typeof account.route === 'object' && account.route?.name) || account.route || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.front_load || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.back_load || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Salary Data</h2>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
              </div>
              <ExcelUpload />
              <div className="mt-6 text-right">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

