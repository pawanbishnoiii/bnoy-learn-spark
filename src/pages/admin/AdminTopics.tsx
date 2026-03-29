import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AdminTopics() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [formCourse, setFormCourse] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subject_id: '' });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('id, title').order('title');
      return data || [];
    },
  });

  const { data: allSubjects } = useQuery({
    queryKey: ['admin-subjects-list'],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('id, title, course_id, courses(title)').order('title');
      return data || [];
    },
  });

  // Filter subjects by selected course for the form
  const formSubjects = formCourse ? allSubjects?.filter((s: any) => s.course_id === formCourse) : allSubjects;

  const { data: topics } = useQuery({
    queryKey: ['admin-topics', selectedCourse],
    queryFn: async () => {
      let q = supabase.from('topics').select('*, subjects(title, course_id, courses(title))').order('sort_order');
      const { data } = await q;
      if (selectedCourse !== 'all') {
        return (data || []).filter((t: any) => t.subjects?.course_id === selectedCourse);
      }
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.subject_id) { toast.error('Select a subject'); throw new Error('No subject'); }
      if (editing) {
        await supabase.from('topics').update(form).eq('id', editing.id);
      } else {
        await supabase.from('topics').insert(form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      setOpen(false);
      toast.success(editing ? 'Updated!' : 'Created!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from('topics').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics'] }); toast.success('Deleted'); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-heading text-2xl font-bold">Manage Topics</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setFormCourse(''); setForm({ title: '', description: '', subject_id: '' }); }} className="bg-fire-gradient border-0">
                <Plus className="w-4 h-4 mr-1" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit' : 'New'} Topic</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Course</Label>
                  <Select value={formCourse} onValueChange={v => { setFormCourse(v); setForm(f => ({ ...f, subject_id: '' })); }}>
                    <SelectTrigger><SelectValue placeholder="Select course first" /></SelectTrigger>
                    <SelectContent>{courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))} disabled={!formCourse}>
                    <SelectTrigger><SelectValue placeholder={formCourse ? "Select subject" : "Select course first"} /></SelectTrigger>
                    <SelectContent>
                      {formSubjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <Button onClick={() => save.mutate()} className="w-full bg-fire-gradient border-0" disabled={save.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter by course */}
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="space-y-3">
          {topics?.map((t: any, i: number) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{t.title}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{(t as any).subjects?.courses?.title}</Badge>
                      <Badge variant="secondary" className="text-xs">{(t as any).subjects?.title}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditing(t);
                      setFormCourse(t.subjects?.course_id || '');
                      setForm({ title: t.title, description: t.description || '', subject_id: t.subject_id });
                      setOpen(true);
                    }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!topics?.length && <p className="text-muted-foreground text-center py-10">No topics yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
