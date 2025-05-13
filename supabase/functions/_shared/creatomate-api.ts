
// Remove axios dependency and use native fetch
// import axios, { AxiosInstance, AxiosRequestConfig } from "https://esm.sh/axios@1.6.7";
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
  private baseUrl: string;
  private headers: HeadersInit;
  
  /**
   * Create a new Creatomate API client
   * @param apiKey - The Creatomate API key (secret)
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Creatomate API key is required');
    }
    
    this.baseUrl = 'https://api.creatomate.com/v1';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Make a request to the Creatomate API
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param body - Request body for POST/PUT requests
   * @returns Response data
   */
  private async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Error in ${method} request to ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Create a new render job
   * @param params - Render parameters
   * @returns Creatomate Render object
   */
  async createRender(params: RenderParams): Promise<CreatomateRender> {
    try {
      const data = await this.request<any>('/renders', 'POST', params);
      
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
   * @returns Creatomate Render object
   */
  async getRender(id: string): Promise<CreatomateRender> {
    try {
      const data = await this.request<any>(`/renders/${id}`, 'GET');
      
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
   * @returns Array of Creatomate Render objects
   */
  async getRenders(params: Record<string, any> = {}): Promise<CreatomateRender[]> {
    try {
      // Convert params to query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/renders${queryString ? `?${queryString}` : ''}`;
      
      const data = await this.request<any>(endpoint, 'GET');
      
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
   * @returns Creatomate Template object
   */
  async getTemplate(id: string): Promise<CreatomateTemplate> {
    try {
      const data = await this.request<any>(`/templates/${id}`, 'GET');
      
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
    // If it's a fetch error with a response, extract the details
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
