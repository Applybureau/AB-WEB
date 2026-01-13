const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/admin/stats - Get admin dashboard statistics (PROTECTED)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get consultation request statistics
    const { data: consultationStats } = await supabaseAdmin
      .from('consultation_requests')
      .select('status, pipeline_status')
      .then(({ data }) => {
        const stats = {
          totalRequests: 0,
          pendingRequests: 0,
          confirmedRequests: 0,
          rescheduledRequests: 0,
          waitlistedRequests: 0,
          rejectedRequests: 0
        };
        
        if (data) {
          stats.totalRequests = data.length;
          data.forEach(item => {
            switch (item.status) {
              case 'pending':
                stats.pendingRequests++;
                break;
              case 'confirmed':
                stats.confirmedRequests++;
                break;
              case 'rescheduled':
                stats.rescheduledRequests++;
                break;
              case 'waitlisted':
                stats.waitlistedRequests++;
                break;
              case 'rejected':
                stats.rejectedRequests++;
                break;
            }
          });
        }
        
        return { data: stats };
      });

    // Get client statistics
    const { data: clientStats } = await supabaseAdmin
      .from('registered_users')
      .select('role, package_tier, package_expiry, is_active')
      .eq('role', 'client')
      .then(({ data }) => {
        const stats = {
          activeClients: 0,
          tier1Clients: 0,
          tier2Clients: 0,
          tier3Clients: 0,
          expiringClients: 0
        };
        
        if (data) {
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
          
          data.forEach(client => {
            if (client.is_active) {
              stats.activeClients++;
              
              // Count by package tier
              switch (client.package_tier) {
                case 'Tier 1':
                  stats.tier1Clients++;
                  break;
                case 'Tier 2':
                  stats.tier2Clients++;
                  break;
                case 'Tier 3':
                  stats.tier3Clients++;
                  break;
              }
              
              // Check for expiring packages
              if (client.package_expiry) {
                const expiryDate = new Date(client.package_expiry);
                if (expiryDate <= thirtyDaysFromNow && expiryDate > now) {
                  stats.expiringClients++;
                }
              }
            }
          });
        }
        
        return { data: stats };
      });

    // Get contact request statistics
    const { data: contactStats } = await supabaseAdmin
      .from('contact_requests')
      .select('status')
      .then(({ data }) => {
        const stats = {
          totalInquiries: 0,
          newInquiries: 0,
          handledInquiries: 0
        };
        
        if (data) {
          stats.totalInquiries = data.length;
          data.forEach(item => {
            switch (item.status) {
              case 'new':
                stats.newInquiries++;
                break;
              case 'handled':
                stats.handledInquiries++;
                break;
            }
          });
        }
        
        return { data: stats };
      });

    // Combine all statistics according to spec
    const combinedStats = {
      // Consultation Request Stats
      totalRequests: consultationStats?.totalRequests || 0,
      pendingRequests: consultationStats?.pendingRequests || 0,
      confirmedRequests: consultationStats?.confirmedRequests || 0,
      rescheduledRequests: consultationStats?.rescheduledRequests || 0,
      waitlistedRequests: consultationStats?.waitlistedRequests || 0,
      rejectedRequests: consultationStats?.rejectedRequests || 0,
      
      // Client Stats
      activeClients: clientStats?.activeClients || 0,
      tier1Clients: clientStats?.tier1Clients || 0,
      tier2Clients: clientStats?.tier2Clients || 0,
      tier3Clients: clientStats?.tier3Clients || 0,
      expiringClients: clientStats?.expiringClients || 0,
      
      // Contact Request Stats
      totalInquiries: contactStats?.totalInquiries || 0,
      newInquiries: contactStats?.newInquiries || 0,
      handledInquiries: contactStats?.handledInquiries || 0
    };

    res.json({
      success: true,
      stats: combinedStats,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admin statistics',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/clients - Get client management data (PROTECTED)
router.get('/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status,
      package_tier,
      limit = 50, 
      offset = 0, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('registered_users')
      .select(`
        id, full_name, email, phone, package_tier, package_expiry, created_at,
        linkedin_url, current_job, target_job, location, salary_target,
        applications!inner(count)
      `)
      .eq('role', 'client')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'expired') {
      query = query.lt('package_expiry', new Date().toISOString());
    }

    if (package_tier && package_tier !== 'all') {
      query = query.eq('package_tier', package_tier);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch clients',
        code: 'DATABASE_ERROR'
      });
    }

    // Get application statistics for each client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Get application counts
        const { data: appStats } = await supabaseAdmin
          .from('applications')
          .select('status')
          .eq('user_id', client.id)
          .then(({ data }) => {
            const stats = {
              applications_count: data?.length || 0,
              interviews_count: 0,
              offers_count: 0
            };
            
            if (data) {
              data.forEach(app => {
                if (app.status === 'interview') {
                  stats.interviews_count++;
                } else if (app.status === 'offer') {
                  stats.offers_count++;
                }
              });
            }
            
            return { data: stats };
          });

        // Determine client status
        let clientStatus = 'active';
        if (client.package_expiry) {
          const expiryDate = new Date(client.package_expiry);
          if (expiryDate < new Date()) {
            clientStatus = 'expired';
          }
        }

        return {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          phone: client.phone,
          package_tier: client.package_tier,
          package_expiry: client.package_expiry,
          created_at: client.created_at,
          applications_count: appStats?.applications_count || 0,
          interviews_count: appStats?.interviews_count || 0,
          offers_count: appStats?.offers_count || 0,
          status: clientStatus,
          linkedin_url: client.linkedin_url,
          current_job: client.current_job,
          target_job: client.target_job,
          location: client.location,
          salary_target: client.salary_target
        };
      })
    );

    res.json({
      success: true,
      clients: clientsWithStats,
      total: clients?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;