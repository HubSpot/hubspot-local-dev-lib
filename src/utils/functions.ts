import moment from 'moment';

type RoutesResponse = {
  objects: Array<{
    route: string;
    method: string;
    created: number;
    updated: number;
    secretNames: Array<string>;
  }>;
};

type FunctionArray = [string, string, string, string, string];

export function getFunctionArrays(resp: RoutesResponse): Array<FunctionArray> {
  return resp.objects.map(func => {
    const { route, method, created, updated, secretNames } = func;
    return [
      route,
      method,
      secretNames.join(', '),
      moment(created).format(),
      moment(updated).format(),
    ];
  });
}
