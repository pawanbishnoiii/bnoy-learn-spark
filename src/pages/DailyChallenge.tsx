import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Play, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function DailyChallenge() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['daily-challenge', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_challenges')
        .select('*, topics(id, title, subjects(title))')
        .eq('challenge_date', today)
        .single();
      return data;
    },
  });

  const { data: completion } = useQuery({
    queryKey: ['daily-challenge-completion', today, user?.id],
    queryFn: async () => {
      if (!challenge) return null;
      const { data } = await supabase
        .from('daily_challenge_completions')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!challenge && !!user,
  });

  const { data: pastChallenges } = useQuery({
    queryKey: ['past-challenges', user?.id],
    queryFn: async () => {
      const { data: completions } = await supabase
        .from('daily_challenge_completions')
        .select('*, daily_challenges(title, challenge_date)')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(7);
      return completions || [];
    },
    enabled: !!user,
  });

  const isCompleted = !!completion;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Flame className="w-7 h-7 text-accent" /> Daily Challenge
        </h1>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading today's challenge...</p>
          </div>
        ) : !challenge ? (
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-fire-gradient flex items-center justify-center mb-4">
                <Flame className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="font-heading text-xl font-bold mb-2">No Challenge Today</h2>
              <p className="text-muted-foreground">Check back tomorrow for a new daily challenge!</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`glass-card border-0 ${isCompleted ? 'border-success/30' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{today}</Badge>
                    <h2 className="font-heading text-xl font-bold">{challenge.title}</h2>
                    {(challenge as any).topics?.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Topic: {(challenge as any).topics.title} · {(challenge as any).topics?.subjects?.title}
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Done!</span>
                    </div>
                  )}
                </div>

                {isCompleted ? (
                  <div className="bg-success/10 rounded-xl p-4 text-center">
                    <Trophy className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-success">Challenge Completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">+{completion?.xp_earned || 10} XP earned</p>
                  </div>
                ) : challenge.topic_id ? (
                  <Button asChild className="w-full bg-fire-gradient border-0" size="lg">
                    <Link to={`/quiz/${challenge.topic_id}`}>
                      <Play className="w-5 h-5 mr-2" /> Start Challenge
                    </Link>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">This challenge has no topic linked yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Past challenges */}
        {(pastChallenges?.length ?? 0) > 0 && (
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold mb-4">Recent Completions</h3>
              <div className="space-y-2">
                {pastChallenges?.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">{c.daily_challenges?.title}</p>
                      <p className="text-xs text-muted-foreground">{c.daily_challenges?.challenge_date}</p>
                    </div>
                    <Badge variant="secondary">+{c.xp_earned} XP</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
