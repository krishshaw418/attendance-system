import { PrismaClient } from "../../generated/prisma/client";

class Db {

    private static instance: Db;
    public prisma: PrismaClient;

    private constructor() {
        this.prisma = new PrismaClient();
    }

    public static getInstance() {
        if (Db.instance) {
            return Db.instance;
        }
        Db.instance = new Db();
        return Db.instance;
    }
}

export const db = Db.getInstance();