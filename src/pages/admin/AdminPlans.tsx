import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Pencil, Trash2 } from 'lucide-react';
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

  // Use app_settings table to store plans as JSON (no subscription_plans table needed)
  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('key', 'subscription_plans').single();
      return (data?.value as any[]) || [];
    },
  });

  const savePlans = useMutation({
    mutationFn: async (updatedPlans: any[]) => {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'subscription_plans',
        value: updatedPlans as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); setOpen(false); toast.success('Saved!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    const featureArr = features.split('\n').filter(f => f.trim());
    const plan = {
      id: editing?.id || crypto.randomUUID(),
      name, price: Number(price), period, features: featureArr,
      is_free: isFree, is_active: isActive,
    };
    const current = plans || [];
    const updated = editing
      ? current.map((p: any) => p.id === editing.id ? plan : p)
      : [...current, plan];
    savePlans.mutate(updated);
  };

  const handleDelete = (id: string) => {
    const updated = (plans || []).filter((p: any) => p.id !== id);
    savePlans.mutate(updated);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price));
    setPeriod(p.period);
    setFeatures((p.features || []).join('\n'));
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
              <Button onClick={openNew} className="bg-fire-gradient border-0 rounded-2xl"><Plus className="w-4 h-4 mr-1" /> Add Plan</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit' : 'New'} Plan</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Plan Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Pro" className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Price (₹)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="rounded-xl" /></div>
                  <div><Label>Period</Label><Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="monthly / yearly / forever" className="rounded-xl" /></div>
                </div>
                <div><Label>Features (one per line)</Label><textarea className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" rows={5} value={features} onChange={e => setFeatures(e.target.value)} /></div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><Switch checked={isFree} onCheckedChange={setIsFree} /><Label>Free Plan</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
                </div>
                <Button onClick={handleSave} className="w-full bg-fire-gradient border-0 rounded-2xl" disabled={savePlans.isPending}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {!plans?.length && (
            <Card className="glass-card border-0"><CardContent className="p-8 text-center text-muted-foreground">No plans yet. Click "Add Plan" to create one.</CardContent></Card>
          )}
          {plans?.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass-card border-0 rounded-2xl ${!p.is_active ? 'opacity-60' : ''}`}>
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
                        {(p.features || []).slice(0, 3).map((f: string) => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                        {(p.features || []).length > 3 && <Badge variant="outline" className="text-[10px]">+{(p.features || []).length - 3}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
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
