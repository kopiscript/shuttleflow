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

    // 1. Clean existing data (in correct order due to foreign keys)
    console.log('🗑️ Cleaning existing data...')
    await prisma.location.deleteMany()
    await prisma.busRouteAssignment.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.route.deleteMany()
    await prisma.bus.deleteMany()
    
    console.log('✅ Cleanup complete')

    // 2. Create Buses
    console.log('🚌 Creating buses...')
    const bus1 = await prisma.bus.create({
        data: {
            busName: "Shuttle Bus 1",
            licensePlate: "ABC1234",
            capacity: 30,
            status: "Active",
        }
    })
    
    const bus2 = await prisma.bus.create({
        data: {
            busName: "Shuttle Bus 2",
            licensePlate: "DEF5678",
            capacity: 30,
            status: "Active",
        }
    })
    console.log(`✅ Created ${2} buses`)

    // 3. Create Routes with coordinates
    console.log('🗺️ Creating routes...')
    const route1 = await prisma.route.create({
        data: {
            routeName: "Route A - Subang to Nilai",
            pickupStop: "INTI Subang",
            dropoffStop: "INTI Nilai",
            pickupLat: 3.0742,
            pickupLng: 101.5913,
            dropoffLat: 2.8051,
            dropoffLng: 101.7656,
            status: "Active",
            intermediateStops: [],
        }
    })
    
    const route2 = await prisma.route.create({
        data: {
            routeName: "Route B - Nilai to Subang",
            pickupStop: "INTI Nilai",
            dropoffStop: "INTI Subang",
            pickupLat: 2.8051,
            pickupLng: 101.7656,
            dropoffLat: 3.0742,
            dropoffLng: 101.5913,
            status: "Active",
            intermediateStops: [],
        }
    })
    console.log(`✅ Created ${2} routes`)

    // 4. Assign buses to routes
    console.log('🔗 Assigning buses to routes...')
    await prisma.busRouteAssignment.create({
        data: {
            busId: bus1.id,
            routeId: route1.id,
        }
    })
    
    await prisma.busRouteAssignment.create({
        data: {
            busId: bus1.id,
            routeId: route2.id,
        }
    })
    console.log('✅ Bus 1 assigned to both routes')

    // 5. Create sample notifications
    console.log('🔔 Creating notifications...')
    const notifications = await prisma.notification.createMany({
        data: [
            {
                type: "info",
                title: "Welcome to Smart Shuttle!",
                message: "Track your bus in real-time and get accurate ETAs.",
                isRead: false,
            },
            {
                type: "announcement",
                title: "Extended Evening Service",
                message: "Evening shuttle schedule has been extended until 8 PM during exam week.",
                isRead: false,
            },
            {
                type: "alert",
                title: "Route B Alternate Bus",
                message: "Route B will be using an alternate bus today due to maintenance.",
                isRead: false,
            },
            {
                type: "delay",
                title: "Route A Bus Delay",
                message: "Route A shuttle is delayed by 10 minutes due to heavy traffic near Building 5.",
                isRead: false,
            },
        ]
    })
    console.log(`✅ Created ${notifications.count} notifications`)

    // 6. Create sample location (starting point)
    console.log('📍 Creating sample location...')
    await prisma.location.create({
        data: {
            busId: bus1.id,
            latitude: 3.110135,
            longitude: 101.59775217,
            speed: 0,
        }
    })
    console.log('✅ Sample location created')

    console.log('\n🎉 Seeding complete!')
    console.log(`📊 Summary:
    - ${2} buses created
    - ${2} routes created
    - ${notifications.count} notifications created
    - Bus 1 assigned to both routes
    - Sample location created`)
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })