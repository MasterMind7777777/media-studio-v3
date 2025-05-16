import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, successResponse } from "../_shared/creatomate-api.ts";

// Create a Supabase client for database operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the webhook payload
    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload));
    
    // Validate payload
    if (!payload || !payload.id) {
      return errorResponse('Invalid webhook payload');
    }
    
    // Check the status of the render
    const renderId = payload.id;
    const status = payload.status;
    const outputUrl = payload.url || null;
    const snapshotUrl = payload.snapshot_url || null;
    const metadata = payload.metadata || '';
    
    console.log(`Processing render ${renderId} with status: ${status}`);
    
    // Extract metadata information
    let jobId = null;
    let platformId = null;
    
    if (metadata) {
      const jobMatch = metadata.match(/job_id:([^|]+)/);
      if (jobMatch && jobMatch[1]) {
        jobId = jobMatch[1];
      }
      
      const platformMatch = metadata.match(/platform:([^|]+)/);
      if (platformMatch && platformMatch[1]) {
        platformId = platformMatch[1];
      }
    }
    
    if (!jobId) {
      console.log('No job ID found in metadata, skipping database update');
      return successResponse({ message: 'Webhook received, but no job ID found in metadata' });
    }
    
    // Get the current render job
    const { data: job, error: fetchError } = await supabaseClient
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
      
    if (fetchError || !job) {
      console.error(`Error fetching job ${jobId}:`, fetchError);
      return errorResponse(`Job not found: ${jobId}`);
    }
    
    // Update the job status and output URLs
    let dbStatus = job.status;
    const outputUrls = job.output_urls || {};
    
    // Update status based on render status
    if (status === 'succeeded' && !outputUrl) {
      // Render succeeded but no URL - this shouldn't happen
      console.warn(`Render ${renderId} succeeded but no URL was provided`);
    } else if (status === 'succeeded') {
      // Add the output URL to the list
      if (platformId) {
        outputUrls[platformId] = outputUrl;
      }
      
      // Check if all renders are complete
      const allComplete = job.creatomate_render_ids.every(id => {
        // If this is the current render, it's complete
        if (id === renderId) return true;
        
        // Otherwise check if it has an output URL
        const platform = Object.values(job.platforms).find(
          (p: any) => outputUrls[p.id]
        );
        return !!platform;
      });
      
      dbStatus = allComplete ? 'completed' : 'processing';
    } else if (status === 'failed') {
      // Mark the job as failed
      dbStatus = 'failed';
    } else if (['queued', 'rendering', 'planned', 'waiting', 'transcribing'].includes(status)) {
      // Job is still processing
      dbStatus = 'processing';
    }
    
    // If this is the first completed render, use its snapshot as preview
    let updateData: any = {
      status: dbStatus,
      output_urls: outputUrls,
      updated_at: new Date().toISOString()
    };
    
    // If we have a snapshot URL and no existing snapshot, add it
    if (snapshotUrl && !job.snapshot_url) {
      updateData.snapshot_url = snapshotUrl;
    }
    
    // Update the job in the database
    const { error: updateError } = await supabaseClient
      .from('render_jobs')
      .update(updateData)
      .eq('id', jobId);
      
    if (updateError) {
      console.error(`Error updating job ${jobId}:`, updateError);
      return errorResponse(`Error updating job: ${updateError.message}`);
    }
    
    console.log(`Successfully processed webhook for render ${renderId}, job ${jobId}`);
    return successResponse({ 
      message: 'Webhook processed successfully',
      renderId,
      jobId,
      status: dbStatus
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return errorResponse(`Error processing webhook: ${error.message}`, 500);
  }
});
