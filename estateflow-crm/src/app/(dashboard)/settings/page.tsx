'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Phone, MessageSquare, Mail, Key, Webhook, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  function handleSave(section: string) {
    toast.success(`${section} settings saved`);
  }

  return (
    <>
      <Header title="Settings & Integrations" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-base">Twilio Voice</CardTitle>
                <CardDescription>Configure Twilio for call bridge automation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <Input placeholder="AC..." type="password" />
            </div>
            <div className="space-y-2">
              <Label>Auth Token</Label>
              <Input placeholder="••••••••" type="password" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1234567890" />
            </div>
            <Button onClick={() => handleSave('Twilio')} size="sm">Save Twilio Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-base">WhatsApp</CardTitle>
                <CardDescription>Configure WhatsApp Business messaging</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Sender Number</Label>
              <Input placeholder="+1234567890" />
            </div>
            <Button onClick={() => handleSave('WhatsApp')} size="sm">Save WhatsApp Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-base">Email (Resend)</CardTitle>
                <CardDescription>Configure email sending via Resend API</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Resend API Key</Label>
              <Input placeholder="re_..." type="password" />
            </div>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">Or use SMTP</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input placeholder="587" type="number" />
              </div>
              <div className="space-y-2">
                <Label>SMTP User</Label>
                <Input placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input placeholder="••••••••" type="password" />
              </div>
            </div>
            <Button onClick={() => handleSave('Email')} size="sm">Save Email Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle className="text-base">Webhook</CardTitle>
                <CardDescription>Lead intake webhook configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input placeholder="Your webhook secret for authentication" type="password" />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono">POST /api/webhooks/leads</p>
              <p className="text-xs text-muted-foreground mt-1">
                Include header: <code>x-webhook-secret: YOUR_SECRET</code>
              </p>
            </div>
            <Button onClick={() => handleSave('Webhook')} size="sm">Save Webhook Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-600" />
              <div>
                <CardTitle className="text-base">AI (OpenAI Compatible)</CardTitle>
                <CardDescription>AI-powered message drafting and property descriptions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input placeholder="sk-..." type="password" />
            </div>
            <Button onClick={() => handleSave('AI')} size="sm">Save AI Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              <div>
                <CardTitle className="text-base">Lead Assignment</CardTitle>
                <CardDescription>Configure how new leads are assigned to agents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Assignment Mode</Label>
              <Select defaultValue="round_robin">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="least_busy">Least Busy Agent</SelectItem>
                  <SelectItem value="manual">Manual Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSave('Assignment')} size="sm">Save Assignment Settings</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
