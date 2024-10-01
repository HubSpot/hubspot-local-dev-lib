import chokidar from 'chokidar';
import PQueue from 'p-queue';

import { uploadFolder } from '../cms/uploadFolder';
import { logger } from '../logger';
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
    logger.log = jest.fn();
    logger.debug = jest.fn();
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

  it('should log ready when watcher is ready', () => {
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

    expect(chokidarMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
    chokidarMock.on.mock.calls[0][1]();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('ready'));
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
    const addCallback = chokidarMock.on.mock.calls[1][1];
    const filePath = '/some-file-path.html';

    addCallback(filePath);

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to upload')
    );
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
    const changeCallback = chokidarMock.on.mock.calls[2][1];
    const filePath = 'changed-file-path.html';

    changeCallback(filePath);

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to upload')
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
    const deleteCallback = chokidarMock.on.mock.calls[2][1];
    const filePath = 'deleted-file-path.html';

    deleteCallback(filePath);

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Attempting to delete')
    );
  });
});
