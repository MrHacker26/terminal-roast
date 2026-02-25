import * as vscode from "vscode";
import { join } from "node:path";
import { exec } from "node:child_process";
import { readdir } from "node:fs/promises";

const COOLDOWN_MS = 2000;
const ERROR_PATTERNS = [
  "command not found",
  "no such file",
  "permission denied",
  "error",
  "failed",
];

type TerminalDataWriteEvent = {
  data: string;
  terminal: vscode.Terminal;
};

type WindowWithTerminalData = {
  onDidWriteTerminalData: vscode.Event<TerminalDataWriteEvent>;
};

let lastPlayTime = 0;
let audioFiles: string[] = [];

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  await loadAudioFiles(context);
  registerCommands(context);
  setupTerminalMonitoring(context);
}

export function deactivate(): void {}

async function loadAudioFiles(context: vscode.ExtensionContext) {
  const mediaPath = join(context.extensionPath, "media");

  try {
    const files = await readdir(mediaPath);
    audioFiles = files
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => join(mediaPath, f));

    if (audioFiles.length === 0) {
      vscode.window.showWarningMessage(
        "⚠️ No .mp3 files found in media folder!",
      );
    }
  } catch {
    vscode.window.showErrorMessage("❌ Failed to load audio files");
  }
}

function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("terminal-roast.testSound", playSound),
  );
}

function setupTerminalMonitoring(context: vscode.ExtensionContext) {
  if (!("onDidWriteTerminalData" in vscode.window)) {
    return;
  }

  const windowWithData = vscode.window as typeof vscode.window &
    WindowWithTerminalData;
  const listener = windowWithData.onDidWriteTerminalData(
    (event: TerminalDataWriteEvent) => {
      if (hasError(event.data.toLowerCase())) {
        playSound();
      }
    },
  );

  context.subscriptions.push(listener);
  vscode.window.showInformationMessage(
    `🔥 Terminal Roast activated! (${audioFiles.length} sounds loaded)`,
  );
}

function hasError(text: string): boolean {
  return ERROR_PATTERNS.some((err) => text.includes(err));
}

function playSound() {
  if (!canPlaySound()) {
    return;
  }

  lastPlayTime = Date.now();
  const sound = getRandomSound();
  const command = getAudioCommand(sound);

  exec(command, (error) => {
    if (error) {
      vscode.window.showWarningMessage("🔥 ROASTED! (audio failed)");
    }
  });
}

function canPlaySound(): boolean {
  const now = Date.now();
  return audioFiles.length > 0 && now - lastPlayTime >= COOLDOWN_MS;
}

function getRandomSound(): string {
  const index = Math.floor(Math.random() * audioFiles.length);
  return audioFiles[index]!;
}

function getAudioCommand(audioPath: string): string {
  const platform = process.platform;

  if (platform === "darwin") {
    return `afplay "${audioPath}"`;
  }

  if (platform === "win32") {
    return `powershell -c (New-Object Media.SoundPlayer '${audioPath}').PlaySync()`;
  }

  return `paplay "${audioPath}" || aplay "${audioPath}" || ffplay -nodisp -autoexit "${audioPath}" 2>/dev/null`;
}
