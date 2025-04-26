import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import BottomNavigation from './BottomNavigation';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Collapse sidebar by default on mobile
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  if (!isAuthenticated) return null;

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-white",
      !isMounted && "opacity-0",
      isMounted && "opacity-100 transition-opacity duration-500"
    )}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className={cn(
        "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
        isMobile ? (sidebarCollapsed ? 'pl-0' : 'pl-0 md:pl-64') : (sidebarCollapsed ? 'pl-16' : 'pl-64'),
        "p-4 md:p-6"
      )}>
        <div className="max-w-7xl mx-auto">
          {isMobile && (
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mb-4 -ml-2"
            >
              <Menu size={24} />
            </Button>
          )}
          <div className="animate-fade-in space-y-6">
            <Outlet />
          </div>
        </div>
        {/* إضافة Toaster للإشعارات لتحسين تجربة المستخدم */}
        <Toaster position="top-center" richColors closeButton />
        {/* شريط تنقل سفلي يظهر فقط على الجوال */}
        {isMobile && <BottomNavigation />}
      </main>
    </div>
  );
}
