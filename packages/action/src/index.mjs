import { writeCommand, writeSummary } from "./github.mjs";
import { runAction } from "./run.mjs";

try {
  const result = await runAction();
  if (result.failed) {
    process.exitCode = 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  writeCommand(
    process.stdout,
    "error",
    { title: "Coding Bible action" },
    message,
  );
  await writeSummary(
    process.env,
    `## Coding Bible\n\n❌ Action failed before analysis completed.\n\n${message}`,
  );
  process.exitCode = 1;
}
