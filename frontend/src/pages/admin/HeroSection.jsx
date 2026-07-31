import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import AdminLayout from '../../components/AdminLayout';

const HeroSection = () => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    secondaryCtaText: '',
    secondaryCtaLink: '',
    demoVideoUrl: '',
    demoVideoTitle: '',
    demoVideoDescription: '',
    offerText: '',
    showOffer: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHeroSection();
  }, []);

  const fetchHeroSection = async () => {
    try {
      const response = await adminAPI.getHeroSection();
      const hero = response.data.data.heroSection;
      setFormData({
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        ctaText: hero.ctaText,
        ctaLink: hero.ctaLink,
        secondaryCtaText: hero.secondaryCtaText,
        secondaryCtaLink: hero.secondaryCtaLink,
        demoVideoUrl: hero.demoVideoUrl || '',
        demoVideoTitle: hero.demoVideoTitle || 'Welcome to SHRI Educational World',
        demoVideoDescription: hero.demoVideoDescription || '',
        offerText: hero.offerText,
        showOffer: hero.showOffer
      });
    } catch (error) {
      console.error('Error fetching hero section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminAPI.updateHeroSection(formData);
      toast.success('Hero section updated successfully');
    } catch (error) {
      toast.error('Failed to update hero section');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Hero Section Settings
        </h1>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="input-field"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary CTA Link
                </label>
                <input
                  type="text"
                  name="ctaLink"
                  value={formData.ctaLink}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary CTA Text
                </label>
                <input
                  type="text"
                  name="secondaryCtaText"
                  value={formData.secondaryCtaText}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary CTA Link
                </label>
                <input
                  type="text"
                  name="secondaryCtaLink"
                  value={formData.secondaryCtaLink}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Demo Video Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Demo Video Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Demo Video URL (YouTube Embed URL)
                  </label>
                  <input
                    type="text"
                    name="demoVideoUrl"
                    value={formData.demoVideoUrl}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    className="input-field"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enter YouTube embed URL. Example: https://www.youtube.com/embed/dQw4w9WgXcQ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Title
                  </label>
                  <input
                    type="text"
                    name="demoVideoTitle"
                    value={formData.demoVideoTitle}
                    onChange={handleChange}
                    placeholder="Welcome to SHRI Educational World"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Description
                  </label>
                  <textarea
                    name="demoVideoDescription"
                    value={formData.demoVideoDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe what students will learn from this demo video..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Offer Text
              </label>
              <input
                type="text"
                name="offerText"
                value={formData.offerText}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="showOffer"
                checked={formData.showOffer}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Offer Banner
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default HeroSection;
