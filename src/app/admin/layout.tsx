
import type { Metadata } from 'next';
import AdminGuard from '@/components/auth/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Panel - DiscussZone',
  description: 'Manage DiscussZone application',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-8rem)]"> {/* Adjust min-height as needed */}
        <AdminSidebar />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
