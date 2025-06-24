import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam, readNumberParam } from "./common.js";
import { stringEnum, optionalStringEnum } from "../schema/typebox.js";
import type { PipelineState } from "../../pipelines/service.js";
import {
  addPipeline,
  listPipelines,
  getPipeline,
  removePipeline,
  startRun,
  getRun,
  listRuns,
  cancelRun,
} from "../../pipelines/service.js";
import { getRole, listRoles } from "../roles.js";
import { getIdentity, listIdentities, addContact, listContacts } from "../agent-identity.js";

const PIPELINE_ACTIONS = ["list", "get", "create", "remove", "run", "runs", "status", "cancel", "roles", "identity", "contacts"] as const;

const PipelineToolSchema = Type.Object({
  action: stringEnum(PIPELINE_ACTIONS),
  pipelineId: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  steps: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
  runId: Type.Optional(Type.String()),
  input: Type.Optional(Type.Object({}, { additionalProperties: true })),
  role: Type.Optional(Type.String()),
  agentId: Type.Optional(Type.String()),
  agentName: Type.Optional(Type.String()),
  contactId: Type.Optional(Type.String()),
  contactName: Type.Optional(Type.String()),
  contactRole: Type.Optional(Type.String()),
});

export function createPipelineTool(opts: {
  state: PipelineState;
}): AnyAgentTool {
  const state = opts.state;
  return {
    label: "Pipeline",
    name: "pipeline",
    description: "Manage autonomous pipelines and team operations. Actions: list, get, create, remove, run, runs, status, cancel, roles, identity, contacts.",
    parameters: PipelineToolSchema,
    execute: async (_toolCallId, params) => {
      const action = readStringParam(params, "action", { required: true });

      switch (action) {
        case "list": {
          const pipelines = await listPipelines(state);
          return jsonResult({ pipelines });
        }

        case "get": {
          const id = readStringParam(params, "pipelineId", { required: true });
          const pipeline = await getPipeline(state, id);
          if (!pipeline) return jsonResult({ error: `Pipeline not found: ${id}` });
          return jsonResult({ pipeline });
        }

        case "create": {
          const id = readStringParam(params, "pipelineId", { required: true });
          const name = readStringParam(params, "name", { required: true });
          const desc = readStringParam(params, "description");
          const stepsRaw = params.steps as any[] | undefined;
          const steps = (stepsRaw ?? []).map((s: any, i: number) => ({
            kind: s.kind ?? "agent",
            id: s.id ?? `step-${i}`,
            task: s.task ?? "",
            ...s,
          }));
          const pipeline = await addPipeline(state, {
            id,
            name,
            description: desc,
            steps,
          });
          return jsonResult({ created: true, pipeline });
        }

        case "remove": {
          const id = readStringParam(params, "pipelineId", { required: true });
          const removed = await removePipeline(state, id);
          return jsonResult({ removed });
        }

        case "run": {
          const id = readStringParam(params, "pipelineId", { required: true });
          const inputRaw = params.input as Record<string, unknown> | undefined;
          const run = await startRun(state, {
            pipelineId: id,
            input: inputRaw,
            trigger: "manual",
          });
          return jsonResult({ run });
        }

        case "runs": {
          const id = readStringParam(params, "pipelineId");
          const runs = await listRuns(state, id ?? undefined);
          return jsonResult({ runs });
        }

        case "status": {
          const runId = readStringParam(params, "runId", { required: true });
          const run = await getRun(state, runId);
          if (!run) return jsonResult({ error: `Run not found: ${runId}` });
          return jsonResult({ run });
        }

        case "cancel": {
          const runId = readStringParam(params, "runId", { required: true });
          const cancelled = await cancelRun(state, runId);
          return jsonResult({ cancelled });
        }

        case "roles": {
          const roleId = readStringParam(params, "role");
          if (roleId) {
            const role = getRole(roleId);
            return jsonResult({ role: role ?? { error: `Role not found: ${roleId}` } });
          }
          return jsonResult({ roles: listRoles().map((r) => ({ id: r.id, name: r.name, title: r.title })) });
        }

        case "identity": {
          const agentId = readStringParam(params, "agentId");
          if (agentId) {
            const identity = getIdentity(agentId);
            return jsonResult({ identity: identity ?? { error: `Identity not found: ${agentId}` } });
          }
          return jsonResult({ identities: listIdentities() });
        }

        case "contacts": {
          const ownerAgentId = readStringParam(params, "agentId", { required: true });
          const contactName = readStringParam(params, "contactName");
          const contactRole = readStringParam(params, "contactRole");
          if (contactName && contactRole) {
            const cid = readStringParam(params, "contactId") ?? `contact-${Date.now()}`;
            addContact(ownerAgentId, {
              agentId: cid,
              name: contactName,
              role: contactRole as any,
              status: "active",
            });
            return jsonResult({ added: true, contactId: cid });
          }
          const contactId = readStringParam(params, "contactId");
          if (contactId) {
            const contact = listContacts(ownerAgentId).find((c) => c.agentId === contactId);
            return jsonResult({ contact: contact ?? { error: `Contact not found: ${contactId}` } });
          }
          return jsonResult({ contacts: listContacts(ownerAgentId) });
        }

        default:
          return jsonResult({ error: `Unknown action: ${action}` });
      }
    },
  };
}
