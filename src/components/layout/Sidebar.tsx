import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Trash2, 
  Bell, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  Globe,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useClients } from '@/contexts/ClientContext';

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
  onClick?: () => void;
  badge?: number;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, active, onClick, badge }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent relative group',
        active && 'bg-sidebar-primary text-sidebar-primary-foreground'
      )}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className={cn("text-sm font-medium transition-opacity duration-200", label ? "opacity-100" : "opacity-0")}>{label}</span>
      {badge && badge > 0 && (
        <Badge variant="secondary" className="ml-auto bg-red-500 text-white absolute right-2">
          {badge}
        </Badge>
      )}
      <span className={cn(
        "absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity",
        badge && badge > 0 ? "hidden" : ""
      )}>
        <ChevronRight size={16} className="text-sidebar-foreground/50" />
      </span>
    </Link>
  );
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated, logout, user } = useAuth();
  const { clients } = useClients();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };
  
  const isActive = (path: string) => location.pathname === path;

  // حساب عدد الإشعارات
  const notificationsCount = React.useMemo(() => {
    if (!clients.length) return 0;
    
    const today = new Date();
    return clients.filter(client => {
      if (!client.completionDate) return false;
      const completionDate = new Date(client.completionDate);
      const diffTime = completionDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 10;
    }).length;
  }, [clients]);

  // --- Responsive mobile sidebar logic ---
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) return null;

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <>
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-sidebar border-b border-sidebar-border flex justify-between items-center px-4 py-2 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            title={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
          <h1 className="text-lg font-bold text-sidebar-foreground flex-1 text-center">{t('app.title')}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            title={t('language')}
          >
            <Globe size={20} />
          </Button>
        </div>
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-sidebar border-t border-sidebar-border flex justify-around items-center px-2 py-1 shadow-lg">
          <Link to="/dashboard"><LayoutDashboard size={22} className={isActive('/dashboard') ? 'text-blue-600' : 'text-sidebar-foreground'} /></Link>
          <Link to="/clients"><Users size={22} className={isActive('/clients') ? 'text-blue-600' : 'text-sidebar-foreground'} /></Link>
          <Link to="/add-client"><UserPlus size={22} className={isActive('/add-client') ? 'text-blue-600' : 'text-sidebar-foreground'} /></Link>
          <Link to="/notifications" className="relative"><Bell size={22} className={isActive('/notifications') ? 'text-blue-600' : 'text-sidebar-foreground'} />{notificationsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">{notificationsCount}</span>}</Link>
          <Link to="/profile"><User size={22} className={isActive('/profile') ? 'text-blue-600' : 'text-sidebar-foreground'} /></Link>
        </div>
        {/* Spacer for content */}
        <div className="h-12"></div>
        <div className="h-12"></div>
      </>
    );
  }

  return (
    <div className={cn(
      'h-screen flex flex-col bg-sidebar fixed z-10 transition-all duration-300 border-r border-sidebar-border shadow-lg',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="p-4 flex justify-between items-center border-b border-sidebar-border">
        {!collapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">{t('app.title')}</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          title={collapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      <div className="flex flex-col flex-1 py-4 px-3 gap-1 overflow-y-auto">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label={collapsed ? '' : t('sidebar.dashboard')}
          to="/dashboard"
          active={isActive('/dashboard')}
        />
        <NavItem
          icon={<Users size={20} />}
          label={collapsed ? '' : t('sidebar.clients')}
          to="/clients"
          active={isActive('/clients')}
        />
        <NavItem
          icon={<UserPlus size={20} />}
          label={collapsed ? '' : t('sidebar.addClient')}
          to="/add-client"
          active={isActive('/add-client')}
        />
        <NavItem
          icon={<Trash2 size={20} />}
          label={collapsed ? '' : t('sidebar.trash')}
          to="/trash"
          active={isActive('/trash')}
        />
        <NavItem
          icon={<Bell size={20} />}
          label={collapsed ? '' : t('sidebar.notifications')}
          to="/notifications"
          active={isActive('/notifications')}
          badge={notificationsCount}
        />
        <NavItem
          icon={<BarChart3 size={20} />}
          label={collapsed ? '' : t('sidebar.analytics')}
          to="/analytics"
          active={isActive('/analytics')}
        />
        
        {user && (user.role === 'admin' || user.role === 'superadmin') && (
          <NavItem
            icon={<Settings size={20} />}
            label={collapsed ? '' : t('sidebar.admin')}
            to="/admin"
            active={isActive('/admin')}
          />
        )}
        
        <NavItem
          icon={<User size={20} />}
          label={collapsed ? '' : 'الملف الشخصي'}
          to="/profile"
          active={isActive('/profile')}
        />
      </div>
      
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent mb-2"
        >
          <Globe size={20} />
          {!collapsed && <span>{t('language')}</span>}
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut size={20} />
              {!collapsed && <span>تسجيل الخروج</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من رغبتك في تسجيل الخروج؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>تأكيد</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
