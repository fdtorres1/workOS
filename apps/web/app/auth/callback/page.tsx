'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      
      // Check for hash fragments (client-side tokens)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Check for query params (server-side tokens)
      const tokenHash = searchParams.get('token_hash');
      const queryType = searchParams.get('type');
      const next = searchParams.get('next') || '/dashboard';

      if (accessToken && refreshToken) {
        // Handle hash-based tokens (most common for email confirmation)
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          router.push(`/login?error=session_failed`);
          return;
        }

        if (data.session && data.user) {
          // Ensure user has an organization (in case org creation failed during signup)
          // Wait for this to complete before redirecting
          try {
            const orgCheck = await fetch('/api/auth/ensure-org', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!orgCheck.ok) {
              const errorData = await orgCheck.json().catch(() => ({}));
              console.error('Failed to ensure organization exists:', errorData);
              router.push(`/login?error=org_creation_failed`);
              return;
            }
            
            // Wait a bit to ensure the database transaction is committed
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error checking organization:', err);
            router.push(`/login?error=org_check_failed`);
            return;
          }
          
          // Use full page reload to ensure server-side can read the cookies
          window.location.href = next;
        }
      } else if (tokenHash && queryType) {
        // Handle query-based tokens (fallback)
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: queryType as 'signup' | 'email' | 'recovery',
        });

        if (error) {
          console.error('OTP verification error:', error);
          router.push(`/login?error=verification_failed`);
          return;
        }

        if (data.session && data.user) {
          // Ensure user has an organization (in case org creation failed during signup)
          // Wait for this to complete before redirecting
          try {
            const orgCheck = await fetch('/api/auth/ensure-org', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (!orgCheck.ok) {
              const errorData = await orgCheck.json().catch(() => ({}));
              console.error('Failed to ensure organization exists:', errorData);
              router.push(`/login?error=org_creation_failed`);
              return;
            }
            
            // Wait a bit to ensure the database transaction is committed
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error checking organization:', err);
            router.push(`/login?error=org_check_failed`);
            return;
          }
          
          // Use full page reload to ensure server-side can read the cookies
          window.location.href = next;
        }
      } else {
        // No tokens found, redirect to login
        router.push('/login?error=invalid_callback');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Confirming your email...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we verify your account.</p>
      </div>
    </div>
  );
}

