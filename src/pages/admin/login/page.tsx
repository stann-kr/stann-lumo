import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Simple password check (will be replaced with D1 authentication later)
    if (password === 'admin123') {
      localStorage.setItem('admin_authenticated', 'true');
      navigate('/admin/home');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#c8b89a] font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#e8d5b0] tracking-wider mb-2">
            ADMIN ACCESS
          </h1>
          <p className="text-sm text-[#8a7560] tracking-widest">CONTENT MANAGEMENT SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm tracking-widest text-[#c8b89a]/70 mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-transparent border-b border-[#c8b89a]/30 py-3 px-1 text-[#e8d5b0] focus:outline-none focus:border-[#c8b89a] transition-colors duration-200"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[#c8b89a]/70 bg-[#c8b89a]/5 px-4 py-3 border border-[#c8b89a]/20">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#c8b89a]/10 hover:bg-[#c8b89a]/20 text-[#e8d5b0] py-4 px-6 transition-all duration-200 cursor-pointer border border-[#c8b89a]/30 hover:border-[#c8b89a]/50 whitespace-nowrap"
          >
            <span className="text-sm tracking-widest">ENTER ADMIN</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm tracking-widest text-[#c8b89a]/50 hover:text-[#c8b89a] transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            BACK TO SITE
          </button>
        </div>

        <div className="mt-12 p-4 bg-[#c8b89a]/5 border border-[#c8b89a]/10">
          <p className="text-xs text-[#8a7560] tracking-wider">
            <i className="ri-information-line mr-2"></i>
            Demo password: admin123
          </p>
          <p className="text-xs text-[#8a7560]/50 mt-2">
            This will be replaced with Cloudflare D1 authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;