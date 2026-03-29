import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function LandingNav() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-50 shadow-sm"
    >
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-fire-gradient flex items-center justify-center shadow-lg">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">Bnoy</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/profile"><User className="w-4 h-4 mr-1.5" /> Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
              <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-fire-gradient text-primary-foreground text-xs font-heading font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-fire-gradient border-0 rounded-xl shadow-lg">
                <Link to="/signup">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
