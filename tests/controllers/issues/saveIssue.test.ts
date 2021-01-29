import { Req, saveIssue } from '../../../src/controllers/issues/saveIssue'
import { Issue } from '../../../src/models/Issue'
import { User } from '../../../src/models/User'
import { getMockReq, getMockRes } from '../../__mocks__/express'
import { mockRepository, RepoMock } from '../../__mocks__/repository'

jest.mock('../../../src/models/Release')
jest.mock('../../../src/models/Issue')

describe('saveIssue', () => {
  const body = { title: 'title', type: 'bug', description: 'description', release: 1 }
  const req = getMockReq<Req>({ params: { repo: 'repo', id: '8' }, body })
  const { res, clearMockRes } = getMockRes()

  let issueMock: RepoMock<Issue>

  beforeEach(() => {
    clearMockRes()

    issueMock = mockRepository(Issue.getRepository as jest.Mock)
    issueMock.update.mockResolvedValue(undefined)
    issueMock.save.mockResolvedValue(undefined)
  })

  it('should update release for all issues', async () => {
    await saveIssue(req, res)
    expect(issueMock.update).toHaveBeenCalledWith({ release: { id: 1 } }, { priority: expect.any(Function) })
  })

  it('should update issue if id is present', async () => {
    await saveIssue(req, res)
    expect(issueMock.update).toHaveBeenCalledWith('8', {
      title: 'title',
      type: 'bug',
      description: 'description',
      release: { id: 1 },
    })
  })

  it('should save issue if id is not present', async () => {
    const req = getMockReq<Req>({ params: { repo: 'repo' }, body })
    req.user = { id: 2 } as User
    await saveIssue(req, res)
    expect(issueMock.save).toHaveBeenCalledWith({
      repo: 'repo',
      title: 'title',
      type: 'bug',
      description: 'description',
      author: { id: 2 },
      release: { id: 1 },
    })
  })

  it('should redirect to issues list', async () => {
    await saveIssue(req, res)
    expect(res.redirect).toHaveBeenCalledWith('/repo/repo/issues/list')
  })
})