import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Rahul S.', role: 'SSC Aspirant', text: 'This platform helped me score 95+ in my SSC exam. The topic-wise practice is amazing!', rating: 5 },
  { name: 'Priya M.', role: 'Bank PO', text: 'Daily challenges kept me consistent. Best quiz app I have ever used for exam prep.', rating: 5 },
  { name: 'Amit K.', role: 'UPSC Student', text: 'The analytics feature showed me exactly where I was weak. Improved my accuracy by 30%!', rating: 5 },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-5" />
      <div className="container relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold">What Students <span className="text-fire-gradient">Say</span></h2>
          <p className="text-muted-foreground mt-2">Trusted by thousands of exam aspirants across India</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card border-0 h-full rounded-2xl hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-fire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{t.name}</p>
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
  );
}
