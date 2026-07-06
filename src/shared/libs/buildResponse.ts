import { setHeapSnapshotNearHeapLimit } from 'node:v8';

export function buildResponse<T>(data: T, message: string, status: boolean) {
  return {
    data,
    message,
    status,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  message: string,
  status: boolean,
  meta: { skip: number; limit: number; total: number },
) {
  const { skip, limit, total } = meta;
  const totalPages = Math.ceil(total / limit);
  const page = Math.floor(skip / limit) + 1;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return {
    data,
    message,
    status,
    meta: {
      total,
      totalPages,
      page,
      limit,
      hasPreviousPage,
      hasNextPage,
    },
  };
}
