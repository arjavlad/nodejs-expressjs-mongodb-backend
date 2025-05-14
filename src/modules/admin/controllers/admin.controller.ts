import { Response } from 'express';
import { pick } from 'lodash';

import { ApiErrors } from '../../../types/errors';
import { ApiResponseHandler } from '../../../types/apiResponse';
import { ValidatedRequest } from '../../../types/validator';
import { PaginationOrder } from '../../../types/pagination';

import { findWithPagination } from '../../../utils/db';

import { adminValidator, getAdminsValidator } from '../validators/admin.validator';

import { Admin, ADMIN_PUBLIC_FIELDS_SELECT } from '../models/admin.model';

/**
 * Admin controller with admin management methods
 */
export const adminController = {
  createAdmin: async (req: ValidatedRequest<typeof adminValidator>, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw ApiErrors.duplicate(`Admin with email ${email} already exists`);
    }

    const admin = await Admin.create({ email, password, firstName, lastName });
    if (!admin) {
      throw ApiErrors.internalServerError('There was an error creating the admin. Please try again later.');
    }

    const adminResponse = pick(admin, ADMIN_PUBLIC_FIELDS_SELECT.split(' '));

    return ApiResponseHandler.success(res, adminResponse, 'Admin created successfully');
  },

  getAdmins: async (req: ValidatedRequest<typeof getAdminsValidator>, res: Response) => {
    const { page = 1, limit = 10, search, sortBy = 'firstName', order = PaginationOrder.ASC } = req.query;

    const query: Record<string, unknown> = {};
    if (search) {
      query['$text'] = { $search: search };
    }

    const { data, pagination } = await findWithPagination(Admin, query, { page, limit, sortBy, order }, (query) =>
      query.select(ADMIN_PUBLIC_FIELDS_SELECT),
    );

    return ApiResponseHandler.paginatedSuccess(res, data, pagination, 'Admins fetched successfully');
  },
};
