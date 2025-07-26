import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface TaxTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'capital_gain' | 'capital_loss';
  description: string;
  amount: string;
  token: string;
  usdValue: string;
  category: string;
  txHash: string;
  network: string;
}

interface TaxSummary {
  totalIncome: string;
  totalExpenses: string;
  capitalGains: string;
  capitalLosses: string;
  netIncome: string;
  taxableIncome: string;
}

interface TaxReportingSystemProps {
  creatorAddress?: string;
}

export const TaxReportingSystem: React.FC<TaxReportingSystemProps> = ({ creatorAddress }) => {
  const { account, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'turbotax' | 'quickbooks'>('csv');

  useEffect(() => {
    if (isConnected) {
      loadTaxData();
    }
  }, [isConnected, selectedYear, creatorAddress]);

  const loadTaxData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from blockchain and price APIs
      const mockTransactions: TaxTransaction[] = [
        {
          id: '1',
          date: '2024-03-15',
          type: 'income',
          description: 'Content subscription payment',
          amount: '25.5',
          token: 'LIB',
          usdValue: '127.50',
          category: 'Content Revenue',
          txHash: '0x1234...5678',
          network: 'Ethereum'
        },
        {
          id: '2',
          date: '2024-03-20',
          type: 'income',
          description: 'NFT tier mint',
          amount: '0.1',
          token: 'ETH',
          usdValue: '350.00',
          category: 'NFT Sales',
          txHash: '0x2345...6789',
          network: 'Ethereum'
        },
        {
          id: '3',
          date: '2024-04-01',
          type: 'expense',
          description: 'Arweave storage fee',
          amount: '0.005',
          token: 'AR',
          usdValue: '2.50',
          category: 'Storage Costs',
          txHash: '0x3456...7890',
          network: 'Arweave'
        }
      ];

      const mockSummary: TaxSummary = {
        totalIncome: '15,420.75',
        totalExpenses: '1,250.30',
        capitalGains: '2,850.00',
        capitalLosses: '450.00',
        netIncome: '14,170.45',
        taxableIncome: '16,570.45'
      };

      setTransactions(mockTransactions);
      setTaxSummary(mockSummary);
    } catch (error) {
      console.error('Error loading tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTaxReport = async () => {
    try {
      setLoading(true);
      
      // Generate report based on format
      let reportData: any;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          reportData = generateCSVReport();
          filename = `tax-report-${selectedYear}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          reportData = generatePDFReport();
          filename = `tax-report-${selectedYear}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'turbotax':
          reportData = generateTurboTaxReport();
          filename = `turbotax-import-${selectedYear}.txf`;
          mimeType = 'text/plain';
          break;
        case 'quickbooks':
          reportData = generateQuickBooksReport();
          filename = `quickbooks-import-${selectedYear}.qbo`;
          mimeType = 'application/vnd.intu.qbo';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Create and download file
      const blob = new Blob([reportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting tax report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCSVReport = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Token', 'USD Value', 'Category', 'TX Hash', 'Network'];
    const rows = transactions.map(tx => [
      tx.date,
      tx.type,
      tx.description,
      tx.amount,
      tx.token,
      tx.usdValue,
      tx.category,
      tx.txHash,
      tx.network
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generatePDFReport = () => {
    // In real implementation, this would generate a proper PDF
    return `TAX REPORT ${selectedYear}\n\nSUMMARY:\nTotal Income: $${taxSummary?.totalIncome}\nTotal Expenses: $${taxSummary?.totalExpenses}\nNet Income: $${taxSummary?.netIncome}\n\nTRANSACTIONS:\n${transactions.map(tx => `${tx.date}: ${tx.description} - $${tx.usdValue}`).join('\n')}`;
  };

  const generateTurboTaxReport = () => {
    // TurboTax TXF format
    let txf = 'V042\nALibertyX Tax Report\nD' + new Date().toISOString().split('T')[0] + '\n';
    
    transactions.forEach(tx => {
      if (tx.type === 'income') {
        txf += `T\nN521\nC1\nL1\nP${tx.description}\nD${tx.date}\n$${tx.usdValue}\n^\n`;
      }
    });
    
    return txf;
  };

  const generateQuickBooksReport = () => {
    // Simplified QBO format
    return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${new Date().toISOString()}
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Content Revenue': 'bg-green-900 text-green-300',
      'NFT Sales': 'bg-blue-900 text-blue-300',
      'Storage Costs': 'bg-red-900 text-red-300',
      'Gas Fees': 'bg-yellow-900 text-yellow-300',
      'Platform Fees': 'bg-purple-900 text-purple-300'
    };
    return colors[category] || 'bg-gray-900 text-gray-300';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return '💰';
      case 'expense': return '💸';
      case 'capital_gain': return '📈';
      case 'capital_loss': return '📉';
      default: return '📊';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access tax reporting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tax Reporting System</h1>
            <p className="text-gray-400 mt-2">Automated cryptocurrency tax reporting and compliance</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="csv">Export as CSV</option>
              <option value="pdf">Export as PDF</option>
              <option value="turbotax">TurboTax Format</option>
              <option value="quickbooks">QuickBooks Format</option>
            </select>
            <button
              onClick={exportTaxReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Tax Summary */}
        {taxSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-2">Total Income</h3>
              <p className="text-2xl font-bold text-green-400">${taxSummary.totalIncome}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-400">${taxSummary.totalExpenses}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-2">Capital Gains</h3>
              <p className="text-2xl font-bold text-blue-400">${taxSummary.capitalGains}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold mb-2">Capital Losses</h3>
              <p className="text-2xl font-bold text-yellow-400">${taxSummary.capitalLosses}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold mb-2">Net Income</h3>
              <p className="text-2xl font-bold text-purple-400">${taxSummary.netIncome}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold mb-2">Taxable Income</h3>
              <p className="text-2xl font-bold text-orange-400">${taxSummary.taxableIncome}</p>
            </div>
          </div>
        )}

        {/* Tax Tips */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">💡 Tax Tips for Crypto Creators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-green-400">Deductible Expenses</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Arweave storage fees</li>
                <li>• Gas fees for content uploads</li>
                <li>• Platform transaction fees</li>
                <li>• Equipment and software costs</li>
                <li>• Marketing and promotion expenses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">Important Notes</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Keep detailed records of all transactions</li>
                <li>• Track USD values at time of transaction</li>
                <li>• Consider consulting a crypto tax professional</li>
                <li>• Report all income, including token rewards</li>
                <li>• Understand your local tax obligations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Transaction History ({selectedYear})</h3>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tax data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">USD Value</th>
                    <th className="px-6 py-3 text-left">Category</th>
                    <th className="px-6 py-3 text-left">Network</th>
                    <th className="px-6 py-3 text-left">TX Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTypeIcon(tx.type)}</span>
                          <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono">{tx.amount} {tx.token}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          tx.type === 'income' || tx.type === 'capital_gain' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          ${tx.usdValue}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(tx.category)}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">{tx.network}</td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                        >
                          {tx.txHash.substring(0, 10)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Tax Disclaimer</h4>
              <p className="text-yellow-200 text-sm">
                This tool provides general information and should not be considered as professional tax advice. 
                Cryptocurrency tax laws vary by jurisdiction and are subject to change. Please consult with a 
                qualified tax professional or accountant familiar with cryptocurrency taxation in your area 
                before making any tax-related decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReportingSystem;