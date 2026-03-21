import React from 'react';
import { FINANCE_KPI_CARDS } from './constants';
import FinanceCard from './FinanceCard';

const FinanceKpiGrid = ({ loading }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    {FINANCE_KPI_CARDS.map((card) => (
      <FinanceCard key={card.title} {...card} loading={loading} />
    ))}
  </div>
);

export default FinanceKpiGrid;
