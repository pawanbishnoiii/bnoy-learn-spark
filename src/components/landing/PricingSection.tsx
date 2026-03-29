import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    desc: 'Get started with basic features',
    features: ['5 Courses access', 'Daily challenges', 'Basic analytics', 'Community support'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '₹199',
    period: '/month',
    desc: 'Unlock everything for serious prep',
    features: ['All Courses & Test Series', 'Unlimited quizzes', 'Advanced analytics', 'Priority support', 'No ads', 'Doubt resolution'],
    cta: 'Go Pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: '₹499',
    period: '/month',
    desc: 'For maximum exam readiness',
    features: ['Everything in Pro', 'PDF downloads', '1-on-1 mentoring', 'Custom test series', 'Early access to new content', 'Certificate of completion'],
    cta: 'Get Premium',
    popular: false,
  },
];

export default function PricingSection() {
  const { user } = useAuthStore();

  return (
    <section className="container py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold">
          Simple, Transparent <span className="text-fire-gradient">Pricing</span>
        </h2>
        <p className="text-muted-foreground mt-2">Choose the plan that fits your exam prep needs</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((p, i) => (
          <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className={`rounded-2xl h-full relative overflow-hidden transition-all hover:-translate-y-1 ${p.popular ? 'border-2 border-primary shadow-xl shadow-primary/10' : 'glass-card border-0'}`}>
              {p.popular && (
                <div className="absolute top-0 right-0 bg-fire-gradient text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-heading text-lg font-bold">{p.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{p.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="font-heading text-3xl font-extrabold">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full rounded-xl h-11 ${p.popular ? 'bg-fire-gradient border-0 fire-glow' : ''}`} variant={p.popular ? 'default' : 'outline'}>
                  <Link to={user ? '/billing' : '/signup'}>{p.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
