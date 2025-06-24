import type { Command } from "commander";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import { addGatewayClientOptions, callGatewayFromCli } from "./gateway-rpc.js";

export function registerWatchCli(program: Command) {
  const watch = program
    .command("watch")
    .description("Manage proactive agent watch triggers (via Gateway)");

  addGatewayClientOptions(
    watch
      .command("add")
      .description("Add a proactive agent nudge / watch trigger")
      .argument(
        "<instruction>",
        "Plain-text watch instruction (e.g. 'Check HackerNews for mentions of opin every day at 12pm')",
      )
      .option("--channel <id>", "Channel ID override")
      .option("--to <target>", "Target recipient override")
      .option("--agent <id>", "Agent ID (default: default agent)")
      .action(async (instruction, opts) => {
        try {
          const res = await callGatewayFromCli("watch.add", opts, {
            instruction,
            channel: opts.channel,
            to: opts.to,
            agentId: opts.agent,
          });
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );

  addGatewayClientOptions(
    watch
      .command("list")
      .alias("ls")
      .description("List active proactive agent nudges")
      .action(async (opts) => {
        try {
          const res = await callGatewayFromCli("watch.list", opts, {});
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );

  addGatewayClientOptions(
    watch
      .command("rm")
      .alias("remove")
      .alias("delete")
      .description("Remove an active watch nudge")
      .argument("<name>", "Watch name / slug")
      .action(async (name, opts) => {
        try {
          const res = await callGatewayFromCli("watch.remove", opts, { name });
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );
}
