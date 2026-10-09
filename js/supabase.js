/**
 * 119 LAUNDRY & Dry Cleaning - Supabase Integration Client
 * Handles real-time persistence of pickup requests & VIP waitlist signups.
 */

// Configuration for Supabase
const SUPABASE_CONFIG = {
  // Supabase Project URL
  url: 'https://rppeksgujbmiuhkhluqd.supabase.co',
  // Your Supabase Publishable Key
  publishableKey: 'sb_publishable_QaYbe7TXc8nW3vP6QdcDdg_udkjYiny'
};

let _supabaseClientInstance = null;

function getSupabaseInstance() {
  if (_supabaseClientInstance) {
    return _supabaseClientInstance;
  }

  const isConfigured = 
    SUPABASE_CONFIG.url && 
    !SUPABASE_CONFIG.url.includes('YOUR_SUPABASE_PROJECT_URL') &&
    typeof window.supabase !== 'undefined';

  if (isConfigured) {
    try {
      _supabaseClientInstance = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey
      );
      return _supabaseClientInstance;
    } catch (err) {
      console.warn('[119 Laundry] Supabase initialization error:', err);
    }
  }
  return null;
}

/**
 * Save customer pickup booking to Supabase
 * Table: pickups
 */
async function savePickupBooking(data) {
  const client = getSupabaseInstance();
  if (!client) {
    console.info('[119 Laundry] Supabase project URL pending. Booking handled locally.');
    return { success: false, reason: 'pending_url' };
  }

  try {
    const { error } = await client.from('pickups').insert([
      {
        booking_ref: data.booking_ref,
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        service: data.service,
        estimated_weight: data.estimated_weight,
        pickup_date: data.pickup_date,
        pickup_time: data.pickup_time,
        notes: data.notes || '',
        status: 'pending'
      }
    ]);

    if (error) {
      console.error('[119 Laundry] Supabase pickup insert failed:', error);
      return { success: false, error };
    }

    console.log('[119 Laundry] Pickup successfully saved to Supabase:', data.booking_ref);
    return { success: true };
  } catch (err) {
    console.error('[119 Laundry] Error saving pickup to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Save VIP Membership waitlist signups to Supabase
 * Table: waitlist
 */
async function saveWaitlistSignup(data) {
  const client = getSupabaseInstance();
  if (!client) {
    console.info('[119 Laundry] Supabase project URL pending. Waitlist signup stored locally.');
    return { success: false, reason: 'pending_url' };
  }

  try {
    const { error } = await client.from('waitlist').insert([
      {
        full_name: data.full_name,
        phone: data.phone,
        frequency: data.frequency || 'weekly'
      }
    ]);

    if (error) {
      console.error('[119 Laundry] Supabase waitlist insert failed:', error);
      return { success: false, error };
    }

    console.log('[119 Laundry] Waitlist signup saved to Supabase for:', data.phone);
    return { success: true };
  } catch (err) {
    console.error('[119 Laundry] Error saving waitlist to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Comprehensive Database Connectivity Test Suite
 * Validates:
 * 1. Supabase Client Initialization
 * 2. Table Read (SELECT)
 * 3. Test Data Insert (INSERT)
 * 4. Test Data Update (UPDATE)
 * 5. Test Data Cleanup (DELETE)
 * 6. Error Handling
 */
async function runConnectivityTests() {
  const testReport = {
    timestamp: new Date().toISOString(),
    projectUrl: SUPABASE_CONFIG.url,
    tests: [],
    allPassed: false
  };

  function addResult(id, title, passed, message, details = null, durationMs = 0) {
    testReport.tests.push({ id, title, passed, message, details, durationMs });
  }

  // 1. Supabase Client Initialization
  const t1Start = performance.now();
  let client = null;
  try {
    client = getSupabaseInstance();
    const t1End = performance.now();
    if (client && typeof client.from === 'function') {
      addResult(1, 'Client Initialization', true, 'Supabase client initialized successfully with project endpoint and key.', null, Math.round(t1End - t1Start));
    } else {
      addResult(1, 'Client Initialization', false, 'Supabase client failed to initialize (client is null or window.supabase is missing).', null, Math.round(t1End - t1Start));
      testReport.allPassed = false;
      return testReport;
    }
  } catch (err) {
    addResult(1, 'Client Initialization', false, `Initialization error: ${err.message}`, err, Math.round(performance.now() - t1Start));
    return testReport;
  }

  // Unique reference for ephemeral test data
  const testRef = `TEST-DIAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 2. Table Read Verification
  const t2Start = performance.now();
  try {
    const { data, error, status } = await client.from('pickups').select('*').limit(1);
    const t2End = performance.now();
    if (error) {
      addResult(2, 'Table Read (SELECT)', false, `Read failed: [${error.code || status}] ${error.message}`, error, Math.round(t2End - t2Start));
    } else {
      addResult(2, 'Table Read (SELECT)', true, `Successfully queried table 'pickups'. Returned ${Array.isArray(data) ? data.length : 0} existing records.`, { rowCount: data ? data.length : 0 }, Math.round(t2End - t2Start));
    }
  } catch (err) {
    addResult(2, 'Table Read (SELECT)', false, `Exception during table read: ${err.message}`, err, Math.round(performance.now() - t2Start));
  }

  // 3. Test Data Insert
  let insertSucceeded = false;
  const t3Start = performance.now();
  const testPayload = {
    booking_ref: testRef,
    full_name: 'Diagnostic Connectivity Test',
    phone: '+91 99999 00000',
    address: 'Diagnostic Suite Automated Run',
    service: 'Wash & Fold (₹119/kg)',
    estimated_weight: '3 kg',
    pickup_date: 'Today',
    pickup_time: 'Testing Slot',
    notes: 'Ephemeral test row - will be purged immediately',
    status: 'testing'
  };

  try {
    const { data, error, status } = await client.from('pickups').insert([testPayload]).select();
    const t3End = performance.now();
    if (error) {
      addResult(3, 'Test Data Insert (INSERT)', false, `Insert failed: [${error.code || status}] ${error.message}`, error, Math.round(t3End - t3Start));
    } else {
      insertSucceeded = true;
      addResult(3, 'Test Data Insert (INSERT)', true, `Successfully inserted temporary test booking (${testRef}).`, { booking_ref: testRef }, Math.round(t3End - t3Start));
    }
  } catch (err) {
    addResult(3, 'Test Data Insert (INSERT)', false, `Exception during insert: ${err.message}`, err, Math.round(performance.now() - t3Start));
  }

  // 4. Test Data Update
  const t4Start = performance.now();
  if (insertSucceeded) {
    try {
      const { data, error, status } = await client.from('pickups').update({
        notes: 'Ephemeral test row - updated successfully during diagnostic run'
      }).eq('booking_ref', testRef).select();
      const t4End = performance.now();
      if (error) {
        addResult(4, 'Test Data Update (UPDATE)', false, `Update failed: [${error.code || status}] ${error.message}`, error, Math.round(t4End - t4Start));
      } else {
        addResult(4, 'Test Data Update (UPDATE)', true, `Successfully updated test booking (${testRef}).`, { updatedRef: testRef }, Math.round(t4End - t4Start));
      }
    } catch (err) {
      addResult(4, 'Test Data Update (UPDATE)', false, `Exception during update: ${err.message}`, err, Math.round(performance.now() - t4Start));
    }
  } else {
    addResult(4, 'Test Data Update (UPDATE)', false, 'Skipped: Cannot update because previous Insert step did not succeed.', null, 0);
  }

  // 5. Test Data Deletion & Cleanup (Ensures zero residual dummy data in production)
  const t5Start = performance.now();
  if (insertSucceeded) {
    try {
      const { data, error, status } = await client.from('pickups').delete().eq('booking_ref', testRef).select();
      const t5End = performance.now();
      if (error) {
        addResult(5, 'Test Data Cleanup (DELETE)', false, `Delete failed: [${error.code || status}] ${error.message}. Manual purge may be needed for ref: ${testRef}`, error, Math.round(t5End - t5Start));
      } else {
        addResult(5, 'Test Data Cleanup (DELETE)', true, `Successfully deleted temporary test row (${testRef}). No residual dummy data left.`, { purgedRef: testRef }, Math.round(t5End - t5Start));
      }
    } catch (err) {
      addResult(5, 'Test Data Cleanup (DELETE)', false, `Exception during cleanup: ${err.message}`, err, Math.round(performance.now() - t5Start));
    }
  } else {
    addResult(5, 'Test Data Cleanup (DELETE)', true, 'No cleanup needed (no test row was inserted). Production tables remain pristine.', null, 0);
  }

  // 6. Error Handling Verification
  const t6Start = performance.now();
  try {
    const { data, error, status } = await client.from('__diagnostic_non_existent_table__').select('*');
    const t6End = performance.now();
    // An error is EXPECTED here; verify the application catches and formats it gracefully
    if (error) {
      addResult(6, 'Error Handling Verification', true, `Database error caught and handled gracefully as expected: [${error.code || status}] ${error.message}`, { expectedError: error }, Math.round(t6End - t6Start));
    } else {
      addResult(6, 'Error Handling Verification', false, 'Unexpected: Query to non-existent table did not return an error object.', data, Math.round(t6End - t6Start));
    }
  } catch (err) {
    addResult(6, 'Error Handling Verification', true, `Exception caught and handled safely by try-catch wrapper: ${err.message}`, null, Math.round(performance.now() - t6Start));
  }

  testReport.allPassed = testReport.tests.every(t => t.passed);
  testReport.summary = {
    total: testReport.tests.length,
    passed: testReport.tests.filter(t => t.passed).length,
    failed: testReport.tests.filter(t => !t.passed).length
  };

  return testReport;
}

// Export global helper
window.SupabaseService = {
  config: SUPABASE_CONFIG,
  getClient: getSupabaseInstance,
  savePickup: savePickupBooking,
  saveWaitlist: saveWaitlistSignup,
  runConnectivityTests: runConnectivityTests,
  isReady: () => !!getSupabaseInstance()
};

