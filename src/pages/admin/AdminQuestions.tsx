import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, HelpCircle, Eye, EyeOff, Copy, Search, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const emptyForm = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', explanation: '', topic_id: '', is_visible: true };

export default function AdminQuestions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [formCourse, setFormCourse] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [importText, setImportText] = useState('');
  const [importTopicId, setImportTopicId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: courses } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('id, title').order('title');
      return data || [];
    },
  });

  const { data: allSubjects } = useQuery({
    queryKey: ['admin-subjects-all'],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('id, title, course_id').order('title');
      return data || [];
    },
  });

  const { data: allTopics } = useQuery({
    queryKey: ['admin-topics-all'],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('id, title, subject_id, subjects(title, course_id, courses(title))').order('title');
      return data || [];
    },
  });

  // Filtered dropdowns
  const filteredSubjects = filterCourse !== 'all' ? allSubjects?.filter((s: any) => s.course_id === filterCourse) : allSubjects;
  const filteredTopics = filterSubject !== 'all' ? allTopics?.filter((t: any) => t.subject_id === filterSubject) : 
    filterCourse !== 'all' ? allTopics?.filter((t: any) => (t as any).subjects?.course_id === filterCourse) : allTopics;

  const formSubjects2 = formCourse ? allSubjects?.filter((s: any) => s.course_id === formCourse) : allSubjects;
  const formTopics2 = formSubject ? allTopics?.filter((t: any) => t.subject_id === formSubject) : 
    formCourse ? allTopics?.filter((t: any) => (t as any).subjects?.course_id === formCourse) : allTopics;

  const { data: questions } = useQuery({
    queryKey: ['admin-questions', filterTopic, filterSubject, filterCourse],
    queryFn: async () => {
      let q = supabase.from('questions').select('*, topics(title, subject_id, subjects(title, course_id, courses(title)))').order('created_at', { ascending: false });
      if (filterTopic !== 'all') q = q.eq('topic_id', filterTopic);
      const { data } = await q;
      let result = data || [];
      if (filterSubject !== 'all' && filterTopic === 'all') {
        result = result.filter((q: any) => q.topics?.subject_id === filterSubject);
      }
      if (filterCourse !== 'all' && filterSubject === 'all') {
        result = result.filter((q: any) => q.topics?.subjects?.course_id === filterCourse);
      }
      return result;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.topic_id) { toast.error('Select a topic'); throw new Error('No topic'); }
      if (editing) {
        await supabase.from('questions').update(form).eq('id', editing.id);
      } else {
        await supabase.from('questions').insert(form);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); setOpen(false); toast.success(editing ? 'Updated!' : 'Created!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from('questions').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); toast.success('Deleted'); },
  });

  const toggleVisibility = async (q: any) => {
    await supabase.from('questions').update({ is_visible: !q.is_visible }).eq('id', q.id);
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
  };

  const duplicateQ = async (q: any) => {
    const { id, created_at, updated_at, topics: _, ...rest } = q;
    await supabase.from('questions').insert({ ...rest, question_text: `${rest.question_text} (Copy)` });
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
    toast.success('Question duplicated');
  };

  // Import from CSV/SQL text
  const handleImport = async () => {
    if (!importTopicId) { toast.error('Select topic for import'); return; }
    try {
      const lines = importText.trim().split('\n').filter(l => l.trim());
      const questions: any[] = [];
      for (const line of lines) {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 6) {
          questions.push({
            topic_id: importTopicId,
            question_text: parts[0],
            option_a: parts[1],
            option_b: parts[2],
            option_c: parts[3],
            option_d: parts[4],
            correct_option: parts[5].toUpperCase(),
            explanation: parts[6] || '',
          });
        }
      }
      if (!questions.length) { toast.error('No valid questions found. Use format: Question|A|B|C|D|Answer|Explanation'); return; }
      const { error } = await supabase.from('questions').insert(questions);
      if (error) throw error;
      toast.success(`${questions.length} questions imported!`);
      setImportOpen(false);
      setImportText('');
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImportText(ev.target?.result as string); };
    reader.readAsText(file);
  };

  // Export questions as CSV
  const handleExport = () => {
    if (!questions?.length) { toast.error('No questions to export'); return; }
    const csv = ['Question|Option A|Option B|Option C|Option D|Correct|Explanation|Topic'];
    questions.forEach((q: any) => {
      csv.push(`${q.question_text}|${q.option_a}|${q.option_b}|${q.option_c}|${q.option_d}|${q.correct_option}|${q.explanation || ''}|${q.topics?.title || ''}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions_export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Questions exported!');
  };

  const filtered = questions?.filter(q => !search || q.question_text.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-heading text-2xl font-bold">Manage Questions</h1>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Import</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-heading">Import Questions</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Format: <code>Question|Option A|Option B|Option C|Option D|Correct Answer (A/B/C/D)|Explanation</code><br/>
                    One question per line. Upload a file or paste below.
                  </p>
                  <div>
                    <Label>Topic</Label>
                    <Select value={importTopicId} onValueChange={setImportTopicId}>
                      <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                      <SelectContent>
                        {allTopics?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title} ({(t as any).subjects?.courses?.title})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Upload File (.csv, .txt)</Label>
                    <Input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} />
                  </div>
                  <div>
                    <Label>Or Paste Data</Label>
                    <Textarea rows={8} value={importText} onChange={e => setImportText(e.target.value)} placeholder="What is 2+2?|3|4|5|6|B|Because 2+2=4" />
                  </div>
                  <Button onClick={handleImport} className="w-full bg-fire-gradient border-0">Import Questions</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditing(null); setFormCourse(''); setFormSubject(''); setForm({ ...emptyForm }); }} className="bg-fire-gradient border-0">
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit' : 'New'} Question</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Course</Label>
                    <Select value={formCourse} onValueChange={v => { setFormCourse(v); setFormSubject(''); setForm(f => ({ ...f, topic_id: '' })); }}>
                      <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>{courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={formSubject} onValueChange={v => { setFormSubject(v); setForm(f => ({ ...f, topic_id: '' })); }} disabled={!formCourse}>
                      <SelectTrigger><SelectValue placeholder={formCourse ? "Select subject" : "Select course first"} /></SelectTrigger>
                      <SelectContent>{formSubjects2?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Topic</Label>
                    <Select value={form.topic_id} onValueChange={v => setForm(f => ({ ...f, topic_id: v }))} disabled={!formSubject}>
                      <SelectTrigger><SelectValue placeholder={formSubject ? "Select topic" : "Select subject first"} /></SelectTrigger>
                      <SelectContent>{formTopics2?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Question</Label><Textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Option A</Label><Input value={form.option_a} onChange={e => setForm(f => ({ ...f, option_a: e.target.value }))} /></div>
                    <div><Label>Option B</Label><Input value={form.option_b} onChange={e => setForm(f => ({ ...f, option_b: e.target.value }))} /></div>
                    <div><Label>Option C</Label><Input value={form.option_c} onChange={e => setForm(f => ({ ...f, option_c: e.target.value }))} /></div>
                    <div><Label>Option D</Label><Input value={form.option_d} onChange={e => setForm(f => ({ ...f, option_d: e.target.value }))} /></div>
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <Select value={form.correct_option} onValueChange={v => setForm(f => ({ ...f, correct_option: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Explanation</Label><Textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} /></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_visible} onCheckedChange={v => setForm(f => ({ ...f, is_visible: v }))} /><Label>Visible</Label></div>
                  <Button onClick={() => save.mutate()} className="w-full bg-fire-gradient border-0" disabled={save.isPending}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters: Course → Subject → Topic */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterCourse} onValueChange={v => { setFilterCourse(v); setFilterSubject('all'); setFilterTopic('all'); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={v => { setFilterSubject(v); setFilterTopic('all'); }} disabled={filterCourse === 'all'}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {filteredSubjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTopic} onValueChange={setFilterTopic} disabled={filterSubject === 'all' && filterCourse === 'all'}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {filteredTopics?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} questions</p>

        <div className="space-y-3">
          {filtered.map((q: any, i: number) => (
            <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <Card className={`glass-card border-0 ${!q.is_visible ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{q.question_text}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{q.topics?.subjects?.courses?.title}</Badge>
                        <Badge variant="secondary" className="text-xs">{q.topics?.title}</Badge>
                        <Badge className="text-xs bg-primary/10 text-primary border-0">Answer: {q.correct_option}</Badge>
                        {!q.is_visible && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => toggleVisibility(q)}>
                        {q.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => duplicateQ(q)}><Copy className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        setEditing(q);
                        setFormCourse((q as any).topics?.subjects?.course_id || '');
                        setFormSubject(q.topics?.subject_id || '');
                        setForm({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option, explanation: q.explanation || '', topic_id: q.topic_id, is_visible: q.is_visible });
                        setOpen(true);
                      }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(q.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!filtered.length && <p className="text-muted-foreground text-center py-10">No questions found.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
