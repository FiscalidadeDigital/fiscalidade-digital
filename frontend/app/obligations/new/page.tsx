'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewObligationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/obligations');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-fd-accent-soft border-t-fd-primary" />

        <p className="mt-4 text-sm text-[var(--fd-text-muted)]">
          A redireccionar...
        </p>
      </div>
    </div>
  );
}