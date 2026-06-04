// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...')

    const deleted = await prisma.notification.deleteMany()
    console.log(`🗑️ Deleted ${deleted.count} existing notifications`)

    const notifications = await prisma.notification.createMany({
        data: [
            {
                type: "delay",
                title: "Route A Bus Delay",
                message: "Route A shuttle is delayed by 10 minutes due to heavy traffic near Building 5.",
            },
            {
                type: "announcement",
                title: "Extended Evening Service",
                message: "Evening shuttle schedule has been extended until 8 PM during exam week.",
            },
            {
                type: "alert",
                title: "Route B Alternate Bus",
                message: "Route B will be using an alternate bus today due to maintenance.",
            },
            {
                type: "info",
                title: "Welcome to Smart Shuttle!",
                message: "Track your bus in real-time and get accurate ETAs.",
            },
        ]
    })

    console.log(`✅ Created ${notifications.count} notifications!`)
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })