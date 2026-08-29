import { appendFile, readFile } from "node:fs/promises";

const escapeData = (value) =>
  String(value)
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");

const escapeProperty = (value) =>
  escapeData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");

export const writeCommand = (stream, command, properties, message) => {
  const serializedProperties = Object.entries(properties)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => `${key}=${escapeProperty(value)}`)
    .join(",");
  stream.write(
    `::${command}${serializedProperties ? ` ${serializedProperties}` : ""}::${escapeData(message)}\n`,
  );
};

export const writeOutput = async (environment, name, value) => {
  const outputFile = environment.GITHUB_OUTPUT;
  if (!outputFile) {
    return;
  }
  await appendFile(outputFile, `${name}=${String(value)}\n`, "utf8");
};

export const writeSummary = async (environment, markdown) => {
  const summaryFile = environment.GITHUB_STEP_SUMMARY;
  if (!summaryFile) {
    return;
  }
  await appendFile(summaryFile, `${markdown}\n`, "utf8");
};

export const readGitHubEvent = async (environment) => {
  if (!environment.GITHUB_EVENT_PATH) {
    return null;
  }
  try {
    return JSON.parse(await readFile(environment.GITHUB_EVENT_PATH, "utf8"));
  } catch {
    return null;
  }
};
