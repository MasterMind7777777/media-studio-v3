
import { describe, it, expect } from 'vitest';
import { getProjectName } from '../getProjectName';
import { RenderJob, Template } from '@/types';

describe('getProjectName', () => {
  it('should return project name when available', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'My Test Project',
      user_id: 'test-user',
      template_id: 'test-template',
      variables: {},
      platforms: [],
      status: 'completed' as const,
      creatomate_render_ids: [],
      output_urls: {},
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    } as RenderJob;
    
    expect(getProjectName(project)).toBe('My Test Project');
  });
  
  it('should use template name when project name is empty', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: '',
      user_id: 'test-user',
      template_id: 'test-template',
      variables: {},
      platforms: [],
      status: 'completed' as const,
      creatomate_render_ids: [],
      output_urls: {},
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    } as RenderJob;
    
    const template = {
      name: 'Social Media Template',
      id: 'template-id',
      creatomate_template_id: 'creatomate-id',
      platforms: [],
      variables: {},
      created_at: '2023-01-01'
    } as Template;
    
    expect(getProjectName(project, template)).toBe('Social Media Template (12345678)');
  });
  
  it('should fallback to ID when name and template are not available', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      user_id: 'test-user',
      template_id: 'test-template',
      variables: {},
      platforms: [],
      status: 'completed' as const,
      creatomate_render_ids: [],
      output_urls: {},
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    } as RenderJob;
    
    expect(getProjectName(project)).toBe('Project 12345678');
  });
  
  it('should handle null template gracefully', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: '',
      user_id: 'test-user',
      template_id: 'test-template',
      variables: {},
      platforms: [],
      status: 'completed' as const,
      creatomate_render_ids: [],
      output_urls: {},
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    } as RenderJob;
    
    expect(getProjectName(project, null)).toBe('Project 12345678');
  });
});
