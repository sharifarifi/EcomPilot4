import React from 'react';
import IntegrationCard from './IntegrationCard';

const LogisticsApps = ({ apps, onManage }) => {
  const filtered = apps.filter(a => a.category === 'Lojistik');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in slide-in-from-bottom-4 duration-500">
      {filtered.map(app => (
        <IntegrationCard key={app.id} app={app} onManage={onManage} />
      ))}
    </div>
  );
};

export default LogisticsApps;
