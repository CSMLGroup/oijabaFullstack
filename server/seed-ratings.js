const { query, queryOne } = require('./db');

/**
 * Seed rides with ratings data for testing
 * Run with: node seed-ratings.js
 */

async function seedRatings() {
  try {
    console.log('🌱 Seeding rides with ratings...');

    // Get some existing rides
    const ridesResult = await query(
      `SELECT id, driver_id, rider_id, status FROM rides 
       WHERE status = 'completed' 
       LIMIT 20`
    );

    if (!ridesResult.rows.length) {
      console.log('❌ No completed rides found. Create some rides first.');
      return;
    }

    console.log(`Found ${ridesResult.rows.length} completed rides`);

    const rideRatings = [
      { 
        driver_rating: 5, rider_rating: 5, 
        rating_driving: 5, rating_behavior: 5, rating_cleanliness: 5, 
        rating_comment: 'Great driver, very professional!',
        rating_rider_behavior: 4, rating_rider_wait_time: 3, 
        rating_rider_comment: 'Respectful and punctual passenger'
      },
      { 
        driver_rating: 4, rider_rating: 4, 
        rating_driving: 4, rating_behavior: 4, rating_cleanliness: 4, 
        rating_comment: 'Good service, on time.',
        rating_rider_behavior: 4, rating_rider_wait_time: 4, 
        rating_rider_comment: 'Polite rider, minimal issues'
      },
      { 
        driver_rating: 5, rider_rating: 5, 
        rating_driving: 5, rating_behavior: 5, rating_cleanliness: 5, 
        rating_comment: 'Excellent experience! Safe and smooth ride.',
        rating_rider_behavior: 5, rating_rider_wait_time: 5, 
        rating_rider_comment: 'Outstanding passenger, very satisfied'
      },
      { 
        driver_rating: 3, rider_rating: 3, 
        rating_driving: 3, rating_behavior: 3, rating_cleanliness: 3, 
        rating_comment: 'It was okay. Average ride.',
        rating_rider_behavior: 3, rating_rider_wait_time: 3, 
        rating_rider_comment: 'Acceptable experience overall'
      },
      { 
        driver_rating: 4, rider_rating: 4, 
        rating_driving: 4, rating_behavior: 4, rating_cleanliness: 4, 
        rating_comment: 'Good ride overall. Professional driver.',
        rating_rider_behavior: 4, rating_rider_wait_time: 4, 
        rating_rider_comment: 'Good behavior, arrived on time'
      },
      { 
        driver_rating: 5, rider_rating: 5, 
        rating_driving: 5, rating_behavior: 5, rating_cleanliness: 5, 
        rating_comment: 'Highly recommended! Best service!',
        rating_rider_behavior: 5, rating_rider_wait_time: 4, 
        rating_rider_comment: 'Excellent passenger, model behavior'
      },
      { 
        driver_rating: 2, rider_rating: 2, 
        rating_driving: 2, rating_behavior: 3, rating_cleanliness: 2, 
        rating_comment: 'Could be better. Some issues encountered.',
        rating_rider_behavior: 2, rating_rider_wait_time: 2, 
        rating_rider_comment: 'Rushed pickup, minor inconvenience'
      },
      { 
        driver_rating: 4, rider_rating: 5, 
        rating_driving: 4, rating_behavior: 4, rating_cleanliness: 5, 
        rating_comment: 'Very clean vehicle! Excellent maintenance.',
        rating_rider_behavior: 5, rating_rider_wait_time: 5, 
        rating_rider_comment: 'Perfect passenger, no complaints'
      },
      { 
        driver_rating: 5, rider_rating: 4, 
        rating_driving: 5, rating_behavior: 5, rating_cleanliness: 5, 
        rating_comment: 'Safe and comfortable. Expert driving skills.',
        rating_rider_behavior: 4, rating_rider_wait_time: 3, 
        rating_rider_comment: 'Good rider, though slightly delayed'
      },
      { 
        driver_rating: 3, rider_rating: 3, 
        rating_driving: 3, rating_behavior: 3, rating_cleanliness: 3, 
        rating_comment: 'Average service. Nothing special.',
        rating_rider_behavior: 3, rating_rider_wait_time: 3, 
        rating_rider_comment: 'Average experience overall'
      },
    ];

    let updated = 0;

    for (let i = 0; i < ridesResult.rows.length; i++) {
      const ride = ridesResult.rows[i];
      const ratingData = rideRatings[i % rideRatings.length];

      try {
        const result = await queryOne(
          `UPDATE rides 
           SET driver_rating = $1,
               rider_rating = $2,
               rating_driving = $3,
               rating_behavior = $4,
               rating_cleanliness = $5,
               rating_rider_behavior = $6,
               rating_rider_wait_time = $7,
               rating_comment = $8,
               rating_rider_comment = $9
           WHERE id = $10
           RETURNING id, driver_rating, rider_rating`,
          [
            ratingData.driver_rating,
            ratingData.rider_rating,
            ratingData.rating_driving,
            ratingData.rating_behavior,
            ratingData.rating_cleanliness,
            ratingData.rating_rider_behavior,
            ratingData.rating_rider_wait_time,
            ratingData.rating_comment,
            ratingData.rating_rider_comment,
            ride.id
          ]
        );

        if (result) {
          updated++;
          console.log(`✅ Updated ride ${ride.id.slice(0, 8)}: Driver ⭐${result.driver_rating}, Rider ⭐${result.rider_rating}`);

          // Update driver rating stats
          if (ride.driver_id) {
            await query(
              `UPDATE drivers 
               SET rating_sum = COALESCE(rating_sum, 0) + $1,
                   rating_count = COALESCE(rating_count, 0) + 1
               WHERE id = $2`,
              [ratingData.driver_rating, ride.driver_id]
            );
          }
        }
      } catch (err) {
        console.error(`❌ Error updating ride ${ride.id}:`, err.message);
      }
    }

    console.log(`\n✨ Successfully seeded ${updated}/${ridesResult.rows.length} rides with ratings!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding ratings:', err.message);
    process.exit(1);
  }
}

seedRatings();
