import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, Loader2, Package, RefreshCcw, ShoppingCart, Store, Wallet } from 'lucide-react';
import { subscribeToShopifyOrders } from '../../firebase/shopifyOrderService';
import { subscribeToShopifyStore } from '../../firebase/shopifyStoreService';
import { normalizeShopDomain, shopifyConfig } from '../../config/shopify';

const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
});

const formatMoney = (value, currency) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return value || '—';

  if (currency && currency !== 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return moneyFormatter.format(amount);
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const StatusBadge = ({ children, tone = 'slate' }) => {
  const toneMap = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${toneMap[tone] || toneMap.slate}`}>
      {children || '—'}
    </span>
  );
};

const ShopifyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  const storeId = useMemo(
    () => normalizeShopDomain(shopifyConfig.defaultShopDomain),
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeToShopifyOrders((nextOrders) => {
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setIsLoadingOrders(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToShopifyStore(storeId, (nextStore) => {
      setStore(nextStore);
      setIsLoadingStore(false);
    });

    return () => unsubscribe();
  }, [storeId]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const paidOrders = orders.filter((order) => order.financialStatus === 'paid').length;
    const unfulfilledOrders = orders.filter((order) => !order.fulfillmentStatus || order.fulfillmentStatus === 'unfulfilled').length;

    return {
      totalOrders: orders.length,
      totalRevenue,
      paidOrders,
      unfulfilledOrders,
    };
  }, [orders]);

  const content = (() => {
    if (isLoadingOrders) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin" /> Shopify siparişleri yükleniyor...
          </div>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ClipboardList size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Henüz Shopify siparişi yok</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Firestore `shopify_orders` koleksiyonuna veri düşmediği için bu ekran boş görünüyor. Önce backend tarafında OAuth ve sipariş senkronizasyonunu çalıştırın, ardından bu tablo otomatik dolacaktır.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
            Öneri: Shopify modalındaki <span className="mx-1">Start Initial Sync</span> akışını gerçek backend job'una bağlayın.
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black uppercase tracking-wide text-slate-500">
          <div>Sipariş</div>
          <div>Müşteri</div>
          <div>Ödeme</div>
          <div>Fulfillment</div>
          <div className="text-right">Tutar</div>
        </div>
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id} className="grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr] gap-4 px-6 py-5 text-sm hover:bg-slate-50/70">
              <div>
                <div className="font-black text-slate-800">{order.orderName || order.shopifyOrderId || order.id}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(order.createdAtShopify || order.createdAt)}</div>
                <div className="mt-2 text-[11px] text-slate-400">Store: {order.storeId || '—'}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-700">
                  {[order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || order.customer?.email || 'Misafir'}
                </div>
                <div className="mt-1 text-xs text-slate-500">{order.customer?.email || 'E-posta yok'}</div>
              </div>
              <div>
                <StatusBadge tone={order.financialStatus === 'paid' ? 'green' : 'amber'}>
                  {order.financialStatus || 'pending'}
                </StatusBadge>
              </div>
              <div>
                <StatusBadge tone={order.fulfillmentStatus === 'fulfilled' ? 'blue' : 'slate'}>
                  {order.fulfillmentStatus || 'unfulfilled'}
                </StatusBadge>
              </div>
              <div className="text-right font-black text-slate-800">{formatMoney(order.totalPrice, order.currency)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Toplam Sipariş</div>
              <div className="mt-2 text-3xl font-black text-slate-800">{stats.totalOrders}</div>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><ShoppingCart size={24} /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Toplam Ciro</div>
              <div className="mt-2 text-3xl font-black text-slate-800">{formatMoney(stats.totalRevenue, orders[0]?.currency || 'TRY')}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><Wallet size={24} /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Paid</div>
              <div className="mt-2 text-3xl font-black text-slate-800">{stats.paidOrders}</div>
            </div>
            <div className="rounded-2xl bg-green-50 p-3 text-green-600"><Package size={24} /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Bekleyen Fulfillment</div>
              <div className="mt-2 text-3xl font-black text-slate-800">{stats.unfulfilledOrders}</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><RefreshCcw size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div>{content}</div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600"><Store size={22} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Mağaza Durumu</h3>
                <p className="mt-1 text-sm text-slate-500">Shopify store metadata özeti.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Store</span>
                <span className="font-bold text-slate-800">{storeId || 'Tanımsız'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Bağlantı</span>
                <StatusBadge tone={store?.connected ? 'green' : 'amber'}>{store?.connectionState || 'unknown'}</StatusBadge>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Son Güncelleme</span>
                <span className="font-medium text-slate-700">{isLoadingStore ? 'Yükleniyor...' : formatDate(store?.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-red-50 p-3 text-red-500"><AlertCircle size={22} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Veri Kaynağı Notu</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Bu ekran yalnızca Firestore `shopify_orders` koleksiyonunda bulunan siparişleri gösterir. Entegrasyon bağlı olsa bile sync job çalışmadıysa liste boş kalır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyOrdersPage;
