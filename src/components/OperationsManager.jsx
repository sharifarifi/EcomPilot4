import React from 'react';
import TaskBoard from './planning/TaskBoard';
import OrderManager from './planning/OrderManager';
import ShiftManager from './planning/ShiftManager';
import LeaveManager from './planning/LeaveManager';
import WorkReport from './planning/WorkReport'; // BU SATIR ÖNEMLİ

const OperationsManager = ({ view }) => {
  switch (view) {
    case 'tasks':
      return <TaskBoard />;
    case 'orders':
      return <OrderManager />;
    case 'shifts':
      return <ShiftManager />;
    case 'leaves':
      return <LeaveManager />;
    case 'reports': // BU KISIM ÖNEMLİ
      return <WorkReport />;
    default:
      return <div className="p-10 text-center text-red-500">Sayfa bulunamadı: {view}</div>;
  }
};

export default OperationsManager;