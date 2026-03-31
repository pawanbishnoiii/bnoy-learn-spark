import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookOpen, Target, Flame, Trophy, Zap, Star, ArrowRight, Clock, Play, Users } from 'lucide-react';
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
      const { data } = await supabase.from('courses').select('*, subjects(id)').eq('is_published', true).limit(6);
      return data || [];
    },
  });

  const { data: todayChallenge } = useQuery({
    queryKey: ['today-challenge-preview'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('daily_challenges').select('*, topics(title, questions(id))').eq('challenge_date', today).maybeSingle();
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* User header - app style */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-fire-gradient text-primary-foreground font-heading text-lg font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-lg font-bold">{profile?.full_name || 'Learner'}</h1>
              <Badge className="bg-accent/15 text-accent border-0 text-[10px]">
                {(stats?.xp || 0) > 500 ? 'Expert' : (stats?.xp || 0) > 100 ? 'Intermediate' : 'Beginner'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-heading font-bold text-sm">{stats?.xp || 0}</span>
          </div>
        </motion.div>

        {/* Daily Task Card - matching reference */}
        {todayChallenge && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link to="/daily-challenge">
              <Card className="bg-hero-gradient border-0 text-primary-foreground rounded-3xl overflow-hidden relative">
                <div className="absolute inset-0 bg-grid opacity-10" />
                <CardContent className="p-5 flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Star className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">Daily Task</h3>
                    <p className="text-primary-foreground/70 text-sm">
                      {(todayChallenge as any)?.topics?.questions?.length || 0} Questions
                    </p>
                    <div className="mt-2">
                      <Progress value={0} className="h-2 bg-white/20" />
                      <div className="flex justify-between text-xs text-primary-foreground/60 mt-1">
                        <span>Progress</span>
                        <span>0/{(todayChallenge as any)?.topics?.questions?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: 'Quizzes', value: stats?.totalQuizzes || 0, icon: BookOpen, bg: 'bg-primary/8', color: 'text-primary' },
            { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, icon: Target, bg: 'bg-success/8', color: 'text-success' },
            { label: 'Streak', value: `${stats?.streak || 0}d`, icon: Flame, bg: 'bg-accent/8', color: 'text-accent' },
            { label: 'XP', value: stats?.xp || 0, icon: Zap, bg: 'bg-warning/8', color: 'text-warning' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <Card className="glass-card border-0 rounded-2xl">
                <CardContent className="p-3 text-center">
                  {isLoading ? <Skeleton className="h-12" /> : (
                    <>
                      <div className={`w-9 h-9 mx-auto rounded-xl ${s.bg} flex items-center justify-center mb-1.5`}>
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <p className="text-lg font-heading font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Courses - horizontal scroll like app */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Quiz</h2>
            <Link to="/courses" className="text-xs text-primary font-medium">View All</Link>
          </div>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {courses.slice(0, 4).map((c: any, i: number) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
                  <Link to={`/courses/${c.id}`}>
                    <Card className="glass-card border-0 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                      <div className="h-28 bg-hero-gradient/30 flex items-center justify-center relative">
                        {c.thumbnail_url ? (
                          <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-10 h-10 text-primary/40" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={`text-[9px] ${c.is_free ? 'bg-success/90' : 'bg-accent/90'} text-white border-0`}>
                            {c.is_free ? 'Free' : `₹${c.price}`}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-heading font-semibold text-xs truncate">{c.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground">{c.subjects?.length || 0} Subjects</span>
                          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No courses available yet.</p>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!recentAttempts?.length ? (
                <p className="text-muted-foreground text-sm py-4">No quizzes attempted yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentAttempts.map((a: any) => {
                    const acc = a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0;
                    return (
                      <Link key={a.id} to={`/quiz-result/${a.id}`} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium text-xs truncate">{a.topics?.title}</p>
                          <p className="text-[10px] text-muted-foreground">{a.topics?.subjects?.title}</p>
                        </div>
                        <Badge variant={acc >= 60 ? 'default' : 'destructive'} className="text-[10px] rounded-xl">{acc}%</Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
