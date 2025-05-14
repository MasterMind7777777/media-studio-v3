
import { renderHook, act } from '@testing-library/react-hooks';
import { useCreatomatePreview } from '../hooks/templates/useCreatomatePreview';

// Mock cleanupVariables function
jest.mock('@/lib/variables', () => ({
  cleanupVariables: jest.fn(vars => vars)
}));

// Mock window.Creatomate
const mockPreview = {
  on: jest.fn((event, callback) => {
    if (event === 'ready') {
      // Simulate ready event
      setTimeout(() => callback(), 10);
    }
  }),
  loadTemplate: jest.fn(),
  setModifications: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  destroy: jest.fn()
};

describe('useCreatomatePreview', () => {
  beforeEach(() => {
    // Setup DOM element for container
    document.body.innerHTML = '<div id="test-container"></div>';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock implementation for getElementById
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'test-container') {
        return document.querySelector('#test-container');
      }
      return null;
    });
    
    // Mock Creatomate in window object
    // @ts-ignore - Mocking window.Creatomate
    window.Creatomate = {
      Preview: jest.fn(() => mockPreview)
    };
    
    // Mock environment variables
    process.env.VITE_DISABLE_CREATOMATE = 'false';
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    // @ts-ignore - Cleanup window.Creatomate
    delete window.Creatomate;
  });
  
  test('initializes with provided variables', () => {
    const { result } = renderHook(() => useCreatomatePreview({
      containerId: 'test-container',
      variables: { test: 'value' }
    }));
    
    expect(result.current.currentVars).toEqual({ test: 'value' });
  });
  
  test('forceUpdateVariables updates currentVars and triggers re-render', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCreatomatePreview({
      containerId: 'test-container',
      variables: { initial: 'value' }
    }));
    
    // Initial value check
    expect(result.current.currentVars).toEqual({ initial: 'value' });
    
    // Update variables
    act(() => {
      result.current.forceUpdateVariables({ updated: 'newValue' });
    });
    
    // Should immediately update the state
    expect(result.current.currentVars).toEqual({ 
      initial: 'value', 
      updated: 'newValue' 
    });
    
    // Wait for debounced call
    jest.advanceTimersByTime(200);
    
    // Should have called setModifications after debounce
    expect(mockPreview.setModifications).toHaveBeenCalledWith({
      initial: 'value',
      updated: 'newValue'
    });
  });
  
  test('handles disabled SDK mode correctly', () => {
    // Set SDK to disabled
    process.env.VITE_DISABLE_CREATOMATE = 'true';
    
    const { result } = renderHook(() => useCreatomatePreview({
      containerId: 'test-container'
    }));
    
    // Should be ready and not loading in disabled mode
    expect(result.current.isLoading).toBe(false);
    
    // After timeout simulating ready state
    jest.advanceTimersByTime(600);
    expect(result.current.isReady).toBe(true);
    expect(result.current.previewMode).toBe('interactive');
    
    // Should not initialize Creatomate.Preview
    expect(window.Creatomate.Preview).not.toHaveBeenCalled();
  });
  
  test('uses preview.setModifications when not disabled', async () => {
    // Make sure SDK is enabled
    process.env.VITE_DISABLE_CREATOMATE = 'false';
    
    const { result, waitForNextUpdate } = renderHook(() => useCreatomatePreview({
      containerId: 'test-container',
      variables: { test: 'value' }
    }));
    
    // Wait for the preview to be ready
    await act(async () => {
      // Simulate the ready event
      const readyCallback = mockPreview.on.mock.calls.find(call => call[0] === 'ready')[1];
      readyCallback();
      await waitForNextUpdate();
    });
    
    // Update variables
    act(() => {
      result.current.forceUpdateVariables({ updated: 'newValue' });
    });
    
    // Wait for debounced call
    jest.advanceTimersByTime(200);
    
    // Should have called setModifications
    expect(mockPreview.setModifications).toHaveBeenCalledWith({
      test: 'value',
      updated: 'newValue'
    });
  });
});
