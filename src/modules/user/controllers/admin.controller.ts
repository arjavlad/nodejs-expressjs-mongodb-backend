import { Response } from 'express';

import { ApiErrors } from '../../../types/errors';
import { ApiResponseHandler } from '../../../types/apiResponse';
import { ValidatedRequest } from '../../../types/validator';

import { findWithPagination } from '../../../utils/db';

import { User, MINI_FIELDS_ADMIN_SELECT, USER_DETAILS_ADMIN_SELECT } from '../models/user.model';
import { updatePasswordSchema, getUsersSchema, userIdSchema, blockUserSchema } from '../validators/admin.validator';
import { PaginationParams } from '../../../types/pagination';

export const adminController = {
  getUsers: async (req: ValidatedRequest<typeof getUsersSchema>, res: Response) => {
    const { page, limit, order, sortBy, status, isBlocked } = req.query;

    const query: Record<string, unknown> = {};

    const paginationParams: PaginationParams = { page, limit, order, sortBy };

    if (status) query['status'] = status;
    if (isBlocked) query['isBlocked'] = isBlocked;

    const { data, pagination } = await findWithPagination(User, query, paginationParams, (query) =>
      query.select(MINI_FIELDS_ADMIN_SELECT),
    );

    return ApiResponseHandler.paginatedSuccess(res, data, pagination, 'Users fetched successfully');
  },

  getUserDetails: async (req: ValidatedRequest<typeof userIdSchema>, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select(USER_DETAILS_ADMIN_SELECT).lean();

    return ApiResponseHandler.success(res, user, 'User details fetched successfully');
  },

  updateUserPassword: async (req: ValidatedRequest<typeof updatePasswordSchema>, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw ApiErrors.notFound('User not found');
    }

    user.password = req.body.password; // Password will hashed in pre save hook
    await user.save();

    return ApiResponseHandler.success(res, user, 'User password updated successfully');
  },

  blockUser: async (req: ValidatedRequest<typeof blockUserSchema>, res: Response) => {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true, blockedReason: req.body.blockedReason, blockedAt: new Date(), blockedBy: req.user._id },
      { new: true },
    )
      .select(USER_DETAILS_ADMIN_SELECT)
      .lean();

    return ApiResponseHandler.success(res, user, 'User blocked successfully');
  },

  unblockUser: async (req: ValidatedRequest<typeof userIdSchema>, res: Response) => {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false, blockedReason: null, blockedAt: null, blockedBy: null },
      { new: true },
    )
      .select(USER_DETAILS_ADMIN_SELECT)
      .lean();

    return ApiResponseHandler.success(res, user, 'User unblocked successfully');
  },
};
