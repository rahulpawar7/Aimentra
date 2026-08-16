'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { getPostLoginRedirect, buildLoginUrl } from '@/lib/auth-utils';
import { useAuthSession } from '@/hooks/useAuthSession';
import { BRAND } from '@/lib/brand';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const benefits = [
  '40+ expert business courses',
  'Learn in Hindi at your pace',
  'Earn verified certificates',
  'Join 50,000+ entrepreneurs',
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { register: registerUser, isLoading } = useAuthStore();
  const { isAuthenticated, authReady, user } = useAuthSession();

  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.replace(getPostLoginRedirect(user?.role, redirectTo));
    }
  }, [authReady, isAuthenticated, user, redirectTo, router]);

  const loginHref = buildLoginUrl(redirectTo);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    const result = await registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
    });

    if (result.success) {
      toast.success('Account created! Continuing…');
      const currentUser = useAuthStore.getState().user;
      router.push(getPostLoginRedirect(currentUser?.role, redirectTo));
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Left panel — benefits */}
      <div className="surface-dark relative hidden w-[42%] flex-col justify-center overflow-hidden bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-800)] px-8 py-12 lg:flex xl:px-12">
        <div style={{
          position: 'absolute', top: '-30%', right: '-30%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(212,165,58,0.18) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '48px' }}>
          <div style={{
            width: '44px', height: '44px', background: 'var(--gradient-brand)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={22} color="var(--navy-900)" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>
            {BRAND.nameUpper}
          </span>
        </Link>

        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2, color: 'white' }}>
          Start Your Business
          <br />
          <span style={{ color: 'var(--brand-400)' }}>Transformation</span>
        </h2>
        <p className="text-muted-on-dark" style={{ marginBottom: '40px', fontSize: '1rem', lineHeight: 1.6 }}>
          Join India&apos;s fastest growing business coaching platform. Learn from industry experts in Hindi.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {benefits.map((benefit) => (
            <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(212,165,58,0.15)', border: '1px solid rgba(212,165,58,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={14} color="var(--brand-400)" />
              </div>
              <span className="text-muted-on-dark" style={{ fontSize: '0.95rem' }}>{benefit}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '48px', padding: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', marginRight: '8px' }}>
              {['R', 'S', 'A', 'P'].map((initial, i) => (
                <div key={i} style={{
                  width: '32px', height: '32px', borderRadius: '50%', marginLeft: i > 0 ? '-8px' : 0,
                  background: `hsl(${38 + i * 12}, 55%, ${42 + i * 4}%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '700', color: 'white',
                  border: '2px solid var(--navy-800)',
                }}>
                  {initial}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>50,000+ entrepreneurs</p>
              <p className="text-muted-on-dark" style={{ fontSize: '0.75rem' }}>already transforming their business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px' }}>Create Account</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Free to start — upgrade anytime</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('name')} placeholder="Rahul Sharma" className="input-base" style={{ paddingLeft: '42px' }} />
              </div>
              {errors.name && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '5px' }}>{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('email')} type="email" placeholder="you@example.com" className="input-base" style={{ paddingLeft: '42px' }} />
              </div>
              {errors.email && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '5px' }}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Mobile Number <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('phone')} type="tel" placeholder="9876543210" className="input-base" style={{ paddingLeft: '42px' }} />
              </div>
              {errors.phone && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '5px' }}>{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" className="input-base" style={{ paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '5px' }}>{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" className="input-base" style={{ paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '5px' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-brand" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Creating Account...' : 'Create Free Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link href={loginHref} style={{ color: 'var(--brand-700)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--brand-700)', textDecoration: 'none' }}>Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--brand-700)', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
