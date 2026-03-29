import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Bell, Shield, Globe, CreditCard, Image, Plus, Trash2, Upload, Palette, MessageSquare, Share2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const qc = useQueryClient();
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [appName, setAppName] = useState('Bnoy');
  const [appDesc, setAppDesc] = useState('The modern MCQ learning platform');
  const [appTagline, setAppTagline] = useState('Crack Any Exam with Smart Practice');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [banners, setBanners] = useState<string[]>([]);
  const [newBanner, setNewBanner] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E8580C');
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to Bnoy! Start practicing MCQs.');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsUrl, setTermsUrl] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      const map: Record<string, any> = {};
      data?.forEach(s => { map[s.key] = s.value; });
      return map;
    },
  });

  useEffect(() => {
    if (settings) {
      if (settings.general) {
        setAppName(settings.general.appName || 'Bnoy');
        setAppDesc(settings.general.appDesc || '');
        setAppTagline(settings.general.tagline || '');
        setWelcomeMsg(settings.general.welcomeMsg || '');
      }
      if (settings.support) {
        setSupportEmail(settings.support.email || '');
        setSupportPhone(settings.support.phone || '');
        setWhatsappLink(settings.support.whatsapp || '');
        setTelegramLink(settings.support.telegram || '');
        setYoutubeLink(settings.support.youtube || '');
        setInstagramLink(settings.support.instagram || '');
      }
      if (settings.notifications) {
        setEmailNotif(settings.notifications.email ?? true);
        setPushNotif(settings.notifications.push ?? false);
      }
      if (settings.security) {
        setMaintenanceMode(settings.security.maintenance ?? false);
        setRegistrationOpen(settings.security.registrationOpen ?? true);
      }
      if (settings.razorpay) {
        setRazorpayKey(settings.razorpay.key || '');
        setPaymentEnabled(settings.razorpay.enabled ?? false);
      }
      if (settings.banners) setBanners(settings.banners.urls || []);
      if (settings.appearance) {
        setPrimaryColor(settings.appearance.primaryColor || '#E8580C');
      }
      if (settings.legal) {
        setPrivacyPolicy(settings.legal.privacyPolicy || '');
        setTermsUrl(settings.legal.termsUrl || '');
      }
    }
  }, [settings]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-settings'] }),
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        saveSetting.mutateAsync({ key: 'general', value: { appName, appDesc, tagline: appTagline, welcomeMsg } }),
        saveSetting.mutateAsync({ key: 'support', value: { email: supportEmail, phone: supportPhone, whatsapp: whatsappLink, telegram: telegramLink, youtube: youtubeLink, instagram: instagramLink } }),
        saveSetting.mutateAsync({ key: 'notifications', value: { email: emailNotif, push: pushNotif } }),
        saveSetting.mutateAsync({ key: 'security', value: { maintenance: maintenanceMode, registrationOpen } }),
        saveSetting.mutateAsync({ key: 'razorpay', value: { key: razorpayKey, secret: razorpaySecret, enabled: paymentEnabled } }),
        saveSetting.mutateAsync({ key: 'banners', value: { urls: banners } }),
        saveSetting.mutateAsync({ key: 'appearance', value: { primaryColor } }),
        saveSetting.mutateAsync({ key: 'legal', value: { privacyPolicy, termsUrl } }),
      ]);
      toast.success('All settings saved!');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `banners/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
      setBanners(prev => [...prev, urlData.publicUrl]);
      toast.success('Banner uploaded!');
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  const sections = [
    {
      icon: Globe, title: 'General Settings',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>App Name</Label><Input value={appName} onChange={e => setAppName(e.target.value)} /></div>
            <div><Label>Tagline</Label><Input value={appTagline} onChange={e => setAppTagline(e.target.value)} /></div>
          </div>
          <div><Label>App Description</Label><Textarea value={appDesc} onChange={e => setAppDesc(e.target.value)} rows={2} /></div>
          <div><Label>Welcome Message</Label><Input value={welcomeMsg} onChange={e => setWelcomeMsg(e.target.value)} /></div>
        </div>
      ),
    },
    {
      icon: Image, title: 'Banner Management',
      content: (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Add banners for the landing page slider. Upload or paste URL.</p>
          {banners.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <img src={url} alt={`Banner ${i+1}`} className="w-20 h-12 rounded object-cover" />
              <Input value={url} readOnly className="flex-1 text-xs" />
              <Button size="icon" variant="ghost" onClick={() => setBanners(prev => prev.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Paste banner image URL..." value={newBanner} onChange={e => setNewBanner(e.target.value)} className="flex-1" />
            <Button onClick={() => { if (newBanner.trim()) { setBanners(prev => [...prev, newBanner.trim()]); setNewBanner(''); } }} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => bannerFileRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>
        </div>
      ),
    },
    {
      icon: Share2, title: 'Social & Support',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Support Email</Label><Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@example.com" /></div>
            <div><Label>Support Phone</Label><Input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="+91..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>WhatsApp Link</Label><Input value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} placeholder="https://wa.me/..." /></div>
            <div><Label>Telegram Link</Label><Input value={telegramLink} onChange={e => setTelegramLink(e.target.value)} placeholder="https://t.me/..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>YouTube Channel</Label><Input value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="https://youtube.com/..." /></div>
            <div><Label>Instagram</Label><Input value={instagramLink} onChange={e => setInstagramLink(e.target.value)} placeholder="https://instagram.com/..." /></div>
          </div>
        </div>
      ),
    },
    {
      icon: Bell, title: 'Notifications',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Email Notifications</Label><Switch checked={emailNotif} onCheckedChange={setEmailNotif} /></div>
          <div className="flex items-center justify-between"><Label>Push Notifications</Label><Switch checked={pushNotif} onCheckedChange={setPushNotif} /></div>
        </div>
      ),
    },
    {
      icon: Shield, title: 'Security & Access',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><Label>Maintenance Mode</Label><p className="text-xs text-muted-foreground">Disable app for students</p></div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Registration Open</Label><p className="text-xs text-muted-foreground">Allow new signups</p></div>
            <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
          </div>
        </div>
      ),
    },
    {
      icon: CreditCard, title: 'Razorpay Payment Gateway',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Enable Payments</Label><p className="text-xs text-muted-foreground">Allow paid course purchases</p></div>
            <Switch checked={paymentEnabled} onCheckedChange={setPaymentEnabled} />
          </div>
          {paymentEnabled && (
            <>
              <div><Label>Razorpay Key ID</Label><Input value={razorpayKey} onChange={e => setRazorpayKey(e.target.value)} placeholder="rzp_live_..." /></div>
              <div><Label>Razorpay Key Secret</Label><Input type="password" value={razorpaySecret} onChange={e => setRazorpaySecret(e.target.value)} placeholder="••••••••" /></div>
              <p className="text-xs text-muted-foreground">Get keys from <a href="https://dashboard.razorpay.com" target="_blank" className="text-primary underline">Razorpay Dashboard</a></p>
            </>
          )}
        </div>
      ),
    },
    {
      icon: FileText, title: 'Legal',
      content: (
        <div className="space-y-4">
          <div><Label>Privacy Policy URL</Label><Input value={privacyPolicy} onChange={e => setPrivacyPolicy(e.target.value)} placeholder="https://..." /></div>
          <div><Label>Terms of Service URL</Label><Input value={termsUrl} onChange={e => setTermsUrl(e.target.value)} placeholder="https://..." /></div>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
        {sections.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card border-0">
              <CardHeader><CardTitle className="font-heading text-lg flex items-center gap-2"><s.icon className="w-5 h-5 text-primary" /> {s.title}</CardTitle></CardHeader>
              <CardContent>{s.content}</CardContent>
            </Card>
          </motion.div>
        ))}
        <Button onClick={handleSave} className="bg-fire-gradient border-0 w-full" disabled={saveSetting.isPending}>
          {saveSetting.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </DashboardLayout>
  );
}
