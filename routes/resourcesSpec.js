const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/client/resources - Get available resources (PROTECTED - CLIENT)
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      category,
      type,
      search,
      limit = 50, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, package_tier')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    let query = supabaseAdmin
      .from('resources')
      .select('id, title, type, category, download_url, description, file_size, pages, created_at, download_count, tags, package_tier_required')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    // Filter by package tier access
    const packageTierHierarchy = {
      'Tier 1': 1,
      'Tier 2': 2,
      'Tier 3': 3
    };
    
    const userTierLevel = packageTierHierarchy[user.package_tier] || 0;
    if (userTierLevel > 0) {
      query = query.lte('package_tier_required', userTierLevel);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch resources',
        code: 'DATABASE_ERROR'
      });
    }

    // Format resources according to spec
    const formattedResources = (resources || []).map(resource => ({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      category: resource.category,
      download_url: resource.download_url,
      description: resource.description,
      file_size: resource.file_size,
      pages: resource.pages,
      created_at: resource.created_at,
      download_count: resource.download_count,
      tags: resource.tags
    }));

    res.json({
      success: true,
      resources: formattedResources,
      total: resources?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit),
      user_package_tier: user.package_tier
    });
  } catch (error) {
    console.error('Fetch resources error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch resources',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/client/resources/:id/download - Track resource download (PROTECTED - CLIENT)
router.post('/resources/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { user_agent, ip_address } = req.body;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, package_tier')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      return res.status(404).json({ 
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND'
      });
    }

    // Check package tier access
    const packageTierHierarchy = {
      'Tier 1': 1,
      'Tier 2': 2,
      'Tier 3': 3
    };
    
    const userTierLevel = packageTierHierarchy[user.package_tier] || 0;
    const requiredTierLevel = resource.package_tier_required || 1;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient package tier for this resource',
        code: 'INSUFFICIENT_PACKAGE_TIER'
      });
    }

    // Track download
    const { error: trackError } = await supabaseAdmin
      .from('resource_downloads')
      .insert({
        resource_id: id,
        user_id: userId,
        download_timestamp: new Date().toISOString(),
        user_agent: user_agent || req.headers['user-agent'],
        ip_address: ip_address || req.ip || req.connection.remoteAddress
      });

    if (trackError) {
      console.error('Error tracking download:', trackError);
      // Don't fail the request if tracking fails
    }

    // Increment download count
    const { error: incrementError } = await supabaseAdmin
      .from('resources')
      .update({
        download_count: (resource.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', id);

    if (incrementError) {
      console.error('Error incrementing download count:', incrementError);
    }

    res.json({
      success: true,
      message: 'Download tracked successfully',
      resource: {
        id: resource.id,
        title: resource.title,
        download_url: resource.download_url,
        file_size: resource.file_size
      },
      download_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to track download',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/client/resources/categories - Get resource categories (PROTECTED - CLIENT)
router.get('/resources/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get distinct categories with counts
    const { data: categories, error } = await supabaseAdmin
      .from('resources')
      .select('category')
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const categoryMap = {};
        data?.forEach(item => {
          categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
        });
        
        const formattedCategories = Object.entries(categoryMap).map(([name, count]) => ({
          name,
          count,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        }));
        
        return { data: formattedCategories, error: null };
      });

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch categories',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/client/resources/download-history - Get user's download history (PROTECTED - CLIENT)
router.get('/resources/download-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      limit = 50, 
      offset = 0,
      sort_by = 'download_timestamp',
      sort_order = 'desc'
    } = req.query;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { data: downloads, error } = await supabaseAdmin
      .from('resource_downloads')
      .select(`
        id, download_timestamp,
        resources!inner(id, title, type, category, file_size)
      `)
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching download history:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch download history',
        code: 'DATABASE_ERROR'
      });
    }

    // Format download history
    const formattedDownloads = (downloads || []).map(download => ({
      id: download.id,
      download_timestamp: download.download_timestamp,
      resource: {
        id: download.resources.id,
        title: download.resources.title,
        type: download.resources.type,
        category: download.resources.category,
        file_size: download.resources.file_size
      }
    }));

    res.json({
      success: true,
      downloads: formattedDownloads,
      total: downloads?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch download history error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch download history',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;