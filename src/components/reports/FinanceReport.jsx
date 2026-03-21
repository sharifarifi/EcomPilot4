import React from 'react';
import { Banknote } from 'lucide-react';
import CompositeChart from './finance-report/CompositeChart';
import ExpenseBreakdownPanel from './finance-report/ExpenseBreakdownPanel';
import FinanceKpiGrid from './finance-report/FinanceKpiGrid';
import FinanceReportHeader from './finance-report/FinanceReportHeader';
import TransactionLedger from './finance-report/TransactionLedger';
import { useFinanceReportViewModel } from './finance-report/useFinanceReportViewModel';

const FinanceReport = () => {
  const {
    activeTab,
    dateRange,
    financialData,
    handleExport,
    loading,
    setActiveTab,
    setDateRange,
    transactions,
  } = useFinanceReportViewModel();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <FinanceReportHeader
        activeTab={activeTab}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
        onTabChange={setActiveTab}
      />

      <FinanceKpiGrid loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Banknote size={20} className="text-blue-500" /> Finansal Trend Analizi
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ciro ve net kârlılık korelasyonu.</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded bg-blue-500"></div> Ciro (Bar)</span>
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div> Net Kâr (Çizgi)</span>
            </div>
          </div>

          <div className="flex-1 relative w-full px-2 pb-2">
            <CompositeChart data={financialData} loading={loading} />
          </div>
        </div>

        <ExpenseBreakdownPanel />
      </div>

      <TransactionLedger transactions={transactions} />
    </div>
  );
};

export default FinanceReport;
