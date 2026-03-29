import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, ArrowRight, BookOpen, Globe, User, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const preparations = [
  'SSC Exams', 'Bank PO / Clerk', 'UPSC', 'Railway Exams',
  'State PSC', 'Teaching Exams', 'Defence Exams', 'Other',
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [goal, setGoal] = useState('');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const { user, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!fullName.trim()) { toast.error('Please enter your name'); return; }
    if (!goal) { toast.error('Please select your preparation goal'); return; }
    setLoading(true);
    try {
      await supabase.from('profiles').update({
        full_name: fullName,
        preparation_goal: goal,
        language_preference: language,
        onboarding_completed: true,
      }).eq('user_id', user!.id);
      await fetchProfile(user!.id);
      toast.success('Welcome to Bnoy! 🔥');
      navigate('/dashboard');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-fire-gradient flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Welcome to Bnoy!</h1>
          <p className="text-muted-foreground mt-1">Let's set up your profile</p>
          {/* Progress */}
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 w-16 rounded-full transition-all ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <User className="w-10 h-10 text-primary mx-auto mb-2" />
                    <h2 className="font-heading text-lg font-semibold">What's your name?</h2>
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4" /> What are you preparing for?
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {preparations.map(p => (
                        <button
                          key={p}
                          onClick={() => setGoal(p)}
                          className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                            goal === p
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary/50 border-border hover:border-primary/50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => { if (fullName.trim() && goal) setStep(2); else toast.error('Please fill all fields'); }}
                    className="w-full bg-fire-gradient border-0"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <Globe className="w-10 h-10 text-primary mx-auto mb-2" />
                    <h2 className="font-heading text-lg font-semibold">Choose your language</h2>
                    <p className="text-sm text-muted-foreground">Select your preferred language for the app</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'english', label: 'English', emoji: '🇬🇧' },
                      { id: 'hindi', label: 'हिंदी', emoji: '🇮🇳' },
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setLanguage(l.id)}
                        className={`p-4 rounded-xl text-center transition-all border ${
                          language === l.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/50 border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{l.emoji}</span>
                        <span className="font-medium">{l.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button onClick={handleComplete} className="flex-1 bg-fire-gradient border-0" disabled={loading}>
                      {loading ? 'Setting up...' : 'Start Learning'} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
