const { query, queryOne } = require('./db');

/**
 * Comprehensive seed data for driver Abu Bakar with complete rating parameters
 * Run with: node seed-abu-bakar-complete.js
 */

async function seedAbuBakar() {
  try {
    console.log('🚗 Seeding driver Abu Bakar with comprehensive rating data...');

    // Check if driver already exists
    const existingDriver = await queryOne(
      `SELECT id FROM drivers WHERE phone = '01812555666'`
    );

    if (existingDriver) {
      console.log('✅ Abu Bakar already exists. Updating with complete rating data...');
      driverId = existingDriver.id;
    } else {
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
          'b0000002-0000-0000-0000-000000000099',
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
          4500,
          920,
          950,
          75000,
          1200,
          14,
          '{"Top Driver","Consistent","5+ Years"}',
          '2023-03-15'
        ]
      );

      driverId = driversResult.id;
      console.log(`✅ Created driver Abu Bakar (ID: ${driverId})`);
    }

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
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 4,
        rating_comment: 'Excellent service! Safe and comfortable ride.',
        rating_rider_comment: 'Outstanding driver, highly satisfied',
        days_ago: 1
      },
      {
        ref: 'OIJ-9002',
        destination: 'School Road',
        pickup: 'Faridpur Market',
        fare: 65,
        driver_rating: 5,
        rider_rating: 4,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 4,
        rating_comment: 'Great driver, professional and courteous.',
        rating_rider_comment: 'Good passenger, respected traffic rules',
        days_ago: 2
      },
      {
        ref: 'OIJ-9003',
        destination: 'UP Office',
        pickup: 'Government Building',
        fare: 50,
        driver_rating: 4,
        rider_rating: 5,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Good service and reasonable fare.',
        rating_rider_comment: 'Excellent passenger, very cooperative',
        days_ago: 3
      },
      {
        ref: 'OIJ-9004',
        destination: 'Grand Bazaar',
        pickup: 'Railway Station',
        fare: 95,
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Best ride ever! Thank you Abu Bakar!',
        rating_rider_comment: 'Perfect passenger, model behavior!',
        days_ago: 4
      },
      {
        ref: 'OIJ-9005',
        destination: 'Health Centre',
        pickup: 'Faridpur Sadar',
        fare: 55,
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 3,
        rating_comment: 'Excellent driving and vehicle maintenance.',
        rating_rider_comment: 'Respectful and polite passenger',
        days_ago: 5
      },
      {
        ref: 'OIJ-9006',
        destination: 'Mosque Road',
        pickup: 'Market Square',
        fare: 70,
        driver_rating: 4,
        rider_rating: 4,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 4,
        rating_comment: 'Solid performance. Good driving skills.',
        rating_rider_comment: 'Good passenger overall, on time',
        days_ago: 6
      },
      {
        ref: 'OIJ-9007',
        destination: 'Police Station',
        pickup: 'Bank Road',
        fare: 60,
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 4,
        rating_comment: 'Very professional driver. Highly recommended!',
        rating_rider_comment: 'Exemplary passenger behavior',
        days_ago: 7
      },
      {
        ref: 'OIJ-9008',
        destination: 'Park Exit',
        pickup: 'City School',
        fare: 75,
        driver_rating: 5,
        rider_rating: 4,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 3,
        rating_comment: 'Fast, safe, and reliable service.',
        rating_rider_comment: 'Good passenger, slight delay in pickup',
        days_ago: 8
      },
      {
        ref: 'OIJ-9009',
        destination: 'Town Center',
        pickup: 'Old Market',
        fare: 80,
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Amazing experience with Abu Bakar!',
        rating_rider_comment: 'Perfect ride with perfect passenger!',
        days_ago: 9
      },
      {
        ref: 'OIJ-9010',
        destination: 'New Hospital',
        pickup: 'Industrial Area',
        fare: 100,
        driver_rating: 4,
        rider_rating: 5,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Good service overall, fair pricing.',
        rating_rider_comment: 'Excellent passenger cooperation',
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

      try {
        const rideResult = await queryOne(
          `INSERT INTO rides (
            ride_ref, rider_id, driver_id, vehicle_type, pickup_name, 
            destination_name, status, fare_final, payment_method, 
            payment_status, rider_rating, driver_rating, 
            rating_driving, rating_behavior, rating_cleanliness,
            rating_comment,
            rating_rider_behavior, rating_rider_wait_time,
            rating_rider_comment,
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
            'completed',
            ride.fare,
            'cash',
            'paid',
            ride.rider_rating,
            ride.driver_rating,
            ride.rating_driving,
            ride.rating_behavior,
            ride.rating_cleanliness,
            ride.rating_comment,
            ride.rating_rider_behavior,
            ride.rating_rider_wait_time,
            ride.rating_rider_comment,
            createdAt.toISOString(),
            completedAt.toISOString()
          ]
        );

        if (rideResult) {
          ridesCreated++;
          console.log(`✅ Created ride ${rideResult.ride_ref} | Driver: ${ride.driver_rating}⭐ (Driving:${ride.rating_driving}, Behavior:${ride.rating_behavior}, Cleanliness:${ride.rating_cleanliness}) | Rider: ${ride.rider_rating}⭐ (Behavior:${ride.rating_rider_behavior}, Wait:${ride.rating_rider_wait_time})`);
        }
      } catch (err) {
        console.error(`❌ Error creating ride ${ride.ref}:`, err.message);
      }
    }

    console.log(`\n✨ Successfully seeded Abu Bakar with ${ridesCreated} rides with COMPLETE rating parameters!`);
    console.log('\n📊 Rating Parameters Summary:');
    console.log('   Driver Ratings (from Rider):');
    console.log('      • rating_driving (skill/safety)');
    console.log('      • rating_behavior (professionalism)');
    console.log('      • rating_cleanliness (vehicle condition)');
    console.log('   Rider Ratings (from Driver):');
    console.log('      • rating_rider_behavior (passenger conduct)');
    console.log('      • rating_rider_wait_time (punctuality)');
    console.log('\n📋 Driver Summary:');
    console.log(`   • Name: Abu Bakar | Phone: 01812555666`);
    console.log(`   • Total Rides Created: ${ridesCreated}`);
    console.log(`   • Status: Active`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Abu Bakar:', err.message);
    process.exit(1);
  }
}

// Initialize driverId
let driverId;

seedAbuBakar();
