import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { user } = useAuthStore();

  const { data: subject } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('*, courses(title)').eq('id', subjectId!).single();
      return data;
    },
  });

  const { data: topics } = useQuery({
    queryKey: ['topics', subjectId],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('*').eq('subject_id', subjectId!).order('sort_order');
      return data || [];
    },
    enabled: !!subjectId,
  });

  // Get question counts per topic
  const { data: questionCounts } = useQuery({
    queryKey: ['topic-question-counts', subjectId],
    queryFn: async () => {
      if (!topics?.length) return {};
      const topicIds = topics.map(t => t.id);
      const { data } = await supabase
        .from('questions')
        .select('topic_id')
        .in('topic_id', topicIds)
        .eq('is_visible', true);
      const counts: Record<string, number> = {};
      data?.forEach(q => {
        counts[q.topic_id] = (counts[q.topic_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!topics?.length,
  });

  // Get user's best attempt per topic
  const { data: topicAttempts } = useQuery({
    queryKey: ['topic-attempts', subjectId, user?.id],
    queryFn: async () => {
      if (!topics?.length || !user) return {};
      const topicIds = topics.map(t => t.id);
      const { data } = await supabase
        .from('quiz_attempts')
        .select('topic_id, correct_answers, total_questions')
        .in('topic_id', topicIds)
        .eq('user_id', user.id)
        .eq('is_completed', true);
      const best: Record<string, { correct: number; total: number }> = {};
      data?.forEach(a => {
        const acc = a.total_questions > 0 ? a.correct_answers / a.total_questions : 0;
        const prev = best[a.topic_id];
        if (!prev || (prev.total > 0 ? prev.correct / prev.total : 0) < acc) {
          best[a.topic_id] = { correct: a.correct_answers, total: a.total_questions };
        }
      });
      return best;
    },
    enabled: !!topics?.length && !!user,
  });

  const totalQuestions = Object.values(questionCounts || {}).reduce((s, c) => s + c, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">{(subject as any)?.courses?.title}</p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">{subject?.title || 'Subject'}</h1>
        </div>

        {/* Full Paper Button */}
        {totalQuestions > 0 && topics && topics.length > 1 && (
          <Card className="glass-card border-0 bg-fire-gradient/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-fire-gradient flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Full Paper</h3>
                  <p className="text-sm text-muted-foreground">{totalQuestions} questions from all topics</p>
                </div>
              </div>
              <Button asChild className="bg-fire-gradient border-0">
                <Link to={`/quiz/${topics[0]?.id}?mode=full&subjectId=${subjectId}`}>
                  <Play className="w-4 h-4 mr-1" /> Start Full Paper
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Topic-wise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics?.map((t: any, i: number) => {
            const qCount = questionCounts?.[t.id] || 0;
            const attempt = topicAttempts?.[t.id];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-card border-0 hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold">{t.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{qCount} Q</Badge>
                        {attempt && (
                          <Badge variant="outline" className="text-xs">
                            Best: {Math.round((attempt.correct / attempt.total) * 100)}%
                          </Badge>
                        )}
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground truncate mt-1">{t.description}</p>}
                    </div>
                    <Button asChild size="sm" className="bg-fire-gradient border-0 flex-shrink-0" disabled={qCount === 0}>
                      <Link to={`/quiz/${t.id}`}><Play className="w-4 h-4 mr-1" /> Start</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {!topics?.length && <p className="text-muted-foreground">No topics available yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
