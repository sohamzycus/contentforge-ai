import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function NewProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    target_audience: '',
    unique_selling_points: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUSPChange = (index, value) => {
    const usps = [...formData.unique_selling_points];
    usps[index] = value;
    setFormData({ ...formData, unique_selling_points: usps });
  };

  const addUSP = () => {
    setFormData({ ...formData, unique_selling_points: [...formData.unique_selling_points, ''] });
  };

  const removeUSP = (index) => {
    setFormData({
      ...formData,
      unique_selling_points: formData.unique_selling_points.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleaned = {
      ...formData,
      unique_selling_points: formData.unique_selling_points.filter((u) => u.trim()),
    };
    if (cleaned.unique_selling_points.length === 0) {
      setError('Please add at least one unique selling point');
      return;
    }
    setLoading(true);
    try {
      const response = await projectsAPI.create(cleaned);
      navigate(`/projects/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-50">
        <LoadingSpinner message="Generating your marketing content across all platforms... This may take 1-2 minutes." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50 py-8 lg:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-card animate-fade-in">
          <div className="p-8 border-b border-surface-200">
            <h1 className="text-xl font-bold text-gray-900">New Project</h1>
            <p className="mt-1 text-sm text-gray-500">
              Describe your product and we'll generate tailored marketing content for every platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                placeholder="e.g., Smart Water Bottle Pro"
              />
            </div>

            <div>
              <label htmlFor="product_description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Description
              </label>
              <textarea
                id="product_description"
                name="product_description"
                value={formData.product_description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition resize-none"
                placeholder="Describe your product, its features, and key benefits..."
              />
            </div>

            <div>
              <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Audience
              </label>
              <textarea
                id="target_audience"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition resize-none"
                placeholder="e.g., Health-conscious professionals aged 25-40 who exercise regularly..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Unique Selling Points
              </label>
              <div className="space-y-2">
                {formData.unique_selling_points.map((usp, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={usp}
                      onChange={(e) => handleUSPChange(index, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                      placeholder={`USP #${index + 1}`}
                    />
                    {formData.unique_selling_points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUSP(index)}
                        className="px-3 py-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 border border-surface-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addUSP}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add another
              </button>
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-surface-100 hover:bg-surface-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-soft hover:shadow-glow transition-all"
              >
                Generate Content
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewProject;
