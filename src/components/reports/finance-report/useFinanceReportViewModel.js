import { useMemo, useState } from 'react';
import {
  financeReportFinancialData,
  financeReportTransactions,
} from '../../../demo-data/financeReport';

export const useFinanceReportViewModel = () => {
  const [dateRange, setDateRange] = useState('Bu Yıl');
  const [activeTab, setActiveTab] = useState('overview');

  const financialData = useMemo(() => financeReportFinancialData, []);
  const transactions = useMemo(() => financeReportTransactions, []);

  const handleExport = () => {
    alert('Finansal Rapor (XLSX) hazırlanıyor...');
  };

  return {
    activeTab,
    dateRange,
    financialData,
    handleExport,
    loading: false,
    setActiveTab,
    setDateRange,
    transactions,
  };
};
