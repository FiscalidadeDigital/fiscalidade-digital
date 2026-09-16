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
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#e9e7ff] border-t-[#5146e5]" />

        <p className="mt-4 text-sm text-[#7180a2]">
          A redireccionar...
        </p>
      </div>
    </div>
  );
}