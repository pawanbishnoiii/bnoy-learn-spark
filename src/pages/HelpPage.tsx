import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageCircle, BookOpen, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const faqs = [
  { q: 'How do I start a quiz?', a: 'Go to Courses → Select a Course → Select a Subject → Choose a Topic and click Start. You can also take Full Paper tests.' },
  { q: 'What is XP and how do I earn it?', a: 'XP (Experience Points) are earned by completing quizzes. You get 10 XP for each correct answer. Higher XP = higher rank on leaderboard.' },
  { q: 'Can I bookmark questions?', a: 'Yes! While taking a quiz, click the bookmark icon on any question. Access your bookmarks from the sidebar menu.' },
  { q: 'How does negative marking work?', a: 'Some courses have negative marking enabled by admin. Wrong answers will deduct marks as configured (e.g., -0.25 per wrong answer).' },
  { q: 'How do I change the app language?', a: 'Go to Profile → Edit Profile → Select your preferred language (English or Hindi).' },
  { q: 'How do I upgrade to a paid plan?', a: 'Go to Billing from the sidebar menu to view available plans and make a payment via Razorpay.' },
  { q: 'My quiz got interrupted. Can I resume?', a: 'Currently, quizzes cannot be resumed once you leave the page. Make sure to complete your quiz in one sitting.' },
  { q: 'How is my accuracy calculated?', a: 'Accuracy = (Total Correct Answers / Total Questions Attempted) × 100. Only completed quizzes are counted.' },
];

export default function HelpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return toast.error('Please enter your message');
    toast.success('Your message has been sent! We\'ll get back to you soon.');
    setName(''); setEmail(''); setMessage('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-primary" /> Help & Support
          </h1>
          <p className="text-muted-foreground mt-1">Find answers or reach out to us</p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, label: 'Getting Started', desc: 'Learn the basics' },
            { icon: Shield, label: 'Account & Security', desc: 'Privacy & safety' },
            { icon: CreditCard, label: 'Billing', desc: 'Plans & payments' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass-card border-0 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-heading font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Textarea placeholder="Describe your issue or feedback..." value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            <Button onClick={handleSubmit} className="bg-fire-gradient border-0">Send Message</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
