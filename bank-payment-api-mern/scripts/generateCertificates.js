import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Self-Signed SSL Certificates for Development
 *
 * This script generates SSL/TLS certificates for HTTPS development
 * For production, use certificates from a trusted CA (Let's Encrypt, DigiCert, etc.)
 */

async function generateCertificates() {
  try {
    console.log('🔐 Generating SSL/TLS Certificates for Development...\n');

    const certsDir = path.join(__dirname, '..', 'certs');

    // Create certs directory if it doesn't exist
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
      console.log('✅ Created certs directory');
    }

    const keyPath = path.join(certsDir, 'localhost-key.pem');
    const certPath = path.join(certsDir, 'localhost.pem');

    // Check if certificates already exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('⚠️  Certificates already exist!');
      console.log('   Delete them if you want to regenerate.\n');
      console.log(`   Key:  ${keyPath}`);
      console.log(`   Cert: ${certPath}\n`);
      return;
    }

    // Generate private key and certificate using OpenSSL
    const opensslCommand = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=BankPaymentAPI/OU=Development/CN=localhost"`;

    console.log('🔧 Running OpenSSL command...');
    console.log('   (This requires OpenSSL to be installed)\n');

    try {
      await execPromise(opensslCommand);
      console.log('✅ SSL certificates generated successfully!\n');
      console.log('📁 Certificate files:');
      console.log(`   Private Key: ${keyPath}`);
      console.log(`   Certificate: ${certPath}\n`);
      console.log('⚠️  IMPORTANT:');
      console.log('   - These are self-signed certificates for DEVELOPMENT only');
      console.log('   - Browsers will show security warnings - this is normal');
      console.log('   - For PRODUCTION, use certificates from a trusted CA\n');
      console.log('🚀 You can now start the server with HTTPS support:');
      console.log('   npm run dev\n');
    } catch (opensslError) {
      console.error('❌ OpenSSL not found or failed to execute\n');
      console.log('📝 Alternative: Use mkcert (https://github.com/FiloSottile/mkcert)\n');
      console.log('   Installation:');
      console.log('   - Windows (chocolatey): choco install mkcert');
      console.log('   - Windows (scoop): scoop install mkcert');
      console.log('   - macOS: brew install mkcert');
      console.log('   - Linux: apt install mkcert (or equivalent)\n');
      console.log('   Then run:');
      console.log('   mkcert -install');
      console.log(`   mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1\n`);
    }

  } catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    process.exit(1);
  }
}

generateCertificates();
