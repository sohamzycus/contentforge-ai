import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatINR(paisa) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paisa || 0) / 100);
}

const UNIT_OPTIONS = [
  { value: 'piece', label: 'Piece' },
  { value: 'plate', label: 'Plate' },
  { value: 'box', label: 'Box' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'Gram' },
  { value: 'litre', label: 'Litre' },
  { value: 'ml', label: 'mL' },
  { value: 'serving', label: 'Serving' },
  { value: 'slice', label: 'Slice' },
];

const CATEGORY_SUGGESTIONS = [
  'Salads', 'Bowls', 'Beverages', 'Desserts', 'Snacks', 'Cakes',
  'Breads', 'Wraps', 'Smoothies', 'Juices', 'Sides', 'Combos', 'Other',
];

const emptyForm = {
  name: '', description: '', category: '', unit_price: '', cost_price: '', unit: 'piece', image_url: '',
};

function ItemsPage() {
  const { brandId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (brandId) loadItems();
  }, [brandId, showInactive]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await itemsAPI.list(brandId, undefined, showInactive);
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      unit_price: Math.round(parseFloat(form.unit_price || 0) * 100),
      cost_price: form.cost_price ? Math.round(parseFloat(form.cost_price) * 100) : null,
      unit: form.unit,
      image_url: form.image_url || null,
    };
    try {
      if (editingItem) {
        await itemsAPI.update(editingItem.id, payload);
        flash(`"${form.name}" updated`);
      } else {
        await itemsAPI.create(brandId, payload);
        flash(`"${form.name}" created`);
      }
      resetForm();
      loadItems();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${editingItem ? 'update' : 'create'} item`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unit_price: (item.unit_price / 100).toString(),
      cost_price: item.cost_price != null ? (item.cost_price / 100).toString() : '',
      unit: item.unit,
      image_url: item.image_url || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item) => {
    setActionLoading(item.id);
    setError(null);
    try {
      await itemsAPI.delete(item.id);
      setDeleteConfirm(null);
      flash(`"${item.name}" deleted`);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete item. It may be referenced by existing orders.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (item) => {
    setActionLoading(item.id);
    setError(null);
    try {
      await itemsAPI.update(item.id, { is_active: !item.is_active });
      flash(`"${item.name}" ${item.is_active ? 'deactivated' : 'activated'}`);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update item');
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingItem(null);
    setShowForm(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
    return cats;
  }, [items]);

  const allCategories = useMemo(() => {
    return [...new Set([...categories, ...CATEGORY_SUGGESTIONS])].sort();
  }, [categories]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (categoryFilter) result = result.filter((i) => i.category === categoryFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return result;
  }, [items, categoryFilter, searchQuery]);

  const margin = (item) => {
    if (!item.cost_price || item.cost_price === 0) return null;
    return Math.round(((item.unit_price - item.cost_price) / item.unit_price) * 100);
  };

  const stats = useMemo(() => {
    const active = items.filter((i) => i.is_active).length;
    const inactive = items.length - active;
    const avgMargin = items.filter((i) => i.cost_price > 0).reduce((acc, i, _, arr) => {
      return acc + ((i.unit_price - i.cost_price) / i.unit_price) * 100 / arr.length;
    }, 0);
    return { total: items.length, active, inactive, avgMargin: Math.round(avgMargin) };
  }, [items]);

  if (loading && items.length === 0) return <LoadingSpinner message="Loading items..." />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/brands" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Item Catalog</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-8">Manage your products and pricing</p>
          </div>
          <button
            onClick={() => { if (showForm && !editingItem) { resetForm(); } else { resetForm(); setShowForm(true); } }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft hover:shadow-elevated transition-all duration-200"
          >
            {showForm && !editingItem ? 'Cancel' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Item
              </>
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between animate-slide-down">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-rose-400 hover:text-rose-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">
            {success}
          </div>
        )}

        {/* Stats Bar */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Items', value: stats.total, color: 'text-gray-900' },
              { label: 'Active', value: stats.active, color: 'text-emerald-600' },
              { label: 'Inactive', value: stats.inactive, color: 'text-gray-500' },
              { label: 'Avg Margin', value: `${stats.avgMargin}%`, color: stats.avgMargin >= 25 ? 'text-emerald-600' : 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-surface-200 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 mb-6 animate-slide-down">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  {editingItem ? `Edit — ${editingItem.name}` : 'New Item'}
                </h3>
                {editingItem && (
                  <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    Cancel editing
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Item Name *</label>
                  <input required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
                    placeholder="e.g. Chicken Caesar Salad" />
                </div>

                {/* Category — combobox */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Category *</label>
                  <input required list="category-options" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
                    placeholder="Select or type..." />
                  <datalist id="category-options">
                    {allCategories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Unit</label>
                  <select value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors bg-white">
                    {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sell Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input required type="number" step="0.01" min="0" value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
                      placeholder="0.00" />
                  </div>
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Cost Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" step="0.01" min="0" value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
                      placeholder="0.00" />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Image URL</label>
                  <input value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
                    placeholder="https://..." />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors resize-none"
                  placeholder="Ingredients, preparation notes, allergens..." />
              </div>

              {/* Live margin preview */}
              {form.unit_price && form.cost_price && parseFloat(form.unit_price) > 0 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Margin:</span>{' '}
                    <span className={`font-bold ${
                      ((parseFloat(form.unit_price) - parseFloat(form.cost_price)) / parseFloat(form.unit_price)) * 100 >= 25
                        ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {Math.round(((parseFloat(form.unit_price) - parseFloat(form.cost_price)) / parseFloat(form.unit_price)) * 100)}%
                    </span>
                  </div>
                  <div className="text-gray-400">|</div>
                  <div>
                    <span className="text-gray-500">Profit:</span>{' '}
                    <span className="font-semibold text-gray-900">₹{(parseFloat(form.unit_price) - parseFloat(form.cost_price)).toFixed(2)}</span>
                    <span className="text-gray-400"> per {form.unit}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-soft hover:shadow-elevated transition-all duration-200">
                  {submitting ? (editingItem ? 'Saving...' : 'Creating...') : (editingItem ? 'Save Changes' : 'Create Item')}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">
                  Discard
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toolbar: Search + Filters */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors bg-white"
                placeholder="Search items..."
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setCategoryFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  !categoryFilter ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-surface-100 ring-1 ring-surface-200'
                }`}>
                All
              </button>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-surface-100 ring-1 ring-surface-200'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Show inactive toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setShowInactive(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${showInactive ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
                All
              </button>
              <button onClick={() => setShowInactive(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${!showInactive ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
                Active Only
              </button>
            </div>
          </div>
        )}

        {/* Items Table */}
        {filteredItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-6 py-3 bg-surface-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-surface-200">
              <div className="col-span-4">Item</div>
              <div className="col-span-2 text-right">Sell Price</div>
              <div className="col-span-2 text-right">Cost / Margin</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {filteredItems.map((item, idx) => {
              const m = margin(item);
              const isDeleting = deleteConfirm === item.id;
              return (
                <div key={item.id}
                  className={`group lg:grid lg:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-surface-50/50 transition-colors ${
                    idx < filteredItems.length - 1 ? 'border-b border-surface-100' : ''
                  } ${!item.is_active ? 'opacity-60' : ''}`}>

                  {/* Item info */}
                  <div className="col-span-4 flex items-center gap-3 mb-3 lg:mb-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 ring-1 ring-surface-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-400">{item.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{item.category}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">per {item.unit}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 max-w-[200px]">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Sell Price */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-bold text-gray-900">{formatINR(item.unit_price)}</span>
                  </div>

                  {/* Cost + Margin */}
                  <div className="col-span-2 text-right">
                    {item.cost_price != null ? (
                      <div>
                        <span className="text-sm text-gray-600">{formatINR(item.cost_price)}</span>
                        {m !== null && (
                          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${
                            m >= 30 ? 'bg-emerald-50 text-emerald-700' : m >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {m}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => handleToggleActive(item)} disabled={actionLoading === item.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100'
                      } disabled:opacity-50`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {actionLoading === item.id ? '...' : item.is_active ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-1.5 mt-3 lg:mt-0">
                    {isDeleting ? (
                      <div className="flex items-center gap-2 animate-slide-down">
                        <span className="text-xs text-rose-600 font-medium">Delete?</span>
                        <button onClick={() => handleDelete(item)} disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors">
                          {actionLoading === item.id ? '...' : 'Yes'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty States */}
        {filteredItems.length === 0 && items.length > 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No items match your filters.</p>
            <button onClick={() => { setCategoryFilter(''); setSearchQuery(''); }}
              className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">Clear filters</button>
          </div>
        )}

        {items.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-sm text-center leading-relaxed">
              Add your first product to start creating orders and tracking inventory.
            </p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft hover:shadow-elevated transition-all duration-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add First Item
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/10 pointer-events-none" onClick={() => setDeleteConfirm(null)} />
        )}
      </div>
    </div>
  );
}

export default ItemsPage;
