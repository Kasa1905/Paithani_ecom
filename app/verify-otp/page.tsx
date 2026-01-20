'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './verifyOtp.module.css';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [otp, setOtp] = useState('');
  const [otpType] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Redirect if no userId
  useEffect(() => {
    if (!userId) {
      router.push('/register');
    }
  }, [userId, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp, otpType }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login and redirect
        router.push('/');
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResending(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otpType }),
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        setOtp('');
        alert(`OTP resent to your ${otpType}`);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!userId) {
    return <div className={styles.redirect}>Redirecting...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Verify Your Email</h1>
      <p className={styles.infoText}>
        We've sent a 6-digit OTP to{email ? ` ${email}` : ' your email'}
      </p>

      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div className={styles.field}>
          <label className={styles.label}>
            Enter OTP *
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className={styles.input}
          />
          <small className={styles.helperText}>6-digit code (check spam folder if not received)</small>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className={styles.submitBtn}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className={styles.resendWrapper}>
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resending}
          className={styles.resendBtn}
        >
          {resending ? 'Resending...' : 'Didn\'t receive OTP? Resend'}
        </button>
      </div>

      <p className={styles.backLink}>
        <Link href="/login" className={styles.link}>
          Back to Login
        </Link>
      </p>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className={styles.fallback}>Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
