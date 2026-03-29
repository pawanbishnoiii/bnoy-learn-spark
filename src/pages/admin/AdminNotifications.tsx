import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminNotifications() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const { data: profiles } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Title required');
      const rows = profiles?.map(p => ({ user_id: p.user_id, title, message, type })) || [];
      if (!rows.length) throw new Error('No users to notify');
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { setTitle(''); setMessage(''); toast.success(`Notification sent to ${profiles?.length} users!`); },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['admin-recent-notifs'],
    queryFn: async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  const uniqueNotifs = recentNotifs?.reduce((acc: any[], n) => {
    if (!acc.find(a => a.title === n.title && a.created_at === n.created_at)) acc.push(n);
    return acc;
  }, []) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-primary" /> Send Notifications</h1>

        <Card className="glass-card border-0">
          <CardHeader><CardTitle className="font-heading text-lg">New Notification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /> Will be sent to all {profiles?.length || 0} users</div>
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message" rows={3} /></div>
            <div><Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="promo">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => sendNotification.mutate()} className="w-full bg-fire-gradient border-0" disabled={sendNotification.isPending}>
              <Send className="w-4 h-4 mr-2" /> {sendNotification.isPending ? 'Sending...' : 'Send to All Users'}
            </Button>
          </CardContent>
        </Card>

        {uniqueNotifs.length > 0 && (
          <Card className="glass-card border-0">
            <CardHeader><CardTitle className="font-heading text-lg">Recent Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {uniqueNotifs.slice(0, 10).map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Bell className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
