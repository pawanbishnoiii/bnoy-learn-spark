import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Upload, Clock, CheckCircle2, Phone, Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DoubtsPage() {
  const { user, profile, isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDoubt, setSelectedDoubt] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatUploading, setChatUploading] = useState(false);

  const { data: doubts } = useQuery({
    queryKey: ['my-doubts', user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('doubts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['doubt-messages', selectedDoubt?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('doubt_messages').select('*').eq('doubt_id', selectedDoubt.id).order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedDoubt,
  });

  // Realtime subscription for chat
  useEffect(() => {
    if (!selectedDoubt) return;
    const channel = supabase
      .channel(`doubt-${selectedDoubt.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doubt_messages', filter: `doubt_id=eq.${selectedDoubt.id}` }, () => {
        refetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDoubt?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 200);
      const path = `doubts/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      clearInterval(progressInterval);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      setUploadProgress(100);
      toast.success('Image uploaded!');
    } catch (err: any) { toast.error(err.message); }
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedDoubt) return;
    setChatUploading(true);
    try {
      const path = `doubts/chat/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      await (supabase as any).from('doubt_messages').insert({
        doubt_id: selectedDoubt.id,
        sender_id: user.id,
        image_url: urlData.publicUrl,
        is_admin: isAdmin,
      });
      refetchMessages();
    } catch (err: any) { toast.error(err.message); }
    setChatUploading(false);
  };

  const submitDoubt = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim()) throw new Error('Title required');
      const { error } = await (supabase as any).from('doubts').insert({
        user_id: user.id, title, description, image_url: imageUrl || null,
        whatsapp_number: whatsapp || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-doubts'] });
      setOpen(false); setTitle(''); setDescription(''); setImageUrl(''); setWhatsapp('');
      toast.success('Doubt submitted! You will get a reply soon.');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDoubt || !chatMessage.trim()) return;
      const { error } = await (supabase as any).from('doubt_messages').insert({
        doubt_id: selectedDoubt.id,
        sender_id: user.id,
        message: chatMessage,
        is_admin: isAdmin,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setChatMessage('');
      refetchMessages();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    open: 'bg-warning/10 text-warning',
    answered: 'bg-success/10 text-success',
    closed: 'bg-muted text-muted-foreground',
  };

  // Chat View
  if (selectedDoubt) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
          {/* Chat Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDoubt(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-semibold text-sm truncate">{selectedDoubt.title}</h2>
              <Badge className={`text-[10px] ${statusColors[selectedDoubt.status] || statusColors.open}`}>{selectedDoubt.status}</Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {/* Initial doubt as first message */}
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-muted">
                <p className="text-sm font-medium">{selectedDoubt.title}</p>
                {selectedDoubt.description && <p className="text-sm text-muted-foreground mt-1">{selectedDoubt.description}</p>}
                {selectedDoubt.image_url && <img src={selectedDoubt.image_url} alt="Doubt" className="mt-2 rounded-xl max-h-40 object-cover" />}
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(selectedDoubt.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Chat messages */}
            {messages?.map((m: any) => {
              const isMe = m.sender_id === user?.id;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                    {m.is_admin && !isMe && <p className="text-[10px] font-medium text-success mb-1">Admin</p>}
                    {m.message && <p className="text-sm">{m.message}</p>}
                    {m.image_url && <img src={m.image_url} alt="Chat" className="mt-1 rounded-xl max-h-40 object-cover" />}
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {selectedDoubt.admin_reply && !messages?.length && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-success/10">
                  <p className="text-[10px] font-medium text-success mb-1">Admin Reply</p>
                  <p className="text-sm">{selectedDoubt.admin_reply}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t pt-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => chatFileRef.current?.click()} disabled={chatUploading} className="shrink-0">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
            <Input
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder="Type your message..."
              className="rounded-2xl"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage.mutate()}
            />
            <Button size="icon" onClick={() => sendMessage.mutate()} disabled={!chatMessage.trim() || sendMessage.isPending}
              className="bg-fire-gradient border-0 rounded-2xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-primary" /> My Doubts</h1>
            <p className="text-muted-foreground text-sm mt-1">Ask questions and chat with experts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-fire-gradient border-0 rounded-2xl"><Plus className="w-4 h-4 mr-1" /> Ask Doubt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Ask a Doubt</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief question" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain your doubt in detail..." rows={4} /></div>
                <div>
                  <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp Number (optional)</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+91 9876543210" type="tel" />
                </div>
                <div>
                  <Label>Upload Image (optional)</Label>
                  {imageUrl && <img src={imageUrl} alt="Doubt" className="w-full h-32 object-cover rounded-xl mt-2 mb-2" />}
                  {uploading && (
                    <div className="mt-2 mb-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl">
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <Button onClick={() => submitDoubt.mutate()} className="w-full bg-fire-gradient border-0 rounded-2xl" disabled={submitDoubt.isPending}>
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
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedDoubt(d)} className="cursor-pointer">
                <Card className="glass-card border-0 hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{d.title}</p>
                          <Badge className={`text-[10px] ${statusColors[d.status] || statusColors.open}`}>{d.status}</Badge>
                        </div>
                        {d.description && <p className="text-sm text-muted-foreground line-clamp-1">{d.description}</p>}
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(d.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Send className="w-4 h-4 text-muted-foreground" />
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
