import React from 'react';
import { Calendar, ChevronDown, Download, Printer } from 'lucide-react';
import { DATE_RANGE_OPTIONS, FINANCE_TABS } from './constants';

const FinanceReportHeader = ({ activeTab, dateRange, onDateRangeChange, onExport, onTabChange }) => (
  <div className="flex flex-col lg:flex-row justify-between items-end gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight">Finansal Kontrol Merkezi</h1>
      <p className="text-slate-500 mt-1 text-sm font-medium">Nakit akışı, kârlılık ve bütçe analizi.</p>
    </div>

    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {FINANCE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative group">
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="appearance-none bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 hover:border-slate-300 transition cursor-pointer min-w-[140px]"
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
        <ChevronDown size={16} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
      </div>

      <div className="flex gap-2">
        <button className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition" title="Yazdır">
          <Printer size={18} />
        </button>
        <button onClick={onExport} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200">
          <Download size={16} /> <span className="hidden sm:inline">İndir</span>
        </button>
      </div>
    </div>
  </div>
);

export default FinanceReportHeader;
