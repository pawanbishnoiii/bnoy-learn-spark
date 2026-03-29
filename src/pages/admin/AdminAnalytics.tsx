import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart3, Users, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AdminAnalytics() {
  const { data: studentStats } = useQuery({
    queryKey: ['admin-student-analytics'],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*, topics(title, subjects(title, courses(title)))')
        .eq('is_completed', true);

      // Per-course stats
      const courseMap: Record<string, { title: string, correct: number, total: number, students: Set<string> }> = {};
      attempts?.forEach((a: any) => {
        const courseTitle = a.topics?.subjects?.courses?.title || 'Unknown';
        if (!courseMap[courseTitle]) courseMap[courseTitle] = { title: courseTitle, correct: 0, total: 0, students: new Set() };
        courseMap[courseTitle].correct += a.correct_answers;
        courseMap[courseTitle].total += a.total_questions;
        courseMap[courseTitle].students.add(a.user_id);
      });

      return Object.values(courseMap).map(c => ({
        ...c,
        studentCount: c.students.size,
        accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
      }));
    },
  });

  const { data: topStudents } = useQuery({
    queryKey: ['admin-top-students'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('xp_points', { ascending: false }).limit(10);
      return data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Analytics</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!studentStats?.length ? (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              ) : (
                studentStats.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{c.title}</span>
                      <span className="text-sm text-muted-foreground">{c.studentCount} students · {c.accuracy}%</span>
                    </div>
                    <Progress value={c.accuracy} className="h-2" />
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Top Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStudents?.map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    <span className="w-6 h-6 rounded-full bg-fire-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium">{s.full_name}</span>
                    <span className="text-sm text-muted-foreground">{s.xp_points} XP</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
