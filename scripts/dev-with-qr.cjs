const os = require("os");
const { spawn } = require("child_process");
const qrcode = require("qrcode-terminal");

function getLanIp() {
  const nets = os.networkInterfaces();

  for (const entries of Object.values(nets)) {
    if (!entries) {
      continue;
    }

    for (const net of entries) {
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      const isIPv4 = net.family === familyV4Value;

      if (isIPv4 && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

const port = process.env.VITE_PORT || "5173";
const ip = getLanIp();
const appUrl = `http://${ip}:${port}`;

console.log("\nScan this QR from your phone (same Wi-Fi/network):");
console.log(appUrl);
qrcode.generate(appUrl, { small: true });
console.log("\nStarting app in LAN mode...\n");

const child = spawn("npm run dev:lan:run", {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
