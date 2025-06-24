import type { Command } from "commander";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import { addGatewayClientOptions, callGatewayFromCli } from "./gateway-rpc.js";

export function registerDigestCli(program: Command) {
  const digest = program
    .command("digest")
    .description("Manage session memory digest (via Gateway)");

  addGatewayClientOptions(
    digest
      .command("enable")
      .description("Enable daily memory digest cron job")
      .option("--cron <expr>", "Cron expression (default: 5pm daily '0 17 * * *')")
      .option("--channel <id>", "Channel ID override")
      .option("--to <target>", "Target recipient override (e.g. phone number)")
      .action(async (opts) => {
        try {
          const res = await callGatewayFromCli("digest.enable", opts, {
            cronExpr: opts.cron,
            channel: opts.channel,
            to: opts.to,
          });
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );

  addGatewayClientOptions(
    digest
      .command("disable")
      .description("Disable daily memory digest cron job")
      .action(async (opts) => {
        try {
          const res = await callGatewayFromCli("digest.disable", opts, {});
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );

  addGatewayClientOptions(
    digest
      .command("status")
      .description("Show daily memory digest cron job status")
      .action(async (opts) => {
        try {
          const res = await callGatewayFromCli("digest.status", opts, {});
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );
}
