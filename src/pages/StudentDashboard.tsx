import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookOpen, Target, Flame, Trophy, TrendingUp, Clock, Zap, Star, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const statCards = [
    { label: 'Quizzes', value: stats?.totalQuizzes || 0, icon: BookOpen, gradient: 'from-primary to-primary/80', bg: 'bg-primary/8' },
    { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, icon: Target, gradient: 'from-success to-success/80', bg: 'bg-success/8' },
    { label: 'Streak', value: `${stats?.streak || 0}d`, icon: Flame, gradient: 'from-accent to-accent/80', bg: 'bg-accent/8' },
    { label: 'XP', value: stats?.xp || 0, icon: Zap, gradient: 'from-warning to-warning/80', bg: 'bg-warning/8' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Avatar className="w-14 h-14 ring-2 ring-primary/20">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-fire-gradient text-primary-foreground font-heading text-lg font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold">
              Hi, <span className="text-fire-gradient">{profile?.full_name || 'Learner'}</span> 👋
            </h1>
            <p className="text-muted-foreground text-sm">Let's continue learning today!</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="glass-card border-0 overflow-hidden">
                <CardContent className="p-4">
                  {isLoading ? <Skeleton className="h-16" /> : (
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`w-5 h-5 bg-gradient-to-br ${s.gradient} bg-clip-text`} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Daily Challenge CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link to="/daily-challenge">
            <Card className="bg-fire-gradient border-0 text-primary-foreground overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-lg">Daily Challenge</p>
                    <p className="text-primary-foreground/80 text-sm">Complete today's challenge for bonus XP</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!recentAttempts?.length ? (
                  <p className="text-muted-foreground text-sm py-4">No quizzes attempted yet. Start learning!</p>
                ) : (
                  <div className="space-y-2.5">
                    {recentAttempts.map((a: any) => {
                      const acc = a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0;
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{a.topics?.title}</p>
                            <p className="text-[11px] text-muted-foreground">{a.topics?.subjects?.title}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-sm font-heading font-bold">{a.correct_answers}/{a.total_questions}</p>
                              <Progress value={acc} className="h-1 w-16" />
                            </div>
                            <Badge variant={acc >= 60 ? 'default' : 'destructive'} className="text-[10px] px-1.5">{acc}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Courses */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Courses</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                    <Link to="/courses">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {!courses?.length ? (
                  <p className="text-muted-foreground text-sm py-4">No courses available yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {courses.map((c: any) => (
                      <Link key={c.id} to={`/courses/${c.id}`} className="block p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{c.title}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] capitalize">{c.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                              <span className="text-[11px] text-muted-foreground font-medium">{c.is_free ? 'Free' : `₹${c.price}`}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
