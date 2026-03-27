const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    connectionString: "postgresql://postgres:barberpro_dev_2026_secure@localhost:5432/postgres" // Connect to default 'postgres' db
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados "postgres".');
    
    await client.query('CREATE DATABASE klypbarber;');
    console.log('Banco de dados "klypbarber" criado com sucesso!');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('O banco de dados "klypbarber" já existe.');
    } else {
      console.error('Erro ao criar o banco de dados:', err);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
