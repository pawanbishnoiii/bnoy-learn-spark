import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, BookOpen, Upload, Eye, IndianRupee, ChevronDown, ChevronRight, FileText, Target, Link as LinkIcon, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function AdminCourses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [topicDialog, setTopicDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [subjectForm, setSubjectForm] = useState({ title: '', description: '', course_id: '' });
  const [topicForm, setTopicForm] = useState({ title: '', description: '', subject_id: '' });
  const [form, setForm] = useState({
    title: '', description: '', is_free: true, price: '0', is_published: false,
    category: 'course', thumbnail_url: '', negative_marking: '0', time_per_question: '60',
    cutoff_marks: '0', pdf_url: '', extra_images: [] as string[], extra_links: [] as { label: string; url: string }[],
  });
  const [newImage, setNewImage] = useState('');
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*').order('sort_order');
      return data || [];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['admin-all-subjects'],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('*').order('sort_order');
      return data || [];
    },
  });

  const { data: topics } = useQuery({
    queryKey: ['admin-all-topics'],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('*').order('sort_order');
      return data || [];
    },
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `courses/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      setForm(f => ({ ...f, thumbnail_url: urlData.publicUrl }));
      toast.success('Thumbnail uploaded!');
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, description: form.description, is_free: form.is_free,
        price: parseFloat(form.price) || 0, is_published: form.is_published,
        category: form.category, thumbnail_url: form.thumbnail_url || null,
        negative_marking: parseFloat(form.negative_marking) || 0,
        time_per_question: parseInt(form.time_per_question) || 60,
        cutoff_marks: parseFloat(form.cutoff_marks) || 0,
        pdf_url: form.pdf_url || null,
        extra_images: form.extra_images, extra_links: form.extra_links,
      };
      if (editing) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); setOpen(false); setEditing(null); toast.success(editing ? 'Updated!' : 'Created!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('courses').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Deleted'); },
  });

  const saveSubject = useMutation({
    mutationFn: async () => {
      const payload = { title: subjectForm.title, description: subjectForm.description, course_id: subjectForm.course_id };
      if (editingSubject) {
        const { error } = await supabase.from('subjects').update(payload).eq('id', editingSubject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subjects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-all-subjects'] }); setSubjectDialog(false); setEditingSubject(null); toast.success('Subject saved!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveTopic = useMutation({
    mutationFn: async () => {
      const payload = { title: topicForm.title, description: topicForm.description, subject_id: topicForm.subject_id };
      if (editingTopic) {
        const { error } = await supabase.from('topics').update(payload).eq('id', editingTopic.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('topics').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-all-topics'] }); setTopicDialog(false); setEditingTopic(null); toast.success('Topic saved!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const delSubject = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('subjects').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-all-subjects'] }); toast.success('Subject deleted'); },
  });

  const delTopic = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('topics').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-all-topics'] }); toast.success('Topic deleted'); },
  });

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title, description: c.description || '', is_free: c.is_free,
      price: String(c.price || 0), is_published: c.is_published,
      category: c.category || 'course', thumbnail_url: c.thumbnail_url || '',
      negative_marking: String(c.negative_marking || 0), time_per_question: String(c.time_per_question || 60),
      cutoff_marks: String(c.cutoff_marks || 0), pdf_url: c.pdf_url || '',
      extra_images: (c.extra_images as string[]) || [], extra_links: (c.extra_links as any[]) || [],
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', is_free: true, price: '0', is_published: false, category: 'course', thumbnail_url: '', negative_marking: '0', time_per_question: '60', cutoff_marks: '0', pdf_url: '', extra_images: [], extra_links: [] });
    setOpen(true);
  };

  const courseSubjects = (courseId: string) => subjects?.filter(s => s.course_id === courseId) || [];
  const subjectTopics = (subjectId: string) => topics?.filter(t => t.subject_id === subjectId) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Manage Courses & Test Series</h1>
          <Button onClick={openNew} className="bg-fire-gradient border-0"><Plus className="w-4 h-4 mr-1" /> Add New</Button>
        </div>

        {/* Course Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit' : 'New'} Course / Test Series</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="course">Course</SelectItem><SelectItem value="test_series">Test Series</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>

              {/* Thumbnail */}
              <div>
                <Label>Thumbnail</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.thumbnail_url && <img src={form.thumbnail_url} alt="thumb" className="w-16 h-16 rounded-lg object-cover" />}
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                </div>
                <Input className="mt-2" placeholder="Or paste image URL" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} />
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={v => setForm(f => ({ ...f, is_free: v }))} /><Label>Free</Label></div>
                {!form.is_free && (
                  <div className="flex-1">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div><Label>Negative Marking</Label><Input type="number" step="0.25" value={form.negative_marking} onChange={e => setForm(f => ({ ...f, negative_marking: e.target.value }))} /></div>
                <div><Label>Time/Question (s)</Label><Input type="number" value={form.time_per_question} onChange={e => setForm(f => ({ ...f, time_per_question: e.target.value }))} /></div>
                <div><Label>Cutoff Marks</Label><Input type="number" value={form.cutoff_marks} onChange={e => setForm(f => ({ ...f, cutoff_marks: e.target.value }))} /></div>
              </div>

              {/* PDF URL */}
              <div><Label>PDF URL</Label><Input value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} placeholder="https://..." /></div>

              {/* Extra Images */}
              <div>
                <Label className="flex items-center gap-1"><Image className="w-4 h-4" /> Extra Images</Label>
                {form.extra_images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1">
                    <img src={url} alt="" className="w-12 h-12 rounded object-cover" />
                    <Input value={url} readOnly className="flex-1 text-xs" />
                    <Button size="icon" variant="ghost" onClick={() => setForm(f => ({ ...f, extra_images: f.extra_images.filter((_, j) => j !== i) }))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Image URL" value={newImage} onChange={e => setNewImage(e.target.value)} className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => { if (newImage.trim()) { setForm(f => ({ ...f, extra_images: [...f.extra_images, newImage.trim()] })); setNewImage(''); } }}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Extra Links */}
              <div>
                <Label className="flex items-center gap-1"><LinkIcon className="w-4 h-4" /> Extra Links</Label>
                {form.extra_links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium">{link.label}</span>
                    <Input value={link.url} readOnly className="flex-1 text-xs" />
                    <Button size="icon" variant="ghost" onClick={() => setForm(f => ({ ...f, extra_links: f.extra_links.filter((_, j) => j !== i) }))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Label" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} className="w-1/3" />
                  <Input placeholder="URL" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => { if (newLink.label && newLink.url) { setForm(f => ({ ...f, extra_links: [...f.extra_links, newLink] })); setNewLink({ label: '', url: '' }); } }}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} /><Label>Published</Label></div>
              <Button onClick={() => save.mutate()} className="w-full bg-fire-gradient border-0" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subject Dialog */}
        <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSubject ? 'Edit' : 'Add'} Subject</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Subject Title</Label><Input value={subjectForm.title} onChange={e => setSubjectForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mathematics" /></div>
              <div><Label>Description</Label><Textarea value={subjectForm.description} onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              {/* Suggestions */}
              {!editingSubject && subjectForm.course_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Mathematics', 'English', 'General Knowledge', 'Science', 'Hindi', 'Reasoning', 'Computer', 'Current Affairs'].filter(s => !subjects?.some(sub => sub.course_id === subjectForm.course_id && sub.title.toLowerCase() === s.toLowerCase())).slice(0, 6).map(s => (
                      <Button key={s} size="sm" variant="outline" className="text-xs h-7" onClick={() => setSubjectForm(f => ({ ...f, title: s }))}>{s}</Button>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={() => saveSubject.mutate()} className="w-full bg-fire-gradient border-0" disabled={saveSubject.isPending}>{saveSubject.isPending ? 'Saving...' : 'Save Subject'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Topic Dialog */}
        <Dialog open={topicDialog} onOpenChange={setTopicDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTopic ? 'Edit' : 'Add'} Topic</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Topic Title</Label><Input value={topicForm.title} onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Algebra" /></div>
              <div><Label>Description</Label><Textarea value={topicForm.description} onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              {/* Suggestions */}
              {!editingTopic && topicForm.subject_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Chapter 1', 'Chapter 2', 'Practice Set 1', 'Mock Test 1', 'Previous Year', 'Important Questions'].filter(s => !topics?.some(t => t.subject_id === topicForm.subject_id && t.title.toLowerCase() === s.toLowerCase())).slice(0, 6).map(s => (
                      <Button key={s} size="sm" variant="outline" className="text-xs h-7" onClick={() => setTopicForm(f => ({ ...f, title: s }))}>{s}</Button>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={() => saveTopic.mutate()} className="w-full bg-fire-gradient border-0" disabled={saveTopic.isPending}>{saveTopic.isPending ? 'Saving...' : 'Save Topic'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Course List with nested subjects/topics */}
        <div className="space-y-3">
          {courses?.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-0">
                  {/* Course Header */}
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {c.thumbnail_url ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}>
                      <p className="font-medium">{c.title}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">{c.category || 'course'}</Badge>
                        <Badge variant="secondary" className="text-xs">{c.is_free ? 'Free' : `₹${c.price}`}</Badge>
                        <Badge variant={c.is_published ? 'default' : 'outline'} className="text-xs">{c.is_published ? 'Published' : 'Draft'}</Badge>
                        <Badge variant="secondary" className="text-xs">{courseSubjects(c.id).length} subjects</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" />{c.total_views || 0}</span>
                      <Button size="icon" variant="ghost" onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}>
                        {expandedCourse === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  {/* Expanded: Subjects & Topics */}
                  {expandedCourse === c.id && (
                    <div className="border-t px-4 py-3 bg-secondary/30">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Subjects</p>
                        <Button size="sm" variant="outline" onClick={() => { setEditingSubject(null); setSubjectForm({ title: '', description: '', course_id: c.id }); setSubjectDialog(true); }}>
                          <Plus className="w-3 h-3 mr-1" /> Add Subject
                        </Button>
                      </div>
                      {courseSubjects(c.id).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No subjects yet. Add one above.</p>
                      ) : courseSubjects(c.id).map(sub => (
                        <div key={sub.id} className="mb-3 ml-2 border-l-2 border-primary/20 pl-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{sub.title}</span>
                              <Badge variant="secondary" className="text-[10px]">{subjectTopics(sub.id).length} topics</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingTopic(null); setTopicForm({ title: '', description: '', subject_id: sub.id }); setTopicDialog(true); }}>
                                <Plus className="w-3 h-3 mr-1" /> Topic
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingSubject(sub); setSubjectForm({ title: sub.title, description: sub.description || '', course_id: sub.course_id }); setSubjectDialog(true); }}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => delSubject.mutate(sub.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Topics */}
                          {subjectTopics(sub.id).map(tp => (
                            <div key={tp.id} className="ml-4 mt-1 flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-accent" />
                                <span className="text-xs">{tp.title}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingTopic(tp); setTopicForm({ title: tp.title, description: tp.description || '', subject_id: tp.subject_id }); setTopicDialog(true); }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => delTopic.mutate(tp.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!courses?.length && <p className="text-muted-foreground text-center py-10">No courses yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
