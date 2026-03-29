import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, IndianRupee } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseList() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*, subjects(id)').eq('is_published', true).order('sort_order');
      return data || [];
    },
  });

  const filtered = courses?.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || (tab === 'course' && (c.category === 'course' || !c.category)) || (tab === 'test_series' && c.category === 'test_series');
    return matchSearch && matchTab;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Courses & Test Series</h1>
          <p className="text-muted-foreground mt-1">Explore and start learning</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search courses & test series..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="test_series">Test Series</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No {tab === 'test_series' ? 'test series' : tab === 'course' ? 'courses' : 'results'} found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c: any, i: number) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/courses/${c.id}`}>
                  <Card className="glass-card border-0 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group h-full">
                    <div className="h-32 bg-fire-gradient flex items-center justify-center relative">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-primary-foreground" />
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs capitalize">{c.category === 'test_series' ? 'Test Series' : 'Course'}</Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={c.is_free ? 'bg-success text-success-foreground text-xs' : 'bg-fire-gradient border-0 text-xs'}>
                          {c.is_free ? 'Free' : `₹${c.price}`}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">{c.title}</h3>
                      {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{c.subjects?.length || 0} Subjects</span>
                        {c.negative_marking > 0 && <span className="text-destructive">-{c.negative_marking} neg</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
