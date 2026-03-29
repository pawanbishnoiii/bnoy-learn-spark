import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Trophy, Flame, Target, BarChart3, MessageSquare, Shield, Zap } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Course-wise Practice', desc: 'Topic-by-topic MCQs organized for every competitive exam.', gradient: 'from-primary to-primary/60' },
  { icon: Trophy, title: 'Leaderboard', desc: 'Compete with thousands and track your rank in real-time.', gradient: 'from-warning to-accent' },
  { icon: Flame, title: 'Daily Challenges', desc: 'Maintain your streak with fresh daily quiz challenges.', gradient: 'from-accent to-accent/60' },
  { icon: Target, title: 'Smart Analytics', desc: 'Track accuracy, time, and performance per topic.', gradient: 'from-success to-success/60' },
  { icon: BarChart3, title: 'Full Test Papers', desc: 'Practice complete exam papers with timer and scoring.', gradient: 'from-primary to-accent' },
  { icon: MessageSquare, title: 'Doubt Resolution', desc: 'Chat with experts to clear your doubts with image support.', gradient: 'from-primary/80 to-primary' },
  { icon: Shield, title: 'Negative Marking', desc: 'Real exam simulation with configurable negative marks.', gradient: 'from-destructive to-destructive/60' },
  { icon: Zap, title: 'Instant Results', desc: 'Get detailed analysis with solutions after every quiz.', gradient: 'from-warning to-warning/60' },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            Everything You Need to <span className="text-fire-gradient">Ace Your Exam</span>
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Built for serious exam aspirants who want a competitive edge</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Card className="glass-card border-0 h-full rounded-2xl hover:shadow-xl transition-all">
                <CardContent className="p-5 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
