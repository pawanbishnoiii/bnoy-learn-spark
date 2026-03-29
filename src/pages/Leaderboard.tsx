import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Crown, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('all');

  const { data: leaders, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').order('xp_points', { ascending: false }).limit(100);
      if (!profiles) return [];
      const userIds = profiles.map(p => p.user_id);
      const { data: attempts } = await supabase.from('quiz_attempts').select('user_id, correct_answers, total_questions, time_taken_seconds').eq('is_completed', true).in('user_id', userIds);
      const statsMap: Record<string, { quizzes: number; correct: number; total: number }> = {};
      attempts?.forEach(a => {
        if (!statsMap[a.user_id]) statsMap[a.user_id] = { quizzes: 0, correct: 0, total: 0 };
        statsMap[a.user_id].quizzes++;
        statsMap[a.user_id].correct += a.correct_answers;
        statsMap[a.user_id].total += a.total_questions;
      });
      return profiles.map(p => ({
        ...p,
        quizzes: statsMap[p.user_id]?.quizzes || 0,
        accuracy: statsMap[p.user_id]?.total ? Math.round((statsMap[p.user_id].correct / statsMap[p.user_id].total) * 100) : 0,
      }));
    },
  });

  const myRank = leaders?.findIndex(l => l.user_id === user?.id);
  const top3 = leaders?.slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-7 h-7 text-primary" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Top learners ranked by XP</p>
          {myRank !== undefined && myRank >= 0 && (
            <Badge className="mt-2 bg-fire-gradient border-0 text-primary-foreground">Your Rank: #{myRank + 1}</Badge>
          )}
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="flex justify-center">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl">All Time</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-xl">Weekly</TabsTrigger>
            <TabsTrigger value="daily" className="rounded-xl">Today</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Podium */}
        {top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-4 pb-2">
            {/* 2nd Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center w-24">
              <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-muted-foreground/30">
                {top3[1].avatar_url && <AvatarImage src={top3[1].avatar_url} />}
                <AvatarFallback className="bg-muted font-heading text-base">{top3[1].full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <p className="font-heading font-semibold text-xs truncate">{top3[1].full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{top3[1].xp_points} XP</p>
              <div className="podium-silver rounded-t-xl h-20 w-full mt-2 flex items-center justify-center">
                <div className="text-center">
                  <Medal className="w-5 h-5 text-primary-foreground/90 mx-auto" />
                  <span className="text-primary-foreground font-heading font-bold text-2xl">2</span>
                </div>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center w-28 -mt-4">
              <div className="relative">
                <Crown className="w-6 h-6 text-warning mx-auto mb-1" />
                <Avatar className="w-16 h-16 mx-auto mb-2 ring-4 ring-warning/40">
                  {top3[0].avatar_url && <AvatarImage src={top3[0].avatar_url} />}
                  <AvatarFallback className="bg-fire-gradient text-primary-foreground font-heading text-lg">{top3[0].full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <p className="font-heading font-bold text-sm truncate">{top3[0].full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{top3[0].xp_points} XP</p>
              <div className="podium-gold rounded-t-xl h-28 w-full mt-2 flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="w-6 h-6 text-primary-foreground/90 mx-auto" />
                  <span className="text-primary-foreground font-heading font-bold text-3xl">1</span>
                </div>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center w-24">
              <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-accent/30">
                {top3[2].avatar_url && <AvatarImage src={top3[2].avatar_url} />}
                <AvatarFallback className="bg-accent/10 text-accent font-heading text-base">{top3[2].full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <p className="font-heading font-semibold text-xs truncate">{top3[2].full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{top3[2].xp_points} XP</p>
              <div className="podium-bronze rounded-t-xl h-16 w-full mt-2 flex items-center justify-center">
                <div className="text-center">
                  <Medal className="w-5 h-5 text-primary-foreground/90 mx-auto" />
                  <span className="text-primary-foreground font-heading font-bold text-2xl">3</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full List */}
        <Card className="glass-card border-0">
          <CardContent className="p-0 divide-y divide-border">
            {leaders?.map((l, i) => (
              <motion.div key={l.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-3 px-4 py-3.5 ${l.user_id === user?.id ? 'bg-primary/5' : ''}`}>
                <div className="w-7 text-center">
                  {i < 3 ? (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-primary-foreground ${i === 0 ? 'podium-gold' : i === 1 ? 'podium-silver' : 'podium-bronze'}`}>{i + 1}</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <Avatar className="w-9 h-9">
                  {l.avatar_url && <AvatarImage src={l.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading">{l.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{l.full_name || 'User'}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{l.daily_streak}d</span>
                    <span className="flex items-center gap-0.5"><Target className="w-3 h-3" />{l.accuracy}%</span>
                    <span>{l.quizzes} quizzes</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-sm">{l.xp_points}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </motion.div>
            ))}
            {!leaders?.length && !isLoading && <p className="text-muted-foreground text-center py-10">No data yet. Start learning!</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
