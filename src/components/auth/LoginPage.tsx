'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('yatangrao215@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  // Logout handler for future use
  // const handleLogout = () => {
  //   localStorage.removeItem('isLoggedIn');
  //   localStorage.removeItem('userEmail');
  //   setEmail('yatangrao215@gmail.com');
  //   setPassword('');
  // };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple mock authentication for now
    if (email && password) {
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // For demo purposes, accept any email/password combination
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        router.push('/dashboard');
      }, 1000);
    } else {
      setError('Please enter both email and password');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple mock registration for now
    if (email && password) {
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // For demo purposes, accept any email/password combination
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        router.push('/dashboard');
      }, 1000);
    } else {
      setError('Please enter both email and password');
      setIsLoading(false);
    }
  };

  if (showSignup) {
    return (
      <div 
        className="min-h-screen flex relative"
        style={{
          backgroundImage: 'url(/images/truck_background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Welcome text overlay - Desktop only */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="relative z-10 p-12 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Welcome to Myrrh</h1>
            <p className="text-lg text-white drop-shadow-md">Streamline your logistics operations with our comprehensive supply chain platform.</p>
          </div>
        </div>

        {/* Right side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Sign up</h2>
              <p className="mt-2 text-sm text-gray-300">
                Welcome to our logistics supply chain platform.<br />
                Register as a member to experience.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSignup}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    E-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-white">
                  I agree to the terms of service
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-300">
                  Already a member?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="font-medium text-orange-400 hover:text-orange-300"
                  >
                    Sign in
                  </button>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex relative"
      style={{
        backgroundImage: 'url(/images/truck_background2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Welcome text overlay - Desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Welcome to Myrrh</h1>
          <p className="text-lg text-white drop-shadow-md">Streamline your logistics operations with our comprehensive supply chain platform.</p>
        </div>
      </div>

       {/* Right side - Login Form */}
       <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
         <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/10">
           <div className="text-center">
             <h2 className="text-3xl font-bold text-white">Sign in</h2>
             <p className="mt-2 text-sm text-gray-300">
               Welcome back to our logistics supply chain platform.
             </p>
           </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
             <div className="space-y-4">
               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-white">
                   E-mail
                 </label>
                 <input
                   id="email"
                   name="email"
                   type="email"
                   required
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                   placeholder="yatangrao215@gmail.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                 />
               </div>

               <div>
                 <label htmlFor="password" className="block text-sm font-medium text-white">
                   Password
                 </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-orange-400 hover:text-orange-300">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-black to-orange-600 hover:from-gray-800 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-300">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="font-medium text-orange-400 hover:text-orange-300"
                >
                  Sign up
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
