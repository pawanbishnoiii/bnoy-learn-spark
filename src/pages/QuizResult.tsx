import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, SkipForward, Trophy, Target, Clock,
  Share2, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown, Flag,
  ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function QuizResult() {
  const { attemptId } = useParams();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSolutions, setShowSolutions] = useState(false);
  const [currentSolIndex, setCurrentSolIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportingQuestionId, setReportingQuestionId] = useState('');

  const { data: attempt } = useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_attempts').select('*, topics(title, subject_id, subjects(title, course_id, courses(title, cutoff_marks)))').eq('id', attemptId!).single();
      return data;
    },
  });

  const { data: answers } = useQuery({
    queryKey: ['quiz-answers', attemptId],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_answers').select('*, questions(*)').eq('attempt_id', attemptId!).order('answered_at');
      return data || [];
    },
  });

  const { data: allAttempts } = useQuery({
    queryKey: ['topic-all-attempts', attempt?.topic_id],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_attempts').select('correct_answers, total_questions, time_taken_seconds').eq('topic_id', attempt!.topic_id).eq('is_completed', true);
      return data || [];
    },
    enabled: !!attempt?.topic_id,
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user || !reportingQuestionId || !reportText.trim()) throw new Error('Fill report details');
      const { error } = await (supabase as any).from('question_reports').insert({
        user_id: user.id, question_id: reportingQuestionId, report_text: reportText,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Report submitted!'); setReportOpen(false); setReportText(''); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!attempt || !answers) {
    return <DashboardLayout><div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div></DashboardLayout>;
  }

  const totalQ = attempt.total_questions;
  const correct = attempt.correct_answers;
  const wrong = answers.filter(a => a.selected_option && !a.is_correct).length;
  const skipped = answers.filter(a => !a.selected_option).length;
  const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
  const cutoff = (attempt as any)?.topics?.subjects?.courses?.cutoff_marks || 0;
  const passed = cutoff > 0 ? correct >= cutoff : accuracy >= 60;
  const timeTaken = attempt.time_taken_seconds || 0;

  const allScores = allAttempts?.map(a => a.total_questions > 0 ? (a.correct_answers / a.total_questions) * 100 : 0) || [];
  const belowMe = allScores.filter(s => s < accuracy).length;
  const percentile = allScores.length > 0 ? Math.round((belowMe / allScores.length) * 100) : 0;

  const formatTime = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}`; };
  const handleShare = () => {
    const text = `I scored ${correct}/${totalQ} (${accuracy}%) on ${(attempt as any)?.topics?.title || 'Quiz'}! 🎯`;
    if (navigator.share) { navigator.share({ title: 'Quiz Result', text }); } else { navigator.clipboard.writeText(text); toast.success('Result copied!'); }
  };
  const retryQuiz = () => navigate(`/quiz/${attempt.topic_id}`);

  const currentAnswer = answers[currentSolIndex];
  const currentQuestion = currentAnswer?.questions;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        {!showSolutions ? (
          <div className="space-y-5">
            {/* Score header - matching reference image */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              {/* Purple header bar */}
              <div className="bg-hero-gradient rounded-t-3xl p-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10" />
                <div className="relative z-10">
                  <p className="text-primary-foreground font-heading font-bold text-lg">
                    Correct Answer {correct}/{totalQ}
                  </p>
                </div>
              </div>

              {/* White card with avatar + rank */}
              <div className="bg-card rounded-b-3xl shadow-xl p-6 -mt-1 text-center">
                {/* Avatar with ribbon */}
                <div className="relative inline-block -mt-12 mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary/30 mx-auto bg-white shadow-lg">
                      <Avatar className="w-full h-full rounded-2xl">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} className="object-cover" />}
                        <AvatarFallback className="bg-hero-gradient text-primary-foreground text-2xl font-heading rounded-2xl">
                          {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Ribbon shape */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28">
                      <div className="bg-gradient-to-b from-primary/80 to-primary/40 backdrop-blur-sm rounded-b-xl px-4 py-2 text-center">
                        <p className="text-primary-foreground font-heading font-bold text-sm truncate">
                          {profile?.full_name || 'Learner'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-muted-foreground text-sm">Rank</p>
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                    className="text-5xl font-heading font-black text-foreground">
                    {percentile > 0 ? percentile : '--'}
                  </motion.p>
                </div>

                <div className="mt-6">
                  <h2 className="font-heading text-xl font-bold">
                    {passed ? "Congratulations, you've completed this quiz!" : "Keep practicing to improve!"}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2">
                    {passed ? "Let's keep testing your knowledge by playing more quizzes!" : "Don't give up — every attempt makes you stronger!"}
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { label: 'Correct', value: correct, color: 'text-success' },
                    { label: 'Wrong', value: wrong, color: 'text-destructive' },
                    { label: 'Skipped', value: skipped, color: 'text-warning' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-2xl bg-muted/50 text-center">
                      <p className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Time: {formatTime(timeTaken)}</span>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button onClick={() => setShowSolutions(true)} className="w-full bg-fire-gradient border-0 rounded-2xl h-14 text-lg font-heading font-bold shadow-xl">
                <CheckCircle2 className="w-5 h-5 mr-2" /> View Solutions
              </Button>
              <Button onClick={retryQuiz} className="w-full bg-accent hover:bg-accent/90 border-0 rounded-2xl h-14 text-lg font-heading font-bold shadow-xl text-accent-foreground">
                <RefreshCw className="w-5 h-5 mr-2" /> Explore More
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
                <Button variant="outline" className="flex-1 rounded-2xl" asChild>
                  <Link to="/leaderboard"><Trophy className="w-4 h-4 mr-1" /> Leaderboard</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowSolutions(false)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Badge variant="secondary" className="rounded-xl">Q {currentSolIndex + 1}/{answers.length}</Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {answers.map((a, i) => (
                <button key={a.id} onClick={() => setCurrentSolIndex(i)}
                  className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${
                    i === currentSolIndex ? 'bg-fire-gradient text-primary-foreground ring-2 ring-primary/50' :
                    a.is_correct ? 'bg-success/15 text-success' :
                    a.selected_option ? 'bg-destructive/15 text-destructive' :
                    'bg-warning/15 text-warning'
                  }`}>{i + 1}</button>
              ))}
            </div>

            {currentQuestion && (
              <motion.div key={currentSolIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="glass-card border-0 rounded-3xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {currentAnswer.is_correct ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                       currentAnswer.selected_option ? <XCircle className="w-5 h-5 text-destructive" /> :
                       <SkipForward className="w-5 h-5 text-warning" />}
                      <Badge variant={currentAnswer.is_correct ? 'default' : currentAnswer.selected_option ? 'destructive' : 'secondary'}>
                        {currentAnswer.is_correct ? 'Correct' : currentAnswer.selected_option ? 'Wrong' : 'Skipped'}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-base font-semibold mb-4">Q{currentSolIndex + 1}. {currentQuestion.question_text}</h2>
                    <div className="space-y-2.5">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const optText = currentQuestion[`option_${opt.toLowerCase()}` as keyof typeof currentQuestion];
                        const isCorrect = opt === currentQuestion.correct_option;
                        const isSelected = opt === currentAnswer.selected_option;
                        return (
                          <div key={opt} className={`p-3 rounded-2xl border-2 ${isCorrect ? 'border-success bg-success/8' : isSelected ? 'border-destructive bg-destructive/8' : 'border-border'}`}>
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-semibold mr-3 ${isCorrect ? 'bg-success text-success-foreground' : isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}>{opt}</span>
                            <span className="text-sm">{optText as string}</span>
                            {isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-success" />}
                            {isSelected && !isCorrect && <XCircle className="inline w-4 h-4 ml-2 text-destructive" />}
                          </div>
                        );
                      })}
                    </div>
                    {currentQuestion.explanation && (
                      <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/15">
                        <p className="text-xs font-medium text-primary mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toast.success('Liked!')}><ThumbsUp className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('Feedback noted')}><ThumbsDown className="w-4 h-4" /></Button>
                        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setReportingQuestionId(currentQuestion.id)}><Flag className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle className="font-heading">Report Question</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <Textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="What's wrong with this question?" rows={4} />
                              <Button onClick={() => reportMutation.mutate()} className="w-full bg-fire-gradient border-0" disabled={reportMutation.isPending}>
                                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex gap-2">
                        {currentSolIndex > 0 && <Button variant="outline" size="sm" onClick={() => setCurrentSolIndex(i => i - 1)}><ChevronLeft className="w-4 h-4" /></Button>}
                        {currentSolIndex < answers.length - 1 && <Button size="sm" className="bg-fire-gradient border-0" onClick={() => setCurrentSolIndex(i => i + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
