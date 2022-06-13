import { render, screen } from '@testing-library/react'
import React from 'react'
import { LoadContainer } from '../../../../src/ui/components/LoadContainer'

describe('LoadContainer', () => {
  it('should render loader when loading', () => {
    render(<LoadContainer loading>Child</LoadContainer>)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
  })

  it('should render child when not loading', () => {
    render(<LoadContainer>Child</LoadContainer>)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })
})