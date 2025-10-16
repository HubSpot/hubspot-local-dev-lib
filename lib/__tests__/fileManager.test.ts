import { uploadFolder } from '../fileManager.js';
import { uploadFile } from '../../api/fileManager.js';
import { walk } from '../fs.js';
import { createIgnoreFilter } from '../ignoreRules.js';
import { mockAxiosResponse } from './__utils__/mockAxiosResponse.js';
import { vi } from 'vitest';

vi.mock('../fs');
vi.mock('../../api/fileManager');
vi.mock('../ignoreRules');

describe('lib/fileManager', () => {
  describe('uploadFolder()', () => {
    it('uploads files in the folder', async () => {
      const files = [
        'folder/document.pdf',
        'folder/images/image.png',
        'folder/images/image.jpg',
        'folder/video/video.mp4',
      ];

      const mockedWalk = vi.mocked(walk);
      const mockedUploadFile = vi.mocked(uploadFile);
      const mockedCreateIgnoreFilter = vi.mocked(createIgnoreFilter);

      mockedWalk.mockResolvedValue(files);
      mockedUploadFile.mockImplementation(() =>
        Promise.resolve(mockAxiosResponse({ objects: [] }))
      );
      mockedCreateIgnoreFilter.mockImplementation(() => () => true);

      const accountId = 123;
      const src = 'folder';
      const dest = 'folder';

      await uploadFolder(accountId, src, dest);

      expect(uploadFile).toReturnTimes(4);

      files.forEach((file, index) => {
        expect(uploadFile).nthCalledWith(index + 1, accountId, file, file);
      });
    });
  });
});
