import chokidar from 'chokidar';
import PQueue from 'p-queue';

import { uploadFolder } from '../cms/uploadFolder.js';
import { watch } from '../cms/watch.js';
import { CMS_PUBLISH_MODE } from '../../constants/files.js';
import { vi, MockInstance } from 'vitest';

vi.mock('chokidar');
vi.mock('axios');
vi.mock('p-queue');
vi.mock('../cms/uploadFolder');

describe('lib/cms/watch', () => {
  let chokidarMock: { watch: MockInstance; on: MockInstance };
  let pQueueAddMock: MockInstance;

  beforeEach(() => {
    chokidarMock = {
      watch: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    };
    vi.mocked(chokidar.watch).mockReturnValue(chokidarMock);

    pQueueAddMock = vi.fn();

    // @ts-expect-error test case
    PQueue.mockImplementation(() => ({
      add: pQueueAddMock,
      size: 0,
    }));
  });

  it('should call chokidar.watch with correct arguments', () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      cmsPublishMode: CMS_PUBLISH_MODE.draft,
      remove: false,
      disableInitial: true,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };

    watch(accountId, src, dest, options);

    expect(chokidar.watch).toHaveBeenCalledWith(src, {
      ignoreInitial: true,
      ignored: expect.any(Function),
    });
  });

  it('should trigger folder upload on initialization', async () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      cmsPublishMode: CMS_PUBLISH_MODE.draft,
      remove: false,
      disableInitial: false,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };
    const postInitialUploadCallback = vi.fn();

    vi.mocked(uploadFolder).mockResolvedValueOnce([]);

    await watch(accountId, src, dest, options, postInitialUploadCallback);

    expect(uploadFolder).toHaveBeenCalledWith(
      accountId,
      src,
      dest,
      {},
      options.commandOptions,
      options.filePaths,
      options.cmsPublishMode
    );
    expect(postInitialUploadCallback).toHaveBeenCalled();
  });

  it('should upload file when file is added', () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      cmsPublishMode: CMS_PUBLISH_MODE.draft,
      remove: false,
      disableInitial: true,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };

    watch(accountId, src, dest, options);

    expect(chokidarMock.on).toHaveBeenCalledWith('add', expect.any(Function));
  });

  it('should handle file change event and upload file', () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      cmsPublishMode: CMS_PUBLISH_MODE.draft,
      remove: false,
      disableInitial: true,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };

    watch(accountId, src, dest, options);

    expect(chokidarMock.on).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should handle file delete event', () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      cmsPublishMode: CMS_PUBLISH_MODE.draft,
      remove: true,
      disableInitial: true,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };

    watch(accountId, src, dest, options);

    expect(chokidarMock.on).toHaveBeenCalledWith(
      'unlink',
      expect.any(Function)
    );
  });
});
