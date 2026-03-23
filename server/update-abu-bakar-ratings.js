const { query, queryOne } = require('./db');

/**
 * Update existing Abu Bakar rides with comprehensive rating parameters
 * Run with: node update-abu-bakar-ratings.js
 */

async function updateAbuBakarRatings() {
  try {
    console.log('🔄 Updating Abu Bakar rides with comprehensive rating parameters...');

    // Get Abu Bakar driver
    const driver = await queryOne(
      `SELECT id FROM drivers WHERE phone = '01812555666'`
    );

    if (!driver) {
      console.log('❌ Abu Bakar driver not found');
      process.exit(1);
    }

    const rideUpdates = [
      {
        ref: 'OIJ-9001',
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 4,
        rating_comment: 'Excellent service! Safe and comfortable ride.',
        rating_rider_comment: 'Outstanding driver, highly satisfied'
      },
      {
        ref: 'OIJ-9002',
        driver_rating: 5,
        rider_rating: 4,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 4,
        rating_comment: 'Great driver, professional and courteous.',
        rating_rider_comment: 'Good passenger, respected traffic rules'
      },
      {
        ref: 'OIJ-9003',
        driver_rating: 4,
        rider_rating: 5,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Good service and reasonable fare.',
        rating_rider_comment: 'Excellent passenger, very cooperative'
      },
      {
        ref: 'OIJ-9004',
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Best ride ever! Thank you Abu Bakar!',
        rating_rider_comment: 'Perfect passenger, model behavior!'
      },
      {
        ref: 'OIJ-9005',
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 3,
        rating_comment: 'Excellent driving and vehicle maintenance.',
        rating_rider_comment: 'Respectful and polite passenger'
      },
      {
        ref: 'OIJ-9006',
        driver_rating: 4,
        rider_rating: 4,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 4,
        rating_comment: 'Solid performance. Good driving skills.',
        rating_rider_comment: 'Good passenger overall, on time'
      },
      {
        ref: 'OIJ-9007',
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 4,
        rating_comment: 'Very professional driver. Highly recommended!',
        rating_rider_comment: 'Exemplary passenger behavior'
      },
      {
        ref: 'OIJ-9008',
        driver_rating: 5,
        rider_rating: 4,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 4,
        rating_rider_wait_time: 3,
        rating_comment: 'Fast, safe, and reliable service.',
        rating_rider_comment: 'Good passenger, slight delay in pickup'
      },
      {
        ref: 'OIJ-9009',
        driver_rating: 5,
        rider_rating: 5,
        rating_driving: 5,
        rating_behavior: 5,
        rating_cleanliness: 5,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Amazing experience with Abu Bakar!',
        rating_rider_comment: 'Perfect ride with perfect passenger!'
      },
      {
        ref: 'OIJ-9010',
        driver_rating: 4,
        rider_rating: 5,
        rating_driving: 4,
        rating_behavior: 4,
        rating_cleanliness: 4,
        rating_rider_behavior: 5,
        rating_rider_wait_time: 5,
        rating_comment: 'Good service overall, fair pricing.',
        rating_rider_comment: 'Excellent passenger cooperation'
      }
    ];

    let updated = 0;

    for (const update of rideUpdates) {
      try {
        const result = await queryOne(
          `UPDATE rides 
           SET driver_rating = $1,
               rider_rating = $2,
               rating_driving = $3,
               rating_behavior = $4,
               rating_cleanliness = $5,
               rating_comment = $6,
               rating_rider_behavior = $7,
               rating_rider_wait_time = $8,
               rating_rider_comment = $9
           WHERE ride_ref = $10 AND driver_id = $11
           RETURNING id, ride_ref`,
          [
            update.driver_rating,
            update.rider_rating,
            update.rating_driving,
            update.rating_behavior,
            update.rating_cleanliness,
            update.rating_comment,
            update.rating_rider_behavior,
            update.rating_rider_wait_time,
            update.rating_rider_comment,
            update.ref,
            driver.id
          ]
        );

        if (result) {
          updated++;
          console.log(`✅ Updated ride ${result.ride_ref} | Driver: ${update.driver_rating}⭐ (D:${update.rating_driving}/B:${update.rating_behavior}/C:${update.rating_cleanliness}) | Rider: ${update.rider_rating}⭐ (B:${update.rating_rider_behavior}/W:${update.rating_rider_wait_time})`);
        }
      } catch (err) {
        console.error(`❌ Error updating ride ${update.ref}:`, err.message);
      }
    }

    console.log(`\n✨ Successfully updated ${updated}/10 Abu Bakar rides with COMPLETE rating parameters!`);
    console.log('\n📊 Rating Parameters Applied:');
    console.log('   ✓ Driver Ratings (from Rider perspective):');
    console.log('      • rating_driving: Skill, safety, and driving competence (1-5)');
    console.log('      • rating_behavior: Professionalism, courtesy, communication (1-5)');
    console.log('      • rating_cleanliness: Vehicle cleanliness and maintenance (1-5)');
    console.log('   ✓ Rider Ratings (from Driver perspective):');
    console.log('      • rating_rider_behavior: Passenger conduct and cooperation (1-5)');
    console.log('      • rating_rider_wait_time: Punctuality and readiness (1-5)');
    console.log('   ✓ Comments:');
    console.log('      • rating_comment: Driver feedback message');
    console.log('      • rating_rider_comment: Passenger feedback message');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating Abu Bakar ratings:', err.message);
    process.exit(1);
  }
}

updateAbuBakarRatings();
