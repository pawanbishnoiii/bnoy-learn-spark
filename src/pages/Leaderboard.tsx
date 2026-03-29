import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Flame, Target, TrendingUp } from 'lucide-react';
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

      const statsMap: Record<string, { quizzes: number; correct: number; total: number; totalTime: number }> = {};
      attempts?.forEach(a => {
        if (!statsMap[a.user_id]) statsMap[a.user_id] = { quizzes: 0, correct: 0, total: 0, totalTime: 0 };
        statsMap[a.user_id].quizzes++;
        statsMap[a.user_id].correct += a.correct_answers;
        statsMap[a.user_id].total += a.total_questions;
        statsMap[a.user_id].totalTime += a.time_taken_seconds || 0;
      });

      return profiles.map(p => ({
        ...p,
        quizzes: statsMap[p.user_id]?.quizzes || 0,
        accuracy: statsMap[p.user_id]?.total ? Math.round((statsMap[p.user_id].correct / statsMap[p.user_id].total) * 100) : 0,
        avgTime: statsMap[p.user_id]?.quizzes ? Math.round(statsMap[p.user_id].totalTime / statsMap[p.user_id].quizzes) : 0,
      }));
    },
  });

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (i === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (i === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>;
  };

  const myRank = leaders?.findIndex(l => l.user_id === user?.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold"><Trophy className="inline w-7 h-7 text-primary mr-2" /> Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top learners ranked by XP</p>
          {myRank !== undefined && myRank >= 0 && <Badge className="mt-2 bg-fire-gradient border-0">Your Rank: #{myRank + 1}</Badge>}
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="flex justify-center">
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Today</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Top 3 Podium */}
        {leaders && leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-6">
            {[1, 0, 2].map((idx) => {
              const l = leaders[idx];
              const isFirst = idx === 0;
              return (
                <motion.div key={l.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 }} className="text-center">
                  <Avatar className={`mx-auto mb-2 ${isFirst ? 'w-16 h-16 ring-4 ring-yellow-400/50' : 'w-12 h-12'}`}>
                    {l.avatar_url && <AvatarImage src={l.avatar_url} />}
                    <AvatarFallback className={`${isFirst ? 'bg-fire-gradient text-primary-foreground text-xl' : 'bg-primary/10 text-primary'} font-heading`}>{l.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  {getRankIcon(idx)}
                  <p className="font-heading font-semibold text-sm mt-1 truncate max-w-[90px]">{l.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{l.xp_points} XP</p>
                  <p className="text-[10px] text-muted-foreground">{l.accuracy}% accuracy</p>
                  <div className={`mt-2 rounded-t-lg ${isFirst ? 'bg-fire-gradient h-24' : idx === 1 ? 'bg-primary/20 h-16' : 'bg-primary/10 h-12'} w-20 mx-auto`} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full List */}
        <Card className="glass-card border-0">
          <CardContent className="p-0">
            {leaders?.map((l, i) => (
              <motion.div key={l.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-3 p-4 border-b last:border-0 ${l.user_id === user?.id ? 'bg-primary/5' : ''}`}>
                <div className="w-8 flex justify-center">{getRankIcon(i)}</div>
                <Avatar className="w-9 h-9">
                  {l.avatar_url && <AvatarImage src={l.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading">{l.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{l.full_name || 'User'}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{l.daily_streak}d</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{l.accuracy}%</span>
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
