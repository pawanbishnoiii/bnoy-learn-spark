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
  CheckCircle2, XCircle, SkipForward, Trophy, Target, Clock, BarChart3,
  Share2, ArrowRight, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare, Flag,
  ChevronLeft, ChevronRight, Star, AlertTriangle, User
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

  const { data: myAttempts } = useQuery({
    queryKey: ['my-topic-attempts', attempt?.topic_id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('topic_id', attempt!.topic_id).eq('user_id', user!.id).eq('is_completed', true).order('completed_at', { ascending: false });
      return data || [];
    },
    enabled: !!attempt?.topic_id && !!user,
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
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length) : 0;
  const avgTime = allAttempts?.length ? Math.round((allAttempts.reduce((s, a) => s + (a.time_taken_seconds || 0), 0)) / allAttempts.length) : 0;
  const bestScore = allScores.length > 0 ? Math.round(Math.max(...allScores)) : 0;

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
      <div className="max-w-3xl mx-auto space-y-6">
        {!showSolutions ? (
          <>
            {/* Result Header with User Info */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="glass-card border-0 overflow-hidden">
                <div className="bg-hero-gradient p-8 text-center text-primary-foreground relative">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <div className="relative z-10">
                    {/* User Avatar & Name */}
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-4 ring-primary-foreground/30">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-heading text-2xl">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-heading font-semibold text-lg mb-1">{profile?.full_name || 'Learner'}</p>
                    <Badge className="bg-primary-foreground/20 border-0 text-primary-foreground text-xs mb-4">
                      {passed ? '🎉 Excellent!' : '💪 Keep Practicing!'}
                    </Badge>
                    <div className="mt-3">
                      <p className="text-6xl font-heading font-black">{correct}/{totalQ}</p>
                      <p className="text-primary-foreground/80 text-lg mt-1">{accuracy}% Accuracy</p>
                    </div>
                    {cutoff > 0 && (
                      <Badge className={`mt-3 ${passed ? 'bg-success' : 'bg-destructive'} text-primary-foreground border-0`}>
                        Cutoff: {cutoff} · {passed ? 'PASSED ✓' : 'NOT PASSED'}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    {(attempt as any)?.topics?.title} · {(attempt as any)?.topics?.subjects?.title}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Correct', value: correct, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/8' },
                { label: 'Wrong', value: wrong, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/8' },
                { label: 'Skipped', value: skipped, icon: SkipForward, color: 'text-warning', bg: 'bg-warning/8' },
                { label: 'Time', value: formatTime(timeTaken), icon: Clock, color: 'text-primary', bg: 'bg-primary/8' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-card border-0">
                    <CardContent className="p-4 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <p className="text-xl font-heading font-bold">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Performance Analysis */}
            <Card className="glass-card border-0">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-heading font-semibold">Performance Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Percentile', value: `${percentile}%`, gradient: true },
                    { label: 'Best Score', value: `${bestScore}%` },
                    { label: 'Avg Score', value: `${avgScore}%` },
                    { label: 'Avg Time', value: formatTime(avgTime) },
                    { label: 'Your Time', value: formatTime(timeTaken) },
                    { label: 'Avg Time/Q', value: `${totalQ > 0 ? Math.round(timeTaken / totalQ) : 0}s` },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className={`text-2xl font-heading font-bold ${item.gradient ? 'text-fire-gradient' : ''}`}>{item.value}</p>
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Score</span><span>{accuracy}%</span></div>
                  <Progress value={accuracy} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Attempt History */}
            {myAttempts && myAttempts.length > 1 && (
              <Card className="glass-card border-0">
                <CardContent className="p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3">Your Attempt History ({myAttempts.length})</h3>
                  <div className="space-y-2">
                    {myAttempts.slice(0, 5).map((a: any, i: number) => {
                      const acc = a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0;
                      const isCurrent = a.id === attemptId;
                      return (
                        <div key={a.id} onClick={() => !isCurrent && navigate(`/quiz-result/${a.id}`)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-sm cursor-pointer transition-colors ${isCurrent ? 'bg-primary/8 ring-1 ring-primary/20' : 'bg-muted/50 hover:bg-muted'}`}>
                          <div>
                            <span className="font-medium">#{myAttempts.length - i}</span>
                            {isCurrent && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">Current</Badge>}
                            <span className="text-xs text-muted-foreground ml-2">{new Date(a.completed_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`font-heading font-bold ${acc >= 60 ? 'text-success' : 'text-destructive'}`}>{acc}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center pb-4">
              <Button onClick={() => setShowSolutions(true)} className="bg-fire-gradient border-0 rounded-2xl" size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" /> View Solutions
              </Button>
              <Button variant="outline" size="lg" onClick={retryQuiz} className="rounded-2xl">
                <RefreshCw className="w-5 h-5 mr-2" /> Retry
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare} className="rounded-2xl">
                <Share2 className="w-5 h-5 mr-2" /> Share
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-2xl">
                <Link to="/leaderboard"><Trophy className="w-5 h-5 mr-2" /> Leaderboard</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowSolutions(false)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
              <Badge variant="secondary">Q {currentSolIndex + 1}/{answers.length}</Badge>
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
                <Card className="glass-card border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {currentAnswer.is_correct ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                       currentAnswer.selected_option ? <XCircle className="w-5 h-5 text-destructive" /> :
                       <SkipForward className="w-5 h-5 text-warning" />}
                      <Badge variant={currentAnswer.is_correct ? 'default' : currentAnswer.selected_option ? 'destructive' : 'secondary'}>
                        {currentAnswer.is_correct ? 'Correct' : currentAnswer.selected_option ? 'Wrong' : 'Skipped'}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-lg font-semibold mb-4">Q{currentSolIndex + 1}. {currentQuestion.question_text}</h2>
                    <div className="space-y-2.5">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const optText = currentQuestion[`option_${opt.toLowerCase()}` as keyof typeof currentQuestion];
                        const isCorrect = opt === currentQuestion.correct_option;
                        const isSelected = opt === currentAnswer.selected_option;
                        return (
                          <div key={opt} className={`p-3 rounded-xl border-2 ${isCorrect ? 'border-success bg-success/8' : isSelected ? 'border-destructive bg-destructive/8' : 'border-border'}`}>
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-semibold mr-3 ${isCorrect ? 'bg-success text-success-foreground' : isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}>{opt}</span>
                            <span className="text-sm">{optText as string}</span>
                            {isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-success" />}
                            {isSelected && !isCorrect && <XCircle className="inline w-4 h-4 ml-2 text-destructive" />}
                          </div>
                        );
                      })}
                    </div>
                    {currentQuestion.explanation && (
                      <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
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
                              <p className="text-sm text-muted-foreground">What's wrong with this question?</p>
                              <Textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="E.g., Wrong answer, Unclear options..." rows={4} />
                              <Button onClick={() => reportMutation.mutate()} className="w-full bg-fire-gradient border-0" disabled={reportMutation.isPending}>
                                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex gap-2">
                        {currentSolIndex > 0 && <Button variant="outline" size="sm" onClick={() => setCurrentSolIndex(i => i - 1)}><ChevronLeft className="w-4 h-4" /> Prev</Button>}
                        {currentSolIndex < answers.length - 1 && <Button size="sm" className="bg-fire-gradient border-0" onClick={() => setCurrentSolIndex(i => i + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
