
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RenderJobInput {
  templateId: string;
  variables: Record<string, any>;
  platforms: any[];
}

export const useCreateRenderJob = () => {
  return useMutation({
    mutationFn: async ({ templateId, variables, platforms }: RenderJobInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('You must be logged in to start a render');
      }
      
      // Insert render job in the database
      const { data, error } = await supabase
        .from('render_jobs')
        .insert({
          template_id: templateId,
          user_id: userData.user.id,
          variables,
          platforms,
          status: 'pending',
          name: `Render ${new Date().toLocaleString()}`, // Default name
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating render job:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to create render job');
      }
      
      // Call edge function to start render process
      const { error: fnError } = await supabase.functions.invoke('creatomate', {
        body: { renderJobId: data.id }
      });
      
      if (fnError) {
        console.error('Error invoking render function:', fnError);
        throw new Error(fnError.message);
      }
      
      return data;
    },
  });
};
