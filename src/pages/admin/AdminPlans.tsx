import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AdminPlans() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [period, setPeriod] = useState('monthly');
  const [features, setFeatures] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('subscription_plans').select('*').order('sort_order');
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const featureArr = features.split('\n').filter(f => f.trim());
      const payload = { name, price: Number(price), period, features: featureArr, is_free: isFree, is_active: isActive };
      if (editing) {
        await (supabase as any).from('subscription_plans').update(payload).eq('id', editing.id);
      } else {
        await (supabase as any).from('subscription_plans').insert(payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); setOpen(false); toast.success('Saved!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await (supabase as any).from('subscription_plans').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Deleted'); },
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price));
    setPeriod(p.period);
    setFeatures(((p.features as string[]) || []).join('\n'));
    setIsFree(p.is_free);
    setIsActive(p.is_active);
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setName(''); setPrice('0'); setPeriod('monthly'); setFeatures(''); setIsFree(false); setIsActive(true);
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Manage Plans</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-fire-gradient border-0"><Plus className="w-4 h-4 mr-1" /> Add Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit' : 'New'} Plan</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Plan Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Pro" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Price (₹)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
                  <div><Label>Period</Label><Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="monthly / yearly / forever" /></div>
                </div>
                <div><Label>Features (one per line)</Label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={5} value={features} onChange={e => setFeatures(e.target.value)} /></div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><Switch checked={isFree} onCheckedChange={setIsFree} /><Label>Free Plan</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
                </div>
                <Button onClick={() => save.mutate()} className="w-full bg-fire-gradient border-0" disabled={save.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {plans?.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass-card border-0 ${!p.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold">{p.name}</p>
                        {p.is_free && <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                        {!p.is_active && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">₹{p.price}/{p.period}</p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {((p.features as string[]) || []).slice(0, 3).map((f: string) => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                        {((p.features as string[]) || []).length > 3 && <Badge variant="outline" className="text-[10px]">+{((p.features as string[]) || []).length - 3}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
