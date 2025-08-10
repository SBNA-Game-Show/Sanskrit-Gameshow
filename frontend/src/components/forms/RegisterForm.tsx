import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/auth';
import { RegisterCredentials, RegisterResponse } from '../../types/auth';
import { ROUTES } from '../../utils/constants';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterCredentials & { confirmPassword: string }>({
    username: '',
    password: '',
    role: 'Player',
    confirmPassword: '',
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const dark = JSON.parse(localStorage.getItem('darkMode') || 'false');
    setIsDarkMode(dark);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      setIsLoading(true);
      const payload: RegisterCredentials = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };
      const res = await API.post<RegisterResponse>('/register', payload);
      setSuccess(res.data.message || 'Registration successful');
      setTimeout(() => navigate(ROUTES.LOGIN), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 transition-all duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-yellow-100'}`}>
      <div className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-red-600'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
            </svg>
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold">Sanskrit Shabd Samvad</h1>
            <p className="text-xs opacity-90">Interactive Team Quiz Game</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-400'}`} aria-label="Toggle dark mode">
          {isDarkMode ? (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md mt-16">
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
              🎮
            </div>
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-red-700'}`}>Create Account</h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Join the quiz competition</p>
        </div>

        <div className={`rounded-2xl shadow-2xl p-8 transition-all duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Username</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-700 placeholder-gray-500'}`} placeholder="Enter username" required />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-700 placeholder-gray-500'}`} placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3.5 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}>
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-700 placeholder-gray-500'}`} placeholder="Confirm password" required />
            </div>

            <div>
              <label htmlFor="role" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                <option value="Player">Player</option>
                <option value="Host">Host</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <a href={ROUTES.LOGIN} className="text-red-600 hover:text-red-500 font-medium transition-colors">
                Login here
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>© 2025 Quiz Game • Developed for Educational Purposes</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
