import { HttpOptions, QueryParams } from '../types/Http';

export function addQueryParams(
  configOptions: HttpOptions,
  queryParams: QueryParams = {}
): HttpOptions {
  const { params } = configOptions;
  return {
    ...configOptions,
    params: {
      ...queryParams,
      ...params,
    },
  };
}
