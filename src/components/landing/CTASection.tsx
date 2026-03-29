import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function CTASection() {
  const { user } = useAuthStore();

  return (
    <section className="container py-20">
      <motion.div
        className="bg-hero-gradient rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 5, repeat: Infinity }} />
          <motion.div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 4, repeat: Infinity }} />
        </div>
        <div className="relative">
          <h2 className="font-heading text-2xl md:text-4xl font-bold mb-4">
            {user ? 'Continue Your Learning Journey' : 'Ready to Ace Your Exam?'}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
            {user ? 'Keep practicing and climb the leaderboard!' : 'Join thousands of successful learners today. Start for free.'}
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 border-0 rounded-2xl px-8 h-14 text-lg shadow-xl">
            <Link to={user ? '/dashboard' : '/signup'}>
              {user ? 'Go to Dashboard' : 'Create Free Account'} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
