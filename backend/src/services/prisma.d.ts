declare const prismaClientSingleton: () => any;
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
export declare const prisma: any;
export {};
//# sourceMappingURL=prisma.d.ts.map