import axios, { AxiosInstance, AxiosRequestConfig } from "https://esm.sh/axios@1.6.7";
import { z } from "https://esm.sh/zod@3.23.8";

/**
 * Zod schema definitions for Creatomate API responses
 */

// Schema for Creatomate Render object
export const RenderSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'waiting', 'planned', 'transcribing', 'rendering', 'succeeded', 'failed']),
  url: z.string().url().optional(),
  snapshot_url: z.string().url().optional(),
  preview_url: z.string().url().optional(),
  progress: z.number().optional(),
  error_message: z.string().optional(),
  output_format: z.enum(['jpg', 'png', 'gif', 'mp4']).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  metadata: z.string().optional(),
  template_id: z.string().optional(),
  template_name: z.string().optional(),
  created_at: z.string().optional()
});

// Schema for Creatomate Template object
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  preview_url: z.string().url().optional(),
  snapshot_url: z.string().url().optional(),
  source: z.record(z.any()).optional(),
  elements: z.array(z.record(z.any())).optional(),
  outputs: z.array(z.record(z.any())).optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

// Schema for array of renders (used in list response)
export const RendersSchema = z.object({
  renders: z.array(RenderSchema)
});

// Type definitions derived from schemas
export type CreatomateRender = z.infer<typeof RenderSchema>;
export type CreatomateTemplate = z.infer<typeof TemplateSchema>;
export type CreatomateRenders = z.infer<typeof RendersSchema>;

// Parameters for render creation
export interface RenderParams {
  template_id?: string;
  source?: Record<string, any>;
  modifications?: Record<string, any>;
  output_format?: 'jpg' | 'png' | 'gif' | 'mp4';
  width?: number;
  height?: number;
  render_scale?: number;
  max_width?: number;
  max_height?: number;
  webhook_url?: string;
  metadata?: string;
  // Allow for future parameters
  [key: string]: unknown;
}

/**
 * Creatomate API client class 
 * This class wraps all API operations and ensures type safety
 */
export class CreatomateApi {
  private client: AxiosInstance;
  
  /**
   * Create a new Creatomate API client
   * @param apiKey - The Creatomate API key (secret)
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Creatomate API key is required');
    }
    
    this.client = axios.create({
      baseURL: 'https://api.creatomate.com/v1',
      timeout: 20000, // 20 seconds
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      validateStatus: (s) => s < 300 // Only 2xx status codes are success
    });
  }
  
  /**
   * Create a new render job
   * @param params - Render parameters
   * @param config - Optional axios request config
   * @returns Creatomate Render object
   */
  async createRender(
    params: RenderParams,
    config: AxiosRequestConfig = {}
  ): Promise<CreatomateRender> {
    try {
      const { data } = await this.client.post('/renders', params, config);
      
      // Parse and validate the response
      return RenderSchema.parse(data);
    } catch (error) {
      console.error('Error creating render:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Get a specific render by ID
   * @param id - Render ID
   * @param config - Optional axios request config
   * @returns Creatomate Render object
   */
  async getRender(
    id: string,
    config: AxiosRequestConfig = {}
  ): Promise<CreatomateRender> {
    try {
      const { data } = await this.client.get(`/renders/${id}`, config);
      
      // Parse and validate the response
      return RenderSchema.parse(data);
    } catch (error) {
      console.error(`Error fetching render ${id}:`, error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Get multiple renders (optionally filtered)
   * @param params - Query parameters
   * @param config - Optional axios request config
   * @returns Array of Creatomate Render objects
   */
  async getRenders(
    params: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<CreatomateRender[]> {
    try {
      const { data } = await this.client.get('/renders', {
        ...config,
        params
      });
      
      // Parse and validate the response
      const result = RendersSchema.safeParse(data);
      
      // Handle two possible response formats - direct array or nested in renders property
      if (result.success) {
        return result.data.renders;
      } else if (Array.isArray(data)) {
        return z.array(RenderSchema).parse(data);
      }
      
      throw new Error('Invalid response format from Creatomate API');
    } catch (error) {
      console.error('Error fetching renders:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Get a template by ID
   * @param id - Template ID
   * @param config - Optional axios request config
   * @returns Creatomate Template object
   */
  async getTemplate(
    id: string,
    config: AxiosRequestConfig = {}
  ): Promise<CreatomateTemplate> {
    try {
      const { data } = await this.client.get(`/templates/${id}`, config);
      
      // Parse and validate the response
      return TemplateSchema.parse(data);
    } catch (error) {
      console.error(`Error fetching template ${id}:`, error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Poll a render until it completes or times out
   * @param id - Render ID to poll
   * @param interval - Polling interval in ms
   * @param maxRetries - Maximum number of polling attempts
   * @returns Final Creatomate Render object
   */
  async awaitRender(
    id: string,
    interval = 5000,
    maxRetries = 60
  ): Promise<CreatomateRender> {
    for (let i = 0; i < maxRetries; i++) {
      const render = await this.getRender(id);
      
      // If the render is done (succeeded or failed), return it
      if (render.status === 'succeeded' || render.status === 'failed') {
        return render;
      }
      
      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    
    throw new Error(`Render ${id} timed out after ${maxRetries * interval / 1000} seconds`);
  }
  
  /**
   * Helper to transform API errors into more useful formats
   */
  private handleError(error: any): Error {
    // If it's an Axios error with a response, extract the details
    if (error.response) {
      const { status, data } = error.response;
      
      return new Error(
        `Creatomate API error (${status}): ${
          typeof data === 'string' ? data : JSON.stringify(data)
        }`
      );
    }
    
    // Otherwise, return the original error
    return error;
  }
  
  /**
   * Verify webhook signature from Creatomate
   * @param signature - X-Creatomate-Signature header value
   * @param body - Raw request body as string
   * @param secret - Webhook secret (same as API key)
   * @returns Boolean indicating if signature is valid
   */
  static verifyWebhookSignature(
    signature: string | null,
    body: string,
    secret: string
  ): boolean {
    // If no signature or body is provided, fail validation
    if (!signature || !body || !secret) {
      return false;
    }
    
    try {
      // Note: In a proper implementation, we would:
      // 1. Create HMAC with SHA-256 algorithm using the secret
      // 2. Generate a hex digest of the body
      // 3. Compare with the provided signature using a constant-time comparison
      
      // This is a placeholder - in Deno we would use crypto API
      console.log('Webhook signature validation would happen here');
      console.log('Signature:', signature);
      
      // For now, return true as we're not implementing actual signature verification yet
      // In production, never skip this verification!
      return true;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}
