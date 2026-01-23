const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin, requireClient } = require('../middleware/auth');
const { 
  createSuccessResponse, 
  createPaginatedResponse,
  handleValidationError,
  handleNotFoundError,
  handleDatabaseError,
  handleBusinessLogicError,
  ERROR_CODES 
} = require('../middleware/errorHandler');
const { 
  parsePaginationParams, 
  addValidSortFields, 
  paginateResults 
} = require('../middleware/pagination');

const router = express.Router();

// GET /api/client/resources - Get resources for client (CLIENT ONLY)
router.get('/', 
  authenticateToken, 
  requireClient,
  addValidSortFields(['created_at', 'title', 'type', 'category', 'download_count']),
  parsePaginationParams,
  async (req, res) => {
    try {
      const clientId = req.user.id;

      // Get client's package tier
      const { data: client, error: clientError } = await supabaseAdmin
        .from('registered_users')
        .select('package_tier')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return handleNotFoundError(req, res, 'Client profile');
      }

      const clientTier = client.package_tier || 'Tier 1';

      // Add search fields for filtering
      req.searchFields = ['title', 'description', 'tags'];

      // Base query - filter by package tier access
      const baseQuery = supabaseAdmin
        .from('resources')
        .select(`
          id,
          title,
          type,
          category,
          description,
          download_url,
          file_size,
          pages,
          duration_minutes,
          package_tier_required,
          download_count,
          tags,
          created_at
        `)
        .eq('is_active', true)
        .or(`package_tier_required.eq.All,package_tier_required.eq.${clientTier}`);

      // Count query
      const countQuery = supabaseAdmin
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`package_tier_required.eq.All,package_tier_required.eq.${clientTier}`);

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data according to specification
      const formattedData = result.data.map(resource => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        category: resource.category,
        download_url: resource.download_url,
        description: resource.description,
        file_size: resource.file_size,
        pages: resource.pages,
        duration_minutes: resource.duration_minutes,
        created_at: resource.created_at,
        download_count: resource.download_count,
        tags: resource.tags || []
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Resources retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching resources:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch resources');
    }
  }
);

// POST /api/client/resources/:id/download - Track resource download (CLIENT ONLY)
router.post('/:id/download', authenticateToken, requireClient, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;
    const { download_timestamp, user_agent, ip_address } = req.body;

    // Check if resource exists and client has access
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('id, title, package_tier_required, download_count')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (resourceError || !resource) {
      return handleNotFoundError(req, res, 'Resource');
    }

    // Get client's package tier
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('package_tier')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return handleNotFoundError(req, res, 'Client profile');
    }

    const clientTier = client.package_tier || 'Tier 1';

    // Check tier access
    if (resource.package_tier_required !== 'All' && resource.package_tier_required !== clientTier) {
      return handleBusinessLogicError(
        req, res, 
        `This resource requires ${resource.package_tier_required} access. Your current tier: ${clientTier}`,
        ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        403
      );
    }

    // Record the download
    const { error: downloadError } = await supabaseAdmin
      .from('resource_downloads')
      .insert({
        resource_id: parseInt(id),
        client_id: clientId,
        download_timestamp: download_timestamp || new Date().toISOString(),
        user_agent: user_agent || req.get('User-Agent'),
        ip_address: ip_address || req.ip
      });

    if (downloadError) {
      console.error('Error recording resource download:', downloadError);
      // Don't fail the request if download tracking fails
    }

    // Increment download count
    const { error: updateError } = await supabaseAdmin
      .from('resources')
      .update({ 
        download_count: (resource.download_count || 0) + 1 
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating download count:', updateError);
      // Don't fail the request if count update fails
    }

    res.json(createSuccessResponse(
      {
        resource_id: parseInt(id),
        resource_title: resource.title,
        download_timestamp: download_timestamp || new Date().toISOString(),
        download_url: resource.download_url
      },
      'Download tracked successfully'
    ));
  } catch (error) {
    console.error('Resource download tracking error:', error);
    return handleDatabaseError(req, res, error, 'Failed to track download');
  }
});

// GET /api/admin/resources - Get all resources (ADMIN ONLY)
router.get('/admin', 
  authenticateToken, 
  requireAdmin,
  addValidSortFields(['created_at', 'title', 'type', 'category', 'download_count', 'package_tier_required']),
  parsePaginationParams,
  async (req, res) => {
    try {
      // Add search fields for filtering
      req.searchFields = ['title', 'description', 'category', 'type'];

      // Base query
      const baseQuery = supabaseAdmin
        .from('resources')
        .select(`
          id,
          title,
          type,
          category,
          description,
          download_url,
          file_size,
          pages,
          duration_minutes,
          package_tier_required,
          download_count,
          tags,
          is_active,
          created_by,
          created_at,
          updated_at
        `);

      // Count query
      const countQuery = supabaseAdmin
        .from('resources')
        .select('*', { count: 'exact', head: true });

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      res.json(createPaginatedResponse(
        result.data,
        result.pagination,
        'Resources retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching resources for admin:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch resources');
    }
  }
);

// POST /api/admin/resources - Create new resource (ADMIN ONLY)
router.post('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      description,
      download_url,
      file_size,
      pages,
      duration_minutes,
      package_tier_required = 'Tier 1',
      tags = []
    } = req.body;

    const adminId = req.user.id;

    // Validate required fields
    const requiredFields = ['title', 'type', 'category', 'download_url'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return handleValidationError(req, res, [
        `Missing required fields: ${missingFields.join(', ')}`
      ]);
    }

    // Validate type
    const validTypes = ['PDF', 'DOCX', 'VIDEO', 'AUDIO', 'LINK', 'TEMPLATE'];
    if (!validTypes.includes(type)) {
      return handleValidationError(req, res, [
        `Invalid type. Valid options: ${validTypes.join(', ')}`
      ]);
    }

    // Validate category
    const validCategories = [
      'Interview Preparation', 'Resume Templates', 'Cover Letter Templates', 
      'Salary Negotiation', 'Career Planning', 'Technical Skills', 
      'Soft Skills', 'Industry Insights', 'Networking', 'Job Search Strategy'
    ];
    if (!validCategories.includes(category)) {
      return handleValidationError(req, res, [
        `Invalid category. Valid options: ${validCategories.join(', ')}`
      ]);
    }

    // Validate package tier
    const validTiers = ['Tier 1', 'Tier 2', 'Tier 3', 'All'];
    if (!validTiers.includes(package_tier_required)) {
      return handleValidationError(req, res, [
        `Invalid package_tier_required. Valid options: ${validTiers.join(', ')}`
      ]);
    }

    // Create resource
    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        type,
        category,
        description,
        download_url,
        file_size,
        pages,
        duration_minutes,
        package_tier_required,
        tags,
        created_by: adminId,
        is_active: true,
        download_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource:', error);
      return handleDatabaseError(req, res, error, 'Failed to create resource');
    }

    res.status(201).json(createSuccessResponse(
      resource,
      'Resource created successfully'
    ));
  } catch (error) {
    console.error('Create resource error:', error);
    return handleDatabaseError(req, res, error, 'Failed to create resource');
  }
});

// PATCH /api/admin/resources/:id - Update resource (ADMIN ONLY)
router.patch('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      category,
      description,
      download_url,
      file_size,
      pages,
      duration_minutes,
      package_tier_required,
      tags,
      is_active
    } = req.body;

    // Validate type if provided
    if (type) {
      const validTypes = ['PDF', 'DOCX', 'VIDEO', 'AUDIO', 'LINK', 'TEMPLATE'];
      if (!validTypes.includes(type)) {
        return handleValidationError(req, res, [
          `Invalid type. Valid options: ${validTypes.join(', ')}`
        ]);
      }
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        'Interview Preparation', 'Resume Templates', 'Cover Letter Templates', 
        'Salary Negotiation', 'Career Planning', 'Technical Skills', 
        'Soft Skills', 'Industry Insights', 'Networking', 'Job Search Strategy'
      ];
      if (!validCategories.includes(category)) {
        return handleValidationError(req, res, [
          `Invalid category. Valid options: ${validCategories.join(', ')}`
        ]);
      }
    }

    // Validate package tier if provided
    if (package_tier_required) {
      const validTiers = ['Tier 1', 'Tier 2', 'Tier 3', 'All'];
      if (!validTiers.includes(package_tier_required)) {
        return handleValidationError(req, res, [
          `Invalid package_tier_required. Valid options: ${validTiers.join(', ')}`
        ]);
      }
    }

    const updateData = {};
    
    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (download_url) updateData.download_url = download_url;
    if (file_size) updateData.file_size = file_size;
    if (pages) updateData.pages = pages;
    if (duration_minutes) updateData.duration_minutes = duration_minutes;
    if (package_tier_required) updateData.package_tier_required = package_tier_required;
    if (tags) updateData.tags = tags;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resource:', error);
      return handleDatabaseError(req, res, error, 'Failed to update resource');
    }

    if (!resource) {
      return handleNotFoundError(req, res, 'Resource');
    }

    res.json(createSuccessResponse(
      resource,
      'Resource updated successfully'
    ));
  } catch (error) {
    console.error('Update resource error:', error);
    return handleDatabaseError(req, res, error, 'Failed to update resource');
  }
});

// DELETE /api/admin/resources/:id - Delete resource (ADMIN ONLY)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First delete all download records
    await supabaseAdmin
      .from('resource_downloads')
      .delete()
      .eq('resource_id', id);

    // Then delete the resource
    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resource:', error);
      return handleDatabaseError(req, res, error, 'Failed to delete resource');
    }

    res.json(createSuccessResponse(
      null,
      'Resource deleted successfully'
    ));
  } catch (error) {
    console.error('Delete resource error:', error);
    return handleDatabaseError(req, res, error, 'Failed to delete resource');
  }
});

// GET /api/admin/resources/:id/downloads - Get download history for resource (ADMIN ONLY)
router.get('/admin/:id/downloads', 
  authenticateToken, 
  requireAdmin,
  addValidSortFields(['download_timestamp', 'created_at']),
  parsePaginationParams,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Base query with client information
      const baseQuery = supabaseAdmin
        .from('resource_downloads')
        .select(`
          id,
          resource_id,
          client_id,
          download_timestamp,
          user_agent,
          ip_address,
          created_at,
          registered_users!inner(full_name, email)
        `)
        .eq('resource_id', id);

      // Count query
      const countQuery = supabaseAdmin
        .from('resource_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('resource_id', id);

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data
      const formattedData = result.data.map(download => ({
        id: download.id,
        resource_id: download.resource_id,
        client_id: download.client_id,
        client_name: download.registered_users?.full_name,
        client_email: download.registered_users?.email,
        download_timestamp: download.download_timestamp,
        user_agent: download.user_agent,
        ip_address: download.ip_address,
        created_at: download.created_at
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Download history retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching download history:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch download history');
    }
  }
);

module.exports = router;