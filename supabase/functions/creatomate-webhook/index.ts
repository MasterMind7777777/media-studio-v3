
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
    // Get the render data from the request body
    const render = await req.json();

    console.log('Received webhook from Creatomate:', render);

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

    const { error: updateError } = await supabase
      .from('render_jobs')
      .update({
        status: mappedStatus, // Use mapped status
        output_urls: outputUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingJob.id);

    if (updateError) {
      console.error('Error updating render job:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update render job' }),
        { status: 500, headers: corsHeaders }
      );
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
