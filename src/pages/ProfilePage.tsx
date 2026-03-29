import { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, BookOpen, LogOut, Camera, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, profile, signOut, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [prepGoal, setPrepGoal] = useState(profile?.preparation_goal || '');
  const [lang, setLang] = useState(profile?.language_preference || 'english');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from('quiz_attempts').select('*').eq('user_id', user!.id).eq('is_completed', true);
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
      await supabase.from('profiles').update({
        full_name: fullName,
        preparation_goal: prepGoal,
        language_preference: lang,
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-0">
            <CardContent className="p-8 text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-fire-gradient text-primary-foreground text-3xl font-heading">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-3 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                  disabled={uploading}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {editing ? (
                <div className="space-y-4 text-left mt-4">
                  <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                  <div><Label>Preparation Goal</Label><Input value={prepGoal} onChange={e => setPrepGoal(e.target.value)} placeholder="e.g. SSC CGL, UPSC, Bank PO" /></div>
                  <div>
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Language</Label>
                    <Select value={lang} onValueChange={setLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-fire-gradient border-0">
                      <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-2xl font-bold">{profile?.full_name || 'User'}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {profile?.preparation_goal && (
                    <p className="text-sm text-primary mt-1">🎯 {profile.preparation_goal}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3" /> {profile?.language_preference === 'hindi' ? 'हिन्दी' : 'English'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                    setFullName(profile?.full_name || '');
                    setPrepGoal(profile?.preparation_goal || '');
                    setLang(profile?.language_preference || 'english');
                    setEditing(true);
                  }}>Edit Profile</Button>
                </>
              )}

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xl font-bold">{profile?.xp_points || 0}</p>
                  <p className="text-xs text-muted-foreground">XP Points</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                    <Flame className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-xl font-bold">{profile?.daily_streak || 0}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-success/10 flex items-center justify-center mb-2">
                    <Target className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-xl font-bold">{stats?.accuracy || 0}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{stats?.total || 0} quizzes completed</p>
          </CardContent>
        </Card>

        <Button variant="destructive" onClick={handleSignOut} className="w-full">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </DashboardLayout>
  );
}
