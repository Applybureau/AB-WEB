const { handleValidationError, ERROR_CODES } = require('./errorHandler');

// Default pagination settings
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;

// Parse and validate pagination parameters
const parsePaginationParams = (req, res, next) => {
  try {
    let { limit, offset, page, sort, order } = req.query;
    
    // Parse limit
    limit = parseInt(limit) || DEFAULT_LIMIT;
    if (limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    
    // Parse offset or page
    if (page) {
      page = parseInt(page) || 1;
      if (page < 1) page = 1;
      offset = (page - 1) * limit;
    } else {
      offset = parseInt(offset) || DEFAULT_OFFSET;
      if (offset < 0) offset = DEFAULT_OFFSET;
      page = Math.floor(offset / limit) + 1;
    }
    
    // Parse sorting
    const validSortFields = req.validSortFields || ['created_at', 'updated_at', 'id'];
    const validOrderValues = ['asc', 'desc'];
    
    if (sort && !validSortFields.includes(sort)) {
      return handleValidationError(req, res, [`Invalid sort field. Valid options: ${validSortFields.join(', ')}`]);
    }
    
    if (order && !validOrderValues.includes(order.toLowerCase())) {
      return handleValidationError(req, res, ['Invalid order value. Valid options: asc, desc']);
    }
    
    sort = sort || 'created_at';
    order = (order || 'desc').toLowerCase();
    
    // Add to request object
    req.pagination = {
      limit,
      offset,
      page,
      sort,
      order
    };
    
    next();
  } catch (error) {
    return handleValidationError(req, res, ['Invalid pagination parameters']);
  }
};

// Build Supabase query with pagination
const buildPaginatedQuery = (query, pagination, countQuery = null) => {
  const { limit, offset, sort, order } = pagination;
  
  // Apply sorting
  query = query.order(sort, { ascending: order === 'asc' });
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  return query;
};

// Get total count for pagination
const getTotalCount = async (countQuery) => {
  try {
    const { count, error } = await countQuery;
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting total count:', error);
    return 0;
  }
};

// Create pagination metadata
const createPaginationMeta = (total, limit, offset) => {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    limit,
    offset,
    page,
    total_pages: totalPages,
    has_next: offset + limit < total,
    has_previous: offset > 0
  };
};

// Middleware to add valid sort fields to request
const addValidSortFields = (fields) => {
  return (req, res, next) => {
    req.validSortFields = fields;
    next();
  };
};

// Helper function for filtering
const parseFilterParams = (req) => {
  const filters = {};
  const { status, search, date_from, date_to, created_by, assigned_to } = req.query;
  
  if (status) {
    filters.status = status;
  }
  
  if (search) {
    filters.search = search.trim();
  }
  
  if (date_from) {
    try {
      filters.date_from = new Date(date_from).toISOString();
    } catch (error) {
      // Invalid date, ignore
    }
  }
  
  if (date_to) {
    try {
      filters.date_to = new Date(date_to).toISOString();
    } catch (error) {
      // Invalid date, ignore
    }
  }
  
  if (created_by) {
    filters.created_by = created_by;
  }
  
  if (assigned_to) {
    filters.assigned_to = assigned_to;
  }
  
  return filters;
};

// Apply filters to Supabase query
const applyFilters = (query, filters, searchFields = []) => {
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.search && searchFields.length > 0) {
    // Create OR condition for search across multiple fields
    const searchConditions = searchFields.map(field => `${field}.ilike.%${filters.search}%`);
    query = query.or(searchConditions.join(','));
  }
  
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }
  
  if (filters.created_by) {
    query = query.eq('created_by', filters.created_by);
  }
  
  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  
  return query;
};

// Complete pagination helper for routes
const paginateResults = async (baseQuery, countQuery, req) => {
  try {
    const { pagination } = req;
    const filters = parseFilterParams(req);
    
    // Apply filters to both queries
    const searchFields = req.searchFields || [];
    let dataQuery = applyFilters(baseQuery, filters, searchFields);
    let totalQuery = applyFilters(countQuery, filters, searchFields);
    
    // Get total count
    const total = await getTotalCount(totalQuery);
    
    // Apply pagination to data query
    dataQuery = buildPaginatedQuery(dataQuery, pagination);
    
    // Execute data query
    const { data, error } = await dataQuery;
    if (error) throw error;
    
    // Create pagination metadata
    const paginationMeta = createPaginationMeta(total, pagination.limit, pagination.offset);
    
    return {
      data: data || [],
      pagination: paginationMeta,
      filters
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  parsePaginationParams,
  buildPaginatedQuery,
  getTotalCount,
  createPaginationMeta,
  addValidSortFields,
  parseFilterParams,
  applyFilters,
  paginateResults,
  DEFAULT_LIMIT,
  MAX_LIMIT
};