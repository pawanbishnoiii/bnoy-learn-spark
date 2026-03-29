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

  // Fetch past attempts for this topic
  const { data: pastAttempts } = useQuery({
    queryKey: ['past-attempts', topicId, user?.id],
    queryFn: async () => {
      const effectiveTopicId = topicId || questions?.[0]?.topic_id;
      if (!effectiveTopicId || !user) return [];
      const { data } = await supabase.from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', effectiveTopicId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(10);
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
    if (submitted || paused) return;
    if (!attemptId) return; // Don't start timer until quiz started
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
      const s = statuses[q.id];
      if (s === 'answered') answered++;
      else if (s === 'skipped') skipped++;
      else if (s === 'marked') marked++;
      else unanswered++;
    });
    return { answered, skipped, marked, unanswered };
  };

  const handleSubmitClick = () => {
    const stats = getQuizStats();
    if (stats.unanswered > 0 || stats.skipped > 0 || stats.marked > 0) {
      setShowConfirmSubmit(true);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!attemptId || !questions) return;
    setShowConfirmSubmit(false);
    let correctCount = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_option) correctCount++; });

    const answerRows = questions.map(q => ({
      attempt_id: attemptId, question_id: q.id,
      selected_option: answers[q.id] || null,
      is_correct: answers[q.id] === q.correct_option,
    }));
    await supabase.from('quiz_answers').insert(answerRows);
    await supabase.from('quiz_attempts').update({
      correct_answers: correctCount, is_completed: true,
      time_taken_seconds: timeElapsed, completed_at: new Date().toISOString(),
    }).eq('id', attemptId);

    const xp = correctCount * 10;
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('xp_points').eq('user_id', user.id).single();
      await supabase.from('profiles').update({ xp_points: (profile?.xp_points || 0) + xp }).eq('user_id', user.id);
    }

    setSubmitted(true);
    toast.success(`Quiz complete! Score: ${correctCount}/${questions.length}`);
    queryClient.invalidateQueries({ queryKey: ['student-stats'] });
    queryClient.invalidateQueries({ queryKey: ['past-attempts'] });
    navigate(`/quiz-result/${attemptId}`);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (questionsLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!questions?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">No questions available.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show past attempts screen before starting quiz
  if (showPastAttempts && !attemptId && pastAttempts && pastAttempts.length > 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center">
                <h2 className="font-heading text-2xl font-bold mb-2">
                  {mode === 'full' ? 'Full Paper' : topic?.title || 'Quiz'}
                </h2>
                <p className="text-muted-foreground mb-1">{questions.length} Questions</p>
                {courseSettings?.time_per_question && (
                  <p className="text-sm text-muted-foreground">
                    Time: {formatTime((courseSettings.time_per_question || 60) * questions.length)}
                    {negativeMarking > 0 && ` · Negative: -${negativeMarking}`}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Past Attempts */}
          <Card className="glass-card border-0">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" /> Your Previous Attempts ({pastAttempts.length})
              </h3>
              <div className="space-y-3">
                {pastAttempts.map((a: any, i: number) => {
                  const accuracy = a.total_questions > 0 ? Math.round((a.correct_answers / a.total_questions) * 100) : 0;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/quiz-result/${a.id}`)}>
                      <div>
                        <p className="text-sm font-medium">
                          Attempt #{pastAttempts.length - i}
                          {i === 0 && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">Latest</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.completed_at).toLocaleDateString()} · {a.time_taken_seconds ? formatTime(a.time_taken_seconds) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-heading font-bold ${accuracy >= 60 ? 'text-success' : 'text-destructive'}`}>
                          {a.correct_answers}/{a.total_questions}
                        </p>
                        <p className="text-xs text-muted-foreground">{accuracy}%</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Go Back</Button>
            <Button onClick={startQuiz} className="flex-1 bg-fire-gradient border-0" size="lg">
              <Play className="w-5 h-5 mr-2" /> Start Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If no past attempts or user chose to start, auto-create attempt
  if (!attemptId && !showPastAttempts) {
    // Will be created by startQuiz
  } else if (!attemptId && (!pastAttempts || pastAttempts.length === 0)) {
    // First time - auto start
    if (user && questions?.length && !attemptId) {
      startQuiz();
    }
  }

  if (!attemptId) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Starting quiz...</p>
        </div>
      </DashboardLayout>
    );
  }

  const quizStats = getQuizStats();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="sticky top-14 z-30 glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-sm font-bold truncate">
                {mode === 'full' ? 'Full Paper' : topic?.title || 'Quiz'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!submitted && (
                <Button variant="ghost" size="icon" onClick={() => setPaused(p => !p)} className="h-8 w-8">
                  {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              )}
              <Badge variant={timeRemaining !== null && timeRemaining < 60 ? 'destructive' : 'outline'} className="gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(timeElapsed)}
              </Badge>
              <Badge variant="secondary" className="text-xs">{currentIndex + 1}/{questions.length}</Badge>
              {negativeMarking > 0 && <Badge variant="destructive" className="text-xs">-{negativeMarking}</Badge>}
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </div>

        {paused ? (
          <Card className="glass-card border-0">
            <CardContent className="p-12 text-center">
              <Pause className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold mb-2">Quiz Paused</h2>
              <p className="text-muted-foreground mb-6">Click resume to continue</p>
              <Button onClick={() => setPaused(false)} className="bg-fire-gradient border-0" size="lg">
                <Play className="w-4 h-4 mr-2" /> Resume Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="glass-card border-0">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <span>Marks: <span className="text-success font-medium">+1</span></span>
                          {negativeMarking > 0 && <span className="text-destructive font-medium">-{negativeMarking}</span>}
                        </div>
                        <h2 className="font-heading text-lg font-semibold">Q{currentIndex + 1}. {currentQ?.question_text}</h2>
                        {mode === 'full' && (currentQ as any)?.topics?.title && (
                          <Badge variant="outline" className="text-xs mt-2">{(currentQ as any).topics.title}</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={markForReview} title="Mark for review" className={statuses[currentQ?.id || ''] === 'marked' ? 'text-warning' : ''}>
                          <Flag className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                          {bookmarks?.has(currentQ?.id || '') ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const optionText = currentQ?.[`option_${opt.toLowerCase()}` as keyof typeof currentQ];
                        const isSelected = answers[currentQ?.id || ''] === opt;
                        return (
                          <motion.button key={opt} whileTap={{ scale: 0.99 }} onClick={() => selectAnswer(opt)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold mr-3 ${isSelected ? 'bg-fire-gradient text-primary-foreground' : 'bg-secondary'}`}>{opt}</span>
                            <span className="text-sm">{optionText as string}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t flex-wrap gap-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={markForReview} className={statuses[currentQ?.id || ''] === 'marked' ? 'border-warning text-warning' : ''}>
                          <Flag className="w-4 h-4 mr-1" /> Mark
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearResponse}>Clear</Button>
                        <Button variant="outline" size="sm" onClick={skipQuestion}>
                          <SkipForward className="w-4 h-4 mr-1" /> Skip
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {currentIndex > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setCurrentIndex(i => i - 1)}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                          </Button>
                        )}
                        {currentIndex < questions.length - 1 ? (
                          <Button size="sm" className="bg-fire-gradient border-0" onClick={() => setCurrentIndex(i => i + 1)}>
                            Save & Next <ChevronRight className="ml-1 w-4 h-4" />
                          </Button>
                        ) : (
                          <Button onClick={handleSubmitClick} className="bg-fire-gradient border-0" size="sm">
                            Submit <CheckCircle2 className="ml-1 w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {showConfirmSubmit && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                      <div>
                        <h3 className="font-heading font-semibold text-lg">Submit Quiz?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {quizStats.unanswered > 0 && `${quizStats.unanswered} unanswered`}
                          {quizStats.unanswered > 0 && quizStats.skipped > 0 && ', '}
                          {quizStats.skipped > 0 && `${quizStats.skipped} skipped`}
                          {(quizStats.unanswered > 0 || quizStats.skipped > 0) && quizStats.marked > 0 && ', '}
                          {quizStats.marked > 0 && `${quizStats.marked} marked`} question(s).
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>Continue Quiz</Button>
                      <Button onClick={submitQuiz} className="bg-fire-gradient border-0">Submit Anyway</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="text-center">
              <Button variant="outline" size="sm" onClick={() => setShowNav(v => !v)}>
                {showNav ? 'Hide' : 'Show'} Question Map ({quizStats.answered}/{questions.length})
              </Button>
            </div>

            {showNav && (
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="w-full flex gap-3 justify-center text-xs mb-2 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" /> Answered</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning inline-block" /> Marked</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted-foreground/40 inline-block" /> Skipped</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary inline-block" /> Unanswered</span>
                </div>
                {questions.map((q: any, i) => {
                  const status = statuses[q.id];
                  return (
                    <button key={q.id} onClick={() => setCurrentIndex(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
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

            <div className="text-center pb-4">
              <Button onClick={handleSubmitClick} className="bg-fire-gradient border-0" size="lg">
                Submit Quiz ({quizStats.answered}/{questions.length})
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
