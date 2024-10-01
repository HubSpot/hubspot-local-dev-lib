import chokidar from 'chokidar';
import PQueue from 'p-queue';

import { uploadFolder } from '../cms/uploadFolder';
import { watch } from '../cms/watch';
import { MODE } from '../../constants/files';

jest.mock('chokidar');
jest.mock('axios');
jest.mock('p-queue');
jest.mock('../cms/uploadFolder');

describe('lib/cms/watch', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chokidarMock: any;
  let pQueueAddMock: jest.Mock;

  beforeEach(() => {
    chokidarMock = {
      watch: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    };
    (chokidar.watch as jest.Mock).mockReturnValue(chokidarMock);

    pQueueAddMock = jest.fn();

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
      mode: MODE.draft,
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
      mode: MODE.draft,
      remove: false,
      disableInitial: false,
      notify: '',
      commandOptions: {},
      filePaths: [],
    };
    const postInitialUploadCallback = jest.fn();

    (uploadFolder as jest.Mock).mockResolvedValueOnce([]);

    await watch(accountId, src, dest, options, postInitialUploadCallback);

    expect(uploadFolder).toHaveBeenCalledWith(
      accountId,
      src,
      dest,
      {},
      options.commandOptions,
      options.filePaths,
      options.mode
    );
    expect(postInitialUploadCallback).toHaveBeenCalled();
  });

  it('should upload file when file is added', () => {
    const accountId = 123;
    const src = 'src-folder';
    const dest = 'dest-folder';
    const options = {
      mode: MODE.draft,
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
      mode: MODE.draft,
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
      mode: MODE.draft,
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
