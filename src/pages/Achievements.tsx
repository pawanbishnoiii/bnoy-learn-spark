import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, Target, Flame, Zap, Star, Award, Medal } from 'lucide-react';

const achievementDefs = [
  { id: 'first_quiz', title: 'First Steps', desc: 'Complete your first quiz', icon: BookOpen, xp: 10, check: (s: any) => s.totalQuizzes >= 1 },
  { id: 'five_quizzes', title: 'Quiz Explorer', desc: 'Complete 5 quizzes', icon: Target, xp: 50, check: (s: any) => s.totalQuizzes >= 5 },
  { id: 'ten_quizzes', title: 'Quiz Master', desc: 'Complete 10 quizzes', icon: Star, xp: 100, check: (s: any) => s.totalQuizzes >= 10 },
  { id: 'twenty_quizzes', title: 'Quiz Champion', desc: 'Complete 20 quizzes', icon: Award, xp: 200, check: (s: any) => s.totalQuizzes >= 20 },
  { id: 'perfect_score', title: 'Perfect Score', desc: 'Get 100% on any quiz', icon: Zap, xp: 50, check: (s: any) => s.hasPerfect },
  { id: 'accuracy_80', title: 'Sharp Mind', desc: 'Maintain 80%+ overall accuracy', icon: Target, xp: 75, check: (s: any) => s.accuracy >= 80 && s.totalQuizzes >= 3 },
  { id: 'streak_3', title: 'On Fire', desc: 'Maintain a 3-day streak', icon: Flame, xp: 30, check: (s: any) => s.streak >= 3 },
  { id: 'streak_7', title: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: Flame, xp: 70, check: (s: any) => s.streak >= 7 },
  { id: 'xp_100', title: 'Rising Star', desc: 'Earn 100 XP', icon: Star, xp: 0, check: (s: any) => s.xp >= 100 },
  { id: 'xp_500', title: 'Knowledge Seeker', desc: 'Earn 500 XP', icon: Medal, xp: 0, check: (s: any) => s.xp >= 500 },
  { id: 'xp_1000', title: 'Scholar', desc: 'Earn 1000 XP', icon: Trophy, xp: 0, check: (s: any) => s.xp >= 1000 },
  { id: 'fifty_quizzes', title: 'Legend', desc: 'Complete 50 quizzes', icon: Trophy, xp: 500, check: (s: any) => s.totalQuizzes >= 50 },
];

export default function Achievements() {
  const { user, profile } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['achievement-stats', user?.id],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_completed', true);

      const totalQuizzes = attempts?.length || 0;
      const totalCorrect = attempts?.reduce((s, a) => s + a.correct_answers, 0) || 0;
      const totalQuestions = attempts?.reduce((s, a) => s + a.total_questions, 0) || 0;
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const hasPerfect = attempts?.some(a => a.correct_answers === a.total_questions && a.total_questions > 0) || false;

      return {
        totalQuizzes,
        accuracy,
        hasPerfect,
        streak: profile?.daily_streak || 0,
        xp: profile?.xp_points || 0,
      };
    },
    enabled: !!user,
  });

  const unlocked = achievementDefs.filter(a => stats && a.check(stats));
  const locked = achievementDefs.filter(a => !stats || !a.check(stats));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-warning" /> Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            {unlocked.length}/{achievementDefs.length} unlocked
          </p>
        </div>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-lg text-success">🏆 Unlocked</h2>
            {unlocked.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-card border-0 border-l-4 border-l-success">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <a.icon className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.desc}</p>
                    </div>
                    {a.xp > 0 && <Badge variant="secondary">+{a.xp} XP</Badge>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-lg text-muted-foreground">🔒 Locked</h2>
            {locked.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className="glass-card border-0 opacity-60">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <a.icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.desc}</p>
                    </div>
                    {a.xp > 0 && <Badge variant="outline">+{a.xp} XP</Badge>}
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
