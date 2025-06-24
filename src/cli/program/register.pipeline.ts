import type { Command } from "commander";
import {
  pipelineListCommand,
  pipelineGetCommand,
  pipelineCreateCommand,
  pipelineRemoveCommand,
  pipelineRunCommand,
  pipelineRunsCommand,
  pipelineStatusCommand,
  pipelineCancelCommand,
  pipelineRolesCommand,
  pipelineIdentityCommand,
} from "../../commands/pipeline.command.js";
import { danger } from "../../globals.js";
import { defaultRuntime } from "../../runtime.js";
import { runCommandWithRuntime } from "../cli-utils.js";
import { addGatewayClientOptions, callGatewayFromCli } from "../gateway-rpc.js";

export function registerPipelineCommands(program: Command) {
  const pipeline = program
    .command("pipeline")
    .description("Manage autonomous agent pipelines and team roles");

  pipeline
    .command("list")
    .description("List all pipelines")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineListCommand({ json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("get <id>")
    .description("Get pipeline details")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (id: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineGetCommand(id, { json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("create <id> <name>")
    .description("Create a new pipeline")
    .option("--description <text>", "Pipeline description")
    .option("--steps <file>", "JSON file with pipeline steps")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (id: string, name: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineCreateCommand(
          { id, name, description: opts.description, stepsFile: opts.steps },
          { json: opts.json, storePath: opts.store },
        );
      });
    });

  pipeline
    .command("remove <id>")
    .description("Remove a pipeline and its runs")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (id: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineRemoveCommand(id, { json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("run <pipelineId>")
    .description("Start a pipeline run")
    .option("--input <json>", "JSON input for the pipeline")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (pipelineId: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineRunCommand(
          { pipelineId, input: opts.input },
          { json: opts.json, storePath: opts.store },
        );
      });
    });

  pipeline
    .command("runs [pipelineId]")
    .description("List pipeline runs (optionally filtered by pipeline)")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (pipelineId: string | undefined, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineRunsCommand(pipelineId, { json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("status <runId>")
    .description("Get status of a pipeline run")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (runId: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineStatusCommand(runId, { json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("cancel <runId>")
    .description("Cancel a running pipeline")
    .option("--json", "Output JSON", false)
    .option("--store <path>", "Custom store path")
    .action(async (runId: string, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineCancelCommand(runId, { json: opts.json, storePath: opts.store });
      });
    });

  pipeline
    .command("roles [roleId]")
    .description("List roles or get role details")
    .option("--json", "Output JSON", false)
    .action(async (roleId: string | undefined, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineRolesCommand(roleId, { json: opts.json });
      });
    });

  pipeline
    .command("identity [agentId]")
    .description("List agent identities or get identity details")
    .option("--json", "Output JSON", false)
    .action(async (agentId: string | undefined, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await pipelineIdentityCommand(agentId, { json: opts.json });
      });
    });

  addGatewayClientOptions(
    pipeline
      .command("create-natural")
      .alias("cn")
      .description("Create a new pipeline using natural language")
      .argument(
        "<instruction>",
        "Plain-text pipeline instruction (e.g. 'Every Monday morning: 1) Research news, 2) Write summary')",
      )
      .option("--agent <id>", "Agent ID")
      .action(async (instruction, opts) => {
        try {
          const res = await callGatewayFromCli("pipeline.natural.create", opts, {
            instruction,
            agentId: opts.agent,
          });
          defaultRuntime.log(JSON.stringify(res, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      }),
  );
}
