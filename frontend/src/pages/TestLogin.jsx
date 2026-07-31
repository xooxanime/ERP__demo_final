import { useState } from 'react';
import axios from 'axios';

const TestLogin = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing login with:', {
        email: 'admin@ca.com',
        password: 'admin123',
        url: `${import.meta.env.VITE_API_URL}/auth/login`
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          email: 'admin@ca.com',
          password: 'admin123'
        }
      );

      console.log('Response:', response.data);
      setResult({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        error: error.response?.data || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Login Test
        </h1>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>API URL:</strong> {import.meta.env.VITE_API_URL}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Email:</strong> admin@ca.com
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Password:</strong> admin123
          </p>
        </div>

        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Admin Login'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            <h3 className="font-bold mb-2">
              {result.success ? '✅ Success!' : '❌ Failed!'}
            </h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-primary-600 hover:text-primary-500">
            ← Back to Login Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
