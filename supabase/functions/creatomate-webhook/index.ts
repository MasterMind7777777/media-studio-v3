
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Define cors headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Define status mapping from Creatomate to our database status values
const mapCreatomateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planned': 'pending',
    'waiting': 'pending',
    'transcribing': 'processing',
    'rendering': 'processing',
    'succeeded': 'completed',
    'failed': 'failed'
  };
  
  return statusMap[status] || 'pending'; // Default to 'pending' for unknown statuses
};

// Function to check if a URL is likely an image URL
const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check for common image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with an image extension or contains image/ in the path
  return imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) || lowercaseUrl.includes('image/');
};

// Function to check if a URL is likely an audio URL (to filter these out)
const isAudioUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check for common audio file extensions
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'];
  const lowercaseUrl = url.toLowerCase();
  
  // Check if URL ends with an audio extension or contains audio/ in the path
  return audioExtensions.some(ext => lowercaseUrl.endsWith(ext)) || lowercaseUrl.includes('audio/');
};

// Function to get the best preview image URL from a render
const getBestPreviewImage = (render: any): string | null => {
  // Check the various possible URLs in order of preference
  const possibleUrls = [
    render.snapshot_url,
    render.preview_url,
    render.url
  ];
  
  for (const url of possibleUrls) {
    if (url && isImageUrl(url) && !isAudioUrl(url)) {
      console.log(`Using ${url} as preview image`);
      return url;
    } else if (url && isAudioUrl(url)) {
      console.log(`Skipping audio URL: ${url}`);
    }
  }
  
  return null;
};

// Verify the webhook signature
const verifySignature = (request: Request, body: string): boolean => {
  try {
    const signature = request.headers.get('X-Creatomate-Signature');
    if (!signature) {
      console.log('No signature header found');
      return false;
    }

    const secretKey = Deno.env.get('CREATOMATE_API_KEY');
    if (!secretKey) {
      console.log('No CREATOMATE_API_KEY secret found');
      return false;
    }

    // Create HMAC using the secret key and the request body
    const hmac = createHmac('sha256', secretKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    // Compare in constant time to prevent timing attacks
    const signatureMatches = expectedSignature.length === signature.length &&
      expectedSignature.split('').every((char, i) => char === signature[i]);

    if (!signatureMatches) {
      console.log('Signature verification failed');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error verifying signature:', err);
    return false;
  }
};

// Handle CORS preflight requests
serve(async (req: Request) => {
  // Handle CORS OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Parse the JSON
    const render = JSON.parse(rawBody);
    console.log('Received webhook from Creatomate:', render);

    // Verify webhook signature for production environments
    if (Deno.env.get('ENVIRONMENT') !== 'development') {
      const isValid = verifySignature(req, rawBody);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: corsHeaders }
        );
      }
    }

    if (!render.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload, missing render ID' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Map Creatomate status to our database status
    const mappedStatus = mapCreatomateStatus(render.status);
    console.log(`Mapping Creatomate status '${render.status}' to database status '${mappedStatus}'`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract metadata if available
    let metadata = null;
    try {
      if (render.metadata) {
        metadata = JSON.parse(render.metadata);
        console.log('Parsed webhook metadata:', metadata);
      }
    } catch (err) {
      console.error('Failed to parse metadata:', err);
    }

    // First approach: Try to find the render job by Creatomate render ID
    let { data: existingJob, error: findError } = await supabase
      .from('render_jobs')
      .select('*')
      .contains('creatomate_render_ids', [render.id])
      .maybeSingle();

    // Second approach: If not found and we have metadata with database_job_id, try to find by that
    if (!existingJob && metadata?.database_job_id) {
      console.log(`Job not found by render ID, trying database_job_id: ${metadata.database_job_id}`);
      const { data: jobByDbId, error: findByDbIdError } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', metadata.database_job_id)
        .maybeSingle();
      
      if (findByDbIdError) {
        console.error('Error finding job by database_job_id:', findByDbIdError);
      } else if (jobByDbId) {
        existingJob = jobByDbId;
        
        // Add this render ID to the job's creatomate_render_ids array
        const updatedRenderIds = [...(existingJob.creatomate_render_ids || []), render.id];
        
        // Update the job with the new render ID
        const { error: updateRenderIdsError } = await supabase
          .from('render_jobs')
          .update({
            creatomate_render_ids: updatedRenderIds,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJob.id);
        
        if (updateRenderIdsError) {
          console.error('Error adding render ID to job:', updateRenderIdsError);
        }
      }
    }

    if (!existingJob) {
      console.error(`No render job found for Creatomate render ID: ${render.id}`);
      console.error('Metadata:', metadata);
      
      return new Response(
        JSON.stringify({ 
          error: 'Render job not found', 
          details: 'The webhook received a render status update for a render job that does not exist in the database.'
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // If we found the job, update it with the new status and URL if available
    const outputUrls = { ...(existingJob.output_urls || {}) };
    
    // Add or update the URL for this render
    if (render.status === 'succeeded' && render.url) {
      outputUrls[render.id] = render.url;
    }

    // Get snapshot URL for this render
    let snapshotUrl = null;
    if (render.status === 'succeeded') {
      snapshotUrl = getBestPreviewImage(render);
    }

    // Update data to save to the database
    const updateData: Record<string, any> = {
      status: mappedStatus,
      output_urls: outputUrls,
      updated_at: new Date().toISOString()
    };

    // Only update snapshot_url if we have a valid image URL and it's not already set
    if (snapshotUrl && (!existingJob.snapshot_url || render.event_type === 'render.finished')) {
      updateData.snapshot_url = snapshotUrl;
      console.log(`Updating snapshot_url to ${snapshotUrl}`);
    }

    const { error: updateError } = await supabase
      .from('render_jobs')
      .update(updateData)
      .eq('id', existingJob.id);

    if (updateError) {
      console.error('Error updating render job:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update render job' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Update template preview image if render succeeded and has valid image URL
    if (render.status === 'succeeded' && existingJob.template_id) {
      console.log('Checking for valid preview image in render response');
      
      // Get the best preview image URL using our helper function
      const previewUrl = getBestPreviewImage(render);
      
      if (previewUrl) {
        console.log(`Found valid preview image URL: ${previewUrl}`);
        
        const { error: templateUpdateError } = await supabase
          .from('templates')
          .update({ 
            preview_image_url: previewUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJob.template_id);
        
        if (templateUpdateError) {
          console.error('Error updating template preview image:', templateUpdateError);
        } else {
          console.log(`Successfully updated template ${existingJob.template_id} preview image to ${previewUrl}`);
        }
      } else {
        console.log('No valid preview image URL found in render response');
      }
    }

    // Return success response (must be fast as required by Creatomate)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
