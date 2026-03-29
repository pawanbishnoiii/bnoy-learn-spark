import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Play, Trophy, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DailyChallenge() {
  const { user, profile } = useAuthStore();

  const today = new Date().toISOString().split('T')[0];

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['daily-challenge', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_challenges')
        .select('*, topics(id, title, subjects(title))')
        .eq('challenge_date', today)
        .maybeSingle();
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
  const streak = profile?.daily_streak || 0;

  // Generate streak dots for last 7 days
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const completed = pastChallenges?.some((c: any) => c.daily_challenges?.challenge_date === dateStr);
    return { date: dateStr, completed, day: date.toLocaleDateString('en', { weekday: 'short' }).charAt(0) };
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Streak Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-0 overflow-hidden">
            <div className="bg-fire-gradient p-6 text-primary-foreground text-center relative">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Flame className="w-12 h-12 mx-auto mb-2" />
                </motion.div>
                <p className="text-4xl font-heading font-black">{streak}</p>
                <p className="text-primary-foreground/80 text-sm">Day Streak 🔥</p>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-center gap-3">
                {streakDays.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      d.completed ? 'bg-fire-gradient text-primary-foreground' : d.date === today ? 'ring-2 ring-primary bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {d.completed ? '🔥' : d.day}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{d.day}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Challenge */}
        <h2 className="font-heading text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Today's Challenge
        </h2>

        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : !challenge ? (
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Flame className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-xl font-bold mb-2">No Challenge Today</h2>
              <p className="text-muted-foreground">Check back tomorrow for a new daily challenge!</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`glass-card border-0 ${isCompleted ? 'ring-2 ring-success/30' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 rounded-xl">{today}</Badge>
                    <h2 className="font-heading text-xl font-bold">{challenge.title}</h2>
                    {(challenge as any).topics?.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Topic: {(challenge as any).topics.title} · {(challenge as any).topics?.subjects?.title}
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>

                {isCompleted ? (
                  <div className="bg-success/10 rounded-2xl p-5 text-center">
                    <Trophy className="w-10 h-10 text-success mx-auto mb-2" />
                    <p className="font-heading font-bold text-success text-lg">Challenge Completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">+{completion?.xp_earned || 10} XP earned</p>
                  </div>
                ) : challenge.topic_id ? (
                  <Button asChild className="w-full bg-fire-gradient border-0 rounded-2xl" size="lg">
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

        {/* Past Challenges */}
        {(pastChallenges?.length ?? 0) > 0 && (
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <h3 className="font-heading font-semibold mb-4">Recent Completions</h3>
              <div className="space-y-2">
                {pastChallenges?.map((c: any, i: number) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-fire-gradient flex items-center justify-center text-xs">🔥</div>
                      <div>
                        <p className="text-sm font-medium">{c.daily_challenges?.title}</p>
                        <p className="text-xs text-muted-foreground">{c.daily_challenges?.challenge_date}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">+{c.xp_earned} XP</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
