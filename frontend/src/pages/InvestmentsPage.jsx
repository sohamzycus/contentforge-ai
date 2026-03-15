import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { investmentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatINR(paisa) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paisa || 0) / 100);
}

const CATEGORY_SUGGESTIONS = ['Equipment', 'Marketing', 'Packaging', 'Rent Deposit', 'Licensing', 'Technology', 'Furniture', 'Branding', 'Training', 'Other'];
const emptyForm = { category: '', amount: '', description: '', invested_at: new Date().toISOString().split('T')[0] };

function InvestmentsPage() {
  const { brandId } = useParams();
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => { if (brandId) loadData(); }, [brandId]);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [invRes, sumRes] = await Promise.all([investmentsAPI.list(brandId), investmentsAPI.summary(brandId)]);
      setInvestments(invRes.data); setSummary(sumRes.data);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load investments'); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const categories = useMemo(() => {
    const cats = new Set(investments.map((i) => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [investments]);

  const filtered = useMemo(() => {
    if (!categoryFilter) return investments;
    return investments.filter((i) => i.category === categoryFilter);
  }, [investments, categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const payload = { category: form.category, amount: Math.round(parseFloat(form.amount || 0) * 100), description: form.description || null, invested_at: form.invested_at };
    try {
      if (editingInv) {
        await investmentsAPI.update(editingInv.id, payload);
        flash('Investment updated');
      } else {
        await investmentsAPI.create(brandId, payload);
        flash('Investment recorded');
      }
      resetForm(); loadData();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(id); setError(null);
    try { await investmentsAPI.delete(id); setDeleteConfirm(null); flash('Investment deleted'); loadData(); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const startEdit = (inv) => {
    setEditingInv(inv);
    setForm({ category: inv.category, amount: String((inv.amount || 0) / 100), description: inv.description || '', invested_at: inv.invested_at ? inv.invested_at.split('T')[0] : new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ ...emptyForm }); setEditingInv(null); setShowForm(false); };

  if (loading && investments.length === 0) return <LoadingSpinner message="Loading investments..." />;

  const maxCat = summary?.by_category ? Math.max(...Object.values(summary.by_category), 1) : 1;

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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Investments</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-8">Track capital investments</p>
          </div>
          <button onClick={() => { showForm ? resetForm() : setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
            {showForm ? 'Cancel' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Record Investment</>)}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex justify-between"><span>{error}</span><button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
        {success && <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">{success}</div>}

        {/* Summary */}
        {summary && (
          <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Investment Summary</h3>
              <p className="text-xl font-bold text-brand-600">{formatINR(summary.total_invested)}</p>
            </div>
            {Object.entries(summary.by_category || {}).length > 0 && (
              <div className="space-y-3">
                {Object.entries(summary.by_category).map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{cat}</span>
                      <span className="font-semibold text-gray-900">{formatINR(amount)}</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500" style={{ width: `${(amount / maxCat) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <button onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!categoryFilter ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>All</button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(categoryFilter === c ? '' : c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${categoryFilter === c ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>{c}</button>
            ))}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 mb-6 animate-slide-down">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{editingInv ? 'Edit Investment' : 'New Investment'}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <div className="relative">
                  <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="inv-categories"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="e.g. Equipment, Marketing" />
                  <datalist id="inv-categories">{CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (₹)</label><input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="0.00" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="Optional" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label><input required type="date" value={form.invested_at} onChange={(e) => setForm({ ...form, invested_at: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-soft transition-all">{submitting ? 'Saving...' : editingInv ? 'Update' : 'Record'}</button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {/* Investments List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500">
              <p className="mb-2">No investments recorded yet.</p>
              <button onClick={() => setShowForm(true)} className="text-brand-600 hover:text-brand-700 font-medium">Record your first investment</button>
            </div>
          ) : (
            filtered.map((inv) => {
              const isDeleting = deleteConfirm === inv.id;
              return (
                <div key={inv.id} className="group bg-white rounded-2xl border border-surface-200 p-5 flex items-center justify-between hover:shadow-elevated transition-all duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">{inv.category}</span>
                        {inv.description && <span className="text-sm text-gray-600 truncate">{inv.description}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(inv.invested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-lg font-bold text-brand-600">{formatINR(inv.amount)}</p>
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 animate-slide-down">
                        <button onClick={() => handleDelete(inv.id)} disabled={actionLoading === inv.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50">{actionLoading === inv.id ? '...' : 'Delete'}</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(inv)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(inv.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default InvestmentsPage;
