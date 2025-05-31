// components/layout/LayoutWrapper.tsx (Server Component)
import { AuthServerUtils } from '@/utils/auth.server';
import ClientLayoutContent from './ClientLayoutContent';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Get auth state from cookies (server-side)
  const user = AuthServerUtils.getCurrentUser();
  const isAuthenticated = AuthServerUtils.isAuthenticated();

  return (
    <ClientLayoutContent 
      initialUser={user} 
      initialIsAuthenticated={isAuthenticated}
    >
      {children}
    </ClientLayoutContent>
  );
}