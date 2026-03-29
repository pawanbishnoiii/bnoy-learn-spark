import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function HeroSection() {
  const { user } = useAuthStore();

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-hero-gradient opacity-95" />
      {/* Animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-accent/20 blur-2xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
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
        </motion.div>

        {/* Floating phone mockups */}
        <div className="mt-12 flex justify-center gap-4 md:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="hidden md:block"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-48 h-80 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shadow-2xl -rotate-6">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/30 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-white/90 font-heading font-semibold text-sm">Quiz Mode</p>
                <div className="w-full space-y-2">
                  <div className="h-8 rounded-xl bg-white/15 flex items-center px-3"><span className="text-xs text-white/70">A. Option 1</span></div>
                  <div className="h-8 rounded-xl bg-success/30 border border-success/50 flex items-center px-3"><span className="text-xs text-white">B. Correct ✓</span></div>
                  <div className="h-8 rounded-xl bg-white/15 flex items-center px-3"><span className="text-xs text-white/70">C. Option 3</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="w-56 md:w-64 h-96 md:h-[26rem] rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 p-3 shadow-2xl">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center gap-4 p-5">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-10 h-10 rounded-full bg-accent/40" />
                  <div>
                    <p className="text-white font-heading font-semibold text-sm">Hi Student! 👋</p>
                    <p className="text-white/60 text-xs">1200 XP • Level 5</p>
                  </div>
                </div>
                <div className="w-full h-20 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white/80 text-xs">Daily Challenge</p>
                    <p className="text-white font-heading font-bold text-lg">14 Qs</p>
                    <div className="w-24 h-2 rounded-full bg-white/20 mt-1"><div className="w-16 h-2 rounded-full bg-accent" /></div>
                  </div>
                </div>
                <div className="w-full flex gap-2">
                  {['🏆', '📚', '🎯', '⚡'].map((e, i) => (
                    <div key={i} className="flex-1 aspect-square rounded-2xl bg-white/10 flex items-center justify-center text-lg">{e}</div>
                  ))}
                </div>
                <div className="w-full space-y-2 mt-auto">
                  <div className="h-12 rounded-2xl bg-white/10 flex items-center px-3 gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/30" />
                    <div><p className="text-white text-xs font-medium">SSC CGL</p><p className="text-white/50 text-[10px]">24 Topics</p></div>
                  </div>
                  <div className="h-12 rounded-2xl bg-white/10 flex items-center px-3 gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent/30" />
                    <div><p className="text-white text-xs font-medium">Bank PO</p><p className="text-white/50 text-[10px]">18 Topics</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="hidden md:block"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="w-48 h-80 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shadow-2xl rotate-6">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-white/20 to-white/5 flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-16 h-16 rounded-full bg-success/30 border-4 border-success/50 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-white font-heading font-bold">987 pts</p>
                <p className="text-white/60 text-sm">Leaderboard</p>
                <div className="w-full space-y-1.5">
                  {[1, 2, 3].map(r => (
                    <div key={r} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/10">
                      <span className="text-xs font-bold text-warning">#{r}</span>
                      <div className="w-5 h-5 rounded-full bg-white/20" />
                      <span className="text-white/70 text-xs flex-1">User {r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
