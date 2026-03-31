import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Star, Users, Zap, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function HeroSection() {
  const { user } = useAuthStore();

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Multi-layer gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-grid opacity-10" />

      {/* Floating question marks - matching reference */}
      <motion.div className="absolute top-[15%] left-[5%] text-6xl font-black text-primary-foreground/20"
        animate={{ y: [0, -15, 0], rotate: [-10, 5, -10] }} transition={{ duration: 5, repeat: Infinity }}>?</motion.div>
      <motion.div className="absolute top-[10%] right-[15%] text-8xl font-black text-primary-foreground/15"
        animate={{ y: [0, -20, 0], rotate: [5, -5, 5] }} transition={{ duration: 6, repeat: Infinity }}>?</motion.div>
      <motion.div className="absolute top-[25%] left-[30%] text-5xl font-black text-accent/30"
        animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }}>?</motion.div>

      {/* Floating circles */}
      <motion.div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-white/8 blur-xl"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute bottom-32 right-10 w-32 h-32 rounded-full bg-accent/15 blur-2xl"
        animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity }} />
      <motion.div className="absolute bottom-20 left-20 w-12 h-12 rounded-full border-2 border-white/10"
        animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 4, repeat: Infinity }} />

      <div className="container relative py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Text */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {['🧑‍🎓', '👩‍🎓', '👨‍🎓'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm border-2 border-white/30">{e}</div>
                ))}
              </div>
              <span className="text-primary-foreground/80 text-sm">10K+ students learning</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground leading-tight">
              Interesting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent to-white">QUIZ</span>
              <br />Awaits You
            </h1>
            <p className="text-primary-foreground/70 text-lg mt-4 max-w-md">
              Play quizzes with your friends and get various prizes
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground border-0 rounded-full px-8 h-14 text-lg shadow-xl shadow-accent/30 font-heading font-bold">
                <Link to={user ? '/dashboard' : '/signup'}>
                  {user ? 'Dashboard' : 'Start Learning'} <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                <Link to={user ? '/courses' : '/login'}>
                  <Play className="mr-2 w-5 h-5" /> {user ? 'Courses' : 'Login'}
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8 text-primary-foreground/60 text-sm">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-warning fill-warning" /> 4.9 Rating</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 10K+ Users</span>
              <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> 50K+ Questions</span>
            </div>
          </motion.div>

          {/* Right: App mockup - quiz screen preview */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex justify-center">
            <div className="relative">
              {/* Main quiz screen mockup */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}
                className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 border border-white/20 shadow-2xl w-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-primary-foreground/60 text-xs font-medium">Question 3/10</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-primary-foreground/60" />
                  </div>
                </div>

                {/* Question card */}
                <div className="bg-white/10 rounded-2xl p-4 mb-4">
                  <p className="text-primary-foreground text-sm font-medium text-center leading-relaxed">
                    Which soccer team won the FIFA World Cup for the first time?
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary-foreground/50 text-xs">Time</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-destructive via-accent to-success" />
                  </div>
                  <span className="text-accent text-xs font-mono">00:12</span>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {[
                    { label: 'A', text: 'Uruguay', selected: true },
                    { label: 'B', text: 'Brazil', selected: false },
                    { label: 'C', text: 'Italy', selected: false },
                    { label: 'D', text: 'Germany', selected: false },
                  ].map((opt) => (
                    <div key={opt.label} className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${
                      opt.selected ? 'bg-success/25 text-success-foreground border border-success/40' : 'bg-white/5 text-primary-foreground/80 border border-white/10'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{opt.label}</span>
                        <span>{opt.text}</span>
                      </div>
                      {opt.selected && <CheckCircle2 className="w-4 h-4 text-success" />}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Floating score popup */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-4 -bottom-4 bg-white/15 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/30 flex items-center justify-center"><Star className="w-4 h-4 text-success" /></div>
                  <div>
                    <p className="text-primary-foreground text-xs font-medium">Score: 92%</p>
                    <p className="text-primary-foreground/50 text-[10px]">Top 5% 🎉</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating streak card */}
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -left-6 top-16 bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-xl w-40">
                <p className="text-primary-foreground text-xs font-medium mb-1">🔥 Daily Streak</p>
                <p className="text-primary-foreground font-heading text-2xl font-bold">12</p>
                <div className="flex gap-1 mt-1.5">
                  {[1,2,3,4,5].map(d => (
                    <div key={d} className="w-5 h-5 rounded-full bg-accent/40 flex items-center justify-center text-[8px]">🔥</div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
