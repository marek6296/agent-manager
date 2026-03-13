import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Shield, Bell, Palette } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-zinc-200">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Account ID</p>
              <p className="text-sm text-zinc-400 font-mono text-xs">{user?.id}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Provider</p>
              <p className="text-sm text-zinc-200 capitalize">{user?.app_metadata?.provider || "email"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-zinc-200">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Security
          </CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-zinc-200">Row Level Security</p>
              <p className="text-xs text-zinc-500">All data is protected with RLS policies</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-zinc-800">
            <div>
              <p className="text-sm text-zinc-200">API Key Encryption</p>
              <p className="text-xs text-zinc-500">Integration tokens are securely stored</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            AI Configuration
          </CardTitle>
          <CardDescription>Configure AI provider settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-zinc-200">AI Provider</p>
              <p className="text-xs text-zinc-500">Current model provider</p>
            </div>
            <Badge>OpenAI</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-zinc-800">
            <div>
              <p className="text-sm text-zinc-200">Default Model</p>
              <p className="text-xs text-zinc-500">Used for AI agent operations</p>
            </div>
            <Badge variant="secondary">gpt-4o-mini</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-zinc-800">
            <div>
              <p className="text-sm text-zinc-200">API Key Status</p>
              <p className="text-xs text-zinc-500">OpenAI API key configuration</p>
            </div>
            <Badge variant={process.env.OPENAI_API_KEY ? "success" : "destructive"}>
              {process.env.OPENAI_API_KEY ? "Configured" : "Not Set"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-blue-400" />
            Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Version</p>
              <p className="text-zinc-200">1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Framework</p>
              <p className="text-zinc-200">Next.js 14</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Database</p>
              <p className="text-zinc-200">Supabase (PostgreSQL)</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Runtime</p>
              <p className="text-zinc-200">Node.js</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
