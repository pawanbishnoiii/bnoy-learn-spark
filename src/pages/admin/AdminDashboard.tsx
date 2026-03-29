import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, HelpCircle, BarChart3, FileText, Target,
  Settings, DollarSign, CreditCard, Bell, Trophy, Flame, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [courses, subjects, topics, questions, profiles, attempts, purchases] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('topics').select('id', { count: 'exact', head: true }),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('user_purchases').select('id', { count: 'exact', head: true }),
      ]);
      return {
        courses: courses.count || 0, subjects: subjects.count || 0,
        topics: topics.count || 0, questions: questions.count || 0,
        students: profiles.count || 0, attempts: attempts.count || 0,
        purchases: purchases.count || 0,
      };
    },
  });

  const statCards = [
    { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, bg: 'bg-primary/8', color: 'text-primary' },
    { label: 'Subjects', value: stats?.subjects || 0, icon: FileText, bg: 'bg-accent/8', color: 'text-accent' },
    { label: 'Topics', value: stats?.topics || 0, icon: Target, bg: 'bg-warning/8', color: 'text-warning' },
    { label: 'Questions', value: stats?.questions || 0, icon: HelpCircle, bg: 'bg-success/8', color: 'text-success' },
    { label: 'Students', value: stats?.students || 0, icon: Users, bg: 'bg-primary/8', color: 'text-primary' },
    { label: 'Attempts', value: stats?.attempts || 0, icon: BarChart3, bg: 'bg-accent/8', color: 'text-accent' },
    { label: 'Purchases', value: stats?.purchases || 0, icon: CreditCard, bg: 'bg-success/8', color: 'text-success' },
  ];

  const quickLinks = [
    { title: 'Manage Courses', desc: 'Add/edit courses & test series', icon: BookOpen, url: '/admin/courses', bg: 'bg-primary/8', color: 'text-primary' },
    { title: 'Manage Subjects', desc: 'Organize subjects', icon: FileText, url: '/admin/subjects', bg: 'bg-accent/8', color: 'text-accent' },
    { title: 'Manage Topics', desc: 'Create topics', icon: Target, url: '/admin/topics', bg: 'bg-warning/8', color: 'text-warning' },
    { title: 'Manage Questions', desc: 'Add & import questions', icon: HelpCircle, url: '/admin/questions', bg: 'bg-success/8', color: 'text-success' },
    { title: 'User Management', desc: 'View & manage users', icon: Users, url: '/admin/users', bg: 'bg-primary/8', color: 'text-primary' },
    { title: 'Analytics', desc: 'Platform analytics', icon: BarChart3, url: '/admin/analytics', bg: 'bg-accent/8', color: 'text-accent' },
    { title: 'Leaderboard', desc: 'Manage rankings', icon: Trophy, url: '/leaderboard', bg: 'bg-warning/8', color: 'text-warning' },
    { title: 'Pricing Plans', desc: 'Subscription plans', icon: DollarSign, url: '/admin/pricing', bg: 'bg-success/8', color: 'text-success' },
    { title: 'Notifications', desc: 'Send notifications', icon: Bell, url: '/admin/notifications', bg: 'bg-primary/8', color: 'text-primary' },
    { title: 'Settings', desc: 'App settings & Razorpay', icon: Settings, url: '/admin/settings', bg: 'bg-accent/8', color: 'text-accent' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Admin Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {statCards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center`}>
                      <c.icon className={`w-5 h-5 ${c.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold">{c.value}</p>
                      <p className="text-[11px] text-muted-foreground">{c.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link, i) => (
              <motion.div key={link.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={link.url}>
                  <Card className="glass-card border-0 hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${link.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <link.icon className={`w-6 h-6 ${link.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-sm group-hover:text-primary transition-colors">{link.title}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
