// src/services/user.service.ts

import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export class UserService {

    // Email se user find karne ka function
    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            return await prisma.user.findUnique({
                where: { email },
            });
        } catch (error) {
            console.error("[UserService] Error fetching user by email:", error);
            throw new Error("Database error while fetching user.");
        }
    }

    // ID se user find karne ka function
    static async getUserById(id: string): Promise<User | null> {
        try {
            return await prisma.user.findUnique({
                where: { id },
            });
        } catch (error) {
            console.error("[UserService] Error fetching user by id:", error);
            throw new Error("Database error while fetching user.");
        }
    }

    // Admin check karne ka function (Baad me kaam aayega)
    static async isAdmin(email: string): Promise<boolean> {
        const user = await this.getUserByEmail(email);
        return user?.role === "ADMIN";
    }
}