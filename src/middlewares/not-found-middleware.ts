import { AppException } from '@libs/exceptions/app-exception';

export const notFoundMiddleware = () => {
  throw AppException.notFound({
    message: 'Page Not Found',
  });
};
