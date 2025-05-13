
import { describe, it, expect } from 'vitest';
import { getProjectName } from '../getProjectName';
import { RenderJob, Template } from '@/types';

describe('getProjectName', () => {
  it('should return project name when available', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'My Test Project',
    } as RenderJob;
    
    expect(getProjectName(project)).toBe('My Test Project');
  });
  
  it('should use template name when project name is empty', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: '',
    } as RenderJob;
    
    const template = {
      name: 'Social Media Template',
    } as Template;
    
    expect(getProjectName(project, template)).toBe('Social Media Template (12345678)');
  });
  
  it('should fallback to ID when name and template are not available', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
    } as RenderJob;
    
    expect(getProjectName(project)).toBe('Project 12345678');
  });
  
  it('should handle null template gracefully', () => {
    const project = {
      id: '12345678-1234-1234-1234-123456789012',
      name: '',
    } as RenderJob;
    
    expect(getProjectName(project, null)).toBe('Project 12345678');
  });
});
