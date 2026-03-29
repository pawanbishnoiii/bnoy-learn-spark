import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Upload, Clock, CheckCircle2, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function DoubtsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: doubts } = useQuery({
    queryKey: ['my-doubts', user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('doubts').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `doubts/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  const submitDoubt = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim()) throw new Error('Title required');
      const { error } = await (supabase as any).from('doubts').insert({
        user_id: user.id, title, description, image_url: imageUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-doubts'] });
      setOpen(false); setTitle(''); setDescription(''); setImageUrl('');
      toast.success('Doubt submitted! Admin will reply soon.');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    open: 'bg-warning/10 text-warning',
    answered: 'bg-success/10 text-success',
    closed: 'bg-muted text-muted-foreground',
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" /> My Doubts</h1>
            <p className="text-muted-foreground text-sm mt-1">Ask questions and get answers from experts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fire-gradient border-0"><Plus className="w-4 h-4 mr-1" /> Ask Doubt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Ask a Doubt</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief question" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain your doubt in detail..." rows={4} /></div>
                <div>
                  <Label>Upload Image (optional)</Label>
                  {imageUrl && <img src={imageUrl} alt="Doubt" className="w-full h-32 object-cover rounded-lg mt-2 mb-2" />}
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <Button onClick={() => submitDoubt.mutate()} className="w-full bg-fire-gradient border-0" disabled={submitDoubt.isPending}>
                  {submitDoubt.isPending ? 'Submitting...' : 'Submit Doubt'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!doubts?.length ? (
          <Card className="glass-card border-0">
            <CardContent className="p-10 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No doubts yet. Ask your first question!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {doubts.map((d: any, i: number) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{d.title}</p>
                          <Badge className={`text-[10px] ${statusColors[d.status] || statusColors.open}`}>{d.status}</Badge>
                        </div>
                        {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                        {d.image_url && (
                          <img src={d.image_url} alt="Doubt" className="mt-2 rounded-lg max-h-32 object-cover" />
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(d.created_at).toLocaleString()}
                        </p>
                        {d.admin_reply && (
                          <div className="mt-3 p-3 rounded-lg bg-success/5 border border-success/20">
                            <p className="text-xs font-medium text-success mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Admin Reply</p>
                            <p className="text-sm">{d.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
