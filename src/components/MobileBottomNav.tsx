import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Trophy, User, HelpCircle, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const studentTabs = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Courses', icon: BookOpen, path: '/courses' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  { label: 'Doubts', icon: MessageSquare, path: '/doubts' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuthStore();

  // No bottom nav for admin
  if (isAdmin) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {studentTabs.map((tab) => {
          const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
