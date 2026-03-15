import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inventoryAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatINR(paisa) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((paisa || 0) / 100);
}

const emptyForm = { name: '', category: '', unit: 'piece', current_stock: '0', min_stock: '0', cost_per_unit: '' };
const UNIT_OPTIONS = ['piece', 'kg', 'g', 'litre', 'ml', 'box', 'dozen', 'pack'];

function InventoryPage() {
  const { brandId } = useParams();
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Movement modal
  const [movementItem, setMovementItem] = useState(null);
  const [movementForm, setMovementForm] = useState({ type: 'IN', quantity: '', notes: '' });
  const [movementSubmitting, setMovementSubmitting] = useState(false);

  useEffect(() => { if (brandId) { loadInventory(); loadLowStock(); } }, [brandId]);

  const loadInventory = async () => {
    setLoading(true); setError(null);
    try { const res = await inventoryAPI.list(brandId); setInventory(res.data); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const loadLowStock = async () => {
    try { const res = await inventoryAPI.lowStock(brandId); setLowStock(res.data); }
    catch { setLowStock([]); }
  };

  const refresh = () => { loadInventory(); loadLowStock(); };
  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const filtered = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter((i) => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  const stats = useMemo(() => ({
    total: inventory.length,
    lowCount: lowStock.length,
    totalValue: inventory.reduce((s, i) => s + (i.cost_per_unit || 0) * i.current_stock, 0),
  }), [inventory, lowStock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const payload = {
      name: form.name, category: form.category || null, unit: form.unit,
      current_stock: parseFloat(form.current_stock) || 0, min_stock: parseFloat(form.min_stock) || 0,
      cost_per_unit: form.cost_per_unit ? Math.round(parseFloat(form.cost_per_unit) * 100) : null,
    };
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, payload);
        flash('Item updated');
      } else {
        await inventoryAPI.create(brandId, payload);
        flash('Item created');
      }
      resetForm(); refresh();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(id); setError(null);
    try { await inventoryAPI.delete(id); setDeleteConfirm(null); flash('Item deleted'); refresh(); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name, category: item.category || '', unit: item.unit,
      current_stock: String(item.current_stock), min_stock: String(item.min_stock),
      cost_per_unit: item.cost_per_unit ? String(item.cost_per_unit / 100) : '',
    });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ ...emptyForm }); setEditingItem(null); setShowForm(false); };

  const handleRecordMovement = async (e) => {
    e.preventDefault();
    if (!movementItem) return;
    setMovementSubmitting(true); setError(null);
    try {
      await inventoryAPI.recordMovement(movementItem.id, {
        type: movementForm.type, quantity: parseFloat(movementForm.quantity) || 0, notes: movementForm.notes || null,
      });
      setMovementItem(null); setMovementForm({ type: 'IN', quantity: '', notes: '' }); flash('Movement recorded'); refresh();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to record movement'); }
    finally { setMovementSubmitting(false); }
  };

  if (loading && inventory.length === 0) return <LoadingSpinner message="Loading inventory..." />;

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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
            </div>
          </div>
          <button onClick={() => { showForm ? resetForm() : setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
            {showForm ? 'Cancel' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Item</>)}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex justify-between"><span>{error}</span><button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
        {success && <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">{success}</div>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Items</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${stats.lowCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-surface-200'}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</p>
            <p className={`text-lg font-bold ${stats.lowCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{stats.lowCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Value</p>
            <p className="text-lg font-bold text-gray-900">{formatINR(stats.totalValue)}</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStock.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50">
            <h2 className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">Low Stock Alerts</h2>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((item) => (
                <span key={item.id} className="px-3 py-1.5 rounded-lg bg-white/70 text-rose-800 text-xs font-medium ring-1 ring-rose-200">
                  {item.name}: {item.current_stock}/{item.min_stock} {item.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..."
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors" />
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 mb-6 animate-slide-down">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{editingItem ? 'Edit Item' : 'New Inventory Item'}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="Item name" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="Optional" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Current Stock</label><input type="number" step="0.01" min="0" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Min Stock (alert threshold)</label><input type="number" step="0.01" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Cost/Unit (₹)</label><input type="number" step="0.01" min="0" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="0.00" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-soft transition-all">{submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No inventory items found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Min</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((item) => {
                  const isLow = item.current_stock <= item.min_stock && item.min_stock > 0;
                  const isDeleting = deleteConfirm === item.id;
                  return (
                    <tr key={item.id} className="group hover:bg-surface-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-surface-100 text-gray-600'}`}>
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.category && <p className="text-xs text-gray-500">{item.category} · {item.unit}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3.5">
                        <span className={`text-sm font-semibold ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>{item.current_stock}</span>
                        {isLow && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">LOW</span>}
                      </td>
                      <td className="text-center px-3 py-3.5 text-sm text-gray-500">{item.min_stock}</td>
                      <td className="text-right px-3 py-3.5 text-sm text-gray-700">{item.cost_per_unit ? formatINR(item.cost_per_unit) : '—'}</td>
                      <td className="text-right px-5 py-3.5">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-2 animate-slide-down">
                            <span className="text-xs text-rose-600">Delete?</span>
                            <button onClick={() => handleDelete(item.id)} disabled={actionLoading === item.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50">{actionLoading === item.id ? '...' : 'Yes'}</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setMovementItem(item)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors" title="Record movement">± Stock</button>
                            <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                            </button>
                            <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Movement Modal */}
      {movementItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setMovementItem(null)}>
          <div className="bg-white rounded-2xl border border-surface-200 p-6 w-full max-w-md shadow-elevated animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Record Movement</h3>
            <p className="text-sm text-gray-500 mb-4">{movementItem.name} — Current: {movementItem.current_stock} {movementItem.unit}</p>
            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {['IN', 'OUT'].map((t) => (
                    <button key={t} type="button" onClick={() => setMovementForm({ ...movementForm, type: t })}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${movementForm.type === t ? (t === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                      {t === 'IN' ? '+ Stock In' : '- Stock Out'}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity</label><input required type="number" step="0.01" min="0" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="0" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label><input value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="Optional" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={movementSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all">{movementSubmitting ? 'Recording...' : 'Record'}</button>
                <button type="button" onClick={() => setMovementItem(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-surface-100 hover:bg-surface-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
