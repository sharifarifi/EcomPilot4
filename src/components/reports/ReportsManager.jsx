import React from 'react';
import SalesReport from './SalesReport'; 
import FinanceReport from './FinanceReport'; 
import PersonnelPerformance from './PersonnelPerformance'; 
// 1. YENİ SAYFAMIZI İÇE AKTARIYORUZ:
import OperationsLogistics from './OperationsLogistics'; 

const ReportsManager = ({ view }) => {
  // Gelen view (activeTab) değerine göre hangi raporu göstereceğimizi seçiyoruz
  switch (view) {
    case 'reports-sales':
      return <SalesReport />;
    
    case 'reports-staff':
      return <PersonnelPerformance />;
      
    // 2. YENİ EKLENEN ROTA:
    case 'reports-operations':
      return <OperationsLogistics />;
      
    case 'reports-finance':
      return <FinanceReport />;
      
    default:
      return (
        <div className="flex items-center justify-center h-64 text-slate-400">
          Lütfen sol menüden bir rapor türü seçin.
        </div>
      );
  }
};

export default ReportsManager;