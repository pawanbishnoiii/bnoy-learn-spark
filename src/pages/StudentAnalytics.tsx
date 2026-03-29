import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function StudentAnalytics() {
  const { user } = useAuthStore();

  const { data: topicStats } = useQuery({
    queryKey: ['topic-analytics', user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*, topics(title, subjects(title))')
        .eq('user_id', user!.id)
        .eq('is_completed', true);

      const topicMap: Record<string, { title: string, subject: string, correct: number, total: number, count: number }> = {};
      attempts?.forEach((a: any) => {
        const tid = a.topic_id;
        if (!topicMap[tid]) {
          topicMap[tid] = { title: a.topics?.title || '', subject: a.topics?.subjects?.title || '', correct: 0, total: 0, count: 0 };
        }
        topicMap[tid].correct += a.correct_answers;
        topicMap[tid].total += a.total_questions;
        topicMap[tid].count += 1;
      });
      return Object.entries(topicMap)
        .map(([id, v]) => ({ id, ...v, accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0 }))
        .sort((a, b) => a.accuracy - b.accuracy);
    },
    enabled: !!user,
  });

  const weakTopics = topicStats?.filter(t => t.accuracy < 60) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">My Analytics</h1>

        {weakTopics.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-destructive" /> Weak Areas (Below 60%)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <span className="text-sm font-semibold text-destructive">{t.accuracy}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Topic-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!topicStats?.length ? (
              <p className="text-muted-foreground text-sm">Complete quizzes to see analytics.</p>
            ) : (
              topicStats.map(t => (
                <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium">{t.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">({t.count} attempts)</span>
                    </div>
                    <span className={`text-sm font-semibold ${t.accuracy >= 80 ? 'text-success' : t.accuracy >= 60 ? 'text-warning' : 'text-destructive'}`}>
                      {t.accuracy}%
                    </span>
                  </div>
                  <Progress value={t.accuracy} className="h-2" />
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
