import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Users, Search, Flame, Target, Trophy, Calendar, BookOpen, Eye, Clock } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-all-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
  });

  const { data: attemptStats } = useQuery({
    queryKey: ['admin-user-attempts'],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_attempts').select('user_id, correct_answers, total_questions').eq('is_completed', true);
      const map: Record<string, { quizzes: number; correct: number; total: number }> = {};
      data?.forEach(a => {
        if (!map[a.user_id]) map[a.user_id] = { quizzes: 0, correct: 0, total: 0 };
        map[a.user_id].quizzes++;
        map[a.user_id].correct += a.correct_answers;
        map[a.user_id].total += a.total_questions;
      });
      return map;
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ['admin-user-purchases'],
    queryFn: async () => {
      const { data } = await supabase.from('user_purchases').select('user_id, amount, payment_status');
      const map: Record<string, { total: number; count: number }> = {};
      data?.forEach(p => {
        if (p.payment_status === 'paid') {
          if (!map[p.user_id]) map[p.user_id] = { total: 0, count: 0 };
          map[p.user_id].total += Number(p.amount) || 0;
          map[p.user_id].count++;
        }
      });
      return map;
    },
  });

  const getRoles = (userId: string) => roles?.filter(r => r.user_id === userId).map(r => r.role) || [];

  const filtered = profiles?.filter(p => {
    const matchSearch = !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.user_id?.toLowerCase().includes(search.toLowerCase());
    if (tab === 'admin') return matchSearch && getRoles(p.user_id).includes('admin');
    if (tab === 'active') return matchSearch && p.last_active_date;
    return matchSearch;
  }) || [];

  const totalUsers = profiles?.length || 0;
  const activeUsers = profiles?.filter(p => p.last_active_date)?.length || 0;
  const adminCount = roles?.filter(r => r.role === 'admin')?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> User Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{totalUsers} total users</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
            { label: 'Active Users', value: activeUsers, icon: Eye, color: 'text-success' },
            { label: 'Admins', value: adminCount, icon: Trophy, color: 'text-accent' },
          ].map(s => (
            <Card key={s.label} className="glass-card border-0">
              <CardContent className="p-4 text-center">
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-heading font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl">All ({totalUsers})</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-xl">Admins ({adminCount})</TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl">Active ({activeUsers})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const userRoles = getRoles(p.user_id);
              const stats = attemptStats?.[p.user_id];
              const accuracy = stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0;
              const purchase = purchases?.[p.user_id];
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className="glass-card border-0 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                          {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary font-heading">{p.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{p.full_name || 'Unknown User'}</p>
                            {userRoles.map(r => (
                              <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'} className={`text-[10px] ${r === 'admin' ? 'bg-fire-gradient border-0' : ''}`}>{r}</Badge>
                            ))}
                            {p.onboarding_completed && <Badge variant="outline" className="text-[10px] text-success border-success/30">✓ Onboarded</Badge>}
                          </div>
                          <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-primary" />{p.xp_points} XP</span>
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-accent" />{p.daily_streak}d streak</span>
                            <span className="flex items-center gap-1"><Target className="w-3 h-3 text-success" />{accuracy}%</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{stats?.quizzes || 0} quizzes</span>
                          </div>
                          <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                            {p.preparation_goal && <span>🎯 {p.preparation_goal}</span>}
                            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Joined: {new Date(p.created_at).toLocaleDateString()}</span>
                            {p.last_active_date && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> Last: {new Date(p.last_active_date).toLocaleDateString()}</span>}
                            {purchase && <span className="text-success font-medium">₹{purchase.total} ({purchase.count} buys)</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {!filtered.length && (
              <div className="text-center py-10">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
