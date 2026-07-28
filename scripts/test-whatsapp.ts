/**
 * Smoke test WhatsApp Cloud API.
 *
 * Usage:
 *   npx tsx scripts/test-whatsapp.ts 50688887777
 *
 * Requires in .env:
 *   WHATSAPP_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 * Optional:
 *   WHATSAPP_TEMPLATE_CONFIRMATION
 *   WHATSAPP_TEMPLATE_LANG=es
 */
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Uso: npx tsx scripts/test-whatsapp.ts 506XXXXXXXX");
    process.exit(1);
  }

  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error(
      "Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en .env",
    );
    process.exit(1);
  }

  const { sendWhatsAppSmokeTest } = await import(
    "../services/whatsapp.service"
  );

  const result = await sendWhatsAppSmokeTest({
    toPhoneE164: to.startsWith("+") ? to : `+${to}`,
    customerName: "Prueba COELI",
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
