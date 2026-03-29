import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, BookOpen, LogOut, Camera, Save, Globe, User, Phone, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, profile, roles, signOut, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [prepGoal, setPrepGoal] = useState(profile?.preparation_goal || '');
  const [lang, setLang] = useState(profile?.language_preference || 'english');
  const [gender, setGender] = useState(profile?.gender || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPrepGoal(profile.preparation_goal || '');
      setLang(profile.language_preference || 'english');
      setGender(profile.gender || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('user_id', user!.id).eq('is_completed', true);
      const total = attempts?.length || 0;
      const correct = attempts?.reduce((s, a) => s + a.correct_answers, 0) || 0;
      const questions = attempts?.reduce((s, a) => s + a.total_questions, 0) || 0;
      return { total, accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0 };
    },
    enabled: !!user,
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
      await fetchProfile(user.id);
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await (supabase as any).from('profiles').update({
        full_name: fullName,
        preparation_goal: prepGoal,
        language_preference: lang,
        gender: gender || null,
        phone: phone || null,
      }).eq('user_id', user.id);
      await fetchProfile(user.id);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-0 overflow-hidden">
            <div className="bg-hero-gradient h-24 relative">
              <div className="absolute inset-0 bg-grid opacity-10" />
            </div>
            <CardContent className="p-6 -mt-12 text-center relative">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto ring-4 ring-background shadow-xl">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-fire-gradient text-primary-foreground text-3xl font-heading">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <h1 className="font-heading text-2xl font-bold mt-3">{profile?.full_name || 'User'}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {roles.map(r => (
                  <Badge key={r} className={r === 'admin' ? 'bg-fire-gradient border-0 text-primary-foreground' : 'bg-primary/10 text-primary border-0'}>
                    <Shield className="w-3 h-3 mr-1" /> {r}
                  </Badge>
                ))}
                {profile?.preparation_goal && <Badge variant="outline">🎯 {profile.preparation_goal}</Badge>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mt-6">
                {[
                  { label: 'XP', value: profile?.xp_points || 0, icon: Trophy, color: 'text-primary' },
                  { label: 'Streak', value: `${profile?.daily_streak || 0}d`, icon: Flame, color: 'text-accent' },
                  { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, icon: Target, color: 'text-success' },
                  { label: 'Quizzes', value: stats?.total || 0, icon: BookOpen, color: 'text-warning' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-2xl bg-muted/50">
                    <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                    <p className="text-lg font-heading font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Info</CardTitle>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-xl">Edit</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="rounded-xl" /></div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="rounded-xl" /></div>
                  <div><Label>Preparation Goal</Label><Input value={prepGoal} onChange={e => setPrepGoal(e.target.value)} placeholder="e.g. SSC CGL, UPSC, Bank PO" className="rounded-xl" /></div>
                  <div>
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Language</Label>
                    <Select value={lang} onValueChange={setLang}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-fire-gradient border-0 rounded-2xl">
                      <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 rounded-2xl">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: 'Email', value: user?.email },
                    { icon: User, label: 'Gender', value: profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set' },
                    { icon: Phone, label: 'Phone', value: profile?.phone || 'Not set' },
                    { icon: Globe, label: 'Language', value: profile?.language_preference === 'hindi' ? 'हिन्दी' : 'English' },
                    { icon: Target, label: 'Goal', value: profile?.preparation_goal || 'Not set' },
                    { icon: Calendar, label: 'Joined', value: joinDate },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Button variant="destructive" onClick={handleSignOut} className="w-full rounded-2xl">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </DashboardLayout>
  );
}
