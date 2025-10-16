import { uploadFolder } from '../fileManager.js';
import { uploadFile } from '../../api/fileManager.js';
import { walk } from '../fs.js';
import { createIgnoreFilter } from '../ignoreRules.js';
import { mockAxiosResponse } from './__utils__/mockAxiosResponse.js';

jest.mock('../fs');
jest.mock('../../api/fileManager');
jest.mock('../ignoreRules');

describe('lib/fileManager', () => {
  describe('uploadFolder()', () => {
    it('uploads files in the folder', async () => {
      const files = [
        'folder/document.pdf',
        'folder/images/image.png',
        'folder/images/image.jpg',
        'folder/video/video.mp4',
      ];

      const mockedWalk = jest.mocked(walk);
      const mockedUploadFile = jest.mocked(uploadFile);
      const mockedCreateIgnoreFilter = jest.mocked(createIgnoreFilter);

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
