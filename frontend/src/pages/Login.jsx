import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(searchParams.get('expired') ? 'Session expired. Please log in again.' : '');
  const [loading, setLoading] = useState(false);
  
  const [devOtp, setDevOtp] = useState(''); // Dev fallback display

  const demoAccounts = [
    { label: 'Fleet Manager', email: 'manager@waybound.com', pass: 'manager123' },
    { label: 'Safety Officer', email: 'safety@waybound.com', pass: 'safety123' },
    { label: 'Financial Analyst', email: 'finance@waybound.com', pass: 'finance123' },
    { label: 'Driver', email: 'driver@waybound.com', pass: 'driver123' }
  ];

  const handleDemoSelect = (demo) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError('');
    setInfoMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      setInfoMessage(result.data.message);
      if (result.data.devOtp) {
        setDevOtp(result.data.devOtp);
      }
    } else {
      setError(result.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    const result = await resendOtp(email);
    setLoading(false);

    if (result.success) {
      setInfoMessage(result.data.message);
      if (result.data.devOtp) {
        setDevOtp(result.data.devOtp);
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 chart-grid">
      <div className="w-full max-w-md bg-[#FAF7F0] border-2 border-primary hard-shadow p-8">
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-primary text-4xl mb-2">local_shipping</span>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase font-bold tracking-tight">Waybound Control</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Secure Industrial Operations</p>
        </div>

        {error && (
          <div className="bg-error-container border border-error text-on-error-container p-3 rounded-sm font-body-sm mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="bg-tertiary-container border border-tertiary text-on-tertiary-container p-3 rounded-sm font-body-sm mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">info</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Operator Email</label>
              <input
                type="email"
                required
                className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="operator@waybound.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">Access Password</label>
              <input
                type="password"
                required
                className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Request 2FA Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-center text-lg tracking-widest focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-on-surface-variant font-body-sm">
                Enter the OTP sent to your registered terminal email.
              </p>
            </div>

            {devOtp && (
              <div className="bg-secondary-fixed border border-secondary text-on-secondary-fixed-variant p-3 rounded-sm font-data-mono text-xs mb-2">
                <span className="font-bold">SYSTEM DEBUG:</span> Simulated code is <strong className="text-secondary select-all">{devOtp}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying Code...' : 'Access Control Room'}
            </button>

            <div className="flex justify-between items-center text-xs mt-4">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-primary hover:underline font-label-caps"
                disabled={loading}
              >
                ← Back to Password
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-secondary hover:underline font-label-caps"
                disabled={loading}
              >
                Resend OTP Code
              </button>
            </div>
          </form>
        )}

        {/* Demo select panel - extremely useful for judging/demoing */}
        {step === 'login' && (
          <div className="mt-8 pt-6 border-t border-outline-variant">
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase text-center mb-3">
              Operator Quick-Select (Demo Roles)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => handleDemoSelect(demo)}
                  className="bg-surface-container border border-outline-variant hover:bg-surface-container-high p-2 text-left rounded-sm transition-all duration-75"
                >
                  <p className="font-label-caps text-[10px] font-bold text-primary">{demo.label}</p>
                  <p className="font-data-mono text-[9px] text-on-surface-variant truncate">{demo.email}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
