import mockdate from 'mockdate'
import { MoreThan } from 'typeorm'
import { getBoard, Req } from '../../../src/controllers/board/getBoard'
import { Issue } from '../../../src/models/Issue'
import { Release } from '../../../src/models/Release'
import { getMockReq, getMockRes } from '../../mocks/express'
import { mockRepository, RepoMock } from '../../mocks/repository'

mockdate.set('2020-01-01T00:00:00.000Z')

jest.mock('../../../src/models/Release')
jest.mock('../../../src/models/Issue')

describe('getBoard', () => {
  const req = getMockReq<Req>({ params: { repo: 'repo' } })
  const { res, clearMockRes } = getMockRes()

  let releaseMock: RepoMock<Release>
  let issueMock: RepoMock<Issue>

  beforeEach(() => {
    clearMockRes()

    releaseMock = mockRepository(Release.getRepository as jest.Mock)
    releaseMock.findOne.mockResolvedValue('release')

    issueMock = mockRepository(Issue.getRepository as jest.Mock)
    issueMock.find.mockResolvedValue('issues')
  })

  it('should get release', async () => {
    await getBoard(req, res)
    expect(releaseMock.findOne).toHaveBeenCalledWith({
      where: { repo: 'repo', dueDate: MoreThan('2020-01-01T00:00:00.000Z') },
      order: { dueDate: 'ASC' },
    })
  })

  it('should get issues', async () => {
    await getBoard(req, res)
    expect(issueMock.find).toHaveBeenCalledWith({
      where: { repo: 'repo', release: 'release' },
      order: { priority: 'ASC' },
    })
  })

  it('should render board with release and issue', async () => {
    await getBoard(req, res)
    expect(res.render).toHaveBeenCalledWith('Board/Board', { release: 'release', issues: 'issues' })
  })
})
