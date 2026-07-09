"use client";

import { Button } from "@heroui/react";
import { PanelCard, JsonBlock, ChannelAccountCard } from "./PanelHelpers";

export function ChannelsPanel({ store }: { store: any }) {
  const snapshot = store.channelsSnapshot as {
    channelOrder?: string[];
    channelLabels?: Record<string, string>;
    channelAccounts?: Record<string, Array<Record<string, unknown>>>;
  } | null;
  const channelEntries = snapshot?.channelOrder?.length
    ? snapshot.channelOrder
    : Object.keys(snapshot?.channelAccounts ?? {});

  return (
    <div className="space-y-5">
      <PanelCard
        title="Channels"
        description="Inspect the current channel availability snapshot and start or stop logins."
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
              onPress={() => store.refreshChannels(true)}
            >
              Probe channels
            </Button>
            <Button
              className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
              onPress={() => store.refreshChannels(false)}
            >
              Refresh
            </Button>
            <Button
              className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
              onPress={() => store.refreshTab("overview")}
            >
              Sync overview
            </Button>
          </div>
        }
      >
        <JsonBlock value={store.channelsSnapshot} />
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {channelEntries.map((channel) => {
          const accounts = snapshot?.channelAccounts?.[channel] ?? [];
          return (
            <PanelCard
              key={channel}
              title={String(snapshot?.channelLabels?.[channel] ?? channel)}
              description={`Accounts: ${accounts.length}`}
            >
              <div className="grid gap-3">
                {accounts.length === 0 ? (
                  <div className="text-sm text-foreground/55">No accounts configured.</div>
                ) : (
                  accounts.map((account, index) => (
                    <ChannelAccountCard key={index} channel={channel} account={account} />
                  ))
                )}
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard
        title="WhatsApp session"
        description="Local WhatsApp web login status and actions."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.startWhatsAppLogin(false)}
          >
            Start login
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.waitWhatsAppLogin()}
          >
            Wait for login
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.logoutWhatsApp()}
          >
            Logout
          </Button>
        </div>
        <div className="space-y-2 text-sm text-foreground/70">
          <div>Message: {store.whatsappLoginMessage ?? "none"}</div>
          <div>
            Connected:{" "}
            {store.whatsappLoginConnected == null
              ? "unknown"
              : store.whatsappLoginConnected
                ? "yes"
                : "no"}
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
