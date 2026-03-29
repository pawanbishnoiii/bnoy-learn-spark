import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookOpen, Target, Flame, Trophy, TrendingUp, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const statCards = [
  { label: 'Quizzes Taken', icon: BookOpen, key: 'totalQuizzes', color: 'text-primary' },
  { label: 'Accuracy', icon: Target, key: 'accuracy', color: 'text-success', suffix: '%' },
  { label: 'Daily Streak', icon: Flame, key: 'streak', color: 'text-accent' },
  { label: 'XP Points', icon: Trophy, key: 'xp', color: 'text-warning' },
];

export default function StudentDashboard() {
  const { user, profile } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['student-stats', user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('user_id', user!.id).eq('is_completed', true);
      const totalQuizzes = attempts?.length || 0;
      const totalCorrect = attempts?.reduce((s, a) => s + a.correct_answers, 0) || 0;
      const totalQuestions = attempts?.reduce((s, a) => s + a.total_questions, 0) || 0;
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      return { totalQuizzes, accuracy, streak: profile?.daily_streak || 0, xp: profile?.xp_points || 0 };
    },
    enabled: !!user,
  });

  const { data: recentAttempts } = useQuery({
    queryKey: ['recent-attempts', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_attempts').select('*, topics(title, subjects(title))').eq('user_id', user!.id).eq('is_completed', true).order('completed_at', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: courses } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*').eq('is_published', true).limit(6);
      return data || [];
    },
  });

  const vals: Record<string, number> = {
    totalQuizzes: stats?.totalQuizzes || 0, accuracy: stats?.accuracy || 0,
    streak: stats?.streak || 0, xp: stats?.xp || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            Welcome, <span className="text-fire-gradient">{profile?.full_name || 'Learner'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Here's your learning progress</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-4">
                  {isLoading ? <Skeleton className="h-16" /> : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-2xl font-heading font-bold mt-1">{vals[s.key]}{s.suffix || ''}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-primary/10 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentAttempts?.length ? (
                <p className="text-muted-foreground text-sm">No quizzes attempted yet. Start learning!</p>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-medium text-sm">{a.topics?.title}</p>
                        <p className="text-xs text-muted-foreground">{a.topics?.subjects?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{a.correct_answers}/{a.total_questions}</p>
                        <p className="text-xs text-muted-foreground">{a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Courses & Test Series</CardTitle>
            </CardHeader>
            <CardContent>
              {!courses?.length ? (
                <p className="text-muted-foreground text-sm">No courses available yet.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((c: any) => (
                    <Link key={c.id} to={`/courses/${c.id}`} className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{c.title}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{c.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                            <span className="text-xs text-muted-foreground">{c.is_free ? 'Free' : `₹${c.price}`}</span>
                          </div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
