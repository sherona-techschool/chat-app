import React, { useState, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ForgotPasswordModal
// Step 1 → Enter email → sends OTP
// Step 2 → Enter 6-digit OTP (individual boxes)
// Step 3 → Enter new password + confirm
// ─────────────────────────────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [step,         setStep]         = useState(1); // 1 | 2 | 3
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState(['', '', '', '', '', '']);
  const [newPassword,  setNewPassword]  = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [resendTimer,  setResendTimer]  = useState(0);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const API = import.meta.env.VITE_API_URL;

  // ── STEP 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Invalid email format.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setStep(2);
      setResendTimer(60); // 60s cooldown before allowing resend
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password ───────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || !confirmPass) { setError('Please fill in both fields.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPass) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccess('Password reset successfully! You can now log in.');
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box keyboard handling ────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // numbers only
    const next = [...otp];
    next[index] = value.slice(-1);   // only last digit
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text   = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = text.split('');
    const next   = [...otp];
    digits.forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>

        {/* Close button */}
        <button style={S.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Step indicators */}
        <div style={S.stepRow}>
          {[1, 2, 3].map(n => (
            <React.Fragment key={n}>
              <div style={{ ...S.stepDot, background: step >= n ? '#0066ff' : '#e2e8f0' }}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div style={{ ...S.stepLine, background: step > n ? '#0066ff' : '#e2e8f0' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: Email ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={S.iconWrap}>📧</div>
            <h2 style={S.title}>Forgot Password?</h2>
            <p style={S.subtitle}>Enter your email and we'll send you a 6-digit OTP.</p>

            {error   && <div style={S.error}>{error}</div>}

            <form onSubmit={handleSendOtp} style={S.form}>
              <div style={S.fieldWrap}>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={S.input}
                  autoFocus
                />
              </div>
              <button type="submit" style={S.btn} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={S.iconWrap}>🔐</div>
            <h2 style={S.title}>Enter OTP</h2>
            <p style={S.subtitle}>
              We sent a 6-digit code to <strong>{email}</strong>. Check your inbox.
            </p>

            {error   && <div style={S.error}>{error}</div>}

            <form onSubmit={handleVerifyOtp} style={S.form}>
              {/* 6 individual OTP boxes */}
              <div style={S.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      ...S.otpBox,
                      borderColor: digit ? '#0066ff' : '#e2e8f0',
                      background:  digit ? '#f0f7ff' : '#fff',
                    }}
                  />
                ))}
              </div>

              <button type="submit" style={S.btn} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
            </form>

            {/* Resend */}
            <p style={S.resendRow}>
              Didn't receive it?{' '}
              <span
                onClick={handleResend}
                style={{
                  ...S.resendLink,
                  opacity: resendTimer > 0 ? 0.4 : 1,
                  cursor:  resendTimer > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </span>
            </p>

            <p style={S.backLink} onClick={() => { setStep(1); setError(''); }}>← Change email</p>
          </>
        )}

        {/* ── STEP 3: New Password ───────────────────────────────────── */}
        {step === 3 && (
          <>
            <div style={S.iconWrap}>🔒</div>
            <h2 style={S.title}>Set New Password</h2>
            <p style={S.subtitle}>Choose a strong password you'll remember.</p>

            {error   && <div style={S.error}>{error}</div>}
            {success && <div style={S.successMsg}>{success}</div>}

            {!success && (
              <form onSubmit={handleResetPassword} style={S.form}>
                <div style={S.fieldWrap}>
                  <label style={S.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={S.input}
                    autoFocus
                  />
                </div>
                <div style={S.fieldWrap}>
                  <label style={S.label}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repeat your password"
                    style={S.input}
                  />
                  {/* Live match indicator */}
                  {confirmPass && (
                    <span style={{
                      fontSize: 12, marginTop: 4, display: 'block',
                      color: newPassword === confirmPass ? '#10b981' : '#ef4444',
                    }}>
                      {newPassword === confirmPass ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  )}
                </div>
                <button type="submit" style={S.btn} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password →'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  overlay:    { position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', display:'flex', justifyContent:'center', alignItems:'center', padding:16 },
  modal:      { position:'relative', background:'#fff', borderRadius:20, padding:'40px 36px 36px', width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,0.18)', animation:'slideUp .25s ease' },
  closeBtn:   { position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#94a3b8', lineHeight:1, padding:4 },

  // Step indicator
  stepRow:    { display:'flex', justifyContent:'center', alignItems:'center', gap:0, marginBottom:24 },
  stepDot:    { width:28, height:28, borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, transition:'background .3s' },
  stepLine:   { width:40, height:2, transition:'background .3s' },

  iconWrap:   { fontSize:40, textAlign:'center', marginBottom:12 },
  title:      { margin:'0 0 6px', fontSize:22, fontWeight:700, color:'#1e293b', textAlign:'center' },
  subtitle:   { margin:'0 0 24px', fontSize:14, color:'#64748b', textAlign:'center', lineHeight:1.5 },

  error:      { background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16, textAlign:'center' },
  successMsg: { background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16, textAlign:'center' },

  form:       { display:'flex', flexDirection:'column', gap:16 },
  fieldWrap:  { display:'flex', flexDirection:'column', gap:6 },
  label:      { fontSize:13, fontWeight:600, color:'#374151' },
  input:      { padding:'11px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:15, outline:'none', transition:'border .2s', width:'100%', boxSizing:'border-box' },
  btn:        { padding:'13px', borderRadius:10, background:'#0066ff', color:'#fff', border:'none', fontSize:15, fontWeight:600, cursor:'pointer', transition:'opacity .2s' },

  // OTP boxes
  otpRow:     { display:'flex', justifyContent:'center', gap:10 },
  otpBox:     { width:46, height:54, borderRadius:10, border:'2px solid #e2e8f0', textAlign:'center', fontSize:22, fontWeight:700, color:'#1e293b', outline:'none', transition:'border-color .2s, background .2s' },

  resendRow:  { textAlign:'center', fontSize:13, color:'#64748b', marginTop:4 },
  resendLink: { color:'#0066ff', fontWeight:600, textDecoration:'none', transition:'opacity .2s' },
  backLink:   { textAlign:'center', fontSize:13, color:'#94a3b8', cursor:'pointer', marginTop:8 },
};

export default ForgotPasswordModal;