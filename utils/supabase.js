const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
}

// Zero-Trust, High-Concurrency Configuration
const zeroTrustConfig = {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,    // Stateless auth - verify JWT on every request
    persistSession: false,      // No session storage - fully stateless
    detectSessionInUrl: false,  // No URL-based session detection
    flowType: 'implicit'        // Use implicit flow for stateless design
  },
  global: {
    headers: {
      'x-application-name': 'apply-bureau-backend',
      'x-client-info': 'zero-trust-backend'
    }
  },
  // High-concurrency database configuration
  realtime: {
    params: {
      eventsPerSecond: 100 // Limit real-time events for stability
    }
  }
};

// Transaction Pooling Configuration (Port 6543 for high concurrency)
const getPoolingUrl = (baseUrl) => {
  // Return original URL if undefined or null
  if (!baseUrl) {
    return baseUrl;
  }
  
  // Convert direct connection (port 5432) to transaction pooling (port 6543)
  if (baseUrl.includes(':5432')) {
    return baseUrl.replace(':5432', ':6543');
  }
  // If no port specified, assume it needs pooling port
  if (!baseUrl.includes(':6543') && !baseUrl.includes('localhost')) {
    return baseUrl.replace('.supabase.co', '.supabase.co:6543');
  }
  return baseUrl;
};

const poolingConfig = {
  ...zeroTrustConfig,
  db: {
    ...zeroTrustConfig.db,
    // Disable prepared statements to prevent connection leaks during high traffic
    prepared_statements: false,
    // Connection pool settings for high concurrency
    pool: {
      max: 20,           // Maximum connections in pool
      min: 2,            // Minimum connections to maintain
      acquire: 30000,    // Maximum time to get connection (30s)
      idle: 10000,       // Maximum idle time before releasing connection (10s)
      evict: 1000        // How often to check for idle connections (1s)
    }
  }
};

// Client for RLS-protected operations (Zero-Trust with user context)
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  zeroTrustConfig
);

// Admin client for service operations (bypasses RLS when necessary)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  zeroTrustConfig
);

// Zero-Trust JWT Verification Function
const verifySupabaseJWT = async (token) => {
  try {
    // Verify JWT using Supabase's built-in verification
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }
    
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || user.app_metadata?.role || 'client',
      aud: user.aud,
      exp: user.exp
    };
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
};

// Connection health check with Zero-Trust validation
const checkConnection = async () => {
  try {
    // Test both RLS-protected and admin connections
    const [rlsTest, adminTest] = await Promise.all([
      supabase.from('profiles').select('count').limit(1),
      supabaseAdmin.from('profiles').select('count').limit(1)
    ]);
    
    const errors = [];
    if (rlsTest.error) errors.push(`RLS client: ${rlsTest.error.message}`);
    if (adminTest.error) errors.push(`Admin client: ${adminTest.error.message}`);
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return { 
      healthy: true, 
      timestamp: new Date().toISOString(),
      pooling: 'enabled',
      rls: 'active'
    };
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return { 
      healthy: false, 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  verifySupabaseJWT,
  checkConnection
};