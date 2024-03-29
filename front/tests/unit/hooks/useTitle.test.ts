import { fireEvent, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCurrentTitle, useTitle } from '../../../src/hooks/useTitle'

describe('useCurrentTitle', () => {
  it('should return title', () => {
    document.title = 'title'
    const { result } = renderHook(() => useCurrentTitle())
    expect(result.current).toBe('title')
  })

  it('should return new title when title changes', () => {
    document.title = 'title'
    const { result } = renderHook(() => useCurrentTitle())
    document.title = 'new title'
    fireEvent(document.head, new CustomEvent('titlechange'))
    expect(result.current).toBe('new title')
  })
})

describe('useTitle', () => {
  beforeEach(() => {
    vi.spyOn(EventTarget.prototype, 'dispatchEvent')
  })

  it('should set document title', () => {
    renderHook(useTitle, { initialProps: 'title' })
    expect(document.title).toBe('Mini Git - title')
    expect(EventTarget.prototype.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent))
  })

  it('should change document title', () => {
    const { rerender } = renderHook(useTitle, { initialProps: 'title' })
    rerender('new title')
    expect(document.title).toBe('Mini Git - new title')
    expect(EventTarget.prototype.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent))
  })
})
