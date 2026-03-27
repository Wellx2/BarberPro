# Guia Passo a Passo: Como fazer o Deploy do Frontend no Vercel 🚀

Este guia foi escrito especialmente para você que **não tem experiência** com deploys. O processo é muito simples e utilizaremos a plataforma **Vercel**, que é gratuita e perfeita para aplicações React/Vite como o BarberPro.

O nosso frontend já está **pronto e configurado** para o Vercel (o arquivo `vercel.json` na raiz já resolve qual a pasta inicial e como tratar as rotas, e o `package.json` já tem o comando de build).

---

## Passo 1: Subir o código para o GitHub
Antes de fazer o deploy, o seu código precisa estar na internet de forma privada (no GitHub).
1. Se ainda não tiver uma conta, crie uma em [github.com](https://github.com/).
2. Crie um repositório privado chamado `barberpro-frontend`.
3. No terminal do seu VS Code, certifique-se de commitar e dar "push" do seu código para esse repositório recém-criado.
   *(Se você usa o GitHub Desktop ou a interface do VS Code, basta sincronizar as alterações para o repositório remoto).*

---

## Passo 2: Criar uma conta na Vercel
1. Acesse [vercel.com](https://vercel.com/) e clique em **Sign Up**.
2. Escolha a opção **"Continue with GitHub"**. Isso conectará sua conta da Vercel diretamente ao seu GitHub, facilitando tudo.

---

## Passo 3: Importar o Projeto
1. Após fazer login na Vercel, clique no botão preto no canto superior direito: **"Add New..."** e depois em **"Project"**.
2. Na lista de repositórios do Git, encontre o seu repositório `barberpro-frontend` e clique no botão **"Import"**.
   *(Se o seu repositório não aparecer, clique em "Adjust GitHub App Permissions" para dar permissão à Vercel de ler o seu repositório privado).*

---

## Passo 4: Configurar o Deploy
Na tela de "Configure Project", você verá algumas opções antes de iniciar:
1. **Project Name**: Pode deixar `barberpro-frontend` ou alterar para o nome da sua barbearia (ex: `klypbarber-web`).
2. **Framework Preset**: A Vercel é inteligente e deve detectar automaticamente que o projeto é construído em **Vite**. Se não estiver selecionado, clique no menu dropdown e escolha `Vite`.
3. **Build and Output Settings**: Pode deixar como a Vercel sugerir. Ela entende o `npm run build` e saberá que o site vai pra pasta `dist`.

### ⚙️ Environment Variables (Variáveis de Ambiente) - **MUITO IMPORTANTE**
Essas variáveis são essenciais para o seu frontend saber **com que backend ele deve falar**. Sem isso, o frontend não carrega as salas, agendamentos, etc.
Na seção "Environment Variables" logo abaixo:

- No primeiro campo (Name), digite: `VITE_API_URL`
- No segundo campo (Value), cole a URL do seu backend de PRODUÇÃO: `https://api.SEU_SITE.com.br/api` *(Substitua pelo link real do seu backend que estará rodando. Se ainda não sabe, pode colocar `http://localhost:3000/api` temporariamente e alterar depois).*
- Clique em **"Add"**.

- Crie mais uma Name: `VITE_SHOP_ID`
- Value: `o_id_da_sua_barbearia` *(O ID fixo que seu backend envia. Opcional caso você use o slug na URL como `KlypBarber.com/centro`)*
- Clique em **"Add"**.

---

## Passo 5: Mágica! ✨
1. Clique no botão preto no final da tela: **"Deploy"**.
2. Aguarde entre 1 a 2 minutos. A Vercel vai instalar o NodeJS, ler seu `package.json`, compilar o Vite e publicar o seu site na internet em servidores mundiais!
3. Quando acabar, choverão confetes na sua tela! Clique em **"Continue to Dashboard"**.

---

## Passo 6: Ver o site no ar e Domínio Personalizado
1. No seu Dashboard, você verá o campo **"Domains"**. A Vercel te dará um link gratuito temporário (ex: `barberpro-frontend.vercel.app`). Se você clicar nele, já verá seu sistema online!
2. **Para colocar o seu domínio próprio (`klypbarber.com.br`)**:
   - Vá na aba **"Settings"** e depois em **"Domains"**.
   - Digite o seu domínio real, exemplo: `www.klypbarber.com.br` e clique em Add.
   - A Vercel vai te dar instruções de apontamento (geralmente adicionar um registro CNAME e um A `76.76.21.21` lá no Registro.br, Hostinger, GoDaddy, etc.). 
   - A Vercel gerará o cadeado verde (Certificado de Segurança SSL/HTTPS) automaticamente logo depois.

---

**Dica de Ouro:**
A partir de agora, toda vez que você fizer **commit** e **push** de novas atualizações para a branch `main` no GitHub, a Vercel vai baixar o código novo e atualizar seu site em produção automaticamente, sem você precisar clicar em mais nada!
