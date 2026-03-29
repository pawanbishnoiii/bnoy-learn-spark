import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { BookOpen, Flame, Trophy, ArrowRight, Zap, Target, BarChart3, Users, CheckCircle, Star, Shield, Clock, LogOut, User, LayoutDashboard, Search, ChevronLeft, ChevronRight, HelpCircle, IndianRupee } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

const studyAnimation = {
  v: "5.7.4", fr: 30, ip: 0, op: 60, w: 200, h: 200,
  layers: [{
    ddd: 0, ind: 1, ty: 4, nm: "circle", sr: 1, ks: {
      o: { a: 0, k: 100 }, r: { a: 1, k: [{ i: { x: [0.83], y: [0.83] }, o: { x: [0.17], y: [0.17] }, t: 0, s: [0] }, { t: 60, s: [360] }] },
      p: { a: 0, k: [100, 100, 0] }, s: { a: 1, k: [{ i: { x: [0.83, 0.83, 0.83] }, o: { x: [0.17, 0.17, 0.17] }, t: 0, s: [100, 100, 100] }, { i: { x: [0.83, 0.83, 0.83] }, o: { x: [0.17, 0.17, 0.17] }, t: 30, s: [120, 120, 100] }, { t: 60, s: [100, 100, 100] }] }
    },
    shapes: [{ ty: "el", d: 1, s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] } },
    { ty: "st", c: { a: 0, k: [0.96, 0.34, 0.13, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 } },
    { ty: "fl", c: { a: 0, k: [0.96, 0.34, 0.13, 0.1] }, o: { a: 0, k: 100 } }]
  }]
};

const features = [
  { icon: BookOpen, title: 'Structured Learning', desc: 'Course → Subject → Topic → Quiz pathway' },
  { icon: Flame, title: 'Daily Challenges', desc: 'Build streaks and earn XP daily' },
  { icon: Trophy, title: 'Gamified Experience', desc: 'Achievements, leaderboards, rewards' },
  { icon: Target, title: 'Smart Analytics', desc: 'Track weak areas and improve' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Detailed explanations for every answer' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'Visual charts and performance stats' },
];

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '50K+', label: 'Questions' },
  { value: '500+', label: 'Topics' },
  { value: '95%', label: 'Success Rate' },
];

const testimonials = [
  { name: 'Rahul S.', role: 'SSC Aspirant', text: 'This platform helped me score 95+ in my SSC exam. The topic-wise practice is amazing!', rating: 5 },
  { name: 'Priya M.', role: 'Bank PO', text: 'Daily challenges kept me consistent. Best quiz app I have ever used for exam prep.', rating: 5 },
  { name: 'Amit K.', role: 'UPSC Student', text: 'The analytics feature showed me exactly where I was weak. Improved my accuracy by 30%!', rating: 5 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// Default banner images
const defaultBanners = [
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1200&h=400&fit=crop',
];

export default function Landing() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: courses } = useQuery({
    queryKey: ['landing-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*, subjects(id)').eq('is_published', true).order('sort_order').limit(6);
      return data || [];
    },
  });

  const { data: bannerSettings } = useQuery({
    queryKey: ['landing-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'banners').single();
      const val = data?.value as any;
      return val?.urls?.length ? val.urls : defaultBanners;
    },
  });

  const banners = bannerSettings || defaultBanners;

  // Auto-slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const filteredCourses = courses?.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-fire-gradient flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">Bnoy</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard</Link></Button>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/profile"><User className="w-4 h-4 mr-1" /> Profile</Link></Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
                <Avatar className="w-8 h-8">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="bg-fire-gradient text-primary-foreground text-xs font-heading">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
                <Button asChild size="sm" className="bg-fire-gradient border-0"><Link to="/signup">Get Started Free</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Banner Slider */}
      <section className="relative overflow-hidden">
        <div className="relative h-48 md:h-72">
          {banners.map((url: string, i: number) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === currentSlide ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={url} alt={`Banner ${i+1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            </motion.div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={() => setCurrentSlide(s => (s - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center z-10">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentSlide(s => (s + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center z-10">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_: string, i: number) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-6' : 'bg-primary/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Hero */}
      <section className="container py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Flame className="w-4 h-4" /> #1 MCQ Learning Platform
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Crack Any Exam with <span className="text-fire-gradient">Smart Practice</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Practice thousands of MCQs with detailed explanations. Track your progress and master every topic.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Button asChild size="lg" className="bg-fire-gradient border-0 text-lg px-8 fire-glow">
                <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-fire-gradient border-0 text-lg px-8 fire-glow">
                  <Link to="/signup">Create Free Account <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8">
                  <Link to="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Search */}
      <section className="container pb-8">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search courses & test series..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 rounded-xl text-base" />
        </div>
      </section>

      {/* Courses */}
      {filteredCourses.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">
              Popular <span className="text-fire-gradient">Courses & Test Series</span>
            </h2>
            <Button asChild variant="outline" size="sm"><Link to={user ? '/courses' : '/signup'}>View All</Link></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c: any, i: number) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={user ? `/courses/${c.id}` : '/signup'}>
                  <Card className="glass-card border-0 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group h-full">
                    <div className="h-32 bg-fire-gradient/80 flex items-center justify-center relative">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-primary-foreground" />
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs capitalize">{c.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={c.is_free ? 'bg-success text-success-foreground text-xs' : 'bg-fire-gradient border-0 text-xs'}>
                          {c.is_free ? 'Free' : `₹${c.price}`}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                      {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{c.subjects?.length || 0} Subjects</span>
                        {c.negative_marking > 0 && <span className="text-destructive">-{c.negative_marking} neg</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="bg-primary/5 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-fire-gradient">{s.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-10">
          Everything You Need to <span className="text-fire-gradient">Excel</span>
        </h2>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {features.map((f) => (
            <motion.div key={f.title} variants={item}>
              <Card className="glass-card border-0 hover:shadow-lg transition-all hover:-translate-y-1 group h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-fire-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="bg-primary/5 py-16">
        <div className="container">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-10">What Students <span className="text-fire-gradient">Say</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="glass-card border-0 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-fire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">{t.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <motion.div className="bg-fire-gradient rounded-3xl p-10 md:p-16 text-center text-primary-foreground" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            {user ? 'Continue Your Journey' : 'Ready to Ace Your Exam?'}
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
            {user ? 'Keep practicing and climb the leaderboard!' : 'Join thousands of learners today.'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Button asChild size="lg" variant="secondary"><Link to="/dashboard">Go to Dashboard</Link></Button>
            ) : (
              <Button asChild size="lg" variant="secondary"><Link to="/signup">Create Free Account</Link></Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold text-lg">Bnoy</span>
              </div>
              <p className="text-sm text-muted-foreground">Modern MCQ learning platform for competitive exams.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/courses" className="block hover:text-primary">Courses</Link>
                <Link to={user ? '/dashboard' : '/signup'} className="block hover:text-primary">{user ? 'Dashboard' : 'Sign Up'}</Link>
                {user && <Link to="/billing" className="block hover:text-primary">Billing</Link>}
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Mock Tests</p><p>Daily Challenges</p><p>Leaderboard</p><p>Test Series</p>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to={user ? '/help' : '#'} className="block hover:text-primary">Help Center</Link>
                <p>Contact Us</p><p>Privacy Policy</p><p>Terms of Service</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Bnoy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
