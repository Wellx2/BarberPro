const API_URL = 'http://localhost:3000/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function runAll() {
  console.log("🚀 Iniciando Testes de Fumaça E2E (Sem Mocks)...\n");

  try {
    // 1. Auth: Bad Request (Missing fields)
    const badLogin = await req('/auth/login', 'POST', { email: '' });
    console.log(`[Auth] Bad Request (Login Incompleto): Retornou ${badLogin.status} -> ${badLogin.status >= 400 ? '✅ SUCCESS' : '❌ FAIL'}`);

    // 2. Auth: Unauthorized (Wrong password)
    const unauthorized = await req('/auth/login', 'POST', { email: 'admin@klypbarber.com', password: 'wrongpassword' });
    console.log(`[Auth] Unauthorized (Senha Errada): Retornou ${unauthorized.status} -> ${unauthorized.status === 401 ? '✅ SUCCESS' : '❌ FAIL'}`);

    // 3. Auth: Login Real (Admin)
    const login = await req('/auth/login', 'POST', { email: 'admin@klypbarber.com', password: 'senha123' });
    console.log(`[Auth] Login Admin (/auth/login): Retornou ${login.status} -> ${login.status === 200 || login.status === 201 ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    if (!login.data || !login.data.accessToken) {
       console.log("   ⚠️ Backend não retornou token válido. Verifique se as credenciais admin@klypbarber.com / senha123 estão populadas no banco local.");
       return;
    }

    const token = login.data.accessToken;
    console.log(`   🔑 Token obtido com sucesso!`);

    // 4. Fluxos de Negócio: Listar Agendamentos
    const appointments = await req('/appointments', 'GET', null, token);
    console.log(`[Business Flow] Listar Agendamentos (/appointments): Retornou ${appointments.status} -> ${appointments.status === 200 ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    if (appointments.data && Array.isArray(appointments.data)) {
        console.log(`   📅 ${appointments.data.length} agendamentos reais carregados do banco.`);
    }

    console.log("\n✅ Testes automatizados via script finalizados!");
  } catch (error) {
    console.error("❌ Falha na execução do script:", error);
  }
}

runAll();
