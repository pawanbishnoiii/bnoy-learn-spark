import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CreditCard, Check, Crown, Zap, Star, ShoppingCart, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function BillingPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const courseId = searchParams.get('courseId');

  const { data: course } = useQuery({
    queryKey: ['billing-course', courseId],
    queryFn: async () => { const { data } = await supabase.from('courses').select('*').eq('id', courseId!).single(); return data; },
    enabled: !!courseId,
  });

  const { data: razorpaySettings } = useQuery({
    queryKey: ['razorpay-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'razorpay').single();
      return data?.value as any;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('subscription_plans').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  const { data: userPurchases } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_purchases').select('*, courses(id, title, thumbnail_url, category)').eq('user_id', user!.id).eq('payment_status', 'paid');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: userSub } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('user_subscriptions').select('*, subscription_plans(name)').eq('user_id', user!.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1);
      return data?.[0] || null;
    },
    enabled: !!user,
  });

  const initRazorpay = (amount: number, description: string, onSuccess: (paymentId: string) => void) => {
    if (!razorpaySettings?.enabled || !razorpaySettings?.key) {
      toast.error('Payment gateway not configured. Contact admin.');
      return;
    }
    const options = {
      key: razorpaySettings.key,
      amount: amount * 100,
      currency: 'INR',
      name: 'Bnoy MCQ Platform',
      description,
      handler: (response: any) => onSuccess(response.razorpay_payment_id),
      prefill: { email: user?.email },
      theme: { color: '#E8580C' },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user || !course) throw new Error('Missing data');
      if (!razorpaySettings?.enabled || !razorpaySettings?.key) {
        // Direct purchase if no payment gateway
        const { error } = await supabase.from('user_purchases').insert({
          user_id: user.id, course_id: course.id, amount: course.price || 0,
          payment_id: 'manual_' + Date.now(), payment_status: 'paid',
        });
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ['purchase-check'] });
        qc.invalidateQueries({ queryKey: ['user-purchases'] });
        toast.success('Purchase successful!');
        navigate(`/courses/${course.id}`);
        return;
      }
      // Razorpay
      initRazorpay(course.price || 0, `Purchase: ${course.title}`, async (paymentId) => {
        const { error } = await supabase.from('user_purchases').insert({
          user_id: user.id, course_id: course.id, amount: course.price || 0,
          payment_id: paymentId, payment_status: 'paid',
        });
        if (error) { toast.error(error.message); return; }
        qc.invalidateQueries({ queryKey: ['purchase-check'] });
        qc.invalidateQueries({ queryKey: ['user-purchases'] });
        toast.success('Payment successful! You now have access.');
        navigate(`/courses/${course.id}`);
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const planIcons: Record<string, any> = { 'Free': Zap, 'Pro': Star, 'Premium': Crown };

  // Buying a specific course
  if (courseId && course) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card border-0 overflow-hidden">
              {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />}
              <CardContent className="p-6">
                <Badge className="mb-2 capitalize">{course.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                <h1 className="font-heading text-2xl font-bold mb-2">{course.title}</h1>
                {course.description && <p className="text-muted-foreground text-sm mb-4">{course.description}</p>}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-heading text-3xl font-bold text-fire-gradient">₹{course.price}</span>
                  </div>
                  <Button onClick={() => purchaseMutation.mutate()} className="w-full bg-fire-gradient border-0" size="lg" disabled={purchaseMutation.isPending}>
                    <ShoppingCart className="w-5 h-5 mr-2" /> {purchaseMutation.isPending ? 'Processing...' : `Pay ₹${course.price}`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">Secured by Razorpay · 7-day money-back guarantee</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Plans + Purchased courses view
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold"><CreditCard className="inline w-7 h-7 text-primary mr-2" /> Plans & Billing</h1>
          <p className="text-muted-foreground mt-1">Choose the plan that fits your preparation needs</p>
          {userSub && <Badge className="mt-2 bg-fire-gradient border-0">Current Plan: {(userSub as any)?.subscription_plans?.name || 'Free'}</Badge>}
        </div>

        {/* Plans from DB */}
        <div className="grid md:grid-cols-3 gap-6">
          {(plans || []).map((plan: any, i: number) => {
            const IconComp = planIcons[plan.name] || Zap;
            const features = (plan.features as string[]) || [];
            const isCurrent = plan.is_free;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`glass-card border-0 h-full flex flex-col relative ${plan.name === 'Pro' ? 'ring-2 ring-primary' : ''}`}>
                  {plan.name === 'Pro' && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-fire-gradient border-0">Most Popular</Badge></div>}
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2"><IconComp className="w-6 h-6 text-primary" /></div>
                    <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                    <div className="mt-2"><span className="text-3xl font-heading font-bold">₹{plan.price}</span><span className="text-sm text-muted-foreground">/{plan.period}</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {features.map((f: string) => (<li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary flex-shrink-0" />{f}</li>))}
                    </ul>
                    <Button
                      className={`w-full mt-6 ${plan.name === 'Pro' ? 'bg-fire-gradient border-0' : ''}`}
                      variant={isCurrent ? 'outline' : plan.name === 'Pro' ? 'default' : 'secondary'}
                      disabled={isCurrent}
                      onClick={() => {
                        if (plan.is_free) return;
                        if (!razorpaySettings?.enabled) { toast.error('Payment gateway not configured'); return; }
                        initRazorpay(plan.price, `Subscribe to ${plan.name}`, async (paymentId) => {
                          await (supabase as any).from('user_subscriptions').insert({
                            user_id: user!.id, plan_id: plan.id, payment_id: paymentId, status: 'active',
                            expires_at: new Date(Date.now() + (plan.period === 'yearly' ? 365 : 30) * 86400000).toISOString(),
                          });
                          qc.invalidateQueries({ queryKey: ['user-subscription'] });
                          toast.success(`Subscribed to ${plan.name}!`);
                        });
                      }}
                    >
                      {isCurrent ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Purchased Courses */}
        {userPurchases && userPurchases.length > 0 && (
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> My Purchased Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPurchases.map((p: any) => (
                  <Link key={p.id} to={`/courses/${p.course_id}`} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.courses?.thumbnail_url ? <img src={p.courses.thumbnail_url} className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.courses?.title}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{p.courses?.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                        <span>₹{p.amount}</span>
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card border-0"><CardContent className="p-6"><h3 className="font-heading font-semibold mb-2">Payment Information</h3><p className="text-sm text-muted-foreground">Payments processed securely via Razorpay. 7-day money-back guarantee.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
