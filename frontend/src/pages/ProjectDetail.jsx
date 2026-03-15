import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const tabs = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'bg-pink-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'bg-gray-900',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: 'bg-red-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    color: 'bg-amber-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
    ),
  },
  {
    id: 'image_prompt',
    name: 'Image Prompt',
    color: 'bg-violet-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
    ),
  },
];

function MarkdownContent({ content }) {
  return (
    <div className="prose-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-gray-500 hover:text-gray-700 hover:bg-surface-50 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-accent-emerald" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('facebook');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('rendered');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(id);
      setProject(response.data);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const downloadContent = (platform, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.product_name}_${platform}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message="Loading project..." />;

  if (error || !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-50">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getContent = (tab) => {
    if (tab === 'image_prompt') return project.content?.creative?.image_prompt || 'No content generated';
    return project.content?.content?.[tab] || 'No content generated';
  };

  const currentTab = tabs.find((t) => t.id === activeTab);
  const currentContent = getContent(activeTab);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 animate-fade-in">
        {/* Back + header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.product_name}</h1>
          <p className="text-sm text-gray-500 max-w-2xl">{project.product_description}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
            <span>
              <span className="font-medium text-gray-500">Audience:</span> {project.target_audience}
            </span>
            <span>
              <span className="font-medium text-gray-500">Created:</span>{' '}
              {new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar tabs */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
              <div className="p-3 space-y-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-brand-50 text-brand-700 shadow-soft'
                        : 'text-gray-600 hover:bg-surface-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg ${tab.color} text-white flex items-center justify-center shrink-0`}>
                      {tab.icon}
                    </span>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div className="space-y-6">
            {/* Content card */}
            <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-surface-200 bg-surface-50/50">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-md ${currentTab.color} text-white flex items-center justify-center`}>
                    {currentTab.icon}
                  </span>
                  <h2 className="text-sm font-semibold text-gray-900">{currentTab.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex rounded-lg border border-surface-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode('rendered')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        viewMode === 'rendered'
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-500 hover:bg-surface-50'
                      }`}
                    >
                      Rendered
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-3 py-1.5 text-xs font-medium border-l border-surface-200 transition-colors ${
                        viewMode === 'raw'
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-500 hover:bg-surface-50'
                      }`}
                    >
                      Raw
                    </button>
                  </div>
                  <CopyButton text={currentContent} />
                  <button
                    onClick={() => downloadContent(activeTab, currentContent)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-200 text-gray-500 hover:text-gray-700 hover:bg-surface-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>

              {/* Content body */}
              <div className="p-6 min-h-[300px]">
                {viewMode === 'rendered' ? (
                  <MarkdownContent content={currentContent} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-600 leading-relaxed bg-surface-50 rounded-xl p-5 border border-surface-200">
                    {currentContent}
                  </pre>
                )}
              </div>
            </div>

            {/* Research section */}
            {project.content?.research && (
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
                  <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-surface-200 bg-surface-50/50">
                    <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Audience Insights</h3>
                  </div>
                  <div className="p-6">
                    <MarkdownContent content={project.content.research.audience_insights} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
                  <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-surface-200 bg-surface-50/50">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Competitor Analysis</h3>
                  </div>
                  <div className="p-6">
                    <MarkdownContent content={project.content.research.competitor_analysis} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
