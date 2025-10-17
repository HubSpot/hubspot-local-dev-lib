import fileStreamResponse from './fixtures/fileStreamResponse.json' with { type: 'json' };
import { createFileMapperNodeFromStreamResponse } from '../fileMapper.js';

describe('api/fileMapper', () => {
  describe('createFileMapperNodeFromStreamResponse()', () => {
    const src = '1234/test.html';
    it('should return request#tranform to create a FileMapperNode from the octet-stream response', () => {
      const node = createFileMapperNodeFromStreamResponse(
        src,
        fileStreamResponse
      );
      expect(node).toEqual({
        source: null,
        path: '/1234/test.html',
        createdAt: 0,
        updatedAt: 1565214001268,
        name: 'test.html',
        folder: false,
        children: [],
      });
    });
  });
});
