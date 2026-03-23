const { query, queryOne } = require('./db');

(async () => {
  try {
    // Get rider by phone
    const rider = await queryOne('SELECT id FROM riders WHERE phone = $1', ['01712457995']);
    const driver = await queryOne('SELECT id FROM drivers WHERE phone = $1', ['01800000001']);
    
    let rider_id, driver_id;
    
    if (!rider) {
      console.log('Creating rider 01712457995...');
      const newRider = await queryOne(
        'INSERT INTO riders (phone, name) VALUES ($1, $2) RETURNING id',
        ['01712457995', 'Test Rider']
      );
      rider_id = newRider.id;
    } else {
      rider_id = rider.id;
    }
    
    if (!driver) {
      console.log('Driver not found!');
      process.exit(1);
    } else {
      driver_id = driver.id;
    }
    
    // Generate unique ride_ref
    const result = await queryOne('SELECT MAX(CAST(SUBSTRING(ride_ref FROM 5) AS INTEGER)) as max_num FROM rides WHERE ride_ref LIKE \'OIJ-%\'');
    const nextNum = (result?.max_num || 0) + 1;
    const ride_ref = `OIJ-${String(nextNum).padStart(5, '0')}`;
    
    // Create ride
    const ride = await queryOne(
      `INSERT INTO rides (
        ride_ref, rider_id, driver_id, 
        pickup_name, destination_name,
        status, fare_final, 
        completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, ride_ref`,
      [ride_ref, rider_id, driver_id, 'Test Pickup', 'Test Destination', 'completed', 150]
    );
    
    console.log('✅ Ride created:', ride.ride_ref);
    console.log('   Rider: 01712457995');
    console.log('   Driver: 01800000001');
    console.log('   Status: completed (no ratings)');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
