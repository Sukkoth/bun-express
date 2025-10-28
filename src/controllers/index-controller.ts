import asyncHandler from '@/utils/async-handler';
import * as indexService from '@/services/index-service';

export const greet = asyncHandler(async (_, res) => {
  res.json({
    success: true,
    data: {
      message: indexService.greetUser(),
    },
  });
});
