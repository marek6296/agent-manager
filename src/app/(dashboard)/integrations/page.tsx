import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegrationConnectButton } from "@/components/dashboard/integration-connect-button";
import { Plug, Mail, MessageCircle, Send, Hash, Phone, CheckCircle2, XCircle } from "lucide-react";
import type { Integration } from "@/lib/types";

const availableProviders = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Read inbox, send emails, and manage labels",
    icon: Mail,
    color: "text-red-400",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-500/20",
    available: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Manage DMs and post interactions",
    icon: MessageCircle,
    color: "text-pink-400",
    bgColor: "bg-pink-600/10",
    borderColor: "border-pink-500/20",
    available: false,
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Bot messages and channel management",
    icon: Send,
    color: "text-blue-400",
    bgColor: "bg-blue-600/10",
    borderColor: "border-blue-500/20",
    available: false,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Server and channel automation",
    icon: Hash,
    color: "text-indigo-400",
    bgColor: "bg-indigo-600/10",
    borderColor: "border-indigo-500/20",
    available: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Message automation and responses",
    icon: Phone,
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/10",
    borderColor: "border-emerald-500/20",
    available: false,
  },
];

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: integrations } = await supabase.from("integrations").select("*");
  const connectedIntegrations = (integrations as Integration[]) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="text-zinc-400 mt-1">Connect your favorite services to power your agents</p>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedIntegrations.map((integration) => {
              const provider = availableProviders.find(p => p.id === integration.provider);
              if (!provider) return null;
              return (
                <Card key={integration.id} className={`${provider.bgColor} border ${provider.borderColor}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-lg ${provider.bgColor}`}>
                        <provider.icon className={`w-5 h-5 ${provider.color}`} />
                      </div>
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-zinc-100 mb-1">{provider.name}</h3>
                    <p className="text-xs text-zinc-500">{provider.description}</p>
                    <div className="mt-4">
                      <IntegrationConnectButton
                        provider={provider.id}
                        integrationId={integration.id}
                        connected={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-200">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProviders.map((provider) => {
            const isConnected = connectedIntegrations.some(i => i.provider === provider.id && i.connected);
            if (isConnected) return null;
            return (
              <Card key={provider.id} className={`hover:border-zinc-700 transition-all ${!provider.available ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${provider.bgColor}`}>
                      <provider.icon className={`w-5 h-5 ${provider.color}`} />
                    </div>
                    {!provider.available && (
                      <Badge variant="outline">Coming Soon</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-1">{provider.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{provider.description}</p>
                  {provider.available ? (
                    <IntegrationConnectButton provider={provider.id} connected={false} />
                  ) : (
                    <button
                      disabled
                      className="w-full px-4 py-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-lg border border-zinc-700/50 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
