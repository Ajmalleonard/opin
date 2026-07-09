"use client";

import { Card, Button } from "@heroui/react";
import { formatList } from "../../../ui/format";
import { PanelCard, JsonBlock } from "./PanelHelpers";

export function NodesPanel({ store }: { store: any }) {
  return (
    <div className="space-y-5">
      <PanelCard title="Nodes" description="System nodes and device pairing state.">
        <div className="flex flex-wrap gap-2 pb-2">
          <Button
            className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-2 px-4"
            onPress={() => store.refreshNodes()}
          >
            Refresh nodes
          </Button>
          <Button
            className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-2 px-4"
            onPress={() => store.loadDevices()}
          >
            Refresh devices
          </Button>
        </div>
        <JsonBlock value={store.nodes} />
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Pending devices" description="Approve or reject device pairing requests.">
          <div className="grid gap-3">
            {store.devicesList?.pending?.length ? (
              store.devicesList.pending.map((device: any) => (
                <Card
                  key={device.requestId}
                  className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-semibold text-foreground">
                      {device.displayName ?? device.deviceId}
                    </h4>
                    <p className="text-xs text-muted">{device.requestId}</p>
                  </div>
                  <div className="space-y-1 text-sm text-foreground/70">
                    <div>Role: {String(device.role ?? "n/a")}</div>
                    <div>Remote IP: {String(device.remoteIp ?? "n/a")}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 text-xs py-1.5 px-3"
                      onPress={() => store.approveDevice(device.requestId)}
                    >
                      Approve
                    </Button>
                    <Button
                      className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                      onPress={() => store.rejectDevice(device.requestId)}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-foreground/55">No pending pairings.</div>
            )}
          </div>
        </PanelCard>

        <PanelCard title="Paired devices" description="Rotatable tokens and granted roles.">
          <div className="grid gap-3">
            {store.devicesList?.paired?.length ? (
              store.devicesList.paired.map((device: any) => (
                <Card
                  key={device.deviceId}
                  className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-semibold text-foreground">
                      {device.displayName ?? device.deviceId}
                    </h4>
                    <p className="text-xs text-muted">{device.deviceId}</p>
                  </div>
                  <div className="space-y-1 text-sm text-foreground/70">
                    <div>Roles: {formatList(device.roles)}</div>
                    <div>Scopes: {formatList(device.scopes)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                      onPress={() =>
                        store.rotateDeviceToken({
                          deviceId: device.deviceId,
                          role: device.roles?.[0] ?? "operator",
                          scopes: device.scopes ?? undefined,
                        })
                      }
                    >
                      Rotate token
                    </Button>
                    <Button
                      className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                      onPress={() =>
                        store.revokeDeviceToken({
                          deviceId: device.deviceId,
                          role: device.roles?.[0] ?? "operator",
                        })
                      }
                    >
                      Revoke token
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-sm text-foreground/55">No paired devices.</div>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
