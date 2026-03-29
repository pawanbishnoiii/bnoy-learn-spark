import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Clock, AlertTriangle, FileText, Target, Download, ExternalLink, ShoppingCart, CheckCircle2, Image } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => { const { data } = await supabase.from('courses').select('*').eq('id', courseId).single(); return data; },
  });

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects', courseId],
    queryFn: async () => { const { data } = await supabase.from('subjects').select('*, topics(id)').eq('course_id', courseId!).order('sort_order'); return data || []; },
    enabled: !!courseId,
  });

  const { data: totalQuestions } = useQuery({
    queryKey: ['course-total-questions', courseId],
    queryFn: async () => {
      if (!subjects?.length) return 0;
      const { data: topics } = await supabase.from('topics').select('id').in('subject_id', subjects.map(s => s.id));
      if (!topics?.length) return 0;
      const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true }).in('topic_id', topics.map(t => t.id)).eq('is_visible', true);
      return count || 0;
    },
    enabled: !!subjects?.length,
  });

  const { data: isPurchased } = useQuery({
    queryKey: ['purchase-check', courseId, user?.id],
    queryFn: async () => {
      if (!user || course?.is_free) return true;
      const { data } = await supabase.from('user_purchases').select('id').eq('user_id', user.id).eq('course_id', courseId!).eq('payment_status', 'paid').limit(1);
      return (data?.length || 0) > 0;
    },
    enabled: !!user && !!course,
  });

  const canAccess = course?.is_free || isPurchased;
  const extraImages = (course?.extra_images as string[]) || [];
  const extraLinks = (course?.extra_links as { label: string; url: string }[]) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Course Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-0 overflow-hidden">
            <div className="h-48 bg-fire-gradient/80 flex items-center justify-center relative">
              {course?.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course?.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-16 h-16 text-primary-foreground/60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs capitalize">{course?.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                  {course?.is_free ? (
                    <Badge className="bg-success text-success-foreground text-xs">Free</Badge>
                  ) : (
                    <Badge className="bg-fire-gradient border-0 text-xs">₹{course?.price}</Badge>
                  )}
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{course?.title || 'Course'}</h1>
              </div>
            </div>
            <CardContent className="p-5">
              {course?.description && <p className="text-muted-foreground mb-4">{course.description}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {subjects?.length || 0} Subjects</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalQuestions || 0} Questions</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course?.time_per_question || 60}s/question</span>
                {(course?.negative_marking || 0) > 0 && <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="w-4 h-4" /> -{course?.negative_marking} neg</span>}
                {(course?.cutoff_marks || 0) > 0 && <span className="flex items-center gap-1"><Target className="w-4 h-4" /> Cutoff: {course?.cutoff_marks}</span>}
              </div>

              {/* PDF & Links */}
              <div className="flex flex-wrap gap-2 mb-4">
                {course?.pdf_url && (
                  <Button variant="outline" size="sm" asChild><a href={course.pdf_url} target="_blank"><Download className="w-4 h-4 mr-1" /> Download PDF</a></Button>
                )}
                {extraLinks.map((link, i) => (
                  <Button key={i} variant="outline" size="sm" asChild><a href={link.url} target="_blank"><ExternalLink className="w-4 h-4 mr-1" /> {link.label}</a></Button>
                ))}
              </div>

              {/* Buy Button */}
              {!canAccess && (
                <Button onClick={() => navigate(`/billing?courseId=${courseId}`)} className="w-full bg-fire-gradient border-0" size="lg">
                  <ShoppingCart className="w-5 h-5 mr-2" /> Buy Now - ₹{course?.price}
                </Button>
              )}
              {canAccess && !course?.is_free && (
                <div className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="w-4 h-4" /> You have access to this {course?.category === 'test_series' ? 'test series' : 'course'}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Extra Images Gallery */}
        {extraImages.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-bold mb-3 flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {extraImages.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-xl w-full h-32 object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Subjects */}
        <h2 className="font-heading text-xl font-bold">Subjects</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : !subjects?.length ? (
          <div className="text-center py-10"><BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No subjects available yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((s: any, i: number) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={canAccess ? `/subjects/${s.id}` : '#'} onClick={e => { if (!canAccess) { e.preventDefault(); navigate(`/billing?courseId=${courseId}`); } }}>
                  <Card className={`glass-card border-0 hover:shadow-md transition-all hover:-translate-y-0.5 group ${!canAccess ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">{s.title}</h3>
                        {s.description && <p className="text-sm text-muted-foreground truncate">{s.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{s.topics?.length || 0} Topics</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
