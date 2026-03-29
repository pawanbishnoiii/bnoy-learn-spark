import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function CoursesSection() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: courses } = useQuery({
    queryKey: ['landing-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*, subjects(id)').eq('is_published', true).order('sort_order').limit(6);
      return data || [];
    },
  });

  const filtered = courses?.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!filtered.length && !search) return null;

  return (
    <section className="container pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            Popular <span className="text-fire-gradient">Courses & Test Series</span>
          </h2>
          <p className="text-muted-foreground mt-1">Start practicing with our top-rated content</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl w-52" />
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to={user ? '/courses' : '/signup'}>View All</Link>
          </Button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link to={user ? `/courses/${c.id}` : '/signup'}>
                <Card className="glass-card border-0 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden group h-full rounded-2xl">
                  <div className="h-36 bg-hero-gradient flex items-center justify-center relative overflow-hidden">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-primary-foreground/80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="text-xs capitalize rounded-lg bg-white/90 text-foreground">{c.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className={`text-xs rounded-lg ${c.is_free ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'}`}>
                        {c.is_free ? 'Free' : `₹${c.price}`}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-heading font-semibold text-base group-hover:text-primary transition-colors">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded-md">{c.subjects?.length || 0} Subjects</span>
                      {c.negative_marking > 0 && <span className="text-destructive">-{c.negative_marking} neg</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">No courses found matching "{search}"</p>
      )}
    </section>
  );
}
