import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeSlash,
  Check,
  WarningCircle
} from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

interface AuthPageProps {
  defaultView?: 'register' | 'login';
}

const AuthPage: React.FC<AuthPageProps> = ({ defaultView = 'register' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, error, clearError, isAuthenticated } = useAuth();

  const [isRegister, setIsRegister] = useState(() => {
    // Priority: location.state > URL params > defaultView
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'login') return false;
    if (mode === 'register') return true;
    return defaultView === 'register';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Navigate on successful auth
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard/home');
    }
  }, [isAuthenticated, navigate]);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState(''); // For login (email or username)
  const [password, setPassword] = useState('');

  // Check URL params or navigation state for view mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const stateView = location.state?.view;

    // Defer to avoid synchronous setState warning
    setTimeout(() => {
      if (mode === 'login' || stateView === 'login') {
        setIsRegister(false);
      } else if (mode === 'register' || stateView === 'register') {
        setIsRegister(true);
      }
    }, 0);
  }, [location.search, location.state]);

  // Derive password strength
  const getPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (!isRegister || !pwd) return 'weak';

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (pwd.length >= 8) {
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /\d/.test(pwd);
      const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

      const passed = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

      if (passed >= 3 && pwd.length >= 10) strength = 'strong';
      else if (passed >= 2) strength = 'medium';
    }
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleBack = () => {
    navigate(-1);
  };

  const toggleView = (view: 'register' | 'login') => {
    setIsRegister(view === 'register');
    clearError();
    // Reset forms
    setUsername('');
    setEmail('');
    setIdentifier('');
    setPassword('');

    const newUrl = `/auth?mode=${view}`;
    window.history.replaceState(null, '', newUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isRegister) {
      await register(username, email, password, rememberMe);
    } else {
      await login(identifier, password, rememberMe);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return 'text-[#EC2801] bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'weak': return 'text-gray-500 bg-gray-100';
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
    }
  };

  return (
    <div className="flex min-h-screen bg-white overflow-hidden font-sans">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-10 bg-white">
        {/* Header Navigation */}
        <div className="flex items-center justify-between p-6 lg:p-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 -mt-10">
          {/* Logo Section */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isRegister ? 'Join Quezia' : 'Welcome Back to Quezia'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isRegister ? 'Start your journey to exam mastery.' : 'Continue your exam preparation.'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="bg-gray-100 p-1 rounded-full flex mb-8 max-w-xs mx-auto w-full">
            <button
              onClick={() => toggleView('register')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${isRegister
                ? 'bg-[#EC2801] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Register
            </button>
            <button
              onClick={() => toggleView('login')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${!isRegister
                ? 'bg-[#EC2801] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Login
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-sm">
              <WarningCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Login */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => {/* TODO: Google OAuth */}}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {/* TODO: Implement Apple OAuth */}}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#000000] hover:bg-[#00000011] transition-all group"
            >
              <svg className="w-5 h-5 text-[#000000] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {/* TODO: Google OAuth */}}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Enter your username"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                {isRegister ? 'Email' : 'Email or Username'}
              </label>
              <input
                type={isRegister ? 'email' : 'text'}
                value={isRegister ? email : identifier}
                onChange={(e) => isRegister ? setEmail(e.target.value) : setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder={isRegister ? 'you@example.com' : 'Enter your email or username'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 8 : undefined}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#EC2801] focus:ring-2 focus:ring-red-100 outline-none transition-all text-gray-900 placeholder-gray-400 pr-24"
                  placeholder="••••••••"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isRegister && password && (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthLabel()} <Check className="w-3 h-3" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {isRegister && (
                <p className="mt-1.5 text-xs text-gray-400 ml-1">
                  Must contain uppercase, lowercase, and number
                </p>
              )}
            </div>

            {isRegister ? (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border ${rememberMe ? 'bg-[#EC2801] border-[#EC2801]' : 'border-gray-300'} flex items-center justify-center transition-colors`}
                >
                  {rememberMe && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm text-gray-600">Remember me</span>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {/* TODO: Implement password reset */}}
                  className="text-sm text-gray-600 hover:text-[#EC2801] font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EC2801] text-white py-3.5 rounded-xl font-medium hover:bg-red-700 active:scale-[0.98] transition-all mt-6 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {isRegister ? 'Start your preparation' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => toggleView(isRegister ? 'login' : 'register')}
              className="font-medium text-[#EC2801] hover:underline"
            >
              {isRegister ? 'Log in' : 'Register'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Dark Placeholder with Bezel Curves */}
      <div className="hidden lg:block lg:w-[55%] relative bg-gray-50">
        {/* Main Dark Container with Bezel Curves */}
        <div className="absolute inset-0 bg-[#EC2801] rounded-l-[40px] overflow-hidden shadow-2xl">
          {/* Top Bezel Curve Decoration */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#EC2801] rounded-full opacity-50 blur-3xl"></div>

          {/* Content Area - Placeholder */}
          <div className="h-full flex flex-col items-center justify-center text-white p-12 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-light text-white/90">
                Your exam preparation<br />
                starts <span className="font-serif italic text-white">here</span>
              </h2>
              <p className="text-white/60 max-w-sm mx-auto">
                Discover the best preparation tools and insights for your competitive exams.
              </p>
            </div>
          </div>

          {/* Bottom Bezel Curve Decoration */}
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-800 rounded-full opacity-50 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;