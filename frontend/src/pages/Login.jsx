import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Login = () => {
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setUserId(res.data.userId);
      setUserStatus(res.data.status);
      setStep(2);
      toast.success('OTP sent! Check your server console.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ userId, otp });
      login(res.data.user, res.data.token);

      if (res.data.user.status === 'pending') {
        setShowApprovalModal(true);
      } else {
        redirectByRole(res.data.user.role);
        toast.success(`Welcome back, ${res.data.user.name}! 🎉`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    const routes = { donor: '/donor', ngo: '/ngo', volunteer: '/volunteer', admin: '/admin' };
    navigate(routes[role] || '/');
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ userId });
      toast.success('OTP resent to your console!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        {['🍎','🥗','🍜','🍕','🥘','🍞','🥑','🍇'].map((e, i) => (
          <span key={i} className="absolute text-5xl animate-pulse-slow" style={{
            top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%`,
            animationDelay: `${i * 0.5}s`
          }}>{e}</span>
        ))}
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl items-center justify-center mb-4 shadow-xl">
            <span className="text-4xl">🍽</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Food Bridge</h1>
          <p className="text-white/80 mt-1">Bridging Hearts, Filling Plates</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden">
          {/* Stepper */}
          <div className="flex">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1 ${step >= s ? 'bg-brand-400' : 'bg-white/20'} transition-all duration-500`} />
            ))}
          </div>

          <div className="p-8">
            {step === 1 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your account</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Your password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span> : 'Continue →'}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-600 font-semibold hover:underline">Register now</Link>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify OTP</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Check the <strong>server console/terminal</strong> for your 6-digit OTP
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="input-label">6-Digit OTP</label>
                    <input
                      type="text"
                      className="input text-center text-2xl tracking-widest font-mono"
                      placeholder="••••••"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</span> : 'Verify & Login'}
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4 text-sm">
                  <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Back</button>
                  <button onClick={handleResendOTP} className="text-brand-600 hover:underline">Resend OTP</button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">© 2026 Food Bridge. Making the world better, one meal at a time.</p>
      </div>

      {/* Admin approval modal */}
      <Modal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} title="Account Pending Approval" size="sm">
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is currently <strong className="text-yellow-600">under admin review</strong>. 
            You'll be notified once approved and can access all features.
          </p>
          <button onClick={() => setShowApprovalModal(false)} className="btn-primary w-full">OK, Got it</button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;
