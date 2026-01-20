const blacklistedTokens = new Set();
export const isTokenBlacklisted = (token) => blacklistedTokens.has(token);
export const blacklistToken = (token) => {
    blacklistedTokens.add(token);
    setTimeout(() => blacklistedTokens.delete(token), 7 * 24 * 60 * 60 * 1000); // 7d
};
// Logout: blacklistToken(req.headers.authorization)
//# sourceMappingURL=jwtBlacklist.js.map