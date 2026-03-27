# 🔒 Guia de Segurança - KlypBarber Backend

## ⚠️ Incidente de Segurança Resolvido

**Data**: 29 de janeiro de 2026  
**Problema**: Credenciais hardcoded no `docker-compose.yml` detectadas pelo GitGuardian  
**Status**: ✅ RESOLVIDO

### O que foi corrigido:
- ✅ Removidas credenciais hardcoded do `docker-compose.yml`
- ✅ Implementado uso de variáveis de ambiente para todas as credenciais
- ✅ Atualizado `.env.example` com instruções claras
- ✅ Verificado que `.env` está no `.gitignore`

---

## 🛡️ Boas Práticas de Segurança

### 1. **NUNCA** commitar credenciais

❌ **ERRADO:**
```yaml
environment:
  POSTGRES_PASSWORD: postgres
  JWT_SECRET: [SUA_SENHA_AQUI]
```

✅ **CORRETO:**
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
```

### 2. Gerar Secrets Fortes

```bash
# Gerar JWT_SECRET e JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou use um gerador online confiável como:
# - https://randomkeygen.com/
# - https://1password.com/password-generator/
```

### 3. Configuração do `.env`

1. **Copie o template:**
   ```bash
   cp .env.example .env
   ```

2. **Edite com valores REAIS e FORTES:**
   ```bash
   nano .env  # ou seu editor preferido
   ```

3. **Nunca commite o .env:**
   - Verifique que `.env` está no `.gitignore`
   - Use `git status` antes de commitar

### 4. Verificar Antes de Commitar

```bash
# Verifique o que será commitado
git status
git diff

# Se detectou credenciais, remova do histórico
git reset HEAD <arquivo>
```

### 5. Rotação de Credenciais

Se credenciais foram expostas:
1. ✅ **Rotacione imediatamente**
2. ✅ Atualize `.env` local
3. ✅ Atualize variáveis em produção (Heroku, AWS, etc.)
4. ✅ Notifique a equipe
5. ✅ Revogue tokens JWT antigos (se aplicável)

---

## 🚨 Checklist de Segurança

Antes de fazer deploy:

- [ ] `.env` está no `.gitignore`
- [ ] Todas as credenciais usam variáveis de ambiente
- [ ] Secrets foram gerados com alta entropia (64+ caracteres)
- [ ] Senhas de banco de dados são fortes (16+ caracteres, alfanuméricos + símbolos)
- [ ] `NODE_ENV=production` em produção
- [ ] CORS configurado corretamente (apenas origins permitidas)
- [ ] Rate limiting ativo (ThrottlerGuard)
- [ ] Helmet configurado
- [ ] HTTPS habilitado em produção

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [GitGuardian Documentation](https://docs.gitguardian.com/)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/security-best-practices)

---

## 🔄 Histórico de Incidentes

### Incidente #1 - Credenciais Expostas no Git (29/01/2026)
- **Severidade**: Alta
- **Arquivo**: `docker-compose.yml`
- **Credencial**: `POSTGRES_PASSWORD=[SENHA_PADRAO]`
- **Ação**: Removido hardcoded, implementado variáveis de ambiente
- **Status**: Resolvido
- **Responsável**: Wellington Tavares
