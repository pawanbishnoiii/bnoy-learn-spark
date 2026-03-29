import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Flame, Trophy, Target, Zap, BarChart3 } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Structured Learning', desc: 'Course → Subject → Topic → Quiz pathway for organized prep', color: 'from-primary to-primary/70' },
  { icon: Flame, title: 'Daily Challenges', desc: 'Build streaks, earn XP, and stay consistent every day', color: 'from-accent to-accent/70' },
  { icon: Trophy, title: 'Gamified Experience', desc: 'Achievements, leaderboards, and rewards to keep you motivated', color: 'from-warning to-warning/70' },
  { icon: Target, title: 'Smart Analytics', desc: 'AI-powered insights to track weak areas and improve fast', color: 'from-success to-success/70' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Detailed explanations for every answer you attempt', color: 'from-primary to-accent' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'Visual charts and performance stats at your fingertips', color: 'from-accent to-warning' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function FeaturesSection() {
  return (
    <section className="container py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
          Everything You Need to <span className="text-fire-gradient">Excel</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">Powerful features designed to make exam preparation fun and effective</p>
      </motion.div>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
        {features.map((f) => (
          <motion.div key={f.title} variants={item}>
            <Card className="glass-card border-0 hover:shadow-xl transition-all hover:-translate-y-1 group h-full rounded-2xl">
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <f.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
