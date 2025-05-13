
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Template } from '@/types';
import { transformTemplate } from './transformers';

export const useTemplate = (templateId?: string) => {
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID is required');
      
      // Fetch template from Supabase
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Template not found');
      }

      // Transform the template data
      return transformTemplate(data as Template);
    },
    enabled: !!templateId,
  });
};
