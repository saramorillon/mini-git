import { render, screen } from '@testing-library/react'
import React from 'react'
import Layout from '../../../src/views/repo/Layout'
import { mockRepositoryMeta } from '../../__mocks__/fixtures'

describe('Layout', () => {
  it('should render children', () => {
    render(
      <Layout repo={mockRepositoryMeta} active="commits">
        <div>Child</div>
      </Layout>
    )
    expect(screen.queryByText('Child')).toBeInTheDocument()
  })
})
