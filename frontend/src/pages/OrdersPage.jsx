import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI, itemsAPI, aiAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const VALID_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};
const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  PREPARING: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  READY: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};
const SOURCE_LABELS = { WALKIN: 'Walk-in', ONLINE: 'Online', PHONE: 'Phone', WHATSAPP: 'WhatsApp', OTHER: 'Other' };

function formatINR(paisa) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paisa || 0) / 100);
}

const today = () => new Date().toISOString().split('T')[0];

function OrdersPage() {
  const { brandId } = useParams();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('');

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', source: 'WALKIN', discount_amount: '', notes: '', orderItems: [{ item_id: '', quantity: 1 }] });
  const [submitting, setSubmitting] = useState(false);

  // WhatsApp parser
  const [showWaParser, setShowWaParser] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waParsing, setWaParsing] = useState(false);

  // Actions
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const itemsMap = useMemo(() => { const m = {}; items.forEach((i) => { m[i.id] = i; }); return m; }, [items]);

  const orderTotals = useMemo(() => {
    let subtotal = 0;
    form.orderItems.forEach((oi) => {
      const item = itemsMap[oi.item_id];
      if (item && oi.quantity > 0) subtotal += item.unit_price * parseInt(oi.quantity, 10);
    });
    const discount = Math.round((parseFloat(form.discount_amount) || 0) * 100);
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
  }, [form.orderItems, form.discount_amount, itemsMap]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter) result = result.filter((o) => o.status === statusFilter);
    if (dateFilter === 'today') {
      const t = today();
      result = result.filter((o) => o.created_at.startsWith(t));
    }
    return result;
  }, [orders, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((o) => o.created_at.startsWith(today()));
    const revenue = todayOrders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total_amount, 0);
    const pending = todayOrders.filter((o) => o.status === 'PENDING').length;
    const delivered = todayOrders.filter((o) => o.status === 'DELIVERED').length;
    return { todayCount: todayOrders.length, revenue, pending, delivered };
  }, [orders]);

  useEffect(() => { if (brandId) { loadOrders(); loadItems(); } }, [brandId]);

  const loadOrders = async () => {
    setLoading(true); setError(null);
    try { const res = await ordersAPI.list(brandId); setOrders(res.data); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to load orders'); }
    finally { setLoading(false); }
  };

  const loadItems = async () => {
    try { const res = await itemsAPI.list(brandId); setItems(res.data.filter((i) => i.is_active)); }
    catch { setItems([]); }
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    const orderItems = form.orderItems.filter((oi) => oi.item_id && oi.quantity > 0)
      .map((oi) => ({ item_id: parseInt(oi.item_id, 10), quantity: parseInt(oi.quantity, 10) }));
    if (orderItems.length === 0) { setError('Add at least one item'); return; }
    setSubmitting(true); setError(null);
    try {
      await ordersAPI.create(brandId, {
        customer_name: form.customer_name || null, customer_phone: form.customer_phone || null,
        source: form.source, discount_amount: Math.round((parseFloat(form.discount_amount) || 0) * 100),
        notes: form.notes || null, items: orderItems,
      });
      resetForm(); flash('Order created'); loadOrders();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create order'); }
    finally { setSubmitting(false); }
  };

  const handleParseWA = async () => {
    if (!waMessage.trim()) return;
    setWaParsing(true); setError(null);
    try {
      const res = await aiAPI.parseOrder({ message: waMessage, brand_id: parseInt(brandId, 10) });
      const parsed = res.data;
      setForm({
        customer_name: parsed.customer_name || '',
        customer_phone: parsed.customer_phone || '',
        source: 'WHATSAPP',
        discount_amount: '',
        notes: `Parsed from WhatsApp`,
        orderItems: parsed.items.length > 0
          ? parsed.items.map((pi) => ({ item_id: pi.item_id ? String(pi.item_id) : '', quantity: pi.quantity || 1 }))
          : [{ item_id: '', quantity: 1 }],
      });
      setShowWaParser(false); setShowForm(true); setWaMessage('');
      flash(`Parsed ${parsed.items.length} item(s) from message`);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to parse WhatsApp message'); }
    finally { setWaParsing(false); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusUpdating(orderId); setError(null);
    try { await ordersAPI.updateStatus(orderId, newStatus); loadOrders(); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to update status'); }
    finally { setStatusUpdating(null); }
  };

  const handleDelete = async (orderId) => {
    setActionLoading(orderId); setError(null);
    try { await ordersAPI.delete(orderId); setDeleteConfirm(null); flash('Order deleted'); loadOrders(); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to delete order'); }
    finally { setActionLoading(null); }
  };

  const resetForm = () => {
    setForm({ customer_name: '', customer_phone: '', source: 'WALKIN', discount_amount: '', notes: '', orderItems: [{ item_id: '', quantity: 1 }] });
    setShowForm(false);
  };

  const addOrderItem = () => setForm({ ...form, orderItems: [...form.orderItems, { item_id: '', quantity: 1 }] });
  const removeOrderItem = (idx) => { if (form.orderItems.length <= 1) return; setForm({ ...form, orderItems: form.orderItems.filter((_, i) => i !== idx) }); };
  const updateOrderItem = (idx, field, value) => { const next = [...form.orderItems]; next[idx] = { ...next[idx], [field]: value }; setForm({ ...form, orderItems: next }); };

  if (loading && orders.length === 0) return <LoadingSpinner message="Loading orders..." />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/brands" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-8">Manage daily orders</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowWaParser(!showWaParser); setShowForm(false); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 ring-1 ring-green-200 transition-all duration-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Order
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowWaParser(false); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft hover:shadow-elevated transition-all duration-200">
              {showForm ? 'Cancel' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>New Order</>)}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex justify-between animate-slide-down"><span>{error}</span><button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
        {success && <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">{success}</div>}

        {/* Today Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Orders", value: stats.todayCount, color: 'text-gray-900' },
            { label: 'Revenue', value: formatINR(stats.revenue), color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Delivered', value: stats.delivered, color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-surface-200 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp Parser */}
        {showWaParser && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-card p-6 mb-6 animate-slide-down">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <h3 className="text-sm font-semibold text-gray-900">Parse WhatsApp Order</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Paste a WhatsApp message or order text. AI will extract items, quantities, and customer details.</p>
            <textarea rows={4} value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors resize-none mb-3"
              placeholder="e.g. Hi, I'd like to order 2 Caesar Salads and 1 Mango Smoothie. My name is Priya, phone 9876543210" />
            <div className="flex gap-3">
              <button onClick={handleParseWA} disabled={waParsing || !waMessage.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 shadow-soft transition-all duration-200">
                {waParsing ? 'Parsing...' : 'Parse & Create Order'}
              </button>
              <button onClick={() => { setShowWaParser(false); setWaMessage(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Create Order Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 mb-6 animate-slide-down">
            <form onSubmit={handleCreate}>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Customer Details</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors" placeholder="Optional" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label><input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors" placeholder="Optional" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors">
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors" placeholder="Optional" /></div>
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Line Items</h3>
                  <button type="button" onClick={addOrderItem} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">+ Add Item</button>
                </div>
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Item</div><div className="col-span-2 text-right">Price</div><div className="col-span-2 text-center">Qty</div><div className="col-span-2 text-right">Total</div><div className="col-span-1" />
                </div>
                <div className="space-y-2">
                  {form.orderItems.map((oi, idx) => {
                    const sel = itemsMap[oi.item_id];
                    const lt = sel ? sel.unit_price * Math.max(0, parseInt(oi.quantity, 10) || 0) : 0;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-surface-50 rounded-xl px-3 py-2.5">
                        <div className="col-span-12 sm:col-span-5">
                          <select required={idx === 0} value={oi.item_id} onChange={(e) => updateOrderItem(idx, 'item_id', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                            <option value="">Select item...</option>
                            {items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.category})</option>)}
                          </select>
                        </div>
                        <div className="col-span-4 sm:col-span-2 text-right"><span className="text-sm font-medium text-gray-700">{sel ? formatINR(sel.unit_price) : '—'}</span>{sel && <span className="block text-xs text-gray-400">/{sel.unit}</span>}</div>
                        <div className="col-span-3 sm:col-span-2 flex justify-center"><input type="number" min="1" value={oi.quantity} onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)} className="w-20 px-3 py-2 rounded-lg border border-surface-200 text-sm text-center bg-white" /></div>
                        <div className="col-span-4 sm:col-span-2 text-right"><span className="text-sm font-semibold text-gray-900">{lt > 0 ? formatINR(lt) : '—'}</span></div>
                        <div className="col-span-1 flex justify-center"><button type="button" onClick={() => removeOrderItem(idx)} disabled={form.orderItems.length <= 1} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-surface-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Subtotal</span><span className="text-sm font-medium text-gray-900">{formatINR(orderTotals.subtotal)}</span></div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="text-sm text-gray-600">Discount</span><input type="number" step="0.01" min="0" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} className="w-24 px-2 py-1 rounded-lg border border-surface-200 text-xs text-right bg-white" placeholder="0" /></div>
                  <span className="text-sm font-medium text-rose-600">{orderTotals.discount > 0 ? `- ${formatINR(orderTotals.discount)}` : '—'}</span>
                </div>
                <div className="border-t border-surface-200 pt-2 mt-2 flex justify-between"><span className="text-sm font-semibold text-gray-900">Total</span><span className="text-lg font-bold text-gray-900">{formatINR(orderTotals.total)}</span></div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-soft hover:shadow-elevated transition-all duration-200">{submitting ? 'Creating...' : 'Place Order'}</button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">Discard</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5">
            {[{ key: 'today', label: 'Today' }, { key: '', label: 'All Time' }].map((f) => (
              <button key={f.key} onClick={() => setDateFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateFilter === f.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-surface-200 mx-1" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!statusFilter ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
              All
            </button>
            {Object.keys(STATUS_STYLES).map((s) => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-500">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const allowed = VALID_STATUS_TRANSITIONS[order.status] || [];
            const statusStyle = STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700';
            const isExpanded = expandedOrder === order.id;
            const isDeleting = deleteConfirm === order.id;
            return (
              <div key={order.id} className="group bg-white rounded-2xl border border-surface-200 shadow-soft hover:shadow-elevated transition-all duration-200 overflow-hidden">
                <button type="button" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center">
                      {order.source === 'WHATSAPP' ? (
                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle}`}>{order.status}</span>
                        {order.source === 'WHATSAPP' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-200">WA</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {order.customer_name && <span>{order.customer_name}</span>}
                        <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-base font-bold text-gray-900">{formatINR(order.total_amount)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-surface-100 px-6 py-4 bg-surface-50/50 animate-slide-down">
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-12 gap-2 px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="col-span-5">Item</div><div className="col-span-2 text-right">Price</div><div className="col-span-2 text-center">Qty</div><div className="col-span-3 text-right">Total</div>
                        </div>
                        {order.items.map((oi) => (
                          <div key={oi.id} className="grid grid-cols-12 gap-2 px-2 py-2 text-sm border-t border-surface-100">
                            <div className="col-span-5 font-medium text-gray-900">{oi.item_name || `Item #${oi.item_id}`}</div>
                            <div className="col-span-2 text-right text-gray-600">{formatINR(oi.unit_price)}</div>
                            <div className="col-span-2 text-center text-gray-600">{oi.quantity}</div>
                            <div className="col-span-3 text-right font-semibold text-gray-900">{formatINR(oi.total_price)}</div>
                          </div>
                        ))}
                        {order.discount_amount > 0 && (
                          <div className="px-2 py-2 text-sm border-t border-surface-100 flex justify-between">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-medium text-rose-600">- {formatINR(order.discount_amount)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {order.notes && <p className="text-xs text-gray-500 mb-3 italic">Note: {order.notes}</p>}

                    {/* Actions row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                      {allowed.map((ns) => (
                        <button key={ns} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, ns); }}
                          disabled={statusUpdating === order.id}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${ns === 'CANCELLED' ? 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200' : 'bg-brand-50 text-brand-700 hover:bg-brand-100 ring-1 ring-brand-200'} disabled:opacity-50`}>
                          {statusUpdating === order.id ? '...' : `${ns.charAt(0) + ns.slice(1).toLowerCase()}`}
                        </button>
                      ))}
                      <div className="ml-auto flex gap-1.5">
                        {isDeleting ? (
                          <div className="flex items-center gap-2 animate-slide-down">
                            <span className="text-xs text-rose-600 font-medium">Delete this order?</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }} disabled={actionLoading === order.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50">{actionLoading === order.id ? '...' : 'Yes'}</button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200">No</button>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(order.id); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete order">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && orders.length > 0 && (
          <div className="text-center py-12"><p className="text-sm text-gray-500">No orders match your filters.</p>
            <button onClick={() => { setDateFilter(''); setStatusFilter(''); }} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">Clear filters</button></div>
        )}

        {orders.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-sm text-center leading-relaxed">Create your first order or paste a WhatsApp message to get started.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>New Order
              </button>
              <button onClick={() => setShowWaParser(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 ring-1 ring-green-200 transition-all">
                WhatsApp Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
