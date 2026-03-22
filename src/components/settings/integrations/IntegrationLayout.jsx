import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShoppingBag, Truck, Wallet, Store, Key, Activity,
  AlertCircle, Eye, EyeOff, Save, CheckCircle, X, Settings, Wifi,
  Globe, Server, Database, Terminal, Trash2, ToggleRight, ToggleLeft, Loader2,
} from 'lucide-react';

import { saveIntegration, subscribeToIntegrations } from '../../../firebase/integrationSettingsService';
import { buildShopifyInstallUrl, normalizeShopDomain, shopifyConfig } from '../../../config/shopify';
import ShopifyInstallButton from '../../integrations/ShopifyInstallButton';
import EcommerceApps from './EcommerceApps';
import MarketplaceApps from './MarketplaceApps';
import LogisticsApps from './LogisticsApps';
import PaymentApps from './PaymentApps';
import AccountingApps from './AccountingApps';
import { ecommerceData, marketplaceData, logisticsData, paymentData, accountingData } from '../../../demo-data/integrations/catalog';

const IntegrationLayout = () => {
  const [activeTab, setActiveTab] = useState('E-Ticaret');
  const [toasts, setToasts] = useState([]);
  const logsEndRef = useRef(null);
  const toastIdRef = useRef(0);

  const baseApps = useMemo(
    () => ([
      ...ecommerceData,
      ...marketplaceData,
      ...logisticsData,
      ...accountingData,
      ...paymentData,
    ]),
    []
  );

  const [integrationData, setIntegrationData] = useState({});
  const [liveLogs, setLiveLogs] = useState({});
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedAppDraft, setSelectedAppDraft] = useState(null);
  const [modalTab, setModalTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToIntegrations((data) => {
      setIntegrationData(data || {});
    });

    return () => unsubscribe();
  }, []);

  const apps = useMemo(
    () => baseApps.map((app) => ({
      ...app,
      ...(integrationData[app.id] || {}),
      logs: liveLogs[app.id] || integrationData[app.id]?.logs || app.logs || [],
    })),
    [baseApps, integrationData, liveLogs]
  );

  const selectedApp = useMemo(() => {
    if (!selectedAppId) return null;

    const liveApp = apps.find((app) => app.id === selectedAppId);
    if (!liveApp) return null;
    if (!selectedAppDraft) return liveApp;

    return {
      ...liveApp,
      ...selectedAppDraft,
      logs: selectedAppDraft.logs ?? liveApp.logs ?? [],
    };
  }, [apps, selectedAppDraft, selectedAppId]);

  const connectedApps = useMemo(
    () => apps.filter((app) => app.status === 'connected'),
    [apps]
  );

  const showToast = (message, type = 'success') => {
    const id = (toastIdRef.current += 1);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  const openModal = (app) => {
    setSelectedAppId(app.id);
    setSelectedAppDraft(null);
    setModalTab('general');
    setShowApiKey(false);
    setIsConnecting(false);
  };

  const closeModal = () => {
    setSelectedAppId(null);
    setSelectedAppDraft(null);
    setModalTab('general');
    setShowApiKey(false);
    setIsConnecting(false);
  };

  const updateSelectedAppDraft = (updater) => {
    setSelectedAppDraft((prev) => {
      const base = prev ?? selectedApp;
      if (!base) return prev;
      return typeof updater === 'function' ? updater(base) : updater;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLogs((prevLogs) => {
        let didChange = false;
        const nextLogs = { ...prevLogs };

        connectedApps.forEach((app) => {
          if (Math.random() <= 0.8) return;

          const actions = ['Sipariş Çekildi', 'Stok Eşitlendi', 'Fiyat Değişti', 'Müşteri Güncellendi', 'Webhook Tetiklendi'];
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          const newLog = {
            time: new Date().toLocaleTimeString('tr-TR'),
            msg: `${randomAction} (#${Math.floor(1000 + Math.random() * 9000)})`,
            status: 'success',
          };

          nextLogs[app.id] = [newLog, ...(prevLogs[app.id] || app.logs || [])].slice(0, 100);
          didChange = true;
        });

        return didChange ? nextLogs : prevLogs;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [connectedApps]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedApp?.logs]);

  const handleFieldChange = (key, value) => {
    updateSelectedAppDraft((prev) => ({
      ...prev,
      fields: { ...(prev.fields || {}), [key]: value },
    }));
  };

  const handleAdvancedChange = (key, value) => {
    updateSelectedAppDraft((prev) => ({
      ...prev,
      advancedSettings: {
        ...(prev.advancedSettings || {}),
        [key]: { ...prev.advancedSettings[key], value },
      },
    }));
  };

  const handleTogglePermission = (key) => {
    updateSelectedAppDraft((prev) => ({
      ...prev,
      permissions: {
        ...(prev.permissions || {}),
        [key]: !prev.permissions?.[key],
      },
    }));
  };

  const getDemoPlaceholder = (app, key) => {
    const demoValue = app?.demoTemplate?.fields?.[key];
    return demoValue ? `Örnek değer: ${demoValue}` : `${key} giriniz...`;
  };

  const handleConnect = async () => {
    if (!selectedApp) return;

    const requiredFieldKeys = getRequiredFieldKeys(selectedApp);
    const hasEmpty = requiredFieldKeys.some((key) => {
      const value = selectedApp.fields?.[key];
      return typeof value !== 'string' || value.trim() === '';
    });
    if (hasEmpty) {
      showToast(isShopifyApp(selectedApp) ? 'Lütfen mağaza adresini girin.' : 'Lütfen API bilgilerini eksiksiz girin!', 'error');
      return;
    }

    setIsConnecting(true);

    setTimeout(async () => {
      try {
        const dataToSave = {
          fields: selectedApp.fields,
          status: 'connected',
          permissions: selectedApp.permissions || {},
          advancedSettings: selectedApp.advancedSettings || {},
          updatedAt: new Date().toISOString(),
        };

        await saveIntegration(selectedApp.id, dataToSave);

        updateSelectedAppDraft((prev) => ({
          ...prev,
          status: 'connected',
          logs: [{ time: 'Şimdi', msg: 'Bağlantı Başarılı 🟢', status: 'success' }, ...(prev.logs || [])],
        }));

        setIsConnecting(false);
        showToast(isShopifyApp(selectedApp) ? 'Shopify bağlantı durumu kaydedildi.' : `${selectedApp.name} bağlandı ve kaydedildi!`);
      } catch (error) {
        showToast(`Bağlantı hatası: ${error.message}`, 'error');
        setIsConnecting(false);
      }
    }, 1500);
  };

  const handleDisconnect = async () => {
    if (!selectedApp || !window.confirm('Bağlantıyı kesmek istediğinize emin misiniz? Ayarlar silinecektir.')) {
      return;
    }

    try {
      const clearedFields = {};
      if (selectedApp.fields) {
        Object.keys(selectedApp.fields).forEach((key) => {
          clearedFields[key] = '';
        });
      }

      const dataToSave = {
        fields: clearedFields,
        status: 'disconnected',
        permissions: selectedApp.permissions || {},
        advancedSettings: selectedApp.advancedSettings || {},
        updatedAt: new Date().toISOString(),
      };

      await saveIntegration(selectedApp.id, dataToSave);
      updateSelectedAppDraft((prev) => ({ ...prev, ...dataToSave }));
      showToast('Bağlantı kesildi.', 'error');
    } catch (error) {
      showToast(`Hata: ${error.message}`, 'error');
    }
  };

  const handleSaveOnly = async () => {
    if (!selectedApp) return;

    try {
      const dataToSave = {
        fields: selectedApp.fields,
        permissions: selectedApp.permissions,
        advancedSettings: selectedApp.advancedSettings,
        status: selectedApp.status,
        updatedAt: new Date().toISOString(),
      };

      await saveIntegration(selectedApp.id, dataToSave);
      closeModal();
      showToast('Ayarlar kaydedildi.');
    } catch (error) {
      showToast(`Hata: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    if (!selectedApp) return;

    updateSelectedAppDraft((prev) => ({ ...prev, logs: [] }));
    setLiveLogs((prev) => ({ ...prev, [selectedApp.id]: [] }));
    showToast('Loglar temizlendi (Sadece yerel).');
  };

  const isShopifyApp = (app) => app?.name === 'Shopify';

  const getVisibleFieldKeys = (app) => {
    if (!app?.fields) return [];

    if (isShopifyApp(app)) {
      return ['shopUrl', 'storeName'].filter((key) => key in app.fields);
    }

    return Object.keys(app.fields);
  };

  const getRequiredFieldKeys = (app) => {
    if (!app?.fields) return [];

    if (isShopifyApp(app)) {
      return ['shopUrl'].filter((key) => key in app.fields);
    }

    return Object.keys(app.fields);
  };

  const appendLocalLog = (message, status = 'success') => {
    if (!selectedApp) return;

    const newLog = {
      time: new Date().toLocaleTimeString('tr-TR'),
      msg: message,
      status,
    };

    updateSelectedAppDraft((prev) => ({
      ...prev,
      logs: [newLog, ...(prev?.logs || [])].slice(0, 100),
    }));

    setLiveLogs((prev) => ({
      ...prev,
      [selectedApp.id]: [newLog, ...(prev[selectedApp.id] || selectedApp.logs || [])].slice(0, 100),
    }));
  };

  const handleShopifyAction = (actionLabel) => {
    if (!selectedApp || !isShopifyApp(selectedApp)) return;

    appendLocalLog(`${actionLabel} isteği sıraya alındı (backend bekleniyor).`);
    showToast(`${actionLabel} henüz backend entegrasyonu gerektiriyor.`, 'error');
  };

  const handleShopifyInstallRedirect = async ({ installUrl, shopDomain }) => {
    appendLocalLog(`OAuth install başlatıldı: ${shopDomain}`);

    updateSelectedAppDraft((prev) => ({
      ...prev,
      fields: {
        ...(prev.fields || {}),
        shopUrl: shopDomain,
      },
      installUrl,
      updatedAt: new Date().toISOString(),
    }));

    await saveIntegration(selectedApp.id, {
      ...selectedApp,
      fields: {
        ...(selectedApp.fields || {}),
        shopUrl: shopDomain,
      },
      shopDomain,
      status: 'pending',
      connectionState: 'pending_oauth',
      installUrl,
      updatedAt: new Date().toISOString(),
      logs: [
        {
          time: new Date().toLocaleTimeString('tr-TR'),
          msg: `OAuth install başlatıldı (${shopDomain})`,
          status: 'success',
        },
        ...(selectedApp.logs || []),
      ].slice(0, 100),
    });
  };

  const renderTabs = () => (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-1 mb-6 custom-scrollbar">
      {[
        { id: 'E-Ticaret', icon: <ShoppingBag size={16} /> },
        { id: 'Pazaryeri', icon: <Store size={16} /> },
        { id: 'Lojistik', icon: <Truck size={16} /> },
        { id: 'Muhasebe', icon: <Activity size={16} /> },
        { id: 'Ödeme', icon: <Wallet size={16} /> },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
        >
          {tab.icon} {tab.id}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderTabs()}

      <div className="min-h-[400px]">
        {activeTab === 'E-Ticaret' && <EcommerceApps apps={apps} onManage={openModal} />}
        {activeTab === 'Pazaryeri' && <MarketplaceApps apps={apps} onManage={openModal} />}
        {activeTab === 'Lojistik' && <LogisticsApps apps={apps} onManage={openModal} />}
        {activeTab === 'Muhasebe' && <AccountingApps apps={apps} onManage={openModal} />}
        {activeTab === 'Ödeme' && <PaymentApps apps={apps} onManage={openModal} />}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl">
            <div className="w-7/12 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-${selectedApp.color}-50 text-${selectedApp.color}-600 border border-${selectedApp.color}-100 font-bold text-2xl shadow-sm`}>
                    {selectedApp.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800">{selectedApp.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{selectedApp.category}</span>
                      <span className={`text-xs flex items-center gap-1 ${selectedApp.status === 'connected' ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                        {selectedApp.status === 'connected' ? <><Wifi size={12} /> Bağlı</> : '● Çevrimdışı'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {['general', 'advanced', 'logs'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setModalTab(tab)}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition ${modalTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab === 'general' ? 'Bağlantı' : tab === 'advanced' ? 'Gelişmiş' : 'Kayıtlar'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                {modalTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-2 border-b border-slate-100"><Key size={16} className="text-blue-500" /> Kimlik Doğrulama</h4>
                      {selectedApp.demoTemplate && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                          <div className="font-bold uppercase tracking-wide">{selectedApp.demoTemplate.badge || 'Demo template data'}</div>
                          <div className="mt-1">Bu alanlardaki placeholder değerler yalnızca örnek gösterim içindir; gerçek kullanıcı credential verisi değildir.</div>
                        </div>
                      )}
                      <div className="space-y-4">
                        {selectedApp.fields && getVisibleFieldKeys(selectedApp).map((key) => (
                          <div key={key}>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                              {selectedApp.demoTemplate?.fields?.[key] && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 normal-case">Örnek değer</span>}
                            </label>
                            <div className="relative">
                              <input
                                type={key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') ? (showApiKey ? 'text' : 'password') : 'text'}
                                className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 bg-white"
                                value={selectedApp.fields[key]}
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                placeholder={getDemoPlaceholder(selectedApp, key)}
                                disabled={selectedApp.status === 'connected' && !selectedApp.demoTemplate}
                              />
                              {(key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) && (
                                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition" type="button">
                                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {isShopifyApp(selectedApp) && (
                        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
                          Shopify için bu ekranda yalnızca güvenli mağaza alanları ve senkronizasyon tercihleri gösterilir.
                          Token, secret ve webhook doğrulama gibi işlemler henüz bu repoda bulunmayan backend katmanına bağlıdır.
                        </div>
                      )}
                      {isShopifyApp(selectedApp) && (
                        <div className="mt-6 space-y-4">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <div className="text-sm font-bold text-slate-800">Hazır install flow</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Buton backend install endpoint'ine `shop`, `redirectUri` ve `returnTo` query parametreleriyle gider.
                                </div>
                              </div>
                              <ShopifyInstallButton
                                shopDomain={selectedApp.fields?.shopUrl || shopifyConfig.defaultShopDomain}
                                onBeforeRedirect={handleShopifyInstallRedirect}
                              />
                            </div>
                            <div className="mt-3 rounded-lg bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-200 break-all">
                              {(() => {
                                try {
                                  return buildShopifyInstallUrl({
                                    shopDomain: normalizeShopDomain(selectedApp.fields?.shopUrl || shopifyConfig.defaultShopDomain),
                                    returnTo: '/settings?tab=integrations&provider=shopify',
                                  });
                                } catch {
                                  return 'Shopify install URL oluşturmak için mağaza domaini gerekli.';
                                }
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={selectedApp.status === 'connected' ? () => handleShopifyAction('Refresh Connection') : handleConnect}
                              disabled={isConnecting}
                              className="bg-blue-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-blue-200"
                              type="button"
                            >
                              {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
                              {isConnecting ? 'Bağlantı Güncelleniyor...' : selectedApp.status === 'connected' ? 'Refresh Connection' : 'Connect with Shopify'}
                            </button>
                            <button
                              onClick={() => handleShopifyAction('Start Initial Sync')}
                              disabled={selectedApp.status !== 'connected'}
                              className="bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                              type="button"
                            >
                              <Activity size={18} />
                              Start Initial Sync
                            </button>
                            <button
                              onClick={() => handleShopifyAction('Sync Orders')}
                              disabled={selectedApp.status !== 'connected'}
                              className="bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                              type="button"
                            >
                              <ShoppingBag size={18} />
                              Sync Orders
                            </button>
                            <button
                              onClick={() => handleShopifyAction('Sync Products')}
                              disabled={selectedApp.status !== 'connected'}
                              className="bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                              type="button"
                            >
                              <Globe size={18} />
                              Sync Products
                            </button>
                          </div>
                        </div>
                      )}
                      {selectedApp.status === 'disconnected' && !isShopifyApp(selectedApp) && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <button onClick={handleConnect} disabled={isConnecting} className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-blue-200">
                            {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
                            {isConnecting ? 'Sunucuya Bağlanılıyor...' : 'Bağlantıyı Kur ve Test Et'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`transition-all duration-500 ${selectedApp.status === 'disconnected' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4"><Settings size={16} className="text-slate-400" /> Veri İzinleri</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedApp.permissions && Object.keys(selectedApp.permissions).map((key) => (
                          <div key={key} onClick={() => handleTogglePermission(key)} className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition select-none ${selectedApp.permissions[key] ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <span className="text-xs font-bold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${selectedApp.permissions[key] ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${selectedApp.permissions[key] ? 'translate-x-4' : ''}`} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'advanced' && (
                  <div className="space-y-6 animate-in fade-in">
                    {selectedApp.advancedSettings ? (
                      <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 pb-2 border-b border-slate-100"><Globe size={16} className="text-purple-500" /> Entegrasyon Konfigürasyonu</h4>
                        <div className="space-y-5">
                          {Object.entries(selectedApp.advancedSettings).map(([key, setting]) => (
                            <div key={key}>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{setting.label}</label>

                              {setting.type === 'select' && (
                                <select className="w-full border border-slate-300 rounded-lg p-3 text-sm bg-white outline-none focus:border-purple-500 transition" value={setting.value} onChange={(e) => handleAdvancedChange(key, e.target.value)}>
                                  {setting.options.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                              )}

                              {setting.type === 'input' && (
                                <input className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-purple-500 transition" value={setting.value} onChange={(e) => handleAdvancedChange(key, e.target.value)} />
                              )}

                              {setting.type === 'toggle' && (
                                <div onClick={() => handleAdvancedChange(key, !setting.value)} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${setting.value ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'}`}>
                                  <span className="text-sm font-bold text-slate-700">{setting.value ? 'Aktif' : 'Pasif'}</span>
                                  {setting.value ? <ToggleRight size={24} className="text-purple-600" /> : <ToggleLeft size={24} className="text-slate-400" />}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 flex flex-col items-center"><Settings size={32} className="opacity-20 mb-2" />Bu entegrasyon için gelişmiş ayar bulunmuyor.</div>
                    )}
                  </div>
                )}

                {modalTab === 'logs' && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white animate-in fade-in">
                    {selectedApp.logs && selectedApp.logs.length > 0 ? selectedApp.logs.map((log, index) => (
                      <div key={`${log.time}-${index}`} className="flex justify-between p-3 border-b border-slate-100 last:border-0 text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">{log.status === 'success' ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}<span className="text-slate-700 font-medium">{log.msg}</span></div>
                        <span className="text-slate-400 font-mono">{log.time}</span>
                      </div>
                    )) : <div className="p-10 text-center text-slate-400 text-xs">Henüz işlem kaydı yok.</div>}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center">
                {selectedApp.status === 'connected' ? <button onClick={handleDisconnect} className="text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2"><Trash2 size={18} /> Bağlantıyı Kes</button> : <div />}
                <button onClick={handleSaveOnly} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2"><Save size={18} /> Kaydet ve Çık</button>
              </div>
            </div>

            <div className="w-5/12 bg-[#0d1117] text-slate-300 flex flex-col font-mono text-xs border-l border-slate-800">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#161b22]">
                <div className="flex items-center gap-2"><Terminal size={16} className="text-blue-400" /><span className="font-bold text-slate-200">Sistem Monitörü</span>{selectedApp.status === 'connected' && <span className="flex h-2 w-2 relative ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>}</div>
                <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded" type="button"><X size={18} className="text-slate-500 hover:text-white" /></button>
              </div>
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-3 font-mono">
                {selectedApp.status === 'connected' ? (
                  (selectedApp.logs || []).length > 0 ? (
                    <>
                      {selectedApp.logs.slice().reverse().map((log, index) => (
                        <div key={`${log.time}-${index}`} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300 leading-relaxed"><span className="text-slate-500 select-none">[{log.time}]</span><span className={log.status === 'error' ? 'text-red-400' : 'text-green-400'}><span className="mr-2">{log.status === 'success' ? '➜' : '✖'}</span>{log.msg}</span></div>
                      ))}
                      <div ref={logsEndRef} />
                    </>
                  ) : <div className="text-slate-600 italic">Veri akışı bekleniyor...</div>
                ) : <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-50"><Database size={48} /><p className="text-center">Sunucu bağlantısı kapalı.<br />Lütfen sol panelden bağlantıyı başlatın.</p></div>}
              </div>
              <div className="p-3 bg-[#161b22] border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><Server size={10} /> {selectedApp.status === 'connected' ? 'Online (24ms)' : 'Offline'}</span>
                {selectedApp.logs && selectedApp.logs.length > 0 && <button onClick={clearLogs} className="hover:text-white transition" type="button">Temizle</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none z-[110]">
        {toasts.map((toast) => <div key={toast.id} className={`pointer-events-auto px-4 py-2 rounded shadow-lg text-sm font-bold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>{toast.message}</div>)}
      </div>
    </div>
  );
};

export default IntegrationLayout;
