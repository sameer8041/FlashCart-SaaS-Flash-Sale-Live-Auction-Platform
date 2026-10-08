// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database with default admin...')

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@flashcart.com' },
        update: {},
        create: {
            email: 'admin@flashcart.com',
            name: 'FlashCart Admin',
            role: 'ADMIN', // Isko humne ADMIN role diya hai
        },
    })

    console.log('Seeding finished successfully.', adminUser)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })



    