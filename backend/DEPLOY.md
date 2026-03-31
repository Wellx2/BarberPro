# Guia Passo a Passo: Como fazer o Deploy do Backend no Vercel 🚀

Este guia foi escrito especialmente para você que **não tem experiência** com deploys. Siga cada passo com calma e você vai conseguir colocar o backend online sem dificuldades!

O backend precisa de **dois serviços gratuitos** trabalhando juntos:
- **Supabase** → O banco de dados (onde ficam todos os dados de clientes, barbearias, etc.)
- **Vercel** → O servidor que roda o código da API (como um computador sempre ligado na nuvem)

---

## Pré-requisito: Código no GitHub
Antes de tudo, o código do backend precisa estar salvo no GitHub (da mesma forma que você fez com o frontend).

1. Se ainda não tem, crie um repositório privado no [github.com](https://github.com/) chamado `barberpro-backend`.
2. No terminal do VS Code (dentro da pasta `backend`), certifique-se de que o código já foi commitado e enviado para o GitHub.

---

## Passo 1: Criar o Banco de Dados no Supabase 🗄️

O banco de dados é onde todos os dados da barbearia ficam guardados. Usaremos o **Supabase**, que é gratuito e muito confiável.

1. Acesse [supabase.com](https://supabase.com/) e clique em **"Start your project"**.
2. Faça login com sua conta do **GitHub** (fica mais fácil).
3. Clique no botão verde **"New Project"**.
4. Preencha as informações:
   - **Organization**: pode deixar o padrão.
   - **Project name**: escreva `klypbarber-production`.
   - **Database Password**: crie uma **senha forte** (ex: `KlypBarber@2026!Prod`). ⚠️ **GUARDE ESSA SENHA** — você precisará dela daqui a pouco.
   - **Region**: escolha **South America (São Paulo)** para menor latência.
5. Clique em **"Create new project"** e aguarde 2-3 minutos enquanto o banco é criado.

### Pegando a URL de conexão do banco:

Existem duas formas de a**Opção A (A mais rápida - Recomendada):**
6. No topo da tela do seu projeto no Supabase, clique no botão azul escrito **"Connect"** (fica lá em cima, do lado direito).
7. Vai abrir uma janelinha. Clique em **"ORM"** e selecione **"Prisma"**.
8. Você verá dois links importantes. Copie os dois para o seu bloco de notas:

   - **DATABASE_URL (Pooling):** É o link com o final `:6543/postgres?pgbouncer=true`. Ele serve para a API rodar no dia a dia.
   - **DIRECT_URL (Direct):** É o link com o final `:5432/postgres`. Ele serve especificamente para você rodar as Migrations (o comando de criar tabelas).

**Opção B (Pelas configurações):**
6. No menu lateral, lá embaixo, clique no ícone da **⚙️ Project Settings** (Engrenagem).
   > ⚠️ **Atenção:** Não clique no ícone de "Cilindro" (Database) da barra lateral, pois ele serve apenas para ver tabelas e vai dizer que não tem nada (pois seu banco ainda está vazio).
7. Dentro de Settings, procure por **"Database"** no menu que abriu.
8. Procure a seção de **"Connection string"** (pode estar dentro de "Connect"). Certifique-se de pegar tanto a URL de **Pooling** (porta 6543) quanto a **Direct** (porta 5432).

**Independente da opção escolhida:**

9. Você verá um bloco de código (geralmente em uma caixa preta) com dois links. **Copie e cole ambos em um bloco de notas (Notepad) no seu computador.** Eles serão parecidos com isto:

   ```env
   # Link A: DATABASE_URL (Pooling) -> Usado para a API rodar na Vercel (Passo 4)
   DATABASE_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Link B: DIRECT_URL (Direct) -> Usado para criar as tabelas (Passo 6.1)
   DIRECT_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
   ```

10. **Prepare os links no seu bloco de notas**:
    - Em ambos os links, apague o texto `[YOUR-PASSWORD]` (incluindo os colchetes).
    - No lugar dele, digite a **senha do banco** que você criou lá no início (Passo 1.4).
    - Agora você tem seus dois "endereços finais" prontos e limpos.

11. ✅ **Deixe esse bloco de notas aberto!** 
    - Você vai usar o **Link A** no **Passo 4** (nas configurações da Vercel).
    - Você vai usar o **Link B** no **Passo 6.1** (no seu arquivo .env local).



---

## Passo 2: Gerar os Segredos de Segurança (JWT Secrets) 🔑

Os JWT Secrets são como "senhas mestras" que protegem os tokens de login dos usuários. Você precisa gerar dois.

No terminal do VS Code, cole e execute esse comando:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Cada execução vai gerar uma sequência gigante de letras e números. **Copie e guarde as duas** no bloco de notas.

---

## Passo 3: Criar uma conta na Vercel e importar o projeto 🌐

1. Acesse [vercel.com](https://vercel.com/) e clique em **"Sign Up"**.
2. Escolha **"Continue with GitHub"**.
3. Após o login, clique em **"Add New..."** e depois em **"Project"**.
4. Na lista de repositórios, encontre o `barberpro-backend` e clique em **"Import"**.

---

## Passo 4: Configurar o Deploy ⚙️

Na tela de "Configure Project":

1. **Project Name**: pode colocar `klypbarber-api`.
2. **Framework Preset**: selecione **"Other"**.
3. **Root Directory**: **IMPORTANTE** — Se seu repositório contém as pastas `backend` e `frontend` juntas no mesmo repositório, clique em **"Edit"** e selecione apenas a pasta `backend`. Se o `backend` for um repositório separado, deixe como está.
4. **Build Command**: deixe em branco (a Vercel vai usar o `vercel-build` do `package.json` automaticamente, que executa `prisma generate && npm run build`).
5. **Output Directory**: deixe em branco.

### ⚙️ Environment Variables (Variáveis de Ambiente) — **A PARTE MAIS IMPORTANTE**

Aqui é onde você cola as "configurações secretas" do seu servidor. Na Vercel, você verá dois campos: **Key** (Nome) e **Value** (Valor). 

Para cada linha abaixo, digite o nome no campo **Key**, cole o valor no campo **Value** e clique no botão **"Add"**:

| Key (Nome) | Value (Valor) |
|------|-------|
| `DATABASE_URL` | O link do Supabase que termina com `:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | O link do Supabase que termina com `:5432/postgres` |
| `JWT_SECRET` | O primeiro código gigante que você gerou no terminal (Passo 2) |
| `JWT_REFRESH_SECRET` | O segundo código gigante que você gerou no terminal (Passo 2) |
| `NODE_ENV` | Escreva exatamente: `production` |
| `FRONTEND_URL` | O link do seu site (ex: `https://klypbarber.vercel.app`) |

> 💡 **Dica**: No campo Value do `JWT_SECRET`, você pode simplesmente copiar a sequência de letras e números que apareceu no seu terminal do VS Code.


---

## Passo 5: Mágica! ✨

1. Clique no botão preto: **"Deploy"**.
2. Aguarde entre 2 a 4 minutos. A Vercel vai:
   - Instalar todas as dependências (`npm install`)
   - Gerar o cliente do Prisma (`prisma generate`)
   - Compilar o TypeScript para JavaScript (`npm run build`)
   - Publicar a API numa URL global
3. Quando terminar, você verá uma tela com **confetes** e o link da sua API!

A URL terá o formato: `https://klypbarber-api.vercel.app`

---

## Passo 6: Criar as tabelas e o Super Admin no banco 🌱

Seu banco de dados no Supabase ainda está vazio. Agora precisamos criar todas as tabelas e o usuário administrador master.

### 6.1 — Criar as tabelas (Migrations)

O banco de dados do Supabase inicia "pelado" (sem tabelas). Precisamos enviar a estrutura do seu código para lá.

1. No VS Code, abra o seu arquivo [**.env**](file:///d:/Meus%20docs/Curso%20IA/barberpro/backend/.env) (o arquivo real, não o exemplo).
2. Procure as linhas `DATABASE_URL` e `DIRECT_URL`.
3. **Temporariamente**, apague os links que estão lá e cole os links que você salvou no seu bloco de notas (Passo 10).
   - Use o link que termina com `:6543...` no `DATABASE_URL`.
   - Use o link que termina com `:5432...` no `DIRECT_URL`.
4. Agora, no terminal da pasta `backend`, digite este comando:
   ```bash
   npx prisma migrate deploy
   ```
5. Este comando vai ler o `DIRECT_URL` e criar todas as tabelas no Supabase.


### 6.2 — Criar o Super Admin

Ainda com as URLs do Supabase no `.env`, execute:

```bash
npm run prisma:seed:stage
```

Você verá no terminal:
```
✅ Super Admin Criado com sucesso!
   Email: superadmin@klypbarber.com
   Senha: Klyp@Start2026
```

### 6.3 — Restaurar o `.env` local

⚠️ **Não esqueça** de trocar as URLs no `.env` de volta para a sua URL local (`postgresql://postgres:...@localhost:5432/klypbarber`), para não bagunçar o ambiente de desenvolvimento.


---

## Passo 7: Atualizar o Frontend com a URL do Backend 🔗

Agora que a API está no ar, volte no painel do seu **projeto frontend** na Vercel:

1. Vá em **"Settings"** → **"Environment Variables"**.
2. Encontre a variável `VITE_API_URL`.
3. Troque o valor pelo link real da sua API: `https://klypbarber-api.vercel.app/api`
4. Clique em **"Save"**.
5. Para aplicar a mudança, vá em **"Deployments"**, clique nos 3 pontinhos do último deploy e escolha **"Redeploy"**.

---

## ✅ Checklist Final

Antes de testar, confirme que tudo está ok:
- [ ] Banco de dados criado no Supabase
- [ ] Migrations rodadas (`npx prisma migrate deploy`)
- [ ] Super Admin criado (`npm run prisma:seed:stage`)
- [ ] Backend publicado na Vercel com todas as variáveis de ambiente
- [ ] Frontend atualizado com a URL correta do backend

---

## Testando se funcionou ✔️

Acesse no navegador:
```
https://klypbarber-api.vercel.app/api/health
```
Ou tente fazer login:
```
https://klypbarber-api.vercel.app/api/auth/login
```

Se retornar alguma resposta JSON (mesmo que seja de erro de credenciais), significa que a API está funcionando! 🎉

---

**Dica de Ouro:**
Assim como o frontend, a partir de agora toda vez que você fizer **commit** e **push** para a branch `main` do repositório do backend, a Vercel vai recompilar e atualizar a API automaticamente!
