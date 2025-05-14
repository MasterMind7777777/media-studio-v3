
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCreatomatePreview } from '../hooks/templates/useCreatomatePreview';

// Mock the window.Creatomate object
const mockPreviewInstance = {
  onReady: jest.fn(),
  onError: jest.fn(),
  onPlay: jest.fn(),
  onPause: jest.fn(),
  loadTemplate: jest.fn(),
  setModifications: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  dispose: jest.fn(),
};

// Mock the CreatomateLoader and other dependencies
jest.mock('../components/CreatomateLoader', () => ({
  loadScript: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/hooks/utils/useDebouncedCallback', () => ({
  useDebouncedCallback: (fn: any) => fn,
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('@/integrations/creatomate/config', () => ({
  isCreatomateDisabled: false,
  ensureCreatomateSDK: jest.fn().mockResolvedValue(undefined),
  isCreatomateSDKAvailable: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/variables', () => ({
  cleanupVariables: (vars: any) => vars,
}));

describe('useCreatomatePreview', () => {
  const containerId = 'test-container';
  
  beforeEach(() => {
    // Setup DOM element
    document.body.innerHTML = `<div id="${containerId}"></div>`;
    
    // Setup global Creatomate object
    (window as any).Creatomate = {
      Preview: jest.fn(() => mockPreviewInstance),
    };
    
    // Clear all mock calls
    jest.clearAllMocks();
  });
  
  it('initializes preview with correct container', () => {
    renderHook(() => useCreatomatePreview({ containerId }));
    
    // Should create a Preview instance with the container
    expect(window.Creatomate.Preview).toHaveBeenCalledWith(
      expect.objectContaining({ container: expect.any(HTMLElement) })
    );
  });
  
  it('updates variables correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useCreatomatePreview({ 
        containerId,
        variables: { text: 'Initial value' }
      })
    );
    
    // Simulate Preview ready event
    act(() => {
      mockPreviewInstance.onReady();
    });
    
    await waitForNextUpdate();
    
    // Call forceUpdateVariables
    act(() => {
      result.current.forceUpdateVariables({ text: 'Updated value' });
    });
    
    // Should update currentVars state
    expect(result.current.currentVars).toEqual(expect.objectContaining({
      text: 'Updated value'
    }));
    
    // Should call setModifications
    expect(mockPreviewInstance.setModifications).toHaveBeenCalled();
  });
  
  it('toggles play/pause correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useCreatomatePreview({ containerId })
    );
    
    // Simulate Preview ready event
    act(() => {
      mockPreviewInstance.onReady();
    });
    
    await waitForNextUpdate();
    
    // Initially not playing
    expect(result.current.isPlaying).toBe(false);
    
    // Call togglePlay to play
    act(() => {
      result.current.togglePlay();
    });
    
    // Should call play
    expect(mockPreviewInstance.play).toHaveBeenCalled();
    
    // Simulate play event
    act(() => {
      mockPreviewInstance.onPlay();
    });
    
    // Should be playing now
    expect(result.current.isPlaying).toBe(true);
    
    // Call togglePlay again to pause
    act(() => {
      result.current.togglePlay();
    });
    
    // Should call pause
    expect(mockPreviewInstance.pause).toHaveBeenCalled();
  });
});
