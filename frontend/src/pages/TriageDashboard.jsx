import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { triageAPI, brandsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatCurrency(paisa) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(paisa / 100);
}

function TriageDashboard() {
  const [triage, setTriage] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [triageRes, brandsRes] = await Promise.all([
        triageAPI.daily(today),
        brandsAPI.list(),
      ]);
      setTriage(triageRes.data);
      setBrands(brandsRes.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const hasBrands = brands.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/brands" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-surface-200 hover:border-surface-300 transition-colors">
              Manage Brands
            </Link>
            <Link to="/projects/new" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
              Generate Content
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-xl mb-6 border border-rose-100">{error}</div>
        )}

        {!hasBrands ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Set up your brands</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
              Create your first brand to start tracking orders, inventory, and generating marketing content.
            </p>
            <Link to="/brands" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
              Create Brand
            </Link>
          </div>
        ) : (
          <>
            {/* Combined metrics */}
            {triage?.combined && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Total Orders', value: triage.combined.total_orders, color: 'text-blue-600' },
                  { label: 'Revenue', value: formatCurrency(triage.combined.total_revenue), color: 'text-emerald-600' },
                  { label: 'Profit', value: formatCurrency(triage.combined.total_profit), color: 'text-green-600' },
                  { label: 'Content Pieces', value: triage.combined.total_content_pieces, color: 'text-purple-600' },
                  { label: 'WoW Growth', value: `${triage.combined.week_over_week_growth}%`, color: triage.combined.week_over_week_growth >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-2xl border border-surface-200 p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Per-brand cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {triage?.brands?.map((b) => (
                <div key={b.brand_id} className="bg-white rounded-2xl border border-surface-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{b.brand_name}</h3>
                    {b.low_stock_count > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-600">
                        {b.low_stock_count} low stock
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Orders</p>
                      <p className="text-lg font-bold text-gray-900">{b.orders_today}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(b.revenue_today)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(b.profit_today)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Content</p>
                      <p className="text-lg font-bold text-purple-600">{b.content_generated_today}</p>
                    </div>
                  </div>
                  {b.top_item && (
                    <p className="mt-3 text-xs text-gray-500">Top seller: <span className="font-medium text-gray-700">{b.top_item}</span></p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Link to={`/brands/${b.brand_id}/orders`} className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium bg-surface-100 hover:bg-surface-200 text-gray-700 transition-colors">
                      Orders
                    </Link>
                    <Link to={`/brands/${b.brand_id}/inventory`} className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium bg-surface-100 hover:bg-surface-200 text-gray-700 transition-colors">
                      Inventory
                    </Link>
                    <Link to={`/brands/${b.brand_id}/transactions`} className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium bg-surface-100 hover:bg-surface-200 text-gray-700 transition-colors">
                      Finances
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/projects" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">View Projects</span>
                </Link>
                <Link to="/projects/new" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Generate Content</span>
                </Link>
                <Link to="/brands" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Manage Brands</span>
                </Link>
                <Link to="/brands" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Finances</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TriageDashboard;
