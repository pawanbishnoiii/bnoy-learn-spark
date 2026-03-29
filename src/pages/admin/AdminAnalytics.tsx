import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { BarChart3, Users, Target, TrendingUp, BookOpen, Eye, Flame, Calendar, Clock, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AdminAnalytics() {
  const { data: overviewStats } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async () => {
      const [profiles, courses, attempts, questions] = await Promise.all([
        supabase.from('profiles').select('user_id, xp_points, daily_streak, last_active_date, created_at'),
        supabase.from('courses').select('id').eq('is_published', true),
        supabase.from('quiz_attempts').select('id, user_id, correct_answers, total_questions, time_taken_seconds, completed_at').eq('is_completed', true),
        supabase.from('questions').select('id'),
      ]);
      
      const totalUsers = profiles.data?.length || 0;
      const totalCourses = courses.data?.length || 0;
      const totalAttempts = attempts.data?.length || 0;
      const totalQuestions = questions.data?.length || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const activeToday = profiles.data?.filter(p => p.last_active_date === today).length || 0;
      
      const last7d = new Date(Date.now() - 7 * 86400000).toISOString();
      const recentAttempts = attempts.data?.filter(a => a.completed_at && a.completed_at > last7d).length || 0;
      
      const uniqueAttemptUsers = new Set(attempts.data?.map(a => a.user_id));
      
      const avgAccuracy = attempts.data?.length ? 
        Math.round(attempts.data.reduce((s, a) => s + (a.total_questions > 0 ? (a.correct_answers / a.total_questions) * 100 : 0), 0) / attempts.data.length) : 0;

      const newUsersThisWeek = profiles.data?.filter(p => p.created_at > last7d).length || 0;

      return { totalUsers, totalCourses, totalAttempts, totalQuestions, activeToday, recentAttempts, uniqueLearnersCount: uniqueAttemptUsers.size, avgAccuracy, newUsersThisWeek };
    },
  });

  const { data: coursePerformance } = useQuery({
    queryKey: ['admin-course-performance'],
    queryFn: async () => {
      const { data: attempts } = await supabase.from('quiz_attempts').select('*, topics(title, subjects(title, courses(title)))').eq('is_completed', true);
      const courseMap: Record<string, { title: string; correct: number; total: number; students: Set<string>; attempts: number }> = {};
      attempts?.forEach((a: any) => {
        const courseTitle = a.topics?.subjects?.courses?.title || 'Unknown';
        if (!courseMap[courseTitle]) courseMap[courseTitle] = { title: courseTitle, correct: 0, total: 0, students: new Set(), attempts: 0 };
        courseMap[courseTitle].correct += a.correct_answers;
        courseMap[courseTitle].total += a.total_questions;
        courseMap[courseTitle].students.add(a.user_id);
        courseMap[courseTitle].attempts++;
      });
      return Object.values(courseMap).map(c => ({
        title: c.title,
        studentCount: c.students.size,
        accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
        attempts: c.attempts,
      })).sort((a, b) => b.attempts - a.attempts);
    },
  });

  const { data: topStudents } = useQuery({
    queryKey: ['admin-top-students'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('xp_points', { ascending: false }).limit(10);
      return data || [];
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
      return data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" /> Analytics Dashboard
        </h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: overviewStats?.totalUsers || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/8' },
            { label: 'Active Today', value: overviewStats?.activeToday || 0, icon: Activity, color: 'text-success', bg: 'bg-success/8' },
            { label: 'Quiz Attempts', value: overviewStats?.totalAttempts || 0, icon: BookOpen, color: 'text-accent', bg: 'bg-accent/8' },
            { label: 'Avg Accuracy', value: `${overviewStats?.avgAccuracy || 0}%`, icon: Target, color: 'text-warning', bg: 'bg-warning/8' },
            { label: 'Total Questions', value: overviewStats?.totalQuestions || 0, icon: Eye, color: 'text-primary', bg: 'bg-primary/8' },
            { label: 'This Week Attempts', value: overviewStats?.recentAttempts || 0, icon: TrendingUp, color: 'text-success', bg: 'bg-success/8' },
            { label: 'Unique Learners', value: overviewStats?.uniqueLearnersCount || 0, icon: Users, color: 'text-accent', bg: 'bg-accent/8' },
            { label: 'New Users (7d)', value: overviewStats?.newUsersThisWeek || 0, icon: Calendar, color: 'text-warning', bg: 'bg-warning/8' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-heading font-bold">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Course Performance */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!coursePerformance?.length ? (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              ) : (
                coursePerformance.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium">{c.title}</span>
                      <span className="text-xs text-muted-foreground">{c.studentCount} students · {c.attempts} attempts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={c.accuracy} className="h-2 flex-1" />
                      <span className="text-sm font-heading font-bold text-primary">{c.accuracy}%</span>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent" /> Top Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {topStudents?.map((s: any, i: number) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ${i < 3 ? 'bg-fire-gradient' : 'bg-muted-foreground/50'}`}>
                      {i + 1}
                    </span>
                    <Avatar className="w-8 h-8">
                      {s.avatar_url && <AvatarImage src={s.avatar_url} />}
                      <AvatarFallback className="text-xs bg-primary/10">{s.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.full_name || 'User'}</p>
                      <div className="flex gap-2 text-[11px] text-muted-foreground">
                        <span>{s.daily_streak}d streak</span>
                        {s.last_active_date && <span>Last: {new Date(s.last_active_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-heading font-bold">{s.xp_points} XP</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <Avatar className="w-9 h-9">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{u.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.full_name || 'New User'}</p>
                    <p className="text-[11px] text-muted-foreground">{u.preparation_goal || 'No goal set'}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(u.created_at).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
