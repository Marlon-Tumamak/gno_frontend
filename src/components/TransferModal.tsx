'use client';

import { useState } from 'react';

interface TransferEntry {
  id: number;
  account_number: string;
  reference_number: string | null;
  date: string;
  description: string;
  remarks: string;
  final_total: number;
  debit: number;
  credit: number;
}

interface TransferDetails {
  source: { plateNumber: string; date: string; entries: TransferEntry[] };
  target: { plateNumber: string; date: string; entries: TransferEntry[] };
}

interface TransferModalProps {
  isOpen: boolean;
  transferDetails: TransferDetails | null;
  loadingEntries: boolean;
  onClose: () => void;
  onConfirm: (details: TransferDetails) => Promise<void>;
  sourcePlateNumber?: string;
  sourceDate?: string;
  targetPlateNumber?: string;
  targetDate?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export default function TransferModal({
  isOpen,
  transferDetails,
  loadingEntries,
  onClose,
  onConfirm,
  sourcePlateNumber,
  sourceDate,
  targetPlateNumber,
  targetDate,
}: TransferModalProps) {
  const [isTransferring, setIsTransferring] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!transferDetails) return;
    
    setIsTransferring(true);
    try {
      await onConfirm(transferDetails);
      // Modal will be closed by parent after successful transfer
    } catch (error) {
      console.error('Transfer error:', error);
      // Error toast is handled by parent component
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">Allowance Transfer Details</h2>
            <button
              onClick={onClose}
              disabled={isTransferring}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold">From:</span> {transferDetails?.source?.plateNumber || sourcePlateNumber || 'N/A'} on {transferDetails?.source?.date || sourceDate || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">To:</span> {transferDetails?.target?.plateNumber || targetPlateNumber || 'N/A'} on {transferDetails?.target?.date || targetDate || 'N/A'}
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {(loadingEntries || isTransferring) && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20 rounded-b-2xl">
              <div className="text-center">
                <svg className="animate-spin h-16 w-16 text-orange-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-gray-800 font-bold text-xl mb-2">
                  {isTransferring ? 'Transferring allowance entries...' : 'Loading allowance entries...'}
                </div>
                <div className="text-gray-600 text-sm">
                  {isTransferring ? 'Please wait while we update the dates' : 'Please wait while we fetch the entries'}
                </div>
              </div>
            </div>
          )}
          {!loadingEntries && transferDetails && (
            <div className="space-y-6">
              {/* Source Entries */}
              <div>
                <h3 className="text-xl font-bold text-black mb-3">
                  Source Entries ({transferDetails.source.plateNumber} - {transferDetails.source.date})
                </h3>
                {transferDetails.source.entries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Account #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transferDetails.source.entries.map((entry, idx) => (
                          <tr key={entry.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-black font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.account_number || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.reference_number || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.date || '-'}</td>
                            <td className="px-4 py-3 text-black">{entry.description || '-'}</td>
                            <td className="px-4 py-3 text-black">{entry.remarks || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black text-right font-semibold">
                              {formatCurrency(parseFloat(entry.final_total?.toString() || '0'))}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
                          <td colSpan={6} className="px-4 py-3 text-right text-black">TOTAL:</td>
                          <td className="px-4 py-3 whitespace-nowrap text-black text-right">
                            {formatCurrency(
                              transferDetails.source.entries.reduce((sum, entry) => sum + parseFloat(entry.final_total?.toString() || '0'), 0)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">No allowance entries found</div>
                )}
              </div>

              {/* Target Entries */}
              <div>
                <h3 className="text-xl font-bold text-black mb-3">
                  Target Entries ({transferDetails.target.plateNumber} - {transferDetails.target.date})
                </h3>
                {transferDetails.target.entries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Account #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transferDetails.target.entries.map((entry, idx) => (
                          <tr key={entry.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-black font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.account_number || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.reference_number || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black">{entry.date || '-'}</td>
                            <td className="px-4 py-3 text-black">{entry.description || '-'}</td>
                            <td className="px-4 py-3 text-black">{entry.remarks || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-black text-right font-semibold">
                              {formatCurrency(parseFloat(entry.final_total?.toString() || '0'))}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold">
                          <td colSpan={6} className="px-4 py-3 text-right text-black">TOTAL:</td>
                          <td className="px-4 py-3 whitespace-nowrap text-black text-right">
                            {formatCurrency(
                              transferDetails.target.entries.reduce((sum, entry) => sum + parseFloat(entry.final_total?.toString() || '0'), 0)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">No allowance entries found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isTransferring}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isTransferring || loadingEntries}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isTransferring ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Transferring...</span>
                </>
              ) : (
                <span>Confirm Transfer</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

