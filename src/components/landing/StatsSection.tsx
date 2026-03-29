import { motion } from 'framer-motion';

const stats = [
  { value: '10K+', label: 'Active Students', emoji: '👨‍🎓' },
  { value: '50K+', label: 'Questions', emoji: '❓' },
  { value: '500+', label: 'Topics', emoji: '📚' },
  { value: '95%', label: 'Success Rate', emoji: '🏆' },
];

export default function StatsSection() {
  return (
    <section className="container -mt-8 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5 text-center hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <span className="text-2xl mb-2 block">{s.emoji}</span>
            <p className="font-heading text-2xl md:text-3xl font-bold text-fire-gradient">{s.value}</p>
            <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
