'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  buildLoginPath,
  getTenantRouteAccessState,
} from '@/lib/route-access';

function NeutralSessionState() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-sm text-slate-600"
    >
      <p>A confirmar o acesso…</p>
    </main>
  );
}

export default function TenantRouteGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    initialized,
    loading,
    isAuthenticated,
  } = useAuth();

  const accessState = getTenantRouteAccessState({
    pathname,
    initialized,
    loading,
    isAuthenticated,
  });

  useEffect(() => {
    if (accessState !== 'redirect') {
      return;
    }

    const intendedPath = typeof window === 'undefined'
      ? pathname
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;

    router.replace(buildLoginPath(intendedPath));
  }, [accessState, pathname, router]);

  if (accessState === 'public' || accessState === 'granted') {
    return children;
  }

  return <NeutralSessionState />;
}
