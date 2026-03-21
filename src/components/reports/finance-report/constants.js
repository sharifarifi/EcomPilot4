import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export const FINANCE_TABS = [
  { key: 'overview', label: 'Genel Bakış' },
  { key: 'cashflow', label: 'Nakit Akışı' },
  { key: 'ledger', label: 'Defter' },
];

export const DATE_RANGE_OPTIONS = ['Bu Ay', 'Bu Çeyrek', 'Bu Yıl'];

export const FINANCE_KPI_CARDS = [
  {
    title: 'Toplam Gelir',
    value: '₺845,230',
    subValue: '₺1.2M Hedef',
    change: '+%12',
    trend: 'up',
    icon: TrendingUp,
    color: 'emerald',
    target: 78,
  },
  {
    title: 'Operasyonel Gider',
    value: '₺242,500',
    subValue: 'Limit: ₺300k',
    change: '+%5',
    trend: 'down',
    icon: TrendingDown,
    color: 'rose',
    target: 80,
  },
  {
    title: 'Net Kâr (EBITDA)',
    value: '₺602,730',
    subValue: 'Marj: %71',
    change: '+%18',
    trend: 'up',
    icon: Wallet,
    color: 'blue',
    target: 92,
  },
  {
    title: 'Kasa Nakdi',
    value: '₺128,400',
    subValue: 'Runway: 4 Ay',
    change: '-%2',
    trend: 'down',
    icon: Landmark,
    color: 'amber',
    target: 45,
  },
];

export const EXPENSE_BREAKDOWN = [
  { label: 'Ürün Maliyeti (COGS)', val: 45, money: '₺109k', col: 'bg-slate-800' },
  { label: 'Dijital Pazarlama', val: 25, money: '₺60k', col: 'bg-rose-500' },
  { label: 'Lojistik & Kargo', val: 15, money: '₺36k', col: 'bg-blue-500' },
  { label: 'Personel Giderleri', val: 10, money: '₺24k', col: 'bg-emerald-500' },
  { label: 'Altyapı & Yazılım', val: 5, money: '₺12k', col: 'bg-amber-500' },
];
