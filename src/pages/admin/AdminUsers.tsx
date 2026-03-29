import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Users, Search, Flame, Target, Trophy, Calendar, Mail, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) console.error('Profiles error:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">{profiles?.length || 0} total users</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-10">Loading users...</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const userRoles = getRoles(p.user_id);
              const stats = attemptStats?.[p.user_id];
              const accuracy = stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0;
              const purchase = purchases?.[p.user_id];
              return (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <Card className="glass-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary font-heading">{p.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{p.full_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.user_id}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {userRoles.map(r => (
                              <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'} className={r === 'admin' ? 'bg-fire-gradient border-0 text-[10px]' : 'text-[10px]'}>{r}</Badge>
                            ))}
                            {p.language_preference && <Badge variant="outline" className="text-[10px]">{p.language_preference}</Badge>}
                            {p.onboarding_completed && <Badge variant="outline" className="text-[10px] text-success">Onboarded</Badge>}
                          </div>
                        </div>
                        <div className="hidden md:grid grid-cols-4 gap-4 text-xs text-muted-foreground text-center">
                          <div><Trophy className="w-3 h-3 mx-auto mb-0.5 text-primary" /><span className="font-medium">{p.xp_points}</span><br />XP</div>
                          <div><Flame className="w-3 h-3 mx-auto mb-0.5 text-accent" /><span className="font-medium">{p.daily_streak}</span><br />Streak</div>
                          <div><Target className="w-3 h-3 mx-auto mb-0.5 text-success" /><span className="font-medium">{accuracy}%</span><br />Accuracy</div>
                          <div><BookOpen className="w-3 h-3 mx-auto mb-0.5" /><span className="font-medium">{stats?.quizzes || 0}</span><br />Quizzes</div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground flex-wrap">
                        {p.preparation_goal && <span>🎯 {p.preparation_goal}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined: {new Date(p.created_at).toLocaleDateString()}</span>
                        {p.last_active_date && <span>Last: {new Date(p.last_active_date).toLocaleDateString()}</span>}
                        {purchase && <span className="text-success">₹{purchase.total} ({purchase.count} purchases)</span>}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground md:hidden flex-wrap">
                        <span>{p.xp_points} XP</span><span>{p.daily_streak}d streak</span><span>{accuracy}%</span><span>{stats?.quizzes || 0} quizzes</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {!filtered.length && !isLoading && (
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
