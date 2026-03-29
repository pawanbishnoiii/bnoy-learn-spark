import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play, Trophy, BookOpen, Flame, Target, Zap, Star, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function HeroSection() {
  const { user } = useAuthStore();

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-hero-gradient opacity-95" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/8 blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/4 left-1/3 w-48 h-48 rounded-full bg-accent/15 blur-2xl"
          animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-warning/15 blur-2xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 rounded-full bg-yellow-300/40"
          animate={{ y: [0, -20, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-3 h-3 rounded-sm bg-pink-300/40 rotate-45"
          animate={{ y: [0, -15, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-5 h-5 rounded-full bg-green-300/30"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-60 left-1/2 w-2 h-2 rounded-full bg-white/30"
          animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity }}
        />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>
      </div>

      <div className="container relative py-16 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto text-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-8 border border-white/20"
          >
            <Sparkles className="w-4 h-4" /> #1 MCQ Learning Platform in India
          </motion.div>

          <h1 className="font-heading text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Crack Any Exam with
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
              Smart Practice
            </span>
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-xl mx-auto mb-10">
            Practice thousands of MCQs, track your progress, and master every topic with our gamified learning experience.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 border-0 text-lg px-8 rounded-2xl shadow-xl accent-glow h-14">
                <Link to="/dashboard">Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 border-0 text-lg px-8 rounded-2xl shadow-xl accent-glow h-14">
                  <Link to="/signup">Start Learning Free <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white h-14">
                  <Link to="/login"><Play className="mr-2 w-5 h-5" /> Play Quiz</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-8 text-white/60 text-sm"
          >
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 10K+ Students</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> 4.8 Rating</span>
            <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> 500+ Quizzes</span>
          </motion.div>
        </motion.div>

        {/* Floating phone mockups */}
        <div className="mt-12 flex justify-center gap-4 md:gap-8">
          {/* Left card - Quiz Mode */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="hidden md:block"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-52 h-[22rem] rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shadow-2xl -rotate-6">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center justify-between p-4">
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-accent/30 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white/90 font-heading font-semibold text-xs">Quiz Mode</p>
                      <p className="text-white/50 text-[10px]">SSC CGL • Maths</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/15 mb-3">
                    <div className="w-3/5 h-full rounded-full bg-accent" />
                  </div>
                  <p className="text-white/80 text-xs mb-3">Q5. What is the value of sin 45°?</p>
                </div>
                <div className="w-full space-y-2">
                  <div className="h-9 rounded-xl bg-white/15 flex items-center px-3"><span className="text-xs text-white/70">A. 1/√2</span></div>
                  <div className="h-9 rounded-xl bg-success/30 border border-success/50 flex items-center px-3 justify-between">
                    <span className="text-xs text-white">B. √2/2</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="h-9 rounded-xl bg-white/15 flex items-center px-3"><span className="text-xs text-white/70">C. 1/2</span></div>
                  <div className="h-9 rounded-xl bg-white/15 flex items-center px-3"><span className="text-xs text-white/70">D. √3/2</span></div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-white/50 text-[10px]">
                  <Flame className="w-3 h-3" /> 3 streak
                  <span className="ml-auto">⏱ 0:45</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Center card - Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="w-56 md:w-64 h-96 md:h-[26rem] rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 p-3 shadow-2xl">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center gap-3 p-4">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-10 h-10 rounded-full bg-accent/40 flex items-center justify-center">
                    <span className="text-sm">👋</span>
                  </div>
                  <div>
                    <p className="text-white font-heading font-semibold text-sm">Hi Student!</p>
                    <p className="text-white/60 text-xs">1200 XP • Level 5</p>
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="w-full grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Quizzes', val: '24', icon: '📝' },
                    { label: 'Streak', val: '7d', icon: '🔥' },
                    { label: 'Rank', val: '#12', icon: '🏆' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-white/10 p-2 text-center">
                      <span className="text-sm">{s.icon}</span>
                      <p className="text-white font-heading font-bold text-xs">{s.val}</p>
                      <p className="text-white/40 text-[8px]">{s.label}</p>
                    </div>
                  ))}
                </div>
                
                <div className="w-full h-20 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white/80 text-xs">Daily Challenge</p>
                    <p className="text-white font-heading font-bold text-lg">14 Qs</p>
                    <div className="w-24 h-2 rounded-full bg-white/20 mt-1"><div className="w-16 h-2 rounded-full bg-accent" /></div>
                  </div>
                </div>
                
                <div className="w-full space-y-2 mt-auto">
                  <div className="h-12 rounded-2xl bg-white/10 flex items-center px-3 gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/30 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white/80" />
                    </div>
                    <div><p className="text-white text-xs font-medium">SSC CGL</p><p className="text-white/50 text-[10px]">24 Topics</p></div>
                    <ArrowRight className="w-3 h-3 text-white/30 ml-auto" />
                  </div>
                  <div className="h-12 rounded-2xl bg-white/10 flex items-center px-3 gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/30 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white/80" />
                    </div>
                    <div><p className="text-white text-xs font-medium">Bank PO</p><p className="text-white/50 text-[10px]">18 Topics</p></div>
                    <ArrowRight className="w-3 h-3 text-white/30 ml-auto" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right card - Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="hidden md:block"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="w-52 h-[22rem] rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shadow-2xl rotate-6">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center justify-between p-4">
                <div className="w-full text-center">
                  <div className="w-14 h-14 rounded-full bg-warning/30 border-2 border-warning/50 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-7 h-7 text-yellow-300" />
                  </div>
                  <p className="text-white font-heading font-bold text-sm">Leaderboard</p>
                  <p className="text-white/50 text-[10px]">This Week</p>
                </div>
                <div className="w-full space-y-1.5">
                  {[
                    { rank: 1, name: 'Rahul K.', xp: '2450', color: 'bg-yellow-500/20 border-yellow-500/30' },
                    { rank: 2, name: 'Priya S.', xp: '2180', color: 'bg-gray-400/20 border-gray-400/30' },
                    { rank: 3, name: 'Amit D.', xp: '1990', color: 'bg-orange-500/20 border-orange-500/30' },
                    { rank: 4, name: 'You', xp: '1850', color: 'bg-primary/20 border-primary/30' },
                  ].map(r => (
                    <div key={r.rank} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl ${r.color} border`}>
                      <span className="text-xs font-bold text-warning w-4">#{r.rank}</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                        {r.name.charAt(0)}
                      </div>
                      <span className="text-white/80 text-xs flex-1">{r.name}</span>
                      <span className="text-white/50 text-[10px] font-medium">{r.xp}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-white/40 text-[10px]">
                  <Zap className="w-3 h-3" /> Updated live
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
