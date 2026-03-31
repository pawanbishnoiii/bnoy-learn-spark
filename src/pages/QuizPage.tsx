import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, ArrowRight, Flag, SkipForward, AlertTriangle, Pause, Play, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

type QuestionStatus = 'unanswered' | 'answered' | 'skipped' | 'marked';

export default function QuizPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'topic';
  const subjectId = searchParams.get('subjectId');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [showPastAttempts, setShowPastAttempts] = useState(true);

  const { data: topic } = useQuery({
    queryKey: ['quiz-topic', topicId],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('*, subjects(title, course_id)').eq('id', topicId!).single();
      return data;
    },
    enabled: !!topicId && mode === 'topic',
  });

  const { data: courseSettings } = useQuery({
    queryKey: ['course-settings', topic?.subjects?.course_id, subjectId],
    queryFn: async () => {
      let courseId = topic?.subjects?.course_id;
      if (!courseId && subjectId) {
        const { data: sub } = await supabase.from('subjects').select('course_id').eq('id', subjectId).single();
        courseId = sub?.course_id;
      }
      if (!courseId) return null;
      const { data } = await supabase.from('courses').select('negative_marking, time_per_question').eq('id', courseId).single();
      return data;
    },
    enabled: !!(topic?.subjects?.course_id || subjectId),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions', topicId, mode, subjectId],
    queryFn: async () => {
      if (mode === 'full' && subjectId) {
        const { data: topics } = await supabase.from('topics').select('id').eq('subject_id', subjectId);
        if (!topics?.length) return [];
        const { data } = await supabase.from('questions').select('*, topics(title)').in('topic_id', topics.map(t => t.id)).eq('is_visible', true).order('sort_order');
        return data || [];
      } else {
        const { data } = await supabase.from('questions').select('*, topics(title)').eq('topic_id', topicId!).eq('is_visible', true).order('sort_order');
        return data || [];
      }
    },
    enabled: !!(topicId || subjectId),
  });

  const { data: pastAttempts } = useQuery({
    queryKey: ['past-attempts', topicId, user?.id],
    queryFn: async () => {
      const effectiveTopicId = topicId || questions?.[0]?.topic_id;
      if (!effectiveTopicId || !user) return [];
      const { data } = await supabase.from('quiz_attempts').select('*').eq('user_id', user.id).eq('topic_id', effectiveTopicId).eq('is_completed', true).order('completed_at', { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!user && !!(topicId || questions?.[0]?.topic_id),
  });

  const { data: bookmarks, refetch: refetchBookmarks } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('bookmarks').select('question_id').eq('user_id', user!.id);
      return new Set(data?.map(b => b.question_id) || []);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (courseSettings && questions?.length) {
      const totalTime = (courseSettings.time_per_question || 60) * questions.length;
      setTimeRemaining(totalTime);
      setNegativeMarking(courseSettings.negative_marking || 0);
    }
  }, [courseSettings, questions]);

  useEffect(() => {
    if (submitted || paused || !attemptId) return;
    const interval = setInterval(() => {
      setTimeElapsed(t => t + 1);
      if (timeRemaining !== null) {
        setTimeRemaining(t => {
          if (t !== null && t <= 1) { submitQuiz(); return 0; }
          return t !== null ? t - 1 : null;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, paused, timeRemaining, attemptId]);

  const startQuiz = async () => {
    if (!user || !questions?.length) return;
    setShowPastAttempts(false);
    const effectiveTopicId = topicId || questions[0]?.topic_id;
    if (!effectiveTopicId) return;
    const { data } = await supabase.from('quiz_attempts').insert({
      user_id: user.id, topic_id: effectiveTopicId, total_questions: questions.length,
    }).select().single();
    if (data) setAttemptId(data.id);
  };

  const currentQ = questions?.[currentIndex];
  const progress = questions?.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const timerProgress = timeRemaining !== null && courseSettings?.time_per_question
    ? (timeRemaining / ((courseSettings.time_per_question || 60) * (questions?.length || 1))) * 100 : 100;

  const selectAnswer = (option: string) => {
    if (submitted || !currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
    setStatuses(prev => ({ ...prev, [currentQ.id]: 'answered' }));
  };

  const clearResponse = () => {
    if (!currentQ || submitted) return;
    setAnswers(prev => { const n = { ...prev }; delete n[currentQ.id]; return n; });
    setStatuses(prev => ({ ...prev, [currentQ.id]: 'unanswered' }));
  };

  const skipQuestion = () => {
    if (!currentQ || submitted) return;
    if (!answers[currentQ.id]) setStatuses(prev => ({ ...prev, [currentQ.id]: 'skipped' }));
    if (currentIndex < (questions?.length || 0) - 1) setCurrentIndex(i => i + 1);
  };

  const markForReview = () => {
    if (!currentQ || submitted) return;
    setStatuses(prev => ({
      ...prev,
      [currentQ.id]: prev[currentQ.id] === 'marked' ? (answers[currentQ.id] ? 'answered' : 'unanswered') : 'marked'
    }));
  };

  const toggleBookmark = async () => {
    if (!user || !currentQ) return;
    if (bookmarks?.has(currentQ.id)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', currentQ.id);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, question_id: currentQ.id });
    }
    refetchBookmarks();
  };

  const getQuizStats = () => {
    if (!questions) return { answered: 0, skipped: 0, marked: 0, unanswered: 0 };
    let answered = 0, skipped = 0, marked = 0, unanswered = 0;
    questions.forEach(q => {
      const s = statuses[q.id]; if (s === 'answered') answered++; else if (s === 'skipped') skipped++; else if (s === 'marked') marked++; else unanswered++;
    });
    return { answered, skipped, marked, unanswered };
  };

  const handleSubmitClick = () => {
    const stats = getQuizStats();
    if (stats.unanswered > 0 || stats.skipped > 0 || stats.marked > 0) setShowConfirmSubmit(true);
    else submitQuiz();
  };

  const submitQuiz = async () => {
    if (!attemptId || !questions) return;
    setShowConfirmSubmit(false);
    let correctCount = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_option) correctCount++; });
    const answerRows = questions.map(q => ({
      attempt_id: attemptId, question_id: q.id, selected_option: answers[q.id] || null, is_correct: answers[q.id] === q.correct_option,
    }));
    await supabase.from('quiz_answers').insert(answerRows);
    await supabase.from('quiz_attempts').update({
      correct_answers: correctCount, is_completed: true, time_taken_seconds: timeElapsed, completed_at: new Date().toISOString(),
    }).eq('id', attemptId);
    const xp = correctCount * 10;
    if (user) {
      const { data: p } = await supabase.from('profiles').select('xp_points').eq('user_id', user.id).single();
      await supabase.from('profiles').update({ xp_points: (p?.xp_points || 0) + xp }).eq('user_id', user.id);
    }
    setSubmitted(true);
    toast.success(`Quiz complete! Score: ${correctCount}/${questions.length}`);
    queryClient.invalidateQueries({ queryKey: ['student-stats'] });
    navigate(`/quiz-result/${attemptId}`);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (questionsLoading) {
    return <DashboardLayout><div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" /><p className="text-muted-foreground">Loading questions...</p></div></DashboardLayout>;
  }

  if (!questions?.length) {
    return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground">No questions available.</p><Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button></div></DashboardLayout>;
  }

  // Past attempts screen
  if (showPastAttempts && !attemptId && pastAttempts && pastAttempts.length > 0) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto space-y-5">
          <Card className="glass-card border-0 rounded-3xl">
            <CardContent className="p-6 text-center">
              <h2 className="font-heading text-xl font-bold mb-1">{mode === 'full' ? 'Full Paper' : topic?.title || 'Quiz'}</h2>
              <p className="text-muted-foreground text-sm">{questions.length} Questions</p>
              {courseSettings?.time_per_question && <p className="text-xs text-muted-foreground mt-1">Time: {formatTime((courseSettings.time_per_question || 60) * questions.length)}</p>}
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-3xl">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><RotateCcw className="w-4 h-4 text-primary" /> Previous Attempts ({pastAttempts.length})</h3>
              <div className="space-y-2">
                {pastAttempts.map((a: any, i: number) => {
                  const acc = a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/quiz-result/${a.id}`)}>
                      <div>
                        <span className="text-sm font-medium">#{pastAttempts.length - i}</span>
                        {i === 0 && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">Latest</Badge>}
                        <p className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-lg font-heading font-bold ${acc >= 60 ? 'text-success' : 'text-destructive'}`}>{acc}%</span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-2xl">Go Back</Button>
            <Button onClick={startQuiz} className="flex-1 bg-fire-gradient border-0 rounded-2xl" size="lg"><Play className="w-5 h-5 mr-2" /> Start Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attemptId && !showPastAttempts) { /* waiting for startQuiz */ }
  else if (!attemptId && (!pastAttempts || pastAttempts.length === 0)) { if (user && questions?.length && !attemptId) startQuiz(); }

  if (!attemptId) {
    return <DashboardLayout><div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" /><p className="text-muted-foreground">Starting quiz...</p></div></DashboardLayout>;
  }

  const quizStats = getQuizStats();

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-4">
        {/* Header bar - app style matching reference */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-heading font-bold text-sm">Question {currentIndex + 1}/{questions.length}</p>
          <button onClick={toggleBookmark} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            {bookmarks?.has(currentQ?.id || '') ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {paused ? (
          <Card className="glass-card border-0 rounded-3xl">
            <CardContent className="p-12 text-center">
              <Pause className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-2">Quiz Paused</h2>
              <Button onClick={() => setPaused(false)} className="bg-fire-gradient border-0 rounded-2xl" size="lg"><Play className="w-4 h-4 mr-2" /> Resume</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Question card - purple glass like reference */}
                <Card className="bg-hero-gradient/90 border-0 rounded-3xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <CardContent className="p-6 relative z-10">
                    <p className="text-primary-foreground text-center text-base font-medium leading-relaxed">
                      {currentQ?.question_text}
                    </p>
                    {mode === 'full' && (currentQ as any)?.topics?.title && (
                      <Badge variant="outline" className="text-[10px] mt-3 mx-auto block w-fit border-white/30 text-primary-foreground/70">{(currentQ as any).topics.title}</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Timer bar - gradient like reference */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Time</span>
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-destructive via-accent to-success"
                  style={{ width: `${timerProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <span className={`text-xs font-mono font-bold ${timeRemaining !== null && timeRemaining < 60 ? 'text-destructive' : 'text-accent'}`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(timeElapsed)}
              </span>
            </div>

            {/* Options - matching reference with rounded cards */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optionText = currentQ?.[`option_${opt.toLowerCase()}` as keyof typeof currentQ];
                const isSelected = answers[currentQ?.id || ''] === opt;
                return (
                  <motion.button key={opt} whileTap={{ scale: 0.97 }} onClick={() => selectAnswer(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected ? 'border-success bg-success/10 shadow-md' : 'border-border hover:border-primary/30 bg-card'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold ${
                        isSelected ? 'bg-success text-success-foreground' : 'bg-muted'
                      }`}>{opt}</span>
                      <span className="text-sm font-medium">{optionText as string}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-success bg-success' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-success-foreground" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action buttons - orange buttons like reference */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Mark', icon: Flag, onClick: markForReview, active: statuses[currentQ?.id || ''] === 'marked' },
                { label: 'Clear', icon: XCircle, onClick: clearResponse },
                { label: 'Skip', icon: SkipForward, onClick: skipQuestion },
                { label: currentIndex < questions.length - 1 ? 'Next' : 'Submit', icon: currentIndex < questions.length - 1 ? ChevronRight : CheckCircle2,
                  onClick: currentIndex < questions.length - 1 ? () => setCurrentIndex(i => i + 1) : handleSubmitClick, primary: true },
              ].map((btn) => (
                <Button key={btn.label} size="sm"
                  variant={btn.primary ? 'default' : 'outline'}
                  className={`rounded-2xl h-12 flex-col gap-0.5 text-[10px] ${btn.primary ? 'bg-accent hover:bg-accent/90 text-accent-foreground border-0' : ''} ${btn.active ? 'border-warning text-warning' : ''}`}
                  onClick={btn.onClick}>
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </Button>
              ))}
            </div>

            {/* Pause / Nav */}
            <div className="flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setPaused(true)}>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNav(v => !v)}>
                {showNav ? 'Hide' : 'Show'} Map ({quizStats.answered}/{questions.length})
              </Button>
            </div>

            {showNav && (
              <div className="flex flex-wrap gap-2 justify-center p-3 bg-muted/50 rounded-2xl">
                {questions.map((q: any, i) => {
                  const status = statuses[q.id];
                  return (
                    <button key={q.id} onClick={() => setCurrentIndex(i)}
                      className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${
                        i === currentIndex ? 'bg-fire-gradient text-primary-foreground ring-2 ring-primary/50' :
                        status === 'answered' ? 'bg-primary/20 text-primary' :
                        status === 'marked' ? 'bg-warning/20 text-warning border border-warning/50' :
                        status === 'skipped' ? 'bg-muted-foreground/20 text-muted-foreground' :
                        'bg-secondary text-muted-foreground'
                      }`}>{i + 1}</button>
                  );
                })}
              </div>
            )}

            {showConfirmSubmit && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-warning/50 bg-warning/5 rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                      <div>
                        <h3 className="font-heading font-semibold">Submit Quiz?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {quizStats.unanswered > 0 && `${quizStats.unanswered} unanswered`}
                          {quizStats.skipped > 0 && `, ${quizStats.skipped} skipped`}
                          {quizStats.marked > 0 && `, ${quizStats.marked} marked`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirmSubmit(false)}>Continue</Button>
                      <Button onClick={submitQuiz} className="flex-1 bg-fire-gradient border-0 rounded-xl">Submit</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="text-center pb-4">
              <Button onClick={handleSubmitClick} className="bg-fire-gradient border-0 rounded-2xl px-8" size="lg">
                Submit Quiz ({quizStats.answered}/{questions.length})
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
