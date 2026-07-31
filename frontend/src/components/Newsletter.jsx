import { useState } from 'react';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
      
      // Reset after 3 seconds
      setTimeout(() => setSubscribed(false), 3000);
    }, 1000);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <FiMail className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Updated with Latest News
          </h2>
          <p className="text-xl text-blue-100">
            Subscribe to our newsletter for exam updates, study tips, and exclusive offers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                disabled={loading || subscribed}
              />
            </div>
            <button
              type="submit"
              disabled={loading || subscribed}
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {subscribed ? (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <span>{loading ? 'Subscribing...' : 'Subscribe'}</span>
              )}
            </button>
          </div>
          <p className="text-sm text-blue-100 mt-4 text-center">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
