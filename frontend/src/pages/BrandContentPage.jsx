import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { brandsAPI, itemsAPI, projectsAPI, aiAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'google_ads'];
const PLATFORM_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', google_ads: 'Google Ads' };
const PLATFORM_COLORS = {
  instagram: 'from-pink-500 to-purple-600', facebook: 'from-blue-600 to-blue-700',
  tiktok: 'from-gray-900 to-gray-800', youtube: 'from-red-600 to-red-700', google_ads: 'from-blue-500 to-green-500',
};
const PLATFORM_ICONS = {
  instagram: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  facebook: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  tiktok: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  youtube: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/></svg>,
  google_ads: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>,
};

function BrandContentPage() {
  const { brandId } = useParams();
  const [brand, setBrand] = useState(null);
  const [items, setItems] = useState([]);
  const [contentHistory, setContentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // View modes
  const [view, setView] = useState('history'); // 'history' | 'generate' | 'detail' | 'images'
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('instagram');
  const [copiedField, setCopiedField] = useState(null);

  // Generate form
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ product_name: '', product_description: '', target_audience: '', unique_selling_points: [''] });
  const [generating, setGenerating] = useState(false);

  // Image generation
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImages, setGeneratingImages] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { if (brandId) loadAll(); }, [brandId]);

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [brandRes, itemsRes, contentRes] = await Promise.all([
        brandsAPI.get(brandId), itemsAPI.list(brandId), brandsAPI.listContent(brandId),
      ]);
      const b = brandRes.data;
      setBrand(b);
      setItems(itemsRes.data.filter((i) => i.is_active));
      setContentHistory(contentRes.data || []);
      setForm((prev) => ({
        ...prev, target_audience: b.target_audience || '', product_description: b.description || '',
        unique_selling_points: b.tagline ? [b.tagline] : [''],
      }));
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const handleItemSelect = (itemId) => {
    const item = items.find((i) => i.id === parseInt(itemId));
    setSelectedItem(item);
    if (item) setForm((prev) => ({ ...prev, product_name: item.name, product_description: item.description || brand?.description || '' }));
  };

  const handleUSPChange = (i, v) => { const u = [...form.unique_selling_points]; u[i] = v; setForm({ ...form, unique_selling_points: u }); };
  const addUSP = () => setForm({ ...form, unique_selling_points: [...form.unique_selling_points, ''] });
  const removeUSP = (i) => setForm({ ...form, unique_selling_points: form.unique_selling_points.filter((_, idx) => idx !== i) });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true); setError('');
    try {
      const data = { ...form, unique_selling_points: form.unique_selling_points.filter(Boolean) };
      const res = await brandsAPI.generateContent(brandId, data);
      setContentHistory((prev) => [res.data, ...prev]);
      openDetail(res.data);
      flash('Content generated successfully!');
    } catch (err) { setError(err.response?.data?.detail || 'Failed to generate content'); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (projectId) => {
    setActionLoading(projectId); setError('');
    try {
      await projectsAPI.delete(projectId);
      setContentHistory((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) { setView('history'); setSelectedProject(null); }
      setDeleteConfirm(null); flash('Content deleted');
    } catch (err) { setError(err.response?.data?.detail || 'Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const openDetail = (project) => {
    setSelectedProject(project);
    setActiveTab('instagram');
    setView('detail');
    loadSavedImages(project);
  };

  const [imageProvider, setImageProvider] = useState('');

  const persistImages = async (images, recommendedIdx, provider, prompt) => {
    if (!selectedProject) return;
    try {
      const res = await projectsAPI.saveImages(selectedProject.id, {
        images, recommended_index: recommendedIdx, provider, prompt,
      });
      setSelectedProject(res.data);
      setContentHistory((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)));
    } catch { /* silent – images are still in local state */ }
  };

  const handleGenerateImages = async (prompt) => {
    setImagePrompt(prompt || '');
    setGeneratingImages(true); setGeneratedImages([]); setView('images'); setError('');
    try {
      const res = await aiAPI.generateImages({ prompt: prompt || imagePrompt, width: 1024, height: 1024, count: 3 });
      const imgs = res.data.images || [];
      const recIdx = res.data.recommended_index || 0;
      const prov = res.data.provider || '';
      setGeneratedImages(imgs);
      setSelectedImageIdx(recIdx);
      setImageProvider(prov);
      if (res.data.errors?.length) setError(`Some variations failed: ${res.data.errors.join(', ')}`);
      if (imgs.length > 0) persistImages(imgs, recIdx, prov, prompt || imagePrompt);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to generate images. Check that TOGETHER_API_KEY is set in .env'); }
    finally { setGeneratingImages(false); }
  };

  const loadSavedImages = (project) => {
    const saved = project?.content?.generated_images;
    if (saved?.images?.length) {
      setGeneratedImages(saved.images);
      setSelectedImageIdx(saved.recommended_index || 0);
      setImageProvider(saved.provider || '');
      setImagePrompt(saved.prompt || '');
      return true;
    }
    return false;
  };

  const copyToClipboard = async (text, field) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); } catch {}
  };

  if (loading) return <LoadingSpinner message="Loading content studio..." />;

  const content = selectedProject?.content?.content;
  const research = selectedProject?.content?.research;
  const creative = selectedProject?.content?.creative;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/brands" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Studio</h1>
            {brand && <span className="text-sm text-gray-500">— {brand.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            {view !== 'history' && (
              <button onClick={() => { setView('history'); setSelectedProject(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">
                ← All Content
              </button>
            )}
            <button onClick={() => setView('generate')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-soft transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              Generate New
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex justify-between"><span>{error}</span><button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>}
        {success && <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm animate-slide-down">{success}</div>}

        {/* ── HISTORY VIEW ── */}
        {view === 'history' && (
          <div>
            <p className="text-sm text-gray-500 mb-5">{contentHistory.length} content piece{contentHistory.length !== 1 ? 's' : ''} generated</p>
            {contentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No content yet</h2>
                <p className="text-sm text-gray-500 mb-8 max-w-sm text-center">Generate AI-powered marketing content for Instagram, Facebook, TikTok, YouTube, and Google Ads.</p>
                <button onClick={() => setView('generate')} className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">Generate First Content</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentHistory.map((project) => {
                  const isDeleting = deleteConfirm === project.id;
                  return (
                    <div key={project.id} className="group bg-white rounded-2xl border border-surface-200 hover:shadow-elevated transition-all overflow-hidden">
                      <div className="p-5 cursor-pointer" onClick={() => openDetail(project)}>
                        <div className="flex gap-1.5 mb-3">
                          {PLATFORMS.map((p) => (
                            <div key={p} className={`w-6 h-6 rounded-md bg-gradient-to-br ${PLATFORM_COLORS[p]} flex items-center justify-center text-white`}>
                              {PLATFORM_ICONS[p]}
                            </div>
                          ))}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">{project.product_name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.target_audience}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {project.content?.generated_images?.images?.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[10px] font-semibold">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                                {project.content.generated_images.images.length}
                              </span>
                            )}
                          </div>
                          {isDeleting ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleDelete(project.id)} disabled={actionLoading === project.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50">{actionLoading === project.id ? '...' : 'Delete'}</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 bg-surface-100 hover:bg-surface-200">No</button>
                            </div>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GENERATE VIEW ── */}
        {view === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Generate Marketing Content</h2>
            <p className="text-sm text-gray-500 mb-6">AI creates catchy posts for 5 platforms + image prompts.</p>
            <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-surface-200 shadow-card p-6 space-y-5">
              {items.length > 0 && (
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Feature an item</label>
                  <select value={selectedItem?.id || ''} onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400">
                    <option value="">-- Select or enter manually --</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.category})</option>)}
                  </select>
                </div>
              )}
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name</label><input required value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="e.g. Grilled Chicken Bowl" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><textarea required rows={3} value={form.product_description} onChange={(e) => setForm({ ...form, product_description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none" placeholder="Describe the product..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Target Audience</label><input required value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder="e.g. Health-conscious millennials" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-2">Unique Selling Points</label>
                {form.unique_selling_points.map((usp, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={usp} onChange={(e) => handleUSPChange(i, e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" placeholder={`USP ${i + 1}`} />
                    {form.unique_selling_points.length > 1 && <button type="button" onClick={() => removeUSP(i)} className="px-3 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-50">Remove</button>}
                  </div>
                ))}
                <button type="button" onClick={addUSP} className="text-xs text-brand-600 hover:text-brand-700 font-semibold">+ Add USP</button>
              </div>
              <button type="submit" disabled={generating} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-soft transition-all disabled:opacity-50">
                {generating ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</span> : 'Generate Content with AI'}
              </button>
            </form>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selectedProject && (
          <div className="space-y-6 animate-fade-in">
            {/* Project header */}
            <div className="bg-white rounded-2xl border border-surface-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedProject.product_name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedProject.target_audience}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(selectedProject.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                {creative?.image_prompt && (
                  generatedImages.length > 0 ? (
                    <button onClick={() => setView('images')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                      View Images ({generatedImages.length})
                    </button>
                  ) : (
                    <button onClick={() => handleGenerateImages(creative.image_prompt)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                      Generate Images
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Platform tabs */}
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
              <div className="flex border-b border-surface-200 overflow-x-auto">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => setActiveTab(p)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === p ? 'border-brand-600 text-brand-700 bg-brand-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-surface-50'}`}>
                    <span className={activeTab === p ? 'text-brand-600' : 'text-gray-400'}>{PLATFORM_ICONS[p]}</span>
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
              {content && (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLATFORM_COLORS[activeTab]} flex items-center justify-center text-white`}>{PLATFORM_ICONS[activeTab]}</div>
                      <div><h3 className="text-sm font-bold text-gray-900">{PLATFORM_LABELS[activeTab]} Post</h3><p className="text-xs text-gray-500">Ready to copy & post</p></div>
                    </div>
                    <button onClick={() => copyToClipboard(content[activeTab] || '', activeTab)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${copiedField === activeTab ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                      {copiedField === activeTab ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-5 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed max-h-[500px] overflow-y-auto">{content[activeTab] || 'No content for this platform.'}</div>
                </div>
              )}
            </div>

            {/* Saved Images Gallery */}
            {generatedImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Generated Images</h3>
                      <p className="text-xs text-gray-500">{generatedImages.length} variation{generatedImages.length !== 1 ? 's' : ''} — click to view full size{imageProvider ? ` · ${imageProvider === 'together' ? 'Together.ai FLUX.1' : imageProvider}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleGenerateImages(imagePrompt || creative?.image_prompt)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                      Regenerate
                    </button>
                    <button onClick={() => setView('images')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-surface-100 hover:bg-surface-200 transition-all">
                      View Full
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {generatedImages.map((img, idx) => (
                    <button key={idx} onClick={() => { setSelectedImageIdx(idx); setView('images'); }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageIdx === idx ? 'border-violet-500 ring-2 ring-violet-200' : 'border-surface-200 hover:border-surface-300'}`}>
                      <img src={img.data_url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                        {idx === selectedImageIdx ? 'Selected' : `Style ${idx + 1}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Prompt */}
            {creative?.image_prompt && (
              <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
                    </div>
                    <div><h3 className="text-sm font-bold text-gray-900">AI Image Prompts</h3><p className="text-xs text-gray-500">Copy or generate images directly</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(creative.image_prompt, 'image_prompt')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${copiedField === 'image_prompt' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                      {copiedField === 'image_prompt' ? '✓ Copied!' : 'Copy Prompt'}
                    </button>
                    {generatedImages.length === 0 && (
                      <button onClick={() => handleGenerateImages(creative.image_prompt)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all">
                        Generate Images
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl p-5 text-sm text-gray-800 leading-relaxed border border-violet-100 max-h-48 overflow-y-auto">{creative.image_prompt}</div>
              </div>
            )}

            {/* Research */}
            {research && (
              <div className="grid sm:grid-cols-2 gap-4">
                {research.audience_insights && (
                  <div className="bg-white rounded-2xl border border-surface-200 p-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Audience Insights</h4>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{research.audience_insights}</div>
                  </div>
                )}
                {research.competitor_analysis && (
                  <div className="bg-white rounded-2xl border border-surface-200 p-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Competitor Analysis</h4>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{research.competitor_analysis}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IMAGES VIEW ── */}
        {view === 'images' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Generated Images</h2>
                <p className="text-sm text-gray-500 mt-0.5">Powered by {imageProvider === 'together' ? 'Together.ai FLUX.1 Schnell' : 'AI Image Generation'}</p>
              </div>
              {selectedProject && (
                <button onClick={() => setView('detail')} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors">← Back to Content</button>
              )}
            </div>

            {generatingImages ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="w-10 h-10 animate-spin text-violet-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="text-sm text-gray-600 font-medium">Generating images...</p>
                <p className="text-xs text-gray-400 mt-1">This takes about 45-60 seconds (rate-limited to avoid throttling)</p>
              </div>
            ) : generatedImages.length > 0 ? (
              <div>
                {/* Selected image large */}
                <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden mb-4">
                  <div className="relative aspect-square max-h-[500px] bg-surface-100 flex items-center justify-center">
                    <img src={generatedImages[selectedImageIdx]?.data_url} alt="Generated" className="w-full h-full object-contain" />
                    {selectedImageIdx === 0 && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold shadow-lg">
                        AI Recommended
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-surface-200">
                    <p className="text-xs text-gray-500 line-clamp-2">{generatedImages[selectedImageIdx]?.prompt}</p>
                    <div className="flex gap-2 mt-3">
                      <a href={generatedImages[selectedImageIdx]?.data_url} download={`ai-image-${selectedImageIdx + 1}.jpg`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all">
                        Download Image
                      </a>
                      <button onClick={() => copyToClipboard(generatedImages[selectedImageIdx]?.prompt, 'img_prompt')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${copiedField === 'img_prompt' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                        {copiedField === 'img_prompt' ? '✓ Copied Prompt' : 'Copy Prompt'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-3 gap-3">
                  {generatedImages.map((img, idx) => (
                    <button key={idx} onClick={() => setSelectedImageIdx(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageIdx === idx ? 'border-violet-500 ring-2 ring-violet-200' : 'border-surface-200 hover:border-surface-300'}`}>
                      <img src={img.data_url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                        {idx === 0 ? 'Recommended' : `Style ${idx + 1}`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleGenerateImages(imagePrompt)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200 transition-all">
                    Regenerate Images
                  </button>
                  {selectedProject && (
                    <button onClick={() => {
                      persistImages(generatedImages, selectedImageIdx, imageProvider, imagePrompt);
                      flash('Image selection saved!');
                    }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft transition-all">
                      Save Selection
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrandContentPage;
