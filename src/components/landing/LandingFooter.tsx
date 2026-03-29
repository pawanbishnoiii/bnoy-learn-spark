import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function LandingFooter() {
  const { user } = useAuthStore();

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-fire-gradient flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">Bnoy</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">Modern MCQ learning platform for competitive exams in India.</p>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Powered by</span>
              <span className="font-semibold text-foreground">Razorpay</span>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Platform</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link to="/courses" className="block hover:text-primary transition-colors">Courses</Link>
              <Link to={user ? '/dashboard' : '/signup'} className="block hover:text-primary transition-colors">{user ? 'Dashboard' : 'Sign Up'}</Link>
              {user && <Link to="/billing" className="block hover:text-primary transition-colors">Billing</Link>}
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Features</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <p>Mock Tests</p><p>Daily Challenges</p><p>Leaderboard</p><p>Test Series</p>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Support</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link to={user ? '/help' : '#'} className="block hover:text-primary transition-colors">Help Center</Link>
              <p>Contact Us</p><p>Privacy Policy</p><p>Terms of Service</p>
            </div>
          </div>
        </div>
        <div className="border-t mt-10 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Bnoy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
