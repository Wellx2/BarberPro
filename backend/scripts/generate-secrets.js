#!/usr/bin/env node

/**
 * Script para gerar secrets seguros para KlypBarber
 * 
 * Uso:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\\n🔒 Gerador de Secrets para KlypBarber\\n');
console.log('━'.repeat(70));

console.log('\n📝 Copie estes valores para seu arquivo .env:\n');

console.log('# JWT Secrets');
console.log(`JWT_SECRET="${crypto.randomBytes(64).toString('hex')}"`);
console.log(`JWT_REFRESH_SECRET="${crypto.randomBytes(64).toString('hex')}"`);

console.log('\n# PostgreSQL Password (sugestão)');
const pgPassword = crypto.randomBytes(32).toString('base64').slice(0, 24);
console.log(`POSTGRES_PASSWORD="${pgPassword}"`);

console.log('\n# Atualize também a DATABASE_URL:');
console.log(`DATABASE_URL=\"postgresql://postgres:${pgPassword}@localhost:5432/klypbarber\"`);

console.log('\n━'.repeat(70));
console.log('\n⚠️  IMPORTANTE:');
console.log('   1. Copie estes valores APENAS para o arquivo .env (local)');
console.log('   2. NUNCA commite o arquivo .env no Git');
console.log('   3. Use secrets diferentes em cada ambiente (dev, staging, prod)');
console.log('   4. Para produção, use gerenciadores de secrets (AWS Secrets, HashiCorp Vault, etc.)\n');
