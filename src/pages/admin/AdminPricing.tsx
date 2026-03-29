import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPricing() {
  const qc = useQueryClient();

  const { data: courses } = useQuery({
    queryKey: ['admin-pricing-courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('*').order('title');
      return data || [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, is_free, price }: { id: string, is_free: boolean, price: number }) => {
      await supabase.from('courses').update({ is_free, price }).eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pricing-courses'] });
      toast.success('Pricing updated');
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Course Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage pricing for all courses</p>
        </div>

        <div className="space-y-3">
          {courses?.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className="glass-card border-0">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <p className="font-medium">{c.title}</p>
                    <Badge variant={c.is_free ? 'secondary' : 'default'} className="mt-1">{c.is_free ? 'Free' : `$${c.price}`}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.is_free}
                        onCheckedChange={v => update.mutate({ id: c.id, is_free: v, price: v ? 0 : c.price })}
                      />
                      <Label className="text-sm">Free</Label>
                    </div>
                    {!c.is_free && (
                      <Input
                        type="number"
                        className="w-24"
                        value={c.price}
                        onChange={e => update.mutate({ id: c.id, is_free: false, price: parseFloat(e.target.value) || 0 })}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!courses?.length && <p className="text-muted-foreground text-center py-10">No courses yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
