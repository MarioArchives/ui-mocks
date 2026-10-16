// Starts the dev server on your network and prints a QR code: scan it with your phone (on the same Wi-Fi) to open the
// mocks there. Edits hot-reload on the phone as you save.
import { createServer } from 'vite';
import qrcode from 'qrcode-terminal';

const server = await createServer({ server: { host: true } });
await server.listen();
server.printUrls();

const url = server.resolvedUrls?.network[0];
if (url) {
  console.log(`\n  Scan to open on your phone (same Wi-Fi): ${url}\n`);
  qrcode.generate(url, { small: true });
} else {
  console.log('\n  No network address found: is this machine on Wi-Fi?');
}
