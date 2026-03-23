const { query, queryOne } = require('./db');

/**
 * Seed data for driver Abu Bakar
 * Run with: node seed-abu-bakar.js
 */

async function seedAbuBakar() {
  try {
    console.log('🚗 Seeding driver Abu Bakar...');

    // Check if driver already exists
    const existingDriver = await queryOne(
      `SELECT id FROM drivers WHERE phone = '01812555666'`
    );

    if (existingDriver) {
      console.log('✅ Abu Bakar already exists in the database');
      process.exit(0);
    }

    // 1. Insert Abu Bakar driver
    const driversResult = await queryOne(
      `INSERT INTO drivers (
        id, phone, name, name_bn, area, vehicle_type, vehicle_model, 
        vehicle_plate, nid_verified, avatar, status, is_online, 
        rating_sum, rating_count, total_rides, total_earned, 
        today_earned, today_rides, badges, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING id`,
      [
        'b0000002-0000-0000-0000-000000000099', // Unique ID
        '01812555666',
        'Abu Bakar',
        'আবু বাকার',
        'Faridpur Sadar',
        'cng',
        'Bajaj RE 2022',
        'Fari-ধ-8899',
        true,
        '👨',
        'active',
        true,
        4500, // rating_sum
        920,  // rating_count
        950,  // total_rides
        75000, // total_earned
        1200, // today_earned
        14,   // today_rides
        '{"Top Driver","Consistent","5+ Years"}',
        '2023-03-15'
      ]
    );

    const driverId = driversResult.id;
    console.log(`✅ Created driver Abu Bakar (ID: ${driverId})`);

    // 2. Get a random rider for the rides
    const ridersResult = await query(
      `SELECT id FROM riders LIMIT 10`
    );

    if (ridersResult.rows.length === 0) {
      console.log('❌ No riders found in database');
      process.exit(1);
    }

    const rideData = [
      {
        ref: 'OIJ-9001',
        destination: 'Faridpur Hospital',
        pickup: 'Kalibari Bazar',
        fare: 85,
        driver_rating: 5,
        rider_rating: 5,
        status: 'completed',
        days_ago: 1
      },
      {
        ref: 'OIJ-9002',
        destination: 'School Road',
        pickup: 'Faridpur Market',
        fare: 65,
        driver_rating: 5,
        rider_rating: 4,
        status: 'completed',
        days_ago: 2
      },
      {
        ref: 'OIJ-9003',
        destination: 'UP Office',
        pickup: 'Government Building',
        fare: 50,
        driver_rating: 4,
        rider_rating: 5,
        status: 'completed',
        days_ago: 3
      },
      {
        ref: 'OIJ-9004',
        destination: 'Grand Bazaar',
        pickup: 'Railway Station',
        fare: 95,
        driver_rating: 5,
        rider_rating: 5,
        status: 'completed',
        days_ago: 4
      },
      {
        ref: 'OIJ-9005',
        destination: 'Health Centre',
        pickup: 'Faridpur Sadar',
        fare: 55,
        driver_rating: 5,
        rider_rating: 5,
        status: 'completed',
        days_ago: 5
      },
      {
        ref: 'OIJ-9006',
        destination: 'Mosque Road',
        pickup: 'Market Square',
        fare: 70,
        driver_rating: 4,
        rider_rating: 4,
        status: 'completed',
        days_ago: 6
      },
      {
        ref: 'OIJ-9007',
        destination: 'Police Station',
        pickup: 'Bank Road',
        fare: 60,
        driver_rating: 5,
        rider_rating: 5,
        status: 'completed',
        days_ago: 7
      },
      {
        ref: 'OIJ-9008',
        destination: 'Park Exit',
        pickup: 'City School',
        fare: 75,
        driver_rating: 5,
        rider_rating: 4,
        status: 'completed',
        days_ago: 8
      },
      {
        ref: 'OIJ-9009',
        destination: 'Town Center',
        pickup: 'Old Market',
        fare: 80,
        driver_rating: 5,
        rider_rating: 5,
        status: 'completed',
        days_ago: 9
      },
      {
        ref: 'OIJ-9010',
        destination: 'New Hospital',
        pickup: 'Industrial Area',
        fare: 100,
        driver_rating: 4,
        rider_rating: 5,
        status: 'completed',
        days_ago: 10
      }
    ];

    let ridesCreated = 0;

    for (const ride of rideData) {
      const randomRider = ridersResult.rows[Math.floor(Math.random() * ridersResult.rows.length)];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - ride.days_ago);
      
      const completedAt = new Date(createdAt);
      completedAt.setMinutes(completedAt.getMinutes() + 30);

      const rideResult = await queryOne(
        `INSERT INTO rides (
          ride_ref, rider_id, driver_id, vehicle_type, pickup_name, 
          destination_name, status, fare_final, payment_method, 
          payment_status, rider_rating, driver_rating, 
          rating_driving, rating_behavior, rating_cleanliness,
          rating_rider_behavior, rating_rider_wait_time,
          rating_comment, rating_rider_comment,
          created_at, completed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
          $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING id, ride_ref`,
        [
          ride.ref,
          randomRider.id,
          driverId,
          'cng',
          ride.pickup,
          ride.destination,
          ride.status,
          ride.fare,
          'cash',
          'paid',
          ride.rider_rating,
          ride.driver_rating,
          ride.driver_rating, // rating_driving
          ride.driver_rating, // rating_behavior
          ride.driver_rating, // rating_cleanliness
          ride.rider_rating, // rating_rider_behavior
          ride.rider_rating, // rating_rider_wait_time
          'Excellent service from Abu Bakar. Very professional and courteous driver!',
          'Great passenger. Respectful and on time.',
          createdAt.toISOString(),
          completedAt.toISOString()
        ]
      );

      if (rideResult) {
        ridesCreated++;
        console.log(`✅ Created ride ${rideResult.ride_ref} (Driver: ${ride.driver_rating}⭐, Rider: ${ride.rider_rating}⭐)`);
      }
    }

    console.log(`\n✨ Successfully seeded Abu Bakar with ${ridesCreated} rides!`);
    console.log('📊 Summary:');
    console.log(`   • Driver: Abu Bakar (01812555666)`);
    console.log(`   • Vehicle: Bajaj RE (CNG)`);
    console.log(`   • Rides Created: ${ridesCreated}`);
    console.log(`   • Total Rating Sum: 4500`);
    console.log(`   • Rating Count: 920`);
    console.log(`   • Status: Active`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Abu Bakar:', err.message);
    process.exit(1);
  }
}

seedAbuBakar();
