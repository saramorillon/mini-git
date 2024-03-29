import exec from 'async-exec'
import fs from 'fs'
import { join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import { GitService } from '../../../src/libs/git'
import { getIcon } from '../../../src/libs/icons'
import { repositoryService } from '../../../src/libs/repositories'
import { parseDiff } from '../../../src/utils/parseDiff'
import { mockCommit, mockFile, mockRepo } from '../../mocks'

vi.mock('../../../src/libs/git')
vi.mock('../../../src/libs/icons')
vi.mock('../../../src/utils/parseDiff')
vi.mock('async-exec')

describe('getRepositories', () => {
  it('should list repositories', async () => {
    vi.spyOn(fs.promises, 'readdir').mockResolvedValue([])
    await repositoryService.getRepositories()
    expect(fs.promises.readdir).toHaveBeenCalledWith('repos')
  })

  it('should return repositories sorted by updated date', async () => {
    vi.spyOn(fs.promises, 'readdir').mockResolvedValue(['repo1', 'repo2', 'repo3'] as never)
    vi.spyOn(repositoryService, 'getRepository')
      .mockResolvedValueOnce(mockRepo())
      .mockResolvedValueOnce(mockRepo({ updatedAt: '2020-01-01T00:00:00.000Z' }))
      .mockResolvedValueOnce(null)
    const result = await repositoryService.getRepositories()
    expect(result).toEqual([mockRepo({ updatedAt: '2020-01-01T00:00:00.000Z' }), mockRepo()])
  })
})

describe('getRepository', () => {
  it('should get directory stats', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: vi.fn().mockReturnValue(false) } as never)
    await repositoryService.getRepository('repo')
    expect(fs.promises.stat).toHaveBeenCalledWith(join('repos', 'repo'))
  })

  it('should return null if path is not a directory', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: vi.fn().mockReturnValue(false) } as never)
    const result = await repositoryService.getRepository('repo')
    expect(result).toBeNull()
  })

  it('should rev parse directory', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({
      isDirectory: vi.fn().mockReturnValue(true),
      mtime: new Date(),
    } as never)
    await repositoryService.getRepository('repo')
    expect(GitService.revParse).toHaveBeenCalledWith(join('repos', 'repo'))
  })

  it('should return repo name and last update time', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({
      isDirectory: vi.fn().mockReturnValue(true),
      mtime: new Date('2021-01-01T00:00:00.000Z'),
    } as never)
    const result = await repositoryService.getRepository('repo')
    expect(result).toEqual({ name: 'repo', updatedAt: '2021-01-01T00:00:00.000Z' })
  })

  it('should return null if directory is not a git repo', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: vi.fn().mockReturnValue(true) } as never)
    vi.mocked(GitService.revParse).mockRejectedValue(new Error('fatal: not a git repository'))
    const result = await repositoryService.getRepository('repo')
    expect(result).toBeNull()
  })

  it('should throw if rev parse fails', async () => {
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ isDirectory: vi.fn().mockReturnValue(true) } as never)
    vi.mocked(GitService.revParse).mockRejectedValue(new Error())
    await expect(repositoryService.getRepository('repo')).rejects.toThrow(new Error())
  })
})

describe('getFileType', () => {
  it('should return FOLDER if path is "."', async () => {
    const result = await repositoryService.getFileType('repo', '.', 'branch')
    expect(result).toBe('folder')
  })

  it('should list file information if path is not "."', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('')
    await repositoryService.getFileType('repo', 'path', 'branch')
    expect(GitService.catFile).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', '-t')
  })

  it('should return FILE if path is a blob', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('blob')
    const result = await repositoryService.getFileType('repo', 'path', 'branch')
    expect(result).toBe('file')
  })

  it('should return FOLDER if path is not a blob', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('not-a-blob')
    const result = await repositoryService.getFileType('repo', 'path', 'branch')
    expect(result).toBe('folder')
  })
})

describe('getFiles', () => {
  it('shoud list file names', async () => {
    vi.mocked(GitService.lsTree).mockResolvedValue('')
    await repositoryService.getFiles('repo', 'path', 'branch')
    expect(GitService.lsTree).toHaveBeenCalledWith(join('repos', 'repo'), 'path/', 'branch', '--name-only')
  })

  it('shoud get file information', async () => {
    vi.mocked(GitService.lsTree).mockResolvedValue('path/file.ext')
    vi.spyOn(repositoryService, 'getFile').mockResolvedValue(mockFile())
    await repositoryService.getFiles('repo', 'path', 'branch')
    expect(repositoryService.getFile).toHaveBeenCalledWith('repo', 'path/file.ext', 'branch')
  })

  it('shoud return files sorted by type and name', async () => {
    vi.mocked(GitService.lsTree).mockResolvedValue('path/file.ext\npath/file.ext\npath/file.ext')
    vi.spyOn(repositoryService, 'getFile')
      .mockResolvedValueOnce(mockFile({ name: 'name2', type: 'file' }))
      .mockResolvedValueOnce(mockFile())
      .mockResolvedValueOnce(mockFile({ name: 'name3', type: 'folder' }))
    const result = await repositoryService.getFiles('repo', 'path', 'branch')
    expect(result).toEqual([
      mockFile({ name: 'name3', type: 'folder' }),
      mockFile(),
      mockFile({ name: 'name2', type: 'file' }),
    ])
  })
})

describe('getFile', () => {
  it('should get file type', async () => {
    vi.spyOn(repositoryService, 'getFileType').mockResolvedValue('file')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([])
    await repositoryService.getFile('repo', 'path', 'branch')
    expect(repositoryService.getFileType).toHaveBeenCalledWith('repo', 'path', 'branch')
  })

  it('should get file icon', async () => {
    vi.spyOn(repositoryService, 'getFileType').mockResolvedValue('file')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([])
    await repositoryService.getFile('repo', 'path/name.ext', 'branch')
    expect(getIcon).toHaveBeenCalledWith('file', 'name.ext')
  })

  it('should get last commit', async () => {
    vi.spyOn(repositoryService, 'getFileType').mockResolvedValue('file')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([])
    await repositoryService.getFile('repo', 'path', 'branch')
    expect(repositoryService.getCommits).toHaveBeenCalledWith('repo', 'path', 'branch', 1, 1)
  })

  it('should return type, icon, name, path and last commit', async () => {
    vi.spyOn(repositoryService, 'getFileType').mockResolvedValue('file')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([mockCommit()])
    vi.mocked(getIcon).mockReturnValue('icon')
    const result = await repositoryService.getFile('repo', 'path/name.ext', 'branch')
    expect(result).toEqual({
      type: 'file',
      icon: 'icon',
      name: 'name.ext',
      path: 'path/name.ext',
      lastCommit: mockCommit(),
    })
  })
})

describe('getBranches', () => {
  it('should get branches', async () => {
    vi.mocked(GitService.branch).mockResolvedValue('')
    await repositoryService.getBranches('repo')
    expect(GitService.branch).toHaveBeenCalledWith(join('repos', 'repo'))
  })

  it('should get branch last commit', async () => {
    vi.mocked(GitService.branch).mockResolvedValue('branch1')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([])
    await repositoryService.getBranches('repo')
    expect(repositoryService.getCommits).toHaveBeenCalledWith('repo', '.', 'branch1', 1, 1)
  })

  it('should return branches with last commit without *', async () => {
    vi.mocked(GitService.branch).mockResolvedValue('  branch1\n* branch2')
    vi.spyOn(repositoryService, 'getCommits').mockResolvedValue([mockCommit()])
    const result = await repositoryService.getBranches('repo')
    expect(result).toEqual([
      { name: 'branch1', lastCommit: mockCommit() },
      { name: 'branch2', lastCommit: mockCommit() },
    ])
  })
})

describe('deleteBranch', () => {
  it('should get branches', async () => {
    vi.mocked(GitService.branch).mockResolvedValue('')
    await repositoryService.deleteBranch('repo', 'branch')
    expect(GitService.branch).toHaveBeenCalledWith(join('repos', 'repo'), '-D branch')
  })
})

describe('getContent', () => {
  it('should cat file', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('')
    await repositoryService.getContent('repo', 'path', 'branch')
    expect(GitService.catFile).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', 'blob')
  })

  it('should return file content', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('file content')
    const result = await repositoryService.getContent('repo', 'path', 'branch')
    expect(result).toEqual('file content')
  })
})

describe('getSize', () => {
  it('should cat file', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('')
    await repositoryService.getSize('repo', 'path', 'branch')
    expect(GitService.catFile).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', '-s')
  })

  it('should return file size', async () => {
    vi.mocked(GitService.catFile).mockResolvedValue('123')
    const result = await repositoryService.getSize('repo', 'path', 'branch')
    expect(result).toEqual(123)
  })
})

describe('getCommits', () => {
  it('should log using page and limit', async () => {
    vi.mocked(GitService.log).mockResolvedValue('')
    await repositoryService.getCommits('repo', 'path', 'branch', 5, 15)
    expect(GitService.log).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', '-15 --skip=60')
  })

  it('should return commmits hash, author, date, message and parent', async () => {
    vi.mocked(GitService.log).mockResolvedValue(
      'hash1::author1::123::message1::parent1\nhash2::author2::456::message2::parent2'
    )
    const result = await repositoryService.getCommits('repo', 'path', 'branch', 5, 15)
    expect(result).toEqual([
      { hash: 'hash1', author: 'author1', date: '1970-01-01T00:02:03.000Z', message: 'message1', parent: 'parent1' },
      { hash: 'hash2', author: 'author2', date: '1970-01-01T00:07:36.000Z', message: 'message2', parent: 'parent2' },
    ])
  })
})

describe('countCommits', () => {
  it('should count commits', async () => {
    vi.mocked(GitService.revList).mockResolvedValue('')
    await repositoryService.countCommits('repo', 'path', 'branch')
    expect(GitService.revList).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch')
  })

  it('should return commits count', async () => {
    vi.mocked(GitService.revList).mockResolvedValue('123')
    const result = await repositoryService.countCommits('repo', 'path', 'branch')
    expect(result).toEqual(123)
  })
})

describe('getCommitDiff', () => {
  it('should get diff', async () => {
    vi.mocked(GitService.diffTree).mockResolvedValue('')
    await repositoryService.getCommitDiff('repo', 'path', 'branch')
    expect(GitService.diffTree).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', undefined)
  })

  it('should get diff with parent', async () => {
    vi.mocked(GitService.diffTree).mockResolvedValue('')
    await repositoryService.getCommitDiff('repo', 'path', 'branch', 'parent')
    expect(GitService.diffTree).toHaveBeenCalledWith(join('repos', 'repo'), 'path', 'branch', 'parent')
  })

  it('should return commit diff', async () => {
    vi.mocked(parseDiff).mockReturnValue('diff' as never)
    const result = await repositoryService.getCommitDiff('repo', 'path', 'branch')
    expect(result).toEqual('diff')
  })
})

describe('createRepository', () => {
  it('should create folder', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`mkdir -p ${join('repos', 'repo')}`)
  })

  it('should init git repository', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`cd ${join('repos', 'repo')}; git init --bare`)
  })

  it('should mark repository for export', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`cd ${join('repos', 'repo')}; touch git-daemon-export-ok`)
  })

  it('should copy post update hook', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`cd ${join('repos', 'repo')}; cp hooks/post-update.sample hooks/post-update`)
  })

  it('should configure http.receivepack', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`cd ${join('repos', 'repo')}; git config http.receivepack true`)
  })

  it('should update server info', async () => {
    vi.mocked(exec).mockResolvedValue('')
    await repositoryService.createRepository('repo')
    expect(exec).toHaveBeenCalledWith(`cd ${join('repos', 'repo')}; git update-server-info`)
  })
})
