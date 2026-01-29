# 🔒 Guia Rápido de Correção de Segurança

## ✅ Correções Aplicadas Localmente

Os seguintes arquivos foram corrigidos para remover credenciais hardcoded:

1. ✅ `docker-compose.yml` - Agora usa variáveis de ambiente
2. ✅ `.env.example` - Atualizado com instruções de segurança
3. ✅ `.gitignore` - Reforçado para proteger arquivos sensíveis
4. ✅ `README.md` - Adicionadas instruções de segurança
5. ✅ `SECURITY.md` - Guia completo de segurança criado
6. ✅ `scripts/generate-secrets.js` - Script para gerar secrets

---

## 🚨 AÇÃO IMEDIATA NECESSÁRIA

### Passo 1: Gerar Novos Secrets

```bash
# Gere secrets fortes
node scripts/generate-secrets.js

# Copie os valores para seu arquivo .env local
# Atualize DATABASE_URL com a nova senha
```

### Passo 2: Resolver no GitGuardian (SEM limpar histórico no Windows)

**✅ Abordagem Recomendada:**

1. **Acesse o GitGuardian** e abra o incidente #26545830

2. **Clique em "Resolve"**

3. **Selecione uma das opções:**
   - ✅ **"Rotate & Revoke the leaked secret"** (se você já mudou as senhas)
   - ou "Mark as False Positive" (se é apenas ambiente de dev)

4. **Confirme a resolução**

### Passo 3: Commitar as Correções

Você tem 2 opções:

#### Opção A: Novo Repositório (RECOMENDADO - mais limpo)

Se este é um projeto novo ou você pode começar do zero:

```bash
# 1. Faça backup do código atual
cd "D:\Meus docs\Curso IA\barberpro"
xcopy backend backup-backend /E /I

# 2. Delete a pasta .git
cd backend
Remove-Item -Recurse -Force .git

# 3. Inicialize novo repositório
git init
git add .
git commit -m "Initial commit with security fixes"

# 4. Conecte ao GitHub (crie novo repositório vazio no GitHub)
git remote add origin https://github.com/seu-usuario/barberpro-backend.git
git branch -M main
git push -u origin main
```

#### Opção B: Commitar Sobre o Histórico Existente (mais rápido)

Se você não se importa que a senha antiga fique no histórico:

```bash
cd "D:\Meus docs\Curso IA\barberpro"

# Adicionar apenas as correções de segurança do backend
git add backend/.env.example
git add backend/.gitignore  
git add backend/docker-compose.yml
git add backend/README.md
git add backend/SECURITY.md
git add backend/scripts/generate-secrets.js
git add backend/.github/copilot-instructions.md

# Commitar
git commit -m "fix(security): remove hardcoded credentials and implement env vars

- Replace hardcoded passwords in docker-compose.yml with env variables
- Update .env.example with security instructions
- Add SECURITY.md guide
- Create generate-secrets.js script
- Update README with security best practices

Resolves GitGuardian incident #26545830"

# Push
git push origin main
```

---

## ⚠️ Limpeza de Histórico (Avançado - OPCIONAL)

**ATENÇÃO:** Reescrever histórico Git é complicado no Windows e pode causar problemas.

### Por que NÃO recomendamos limpar histórico:

1. ❌ Ferramentas como `git-filter-repo` são difíceis de instalar no Windows
2. ❌ Requer force push que pode quebrar clones existentes
3. ❌ Se outras pessoas já clonaram, terão problemas
4. ✅ GitGuardian aceita resolução sem limpar histórico
5. ✅ A senha vazada era uma senha de dev genérica (`postgres`)

### Se REALMENTE precisar limpar (use Git Bash):

```bash
# No Git Bash (não PowerShell):
cd /d/Meus\ docs/Curso\ IA/barberpro

# Use BFG Repo-Cleaner (mais fácil que git-filter-repo no Windows)
# Download: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt

# Depois:
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Mas novamente: isso é OPCIONAL e complicado no Windows!**

---

## 📋 Checklist Final

- [ ] Novos secrets gerados com `node scripts/generate-secrets.js`
- [ ] Arquivo `.env` local atualizado com secrets fortes
- [ ] Teste local: `docker-compose down && docker-compose up -d`
- [ ] Correções commitadas e enviadas para GitHub
- [ ] Incidente resolvido no GitGuardian
- [ ] Se em produção: credenciais rotacionadas nos servidores

---

## 🎯 Resumo: O Que Foi Vazado?

- **Credencial**: `POSTGRES_PASSWORD: postgres`
- **Arquivo**: `docker-compose.yml` (linha 10)
- **Severidade**: Alta (senha hardcoded em repositório público)
- **Impacto Real**: Baixo (senha genérica de desenvolvimento)
- **Solução**: Usar variáveis de ambiente + resolver no GitGuardian

---

## 💡 Dicas de Segurança para o Futuro

### ✅ SEMPRE faça ANTES de commitar:
```bash
# Verifique o que vai ser commitado
git diff

# Procure por senhas
git diff | grep -i "password\|secret\|key"

# Se encontrar algo suspeito, adicione ao .gitignore
```

### 🔒 Secrets devem estar:
- ✅ No arquivo `.env` (nunca commitado)
- ✅ Em gerenciadores (AWS Secrets Manager, HashiCorp Vault, 1Password)
- ❌ NUNCA em `docker-compose.yml`, `.js`, `.ts`, `.py` commitados

---

## 📚 Recursos Úteis

- [Gerar Secrets Seguros](https://randomkeygen.com/)
- [GitGuardian Docs](https://docs.gitguardian.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Priorize **Opção A** (novo repositório) - é mais limpo
2. Ou use **Opção B** (commitar sobre histórico) - é aceitável
3. GitGuardian **aceita resolução** sem limpar histórico
4. O importante é que as **novas** credenciais sejam fortes
