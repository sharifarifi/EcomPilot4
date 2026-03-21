export const BASE_CARGO = [
  { name: 'Yurtiçi', avgDays: 1.8, damageRate: 1.2 }, { name: 'Aras', avgDays: 2.4, damageRate: 2.1 },
  { name: 'MNG', avgDays: 2.1, damageRate: 1.8 }, { name: 'PTT', avgDays: 4.5, damageRate: 0.8 }, { name: 'Kolay Gelsin', avgDays: 0.9, damageRate: 0.2 },
];
export const BASE_RETURNS = [
  { name: 'Beden Uymadı', value: 42, color: '#3B82F6' }, { name: 'Kusurlu/Hasarlı', value: 28, color: '#EF4444' },
  { name: 'Görselden Farklı', value: 15, color: '#F59E0B' }, { name: 'Geç Teslimat', value: 10, color: '#8B5CF6' }, { name: 'Diğer', value: 5, color: '#94A3B8' },
];
export const BASE_TOP_RETURNS = [
  { sku: 'TSH-001-BLK', name: 'Siyah Basic Tişört', category: 'Giyim', returnRate: 14.5, totalReturned: 145, lostRevenue: 43500, mainReason: 'Beden Uymadı', trend: 'up' },
  { sku: 'SHS-042-WHT', name: 'Beyaz Sneaker', category: 'Ayakkabı', returnRate: 18.2, totalReturned: 82, lostRevenue: 65600, mainReason: 'Kusurlu/Hasarlı', trend: 'down' },
  { sku: 'DRS-018-RED', name: 'Kırmızı Elbise', category: 'Giyim', returnRate: 15.1, totalReturned: 64, lostRevenue: 38400, mainReason: 'Görselden Farklı', trend: 'up' },
  { sku: 'JCK-009-BLU', name: 'Mavi Kot Ceket', category: 'Dış Giyim', returnRate: 8.4, totalReturned: 41, lostRevenue: 24600, mainReason: 'Beden Uymadı', trend: 'down' },
  { sku: 'ACC-055-GLD', name: 'Zincir Kolye', category: 'Aksesuar', returnRate: 22.5, totalReturned: 38, lostRevenue: 11400, mainReason: 'Kusurlu/Hasarlı', trend: 'up' },
];
export const BASE_REGIONAL = [
  { city: 'İstanbul', orders: 4500, avgDays: 1.1 }, { city: 'Ankara', orders: 2800, avgDays: 1.4 },
  { city: 'İzmir', orders: 2100, avgDays: 1.5 }, { city: 'Bursa', orders: 1800, avgDays: 1.8 },
  { city: 'Antalya', orders: 1500, avgDays: 1.9 }, { city: 'Diyarbakır', orders: 600, avgDays: 3.2 },
];
export const RETURN_CATEGORIES = [
  { name: 'Giyim', value: 45 }, { name: 'Ayakkabı', value: 25 }, { name: 'Aksesuar', value: 15 }, { name: 'Kozmetik', value: 10 }, { name: 'Ev/Yaşam', value: 5 }
];

export const getStableHash = (input) => (
  Array.from(input).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) % 1000003, 7)
);

export const getStableNumber = (key, min, max, precision = 1) => {
  const hash = getStableHash(key);
  const normalized = (hash % 10000) / 10000;
  const value = min + normalized * (max - min);
  return Number(value.toFixed(precision));
};

export const getStableInteger = (key, min, max) => {
  const hash = getStableHash(key);
  return min + (hash % (max - min + 1));
};
