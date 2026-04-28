import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, ShoppingBag, X, CheckCircle, Printer, Eye, 
  User, MapPin, Edit, ChevronDown, Trash2, Download, Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTLARI ---
import { useAuth } from '../../context/AuthContext';
import { subscribeToOrders, addOrder, updateOrder, updateOrderStatus } from '../../firebase/orderService';

// Şehir Verisi (Dosya yolu sizde farklı olabilir, kontrol edin!)
import { cities } from '../../data/cities'; 

// --- SABİT ÜRÜN LİSTESİ (Şimdilik Mock) ---
const shopifyProducts = [
  { id: 101, name: 'Basic T-Shirt Beyaz', sku: 'TS-WHT-M', price: 250, stock: 150, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80' },
  { id: 102, name: 'Basic T-Shirt Siyah', sku: 'TS-BLK-L', price: 250, stock: 80, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=80' },
  { id: 103, name: 'Slim Fit Jean', sku: 'JN-BLU-32', price: 600, stock: 45, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&q=80' },
  { id: 104, name: 'Kargo Pantolon', sku: 'PN-KHK-34', price: 750, stock: 30, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&q=80' },
  { id: 105, name: 'Oversize Hoodie', sku: 'HD-GRY-XL', price: 900, stock: 20, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=200&q=80' },
  { id: 106, name: 'Sneaker Çorap', sku: 'SK-SOCK-3', price: 120, stock: 200, image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50f82?w=200&q=80' },
];

const OrderManager = () => {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('Tümü');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // Form State
  const initialFormState = { 
    customer: '', phone: '', city: '', district: '', addressDetail: '', payment: 'Mail Order', items: [] 
  };
  const [newOrder, setNewOrder] = useState(initialFormState);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    const isManager = ['Admin', 'Manager', 'CEO', 'Director'].includes(userData?.role);
    const unsubscribe = subscribeToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      { uid: userData?.uid, isManagement: isManager }
    );
    return () => unsubscribe();
  }, [userData]);

  // --- FİLTRELEME ---
  const filteredProducts = useMemo(() => {
    return shopifyProducts.filter(p => 
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm]);

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'Tümü' || o.status === activeTab;
    const term = orderSearchTerm.toLowerCase();
    const matchesSearch = 
      o.id.toLowerCase().includes(term) || 
      o.customer.toLowerCase().includes(term) || 
      o.phone.includes(term);
    return matchesTab && matchesSearch;
  });

  // --- İŞLEMLER ---

  const openNewOrderModal = () => {
    setEditingId(null);
    setNewOrder(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingId(order.id);
    setNewOrder({
      customer: order.customer,
      phone: order.phone,
      city: order.city,
      district: order.district,
      addressDetail: order.fullAddress || '', // fullAddress yoksa boş string
      payment: order.payment,
      items: order.items ? order.items.map(i => ({...i})) : []
    });
    setIsModalOpen(true);
  };

  const addToCart = (product) => {
    setNewOrder(prev => {
      const existingItem = prev.items.find(i => i.id === product.id);
      let updatedItems;
      if (existingItem) {
        updatedItems = prev.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        updatedItems = [...prev.items, { ...product, qty: 1 }];
      }
      return { ...prev, items: updatedItems };
    });
  };

  const updateCartQty = (id, delta) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    }));
  };

  const removeFromCart = (id) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSaveOrder = async () => {
    if(!newOrder.customer || !newOrder.city || !newOrder.district || newOrder.items.length === 0) {
      alert("Lütfen tüm zorunlu alanları doldurun ve sepete ürün ekleyin!"); return;
    }
    
    const totalAmount = newOrder.items.reduce((a,b)=>a+(b.price*b.qty),0);
    const orderData = {
        customer: newOrder.customer,
        phone: newOrder.phone,
        city: newOrder.city,
        district: newOrder.district,
        fullAddress: newOrder.addressDetail,
        payment: newOrder.payment,
        items: newOrder.items,
        total: totalAmount,
        userId: userData?.uid || '',
        taker: userData?.name || 'Sistem',
        date: new Date().toISOString().split('T')[0] // Sadece görüntüleme için tarih stringi
    };

    try {
        if (editingId) {
            await updateOrder(editingId, orderData);
            alert("Sipariş güncellendi.");
        } else {
            await addOrder(orderData);
            alert("Sipariş başarıyla oluşturuldu.");
        }
        setIsModalOpen(false);
    } catch (error) {
        alert("İşlem başarısız: " + error.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
        await updateOrderStatus(id, newStatus);
    } catch {
        alert("Durum güncellenemedi.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Onaylandı': return 'bg-blue-100 text-blue-700';
      case 'Hazırlanıyor': return 'bg-yellow-100 text-yellow-700';
      case 'Kargolandı': return 'bg-purple-100 text-purple-700';
      case 'Teslim Edildi': return 'bg-green-100 text-green-700';
      case 'İptal': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleCityChange = (city) => {
    setNewOrder(prev => ({ ...prev, city: city, district: '' }));
  };

  if (loading) return <div className="flex h-96 items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Siparişler Yükleniyor...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ÜST BAR */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="relative w-64">
                 <Search size={18} className="absolute left-3 top-2.5 text-slate-400"/>
                 <input 
                   type="text" 
                   placeholder="Sipariş No, Müşteri..." 
                   className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full text-sm outline-none bg-slate-50 focus:bg-white transition-colors"
                   value={orderSearchTerm}
                   onChange={(e) => setOrderSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['Tümü', 'Hazırlanıyor', 'Kargolandı', 'Teslim Edildi'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
                ))}
              </div>
           </div>
           
           <button onClick={openNewOrderModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all">
              <Plus size={18}/> Yeni Sipariş
           </button>
        </div>
      </div>

      {/* SİPARİŞ TABLOSU */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
             <tr>
               <th className="px-6 py-4">Sipariş ID</th>
               <th className="px-6 py-4">Tarih</th>
               <th className="px-6 py-4">Müşteri / Lokasyon</th>
               <th className="px-6 py-4 text-center">Ürün</th>
               <th className="px-6 py-4 text-right">Tutar</th>
               <th className="px-6 py-4">Durum</th>
               <th className="px-6 py-4">Alan</th>
               <th className="px-6 py-4 text-right">İşlem</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-blue-600">#{order.id.substring(0,6)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{order.date}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{order.customer}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10}/> {order.district}, {order.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{order.items?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-700">{order.total} ₺</div>
                      <div className="text-[10px] text-slate-400">{order.payment}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        <option value="Onaylandı">Onaylandı</option>
                        <option value="Hazırlanıyor">Hazırlanıyor</option>
                        <option value="Kargolandı">Kargolandı</option>
                        <option value="Teslim Edildi">Teslim Edildi</option>
                        <option value="İptal">İptal</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">{order.taker ? order.taker.charAt(0) : '?'}</div>
                          <span className="text-xs font-medium text-slate-600">{order.taker}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(order)} className="p-2 text-slate-400 hover:text-orange-600 rounded-full hover:bg-orange-50 transition" title="Düzenle"><Edit size={16}/></button>
                          <button onClick={() => setInvoiceModal(order)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition" title="Fatura"><Eye size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                            <Search size={32} className="mb-2 opacity-20"/>
                            <p>Kayıt bulunamadı.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL: SİPARİŞ OLUŞTUR / DÜZENLE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl">
            
            {/* SOL: Müşteri Bilgileri */}
            <div className="w-7/12 bg-slate-50 p-6 border-r border-slate-200 flex flex-col overflow-y-auto">
               <div className="mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                     <User size={20}/> {editingId ? `Sipariş Düzenle` : 'Yeni Sipariş Oluştur'}
                  </h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ad Soyad</label>
                     <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white" placeholder="Müşteri Adı" value={newOrder.customer} onChange={e=>setNewOrder(prev => ({...prev, customer: e.target.value}))}/>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Telefon</label>
                     <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white" placeholder="05XX..." value={newOrder.phone} onChange={e=>setNewOrder(prev => ({...prev, phone: e.target.value}))}/>
                  </div>
               </div>

               {/* ADRES SEÇİMİ */}
               <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><MapPin size={12}/> Teslimat Adresi</label>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                     <div className="relative">
                        <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer" value={newOrder.city} onChange={(e) => handleCityChange(e.target.value)}>
                           <option value="">İl Seçiniz...</option>
                           {Object.keys(cities).map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                     </div>
                     <div className="relative">
                        <select className={`w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer ${!newOrder.city && 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} value={newOrder.district} onChange={(e) => setNewOrder(prev => ({...prev, district: e.target.value}))} disabled={!newOrder.city}>
                           <option value="">{newOrder.city ? 'İlçe Seçiniz...' : 'Önce İl Seçin'}</option>
                           {newOrder.city && cities[newOrder.city].map(dist => <option key={dist} value={dist}>{dist}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                     </div>
                  </div>
                  <textarea className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white resize-none" rows="2" placeholder="Mahalle, Sokak, Kapı No, Daire No..." value={newOrder.addressDetail} onChange={e=>setNewOrder(prev => ({...prev, addressDetail: e.target.value}))}></textarea>
               </div>

               <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ödeme Yöntemi</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['Mail Order', 'Havale', 'Kapıda K.Kartı', 'Kapıda Nakit'].map(m=>(
                        <button key={m} onClick={()=>setNewOrder(prev => ({...prev, payment: m}))} className={`text-[11px] py-2.5 rounded border font-bold transition ${newOrder.payment===m?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{m}</button>
                     ))}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase">Ürün Kataloğu</h4>
                     <div className="relative w-48">
                        <Search size={14} className="absolute left-2 top-2 text-slate-400"/>
                        <input className="w-full border rounded-md pl-7 py-1 text-xs outline-none" placeholder="Ürün ara..." value={productSearchTerm} onChange={e=>setProductSearchTerm(e.target.value)}/>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="bg-white border border-slate-200 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:shadow-sm group transition text-center">
                           <div className="aspect-square bg-slate-100 rounded mb-2 overflow-hidden">
                              <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                           </div>
                           <div className="text-[10px] font-bold text-slate-700 truncate">{p.name}</div>
                           <div className="text-xs font-bold text-blue-600 mt-1">{p.price} ₺</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* SAĞ: Sepet Özeti */}
            <div className="w-5/12 bg-white flex flex-col shadow-l-xl z-10">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag size={18}/> Sepet</h3>
                  <button onClick={()=>setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {newOrder.items.length === 0 ? (
                     <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                        <ShoppingBag size={48} className="mb-2 opacity-20"/>
                        <p>Sepetiniz boş</p>
                     </div>
                  ) : (
                     newOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden"><img src={item.image} className="w-full h-full object-cover"/></div>
                              <div>
                                 <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                 <div className="text-xs text-slate-400">{item.price} ₺ x {item.qty}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center border rounded-lg bg-white">
                                 <button onClick={() => updateCartQty(item.id, -1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100">-</button>
                                 <span className="text-xs font-bold px-2">{item.qty}</span>
                                 <button onClick={() => updateCartQty(item.id, 1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100">+</button>
                              </div>
                              <div className="font-bold text-slate-800 w-16 text-right">{item.price * item.qty} ₺</div>
                              <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-slate-500 font-medium">Genel Toplam</span>
                     <span className="text-2xl font-bold text-blue-600">{newOrder.items.reduce((a,b)=>a+(b.price*b.qty),0)} ₺</span>
                  </div>
                  <button onClick={handleSaveOrder} className={`w-full py-3 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2 text-white ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>
                     <CheckCircle size={18}/> {editingId ? 'Siparişi Güncelle' : 'Siparişi Tamamla'}
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL: FATURA GÖRÜNTÜLEME --- */}
      {invoiceModal && (
         <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative">
               <button onClick={() => setInvoiceModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-red-100 hover:text-red-600 transition"><X size={20}/></button>
               
               <div className="p-8 bg-white" id="invoice-area">
                  <div className="text-center mb-8">
                     <div className="text-2xl font-black text-slate-900 tracking-tight">E-ComPilot</div>
                     <div className="text-xs text-slate-400 mt-1">Sipariş Fişi</div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 mb-6 border-b border-slate-100 pb-4">
                     <div>
                        <p className="font-bold text-slate-700">Müşteri:</p>
                        <p>{invoiceModal.customer}</p>
                        <p>{invoiceModal.district} / {invoiceModal.city}</p>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-slate-700">Fiş No:</p>
                        <p className="font-mono">#{invoiceModal.id.substring(0,6)}</p>
                        <p>{invoiceModal.date}</p>
                     </div>
                  </div>

                  <div className="space-y-3 mb-6">
                     {invoiceModal.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                           <span className="text-slate-700">{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                           <span className="font-bold text-slate-900">{item.price * item.qty} ₺</span>
                        </div>
                     ))}
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-4 flex justify-between items-center">
                     <div>
                        <div className="text-xs text-slate-400">Ödeme: {invoiceModal.payment}</div>
                        <span className="font-bold text-lg text-slate-900">Toplam</span>
                     </div>
                     <span className="font-bold text-xl text-blue-600">{invoiceModal.total} ₺</span>
                  </div>
               </div>

               <div className="bg-slate-50 p-4 flex gap-3">
                  <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2"><Printer size={16}/> Yazdır</button>
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2"><Download size={16}/> PDF</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default OrderManager;
