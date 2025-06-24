import type { Command } from "commander";
import type { ProgramContext } from "./context.js";
import { formatDocsLink } from "../../terminal/links.js";
import { isRich, theme } from "../../terminal/theme.js";
import { formatCliBannerHero, hasEmittedCliBanner } from "../banner.js";
import { replaceCliName, resolveCliName } from "../cli-name.js";

const CLI_NAME = resolveCliName();

const EXAMPLES = [
  ["opin channels login --verbose", "Link personal WhatsApp Web and show QR + connection logs."],
  [
    'opin message send --target +25512345678 --message "Hi" --json',
    "Send via your web session and print JSON result.",
  ],
  ["opin gateway --port 18789", "Run the WebSocket Gateway locally."],
  ["opin --dev gateway", "Run a dev Gateway (isolated state/config) on ws://127.0.0.1:19001."],
  ["opin gateway --force", "Kill anything bound to the default gateway port, then start it."],
  ["opin gateway ...", "Gateway control via WebSocket."],
  [
    'opin agent --to +25512345678 --message "Run summary" --deliver',
    "Talk directly to the agent using the Gateway; optionally send the WhatsApp reply.",
  ],
  [
    'opin message send --channel telegram --target @mychat --message "Hi"',
    "Send via your Telegram bot.",
  ],
] as const;

export function configureProgramHelp(program: Command, ctx: ProgramContext) {
  program
    .name(CLI_NAME)
    .description("")
    .version(ctx.programVersion)
    .option(
      "--dev",
      "Dev profile: isolate state under ~/.opin-dev, default gateway port 19001, and shift derived ports (browser/canvas)",
    )
    .option(
      "--profile <name>",
      "Use a named profile (isolates OPIN_STATE_DIR/OPIN_CONFIG_PATH under ~/.opin-<name>)",
    );

  program.option("--no-color", "Disable ANSI colors", false);

  program.configureHelp({
    // sort options and subcommands alphabetically
    sortSubcommands: true,
    sortOptions: true,
    optionTerm: (option) => theme.option(option.flags),
    subcommandTerm: (cmd) => theme.command(cmd.name()),
  });

  program.configureOutput({
    writeOut: (str) => {
      const colored = str
        .replace(/^Usage:/gm, theme.heading("Usage:"))
        .replace(/^Options:/gm, theme.heading("Options:"))
        .replace(/^Commands:/gm, theme.heading("Commands:"));
      process.stdout.write(colored);
    },
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(theme.error(str)),
  });

  if (
    process.argv.includes("-V") ||
    process.argv.includes("--version") ||
    process.argv.includes("-v")
  ) {
    console.log(ctx.programVersion);
    process.exit(0);
  }

  program.addHelpText("beforeAll", () => {
    if (hasEmittedCliBanner()) {
      return "";
    }
    const rich = isRich();
    const hero = formatCliBannerHero(ctx.programVersion, { richTty: rich });
    return `\n${hero}\n`;
  });

  const fmtExamples = EXAMPLES.map(
    ([cmd, desc]) => `  ${theme.command(replaceCliName(cmd, CLI_NAME))}\n    ${theme.muted(desc)}`,
  ).join("\n");

  program.addHelpText("afterAll", ({ command }) => {
    if (command !== program) {
      return "";
    }
    const docs = formatDocsLink("/cli", "docs.opin.squareexp.com/cli");
    const quickStart = [
      `  ${theme.command(replaceCliName("opin setup", CLI_NAME))} ${theme.muted("# initialize config + workspace")}`,
      `  ${theme.command(replaceCliName("opin configure", CLI_NAME))} ${theme.muted("# connect providers and channels")}`,
      `  ${theme.command(replaceCliName("opin gateway", CLI_NAME))} ${theme.muted("# start the local control plane")}`,
    ].join("\n");
    return `\n${theme.heading("Quick Start:")}\n${quickStart}\n\n${theme.heading("Examples:")}\n${fmtExamples}\n\n${theme.muted("Docs:")} ${docs}\n`;
  });
}
