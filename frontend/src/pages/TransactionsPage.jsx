import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { transactionsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatINR(paisa) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paisa || 0) / 100);
}

const CATEGORIES = {
  INCOME: ['Sales', 'Services', 'Commission', 'Refund', 'Other'],
  EXPENSE: ['Ingredients', 'Packaging', 'Rent', 'Salary', 'Marketing', 'Utilities', 'Transport', 'Maintenance', 'Other'],
};
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'];

const emptyForm = { type: 'EXPENSE', category: '', amount: '', payment_method: '', description: '', transaction_date: new Date().toISOString().slice(0, 10) };

function TransactionsPage() {
  const { brandId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filters, setFilters] = useState({ type: '', from_date: '', to_date: '' });

  useEffect(() => { if (brandId) loadTransactions(); }, [brandId, filters.type, filters.from_date, filters.to_date]);

  const loadTransactions = async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      const res = await transactionsAPI.list(brandId, params);
      setTransactions(res.data || []);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const payload = {
      type: form.type, category: form.category, amount: Math.round(parseFloat(form.amount || 0) * 100),
      payment_method: form.payment_method || null, description: form.description || null,
      transaction_date: form.transaction_date || undefined,
    };
    try {
      if (editingTxn) {
        await transactionsAPI.update(editingTxn.id, payload);
        flash('Transaction updated');
      } else {
        await transactionsAPI.create(brandId, payload);
        flash('Transaction created');
      }
      resetForm(); loadTransactions();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(id); setError(null);
    try { await transactionsAPI.delete(id); setDeleteConfirm(null); flash('Transaction deleted'); loadTransactions(); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const startEdit = (txn) => {
    setEditingTxn(txn);
    setForm({
      type: txn.type, category: txn.category, amount: String((txn.amount || 0) / 100),
      payment_method: txn.payment_method || '', description: txn.description || '',
      transaction_date: txn.transaction_date ? txn.transaction_date.split('T')[0] : new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const resetForm = () => { setForm({ ...emptyForm }); setEditingTxn(null); setShowForm(false); };

  if (!brandId) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-50"><p className="text-gray-600">Invalid brand</p></div>;
  if (loading && transactions.length === 0) return <LoadingSpinner message="Loading transactions..." />;

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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-8">Track income & expenses</p>
          </div>
          <button onClick={() => { showForm ? resetForm() : setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
            {showForm ? 'Cancel' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>New Transaction</>)}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex justify-between"><span>{error}</span><button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
        {success && <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">{success}</div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Income</p>
            <p className="text-lg font-bold text-emerald-600">{formatINR(totals.income)}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</p>
            <p className="text-lg font-bold text-rose-600">{formatINR(totals.expense)}</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net</p>
            <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatINR(totals.net)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            {['', 'INCOME', 'EXPENSE'].map((t) => (
              <button key={t} onClick={() => setFilters({ ...filters, type: t })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filters.type === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 ring-1 ring-surface-200 hover:bg-surface-100'}`}>
                {t || 'All'}
              </button>
            ))}
          </div>
          <input type="date" value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs bg-white focus:ring-2 focus:ring-brand-500/20" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs bg-white focus:ring-2 focus:ring-brand-500/20" />
          {(filters.from_date || filters.to_date) && (
            <button onClick={() => setFilters({ ...filters, from_date: '', to_date: '' })} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Clear dates</button>
          )}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 mb-6 animate-slide-down">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{editingTxn ? 'Edit Transaction' : 'New Transaction'}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {['INCOME', 'EXPENSE'].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: '' })}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.type === t ? (t === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                      {t === 'INCOME' ? '+ Income' : '- Expense'}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                  <option value="">Select...</option>
                  {(CATEGORIES[form.type] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (₹)</label><input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="0.00" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                  <option value="">Select...</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label><input required type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="Optional notes" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-soft transition-all">{submitting ? 'Saving...' : editingTxn ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No transactions found. Add one to get started.</div>
          ) : (
            <ul className="divide-y divide-surface-100">
              {transactions.map((txn) => {
                const isDeleting = deleteConfirm === txn.id;
                return (
                  <li key={txn.id} className="group flex items-center justify-between px-5 py-4 hover:bg-surface-50/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${txn.type === 'INCOME' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        <svg className={`w-4 h-4 ${txn.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={txn.type === 'INCOME' ? 'M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75' : 'M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75'} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{txn.category}</span>
                          {txn.payment_method && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-100 text-gray-500">{txn.payment_method}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {txn.description && <span className="text-xs text-gray-500 truncate">{txn.description}</span>}
                          <span className="text-xs text-gray-400">{new Date(txn.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm font-bold ${txn.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.type === 'INCOME' ? '+' : '-'}{formatINR(txn.amount)}
                      </span>
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 animate-slide-down">
                          <button onClick={() => handleDelete(txn.id)} disabled={actionLoading === txn.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50">{actionLoading === txn.id ? '...' : 'Delete'}</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(txn)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(txn.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;
