import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Bookmark, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function BookmarksPage() {
  const { user } = useAuthStore();

  const { data: bookmarks } = useQuery({
    queryKey: ['user-bookmarks', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*, questions(*, topics(id, title))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Bookmarked Questions</h1>
        {!bookmarks?.length ? (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bookmarks yet. Save questions during quizzes!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((b: any, i: number) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{b.questions?.question_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Topic: {b.questions?.topics?.title} · Answer: {b.questions?.correct_option}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                        <Link to={`/quiz/${b.questions?.topics?.id}`}><Play className="w-3 h-3 mr-1" /> Quiz</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
