import { execSync } from "child_process";
import crypto from "crypto";
import os from "os";
import fs from "fs";

export const PROJECT_PREFIX = "OFC";

/**
 * Coleta o identificador único nativo de hardware da máquina de forma 100% offline.
 * - Windows: UUID da Placa-Mãe / BIOS
 * - macOS: IOPlatformSerialNumber
 * - Linux: /etc/machine-id ou /sys/class/dmi/id/product_uuid
 */
export function getRawHardwareUuid(): string {
  const platform = os.platform();

  try {
    if (platform === "win32") {
      // 1. Tenta PowerShell CIM (moderno e rápido)
      try {
        const output = execSync(
          'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"',
          { encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }
        ).trim();
        if (output && output.length > 8 && !output.includes("00000000")) {
          return `win-${output}`;
        }
      } catch (e) {}

      // 2. Fallback WMIC
      try {
        const output = execSync("wmic csproduct get uuid", {
          encoding: "utf8",
          timeout: 3000,
          stdio: ["ignore", "pipe", "ignore"],
        });
        const lines = output.split("\r\n").map((l) => l.trim()).filter((l) => l && l !== "UUID");
        if (lines.length > 0 && lines[0].length > 8) {
          return `win-${lines[0]}`;
        }
      } catch (e) {}

      // 3. Fallback Volume Serial Number do Disco C:
      try {
        const output = execSync("vol c:", {
          encoding: "utf8",
          timeout: 2000,
          stdio: ["ignore", "pipe", "ignore"],
        });
        const match = output.match(/[A-Za-z0-9]{4}-[A-Za-z0-9]{4}/);
        if (match) return `win-vol-${match[0]}`;
      } catch (e) {}
    } else if (platform === "darwin") {
      // macOS: IOPlatformSerialNumber
      try {
        const output = execSync(
          "ioreg -l | grep IOPlatformSerialNumber | awk '{print $4}' | tr -d '\"'",
          { encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }
        ).trim();
        if (output) return `mac-${output}`;
      } catch (e) {}
    } else if (platform === "linux") {
      // Linux: /etc/machine-id
      try {
        if (fs.existsSync("/etc/machine-id")) {
          const id = fs.readFileSync("/etc/machine-id", "utf8").trim();
          if (id) return `linux-${id}`;
        }
        if (fs.existsSync("/sys/class/dmi/id/product_uuid")) {
          const id = fs.readFileSync("/sys/class/dmi/id/product_uuid", "utf8").trim();
          if (id) return `linux-dmi-${id}`;
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("Erro ao ler identificador de hardware nativo:", err);
  }

  // Fallback seguro baseado em CPU + Hostname + Interfaces de Rede
  const cpus = os.cpus().map((c) => c.model).join(";");
  const hostname = os.hostname();
  const networkInterfaces = JSON.stringify(os.networkInterfaces());
  return `fallback-${hostname}-${cpus}-${networkInterfaces}`;
}

/**
 * Formata o Hardware ID em um código amigável e legível: OFC-XXXX-XXXX-XXXX
 */
export function getFormattedHardwareId(): string {
  const raw = getRawHardwareUuid();
  const hash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();

  const part1 = hash.substring(0, 4);
  const part2 = hash.substring(4, 8);
  const part3 = hash.substring(8, 12);

  return `${PROJECT_PREFIX}-${part1}-${part2}-${part3}`;
}
