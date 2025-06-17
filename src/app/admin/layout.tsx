
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Removed hasPersonalizablePizzas and isLoadingPizzaData states

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
      setIsAuthenticated(isLoggedIn);
      setIsLoadingAuth(false);

      if (!isLoggedIn && pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
      // Removed logic to fetch pizza data as it's no longer needed for sidebar state
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 fixed inset-y-0 z-50 hidden md:block">
        {/* Removed props from AdminSidebar as they are no longer needed */}
        <AdminSidebar />
      </aside>
      <main className="flex-1 md:pl-64">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
