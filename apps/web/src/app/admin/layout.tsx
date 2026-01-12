/**
 * Admin Layout
 * Wraps all /admin routes with sidebar navigation and route protection
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getChildSession } from '@/lib/actions/profile-selection';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Require parent authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Block access if a child session is active
  const childSession = await getChildSession();
  if (childSession) {
    // Child is logged in - redirect back to child view
    if (childSession.uiMode === 'TODDLER') {
      redirect('/child/toddler');
    } else {
      redirect('/child/explorer');
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area - responsive margin based on sidebar */}
      <main className="flex-1 transition-all duration-300" style={{ marginLeft: '256px' }}>
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
