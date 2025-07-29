const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys");
const qrcode = require("qrcode-terminal");
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot WhatsApp rodando no Railway!"));
app.listen(PORT, () => console.log("Servidor ativo na porta " + PORT));

const { state, saveState } = useSingleFileAuthState("./auth.json");

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📲 Escaneie o QR Code abaixo com o WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ Bot conectado com sucesso!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Conexão encerrada. Código:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 Reconectando...");
        startBot();
      } else {
        console.log("🔒 Sessão expirada. Apague auth.json para gerar novo QR.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const message = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (message?.toLowerCase() === "oi") {
      await sock.sendMessage(sender, { text: "Olá! 👋 Eu sou o bot do Railway." });
    }
  });
}

startBot();