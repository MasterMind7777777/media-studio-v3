
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Define cors headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
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

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract metadata if available
    let metadata = null;
    try {
      if (render.metadata) {
        metadata = JSON.parse(render.metadata);
      }
    } catch (err) {
      console.error('Failed to parse metadata:', err);
    }

    // Find the render job by ID
    const { data: existingJobs, error: findError } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', render.id)
      .maybeSingle();

    if (findError) {
      console.error('Error finding render job:', findError);
    }

    if (!existingJobs) {
      // This is a new render job we haven't seen before
      // Create a new entry with the render ID
      const { error: insertError } = await supabase
        .from('render_jobs')
        .insert({
          id: render.id,
          status: render.status,
          creatomate_render_ids: [render.id],
          output_urls: {
            [render.id]: render.url
          },
          template_id: metadata?.template_id || render.template_id,
          user_id: metadata?.user_id || null,
        });

      if (insertError) {
        console.error('Error inserting new render job:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create render job' }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      // Update the existing render job
      const outputUrls = { ...(existingJobs.output_urls || {}) };
      
      // Add or update the URL for this render
      if (render.status === 'succeeded' && render.url) {
        outputUrls[render.id] = render.url;
      }

      const { error: updateError } = await supabase
        .from('render_jobs')
        .update({
          status: render.status,
          output_urls: outputUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', render.id);

      if (updateError) {
        console.error('Error updating render job:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update render job' }),
          { status: 500, headers: corsHeaders }
        );
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
