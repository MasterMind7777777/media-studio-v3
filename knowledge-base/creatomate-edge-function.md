
# Creatomate Edge Function Documentation

## Overview
The Creatomate Edge Function serves as a secure backend for interacting with the Creatomate API. This function handles operations like starting render jobs, importing templates, and processing webhooks without exposing the Creatomate API secret key in the frontend code.

## Function Endpoints

### 1. `creatomate` Edge Function
**URL**: `https://yfycfcpyvupjpmngnxfi.supabase.co/functions/v1/creatomate`

This function handles various Creatomate API operations including:
- Starting render jobs
- Importing templates
- Parsing CURL commands
- Updating template previews

### 2. `creatomate-webhook` Edge Function
**URL**: `https://yfycfcpyvupjpmngnxfi.supabase.co/functions/v1/creatomate-webhook`

This function handles webhook callbacks from Creatomate when render jobs are completed or fail.

## Required Secrets
The edge functions require access to the following secrets:
- `CREATOMATE_API_KEY`: Secret API key for the Creatomate service

## Common Usage Patterns

### Starting a Render Job
The frontend calls the `startRenderJob` function in `src/services/creatomate.ts`, which:
1. Formats platform data (ensuring width and height are numbers)
2. Calls the edge function with template ID, variables, and platforms
3. Returns render IDs for tracking

```typescript
// Example from src/services/creatomate.ts
export async function startRenderJob(
  creatomateTemplateId: string, 
  variables: Record<string, any>,
  platforms: any[],
  database_job_id?: string
): Promise<string[]> {
  // Standardize platform objects
  const standardizedPlatforms = platforms.map(platform => ({
    id: platform.id,
    name: platform.name,
    width: Number(platform.width),
    height: Number(platform.height),
    aspect_ratio: platform.aspect_ratio || `${platform.width}:${platform.height}`
  }));
  
  // Call the edge function
  const { data, error } = await supabase.functions.invoke('creatomate', {
    body: { 
      action: 'start-render',
      creatomateTemplateId,
      variables,
      platforms: standardizedPlatforms,
      user_id: userId,
      database_job_id,
      include_snapshots: true
    },
  });
  
  // Return render IDs
  return data.renders.map(render => render.id);
}
```

### Webhook Processing
When a render job completes or fails:
1. Creatomate calls the webhook URL
2. The webhook function updates the job status in the database
3. The frontend receives real-time updates via Supabase subscriptions

## Troubleshooting
Common issues include:
- Platform data format mismatches between frontend and edge function
- Missing or invalid API keys
- Database connectivity issues

For detailed logs, check the Supabase Edge Function logs at:
https://supabase.com/dashboard/project/yfycfcpyvupjpmngnxfi/functions/creatomate/logs
