import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  jest.useFakeTimers();

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'changed', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('changed');
  });

  it('should cancel previous timer on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    rerender({ value: 'c', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('c');
  });
});

describe('useDebouncedCallback', () => {
  jest.useFakeTimers();

  it('should debounce callback execution', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockFn, 500));

    result.current('arg1');
    result.current('arg2');
    result.current('arg3');

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should use latest callback', () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    
    const { result, rerender } = renderHook(
      ({ fn }) => useDebouncedCallback(fn, 500),
      { initialProps: { fn: mockFn1 } }
    );

    result.current();
    rerender({ fn: mockFn2 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockFn2).toHaveBeenCalled();
  });
});
