import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Flame, Trophy, Target, Zap, BarChart3, Shield, Clock, Brain, Award } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Structured Learning', desc: 'Course → Subject → Topic → Quiz pathway for organized prep', color: 'from-primary to-primary/70', emoji: '📚' },
  { icon: Flame, title: 'Daily Challenges', desc: 'Build streaks, earn XP, and stay consistent every day', color: 'from-accent to-accent/70', emoji: '🔥' },
  { icon: Trophy, title: 'Gamified Experience', desc: 'Achievements, leaderboards, and rewards to keep you motivated', color: 'from-warning to-warning/70', emoji: '🏆' },
  { icon: Target, title: 'Smart Analytics', desc: 'AI-powered insights to track weak areas and improve fast', color: 'from-success to-success/70', emoji: '🎯' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Detailed explanations for every answer you attempt', color: 'from-primary to-accent', emoji: '⚡' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'Visual charts and performance stats at your fingertips', color: 'from-accent to-warning', emoji: '📊' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function FeaturesSection() {
  return (
    <section className="container py-20 relative">
      {/* Decorative bg elements */}
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-4">
          <Zap className="w-4 h-4" /> Powerful Features
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Everything You Need to <span className="text-fire-gradient">Excel</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">Powerful features designed to make exam preparation fun and effective</p>
      </motion.div>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
        {features.map((f) => (
          <motion.div key={f.title} variants={item}>
            <Card className="glass-card border-0 hover:shadow-xl transition-all hover:-translate-y-1.5 group h-full rounded-3xl overflow-hidden">
              <CardContent className="p-6 relative">
                {/* Decorative corner gradient */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${f.color} opacity-5 rounded-bl-full`} />
                
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                    <f.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-1.5 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom illustration */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }}
        className="mt-16 flex justify-center"
      >
        <div className="flex items-center gap-8 px-8 py-4 rounded-3xl glass-card border-0">
          {[
            { icon: Shield, label: 'Secure', val: '100%' },
            { icon: Clock, label: 'Uptime', val: '99.9%' },
            { icon: Brain, label: 'Questions', val: '10K+' },
            { icon: Award, label: 'Exams', val: '50+' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-heading font-bold text-lg">{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
