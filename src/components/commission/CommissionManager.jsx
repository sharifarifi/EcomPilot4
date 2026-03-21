import React from 'react';
import SocialMediaCommission from './SocialMediaCommission';
import RetailCommission from './RetailCommission';
import OperationCommission from './OperationCommission';

const CommissionManager = ({ view }) => {
  switch (view) {
    case 'commission-social':
      return <SocialMediaCommission />;
    case 'commission-retail':
      return <RetailCommission />;
    case 'commission-operation':
      return <OperationCommission />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
           <p>Lütfen bir prim kategorisi seçiniz.</p>
        </div>
      );
  }
};

export default CommissionManager;