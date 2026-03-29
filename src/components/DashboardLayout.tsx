import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard, BookOpen, Flame, Trophy, User, LogOut,
  BarChart3, Settings, Bookmark, Users, HelpCircle, DollarSign, Target, FileText, CreditCard, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import MobileBottomNav from '@/components/MobileBottomNav';
import NotificationBell from '@/components/NotificationBell';

const studentNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Courses', url: '/courses', icon: BookOpen },
  { title: 'Daily Challenge', url: '/daily-challenge', icon: Flame },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Bookmarks', url: '/bookmarks', icon: Bookmark },
  { title: 'Achievements', url: '/achievements', icon: Target },
  { title: 'Analytics', url: '/my-analytics', icon: BarChart3 },
  { title: 'Billing', url: '/billing', icon: CreditCard },
  { title: 'Help', url: '/help', icon: HelpCircle },
  { title: 'Doubts', url: '/doubts', icon: Bell },
  { title: 'Profile', url: '/profile', icon: User },
];

const adminNav = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Courses', url: '/admin/courses', icon: BookOpen },
  { title: 'Subjects', url: '/admin/subjects', icon: FileText },
  { title: 'Topics', url: '/admin/topics', icon: Target },
  { title: 'Questions', url: '/admin/questions', icon: HelpCircle },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Notifications', url: '/admin/notifications', icon: Bell },
  { title: 'Reports & Doubts', url: '/admin/reports', icon: HelpCircle },
  { title: 'Plans', url: '/admin/plans', icon: DollarSign },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

function AppSidebarContent() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNav : studentNav;

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border hidden md:flex">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-fire-gradient flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && <span className="font-heading text-lg font-bold">Bnoy</span>}
          </Link>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? 'Admin' : 'Menu'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Student'}</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="flex-shrink-0"><LogOut className="w-4 h-4" /></Button>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 glass sticky top-0 z-40">
            <SidebarTrigger className="mr-4 hidden md:flex" />
            <div className="md:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-fire-gradient flex items-center justify-center">
                  <Flame className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-heading text-base font-bold">Bnoy</span>
              </Link>
            </div>
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main className="flex-1 bg-background bg-grid pb-20 md:pb-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 md:p-6">
              {children}
            </motion.div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
