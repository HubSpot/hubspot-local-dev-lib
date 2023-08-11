import http from '../http';
const BLOGS_API_PATH = 'blogs/v3';

export async function fetchBlogs(accountId, query = {}) {
  return http.get(accountId, {
    url: `${BLOGS_API_PATH}/blogs`,
    query,
  });
}
