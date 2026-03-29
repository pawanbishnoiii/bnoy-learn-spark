import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Flag, MessageSquare, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminReports() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('reports');
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('question_reports').select('*, questions(question_text)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: doubts } = useQuery({
    queryKey: ['admin-doubts'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('doubts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-map'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.user_id] = p.full_name || 'User'; });
      return map;
    },
  });

  const resolveReport = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await (supabase as any).from('question_reports').update({ status: 'resolved', admin_response: response }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Report resolved!'); },
  });

  const replyDoubt = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const { error } = await (supabase as any).from('doubts').update({ status: 'answered', admin_reply: reply }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-doubts'] }); toast.success('Reply sent!'); },
  });

  const statusColor = (s: string) => s === 'resolved' || s === 'answered' ? 'bg-success/10 text-success' : s === 'pending' || s === 'open' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Flag className="w-6 h-6 text-primary" /> Reports & Doubts</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="reports">Question Reports ({reports?.filter(r => r.status === 'pending').length || 0})</TabsTrigger>
            <TabsTrigger value="doubts">Student Doubts ({doubts?.filter(d => d.status === 'open').length || 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'reports' && (
          <div className="space-y-3">
            {!reports?.length ? <p className="text-muted-foreground text-center py-10">No reports</p> :
              reports.map((r: any, i: number) => (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <Card className="glass-card border-0">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            <span className="text-sm font-medium">{profiles?.[r.user_id] || 'User'}</span>
                            <Badge className={`text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">"{r.report_text}"</p>
                          <p className="text-xs text-muted-foreground mt-1">Q: {r.questions?.question_text?.slice(0, 80)}...</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <Input placeholder="Admin response..." value={replyText[r.id] || ''} onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))} className="flex-1" />
                          <Button size="sm" className="bg-fire-gradient border-0" onClick={() => resolveReport.mutate({ id: r.id, response: replyText[r.id] || 'Resolved' })}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Resolve
                          </Button>
                        </div>
                      )}
                      {r.admin_response && <p className="text-xs text-success bg-success/5 p-2 rounded">✓ {r.admin_response}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            }
          </div>
        )}

        {tab === 'doubts' && (
          <div className="space-y-3">
            {!doubts?.length ? <p className="text-muted-foreground text-center py-10">No doubts</p> :
              doubts.map((d: any, i: number) => (
                <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <Card className="glass-card border-0">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{profiles?.[d.user_id] || 'User'}</span>
                            <Badge className={`text-[10px] ${statusColor(d.status)}`}>{d.status}</Badge>
                          </div>
                          <p className="font-medium text-sm">{d.title}</p>
                          {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                          {d.image_url && <img src={d.image_url} className="mt-2 rounded-lg max-h-32 object-cover" />}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {d.status === 'open' && (
                        <div className="flex gap-2">
                          <Input placeholder="Type reply..." value={replyText[d.id] || ''} onChange={e => setReplyText(p => ({ ...p, [d.id]: e.target.value }))} className="flex-1" />
                          <Button size="sm" className="bg-fire-gradient border-0" onClick={() => replyDoubt.mutate({ id: d.id, reply: replyText[d.id] || '' })}>
                            Reply
                          </Button>
                        </div>
                      )}
                      {d.admin_reply && <p className="text-xs text-success bg-success/5 p-2 rounded">✓ {d.admin_reply}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            }
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
