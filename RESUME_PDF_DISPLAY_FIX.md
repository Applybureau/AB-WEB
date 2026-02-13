# Resume PDF Display Fix

## Problem
PDFs uploaded to Supabase Storage are not displaying in the admin dashboard because the `client-files` bucket is private and the public URLs don't work.

## Your Current Architecture
- **Backend:** Uses `supabaseAdmin` (service role) - bypasses RLS
- **Authentication:** Custom JWT with `registered_users` table (not Supabase Auth)
- **Frontend:** Receives URLs from backend API, tries to display them directly

## Why RLS Policies Won't Work
The SQL policies I provided won't work because:
1. Your backend uses service role key (bypasses all RLS)
2. Your frontend doesn't authenticate with Supabase directly
3. Policies check `auth.uid()` but you use custom auth

## Solution Options

### Option 1: Make Bucket Public (Recommended for Your Setup)

**Pros:**
- Simplest solution
- Works immediately with your current code
- No backend changes needed
- Frontend can display PDFs directly

**Cons:**
- Anyone with the URL can access files
- Less secure (but URLs are hard to guess)

**How to Apply:**
1. Go to Supabase Dashboard
2. Navigate to Storage → client-files
3. Click the settings/options menu
4. Click "Make bucket public"
5. Done! PDFs will now display

---

### Option 2: Use Signed URLs (More Secure)

**Pros:**
- More secure - URLs expire after set time
- Files remain private
- Better for sensitive documents

**Cons:**
- Requires backend code changes
- URLs expire and need regeneration
- Slightly more complex

**Backend Changes Required:**

#### 1. Update Upload Endpoint
Change from `getPublicUrl()` to `createSignedUrl()`:

```javascript
// In backend/routes/clientUploads.js
// BEFORE (line 50-53):
const { data: urlData } = supabaseAdmin.storage
  .from('client-files')
  .getPublicUrl(fileName);
const resumeUrl = urlData.publicUrl;

// AFTER:
const { data: urlData, error: urlError } = await supabaseAdmin.storage
  .from('client-files')
  .createSignedUrl(fileName, 31536000); // 1 year expiry

if (urlError) {
  console.error('Error creating signed URL:', urlError);
  return res.status(500).json({ error: 'Failed to generate file URL' });
}

const resumeUrl = urlData.signedUrl;
```

#### 2. Add Endpoint to Refresh Signed URLs
Create new endpoint for when URLs expire:

```javascript
// In backend/routes/adminDashboardComplete.js or clientUploads.js

// GET /api/admin/clients/:id/files/refresh - Refresh signed URLs
router.get('/clients/:id/files/refresh', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', id)
      .eq('is_active', true)
      .eq('file_type', 'resume');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    // Generate fresh signed URLs
    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => {
        if (file.file_url) {
          // Extract path from existing URL
          const urlParts = file.file_url.split('/client-files/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]; // Remove any existing query params
            
            const { data: signedData, error: signedError } = await supabaseAdmin.storage
              .from('client-files')
              .createSignedUrl(filePath, 3600); // 1 hour

            if (!signedError && signedData) {
              return {
                ...file,
                signed_url: signedData.signedUrl
              };
            }
          }
        }
        return file;
      })
    );

    res.json({
      files: filesWithSignedUrls
    });

  } catch (error) {
    console.error('Error refreshing signed URLs:', error);
    res.status(500).json({ error: 'Failed to refresh URLs' });
  }
});
```

#### 3. Update Admin Files Endpoint
Modify the existing endpoint to return signed URLs:

```javascript
// In backend/routes/adminDashboardComplete.js
// Around line 737-770

router.get('/clients/:id/files', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false});

    if (error) {
      logger.error('Error fetching client files:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    // Generate signed URLs for resume files
    const filesWithSignedUrls = await Promise.all(
      (files || []).map(async (file) => {
        if (file.file_type === 'resume' && file.file_url) {
          const urlParts = file.file_url.split('/client-files/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0];
            
            const { data: signedData } = await supabaseAdmin.storage
              .from('client-files')
              .createSignedUrl(filePath, 3600); // 1 hour

            if (signedData) {
              return {
                ...file,
                file_url: signedData.signedUrl // Replace with signed URL
              };
            }
          }
        }
        return file;
      })
    );

    const resumeFile = filesWithSignedUrls?.find(f => f.file_type === 'resume');
    const linkedinFile = filesWithSignedUrls?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = filesWithSignedUrls?.filter(f => f.file_type === 'portfolio') || [];

    res.json({
      files: filesWithSignedUrls || [],
      summary: {
        resume_uploaded: !!resumeFile,
        linkedin_added: !!linkedinFile,
        portfolio_added: portfolioFiles.length > 0,
        total_files: filesWithSignedUrls?.length || 0
      }
    });

  } catch (error) {
    logger.error('Get client files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});
```

**Frontend Changes (if using signed URLs):**
- No changes needed if backend returns signed URLs in `file_url` field
- Frontend just uses the URL as before
- URLs expire after 1 hour, so may need to refresh if user stays on page long

---

## Recommended Approach

**For your current setup, I recommend Option 1 (Make Bucket Public)** because:

1. ✅ No code changes needed
2. ✅ Works immediately
3. ✅ Simpler to maintain
4. ✅ URLs don't expire
5. ✅ Your files are already somewhat protected (hard-to-guess URLs with UUIDs)

**When to use Option 2 (Signed URLs):**
- If you're handling highly sensitive documents (medical records, financial docs, etc.)
- If you need audit trails of file access
- If you want URLs to expire for security

---

## How Frontend Should Display PDFs

Your frontend should display PDFs using one of these methods:

### Method 1: Direct Link (Current)
```javascript
// Simple link that opens PDF in new tab
<a href={file.file_url} target="_blank" rel="noopener noreferrer">
  View Resume
</a>
```

### Method 2: Embedded PDF Viewer
```javascript
// Embed PDF in iframe
<iframe 
  src={file.file_url} 
  width="100%" 
  height="600px"
  title="Resume PDF"
/>
```

### Method 3: PDF.js Library (Best UX)
```javascript
// Using react-pdf or pdf.js for better control
import { Document, Page } from 'react-pdf';

<Document file={file.file_url}>
  <Page pageNumber={1} />
</Document>
```

---

## Quick Fix Steps

1. **Go to Supabase Dashboard**
2. **Storage → client-files bucket**
3. **Click "Make Public"**
4. **Test:** Open the resume URL in browser - should display PDF
5. **Done!** Admin dashboard will now show PDFs

---

## Verification

After applying the fix, test with:
```bash
node backend/check-resume-url-issue.js
```

The bucket should show `Public: true` and URLs should work in browser.
