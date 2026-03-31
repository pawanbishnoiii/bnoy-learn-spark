import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Crown, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('all');
  const navigate = useNavigate();

  const { data: leaders, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').order('xp_points', { ascending: false }).limit(100);
      if (!profiles) return [];
      const userIds = profiles.map(p => p.user_id);
      const { data: attempts } = await supabase.from('quiz_attempts').select('user_id, correct_answers, total_questions').eq('is_completed', true).in('user_id', userIds);
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
  const rest = leaders?.slice(3) || [];

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        {/* Purple gradient header */}
        <div className="bg-hero-gradient rounded-b-[2rem] -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-4 pt-4 pb-6 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative z-10">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-primary-foreground" />
              </button>
              {myRank !== undefined && myRank >= 0 && (
                <Avatar className="w-9 h-9 ring-2 ring-white/30">
                  {leaders?.[myRank]?.avatar_url && <AvatarImage src={leaders[myRank].avatar_url} />}
                  <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
                    {leaders?.[myRank]?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Period Tabs */}
            <div className="flex gap-4 mb-8 justify-center">
              {[
                { value: 'daily', label: 'Today' },
                { value: 'weekly', label: 'Month' },
                { value: 'all', label: 'All Times' },
              ].map(t => (
                <button key={t.value} onClick={() => setPeriod(t.value)}
                  className={`font-heading font-bold text-lg transition-all ${period === t.value ? 'text-primary-foreground' : 'text-primary-foreground/50'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Podium */}
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full" />
              </div>
            ) : top3.length >= 3 ? (
              <div className="flex items-end justify-center gap-3 px-2">
                {/* 2nd Place */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-center flex-1 max-w-[100px]">
                  <Avatar className="w-14 h-14 mx-auto mb-2 ring-3 ring-white/30">
                    {top3[1].avatar_url && <AvatarImage src={top3[1].avatar_url} />}
                    <AvatarFallback className="bg-white/20 text-primary-foreground font-heading text-base">
                      {top3[1].full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/15 backdrop-blur-sm rounded-t-2xl pt-4 pb-3 px-2 relative">
                    <span className="text-primary-foreground font-heading font-black text-4xl">2</span>
                    <p className="text-primary-foreground/70 text-xs mt-1">{top3[1].xp_points}pt</p>
                  </div>
                </motion.div>

                {/* 1st Place */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-center flex-1 max-w-[110px] -mt-6">
                  <div className="relative">
                    <Avatar className="w-16 h-16 mx-auto mb-2 ring-4 ring-white/40">
                      {top3[0].avatar_url && <AvatarImage src={top3[0].avatar_url} />}
                      <AvatarFallback className="bg-white/30 text-primary-foreground font-heading text-lg">
                        {top3[0].full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-t-2xl pt-5 pb-3 px-2 relative min-h-[120px] flex flex-col items-center justify-center">
                    <Crown className="w-5 h-5 text-warning absolute -top-2.5 left-1/2 -translate-x-1/2" />
                    <span className="text-primary-foreground font-heading font-black text-5xl">1</span>
                    <p className="text-primary-foreground/70 text-xs mt-1">{top3[0].xp_points}pt</p>
                  </div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-center flex-1 max-w-[100px]">
                  <Avatar className="w-14 h-14 mx-auto mb-2 ring-3 ring-white/25">
                    {top3[2].avatar_url && <AvatarImage src={top3[2].avatar_url} />}
                    <AvatarFallback className="bg-white/20 text-primary-foreground font-heading text-base">
                      {top3[2].full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/10 backdrop-blur-sm rounded-t-2xl pt-3 pb-3 px-2 relative">
                    <span className="text-primary-foreground font-heading font-black text-4xl">3</span>
                    <p className="text-primary-foreground/70 text-xs mt-1">{top3[2].xp_points}pt</p>
                  </div>
                </motion.div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Rest of the list */}
        <div className="bg-card rounded-3xl shadow-lg -mt-2 relative z-10">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {rest.map((l, i) => {
                const rank = i + 4;
                const isMe = l.user_id === user?.id;
                return (
                  <motion.div key={l.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-3 px-5 py-4 ${isMe ? 'bg-primary/5' : ''}`}>
                    <span className="text-sm font-heading font-bold text-muted-foreground w-7 text-center">{String(rank).padStart(2, '0')}</span>
                    <Avatar className="w-10 h-10">
                      {l.avatar_url && <AvatarImage src={l.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading">
                        {l.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.full_name || 'User'}</p>
                      <div className="flex gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{l.daily_streak}d</span>
                        <span className="flex items-center gap-0.5"><Target className="w-3 h-3" />{l.accuracy}%</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-2xl font-heading font-bold bg-primary/8 text-primary">
                      {l.xp_points}pt
                    </Badge>
                  </motion.div>
                );
              })}
              {!leaders?.length && !isLoading && (
                <p className="text-muted-foreground text-center py-10 text-sm">No data yet. Start learning!</p>
              )}
            </div>
          )}
        </div>

        {/* My rank highlight */}
        {myRank !== undefined && myRank >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-center gap-3">
            <span className="font-heading font-bold text-primary text-lg">{String(myRank + 1).padStart(2, '0')}</span>
            <Avatar className="w-9 h-9">
              {leaders?.[myRank]?.avatar_url && <AvatarImage src={leaders[myRank].avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{leaders?.[myRank]?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1"><p className="text-sm font-medium">You</p></div>
            <Badge className="bg-fire-gradient border-0 text-primary-foreground">{leaders?.[myRank]?.xp_points}pt</Badge>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
