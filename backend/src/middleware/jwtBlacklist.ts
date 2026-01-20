










const blacklistedTokens = new Set<string>();

export const isTokenBlacklisted = (token: string) => blacklistedTokens.has(token);

export const blacklistToken = (token: string) => {
  blacklistedTokens.add(token);
  setTimeout(() => blacklistedTokens.delete(token), 7 * 24 * 60 * 60 * 1000); // 7d
};

// Logout: blacklistToken(req.headers.authorization)