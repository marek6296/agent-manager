"use client";

import { useState } from "react";
import { getConnectUrl, disconnectIntegration } from "@/services/integrations/actions";
import { Button } from "@/components/ui/button";
import { Plug, Unplug } from "lucide-react";

export function IntegrationConnectButton({
  provider,
  integrationId,
  connected,
}: {
  provider: string;
  integrationId?: string;
  connected: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const url = await getConnectUrl(provider);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      // If Google OAuth is not configured, show a helpful message
      alert("Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integrationId) return;
    if (confirm("Are you sure you want to disconnect this integration?")) {
      setLoading(true);
      try {
        await disconnectIntegration(integrationId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDisconnect}
        disabled={loading}
        className="w-full text-red-400 border-red-500/20 hover:bg-red-600/10"
      >
        <Unplug className="w-3.5 h-3.5 mr-2" />
        {loading ? "Disconnecting..." : "Disconnect"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      className="w-full bg-violet-600 hover:bg-violet-700"
      size="sm"
    >
      <Plug className="w-3.5 h-3.5 mr-2" />
      {loading ? "Connecting..." : "Connect"}
    </Button>
  );
}
