#!/bin/bash

### Initialise a new module for the backend with basic folder and file structure.

read -p "Enter the name of the module (e.g., post): " moduleName

if [ -z "$moduleName" ]; then
  echo "Module name cannot be empty."
  exit 1
fi

# Convert moduleName to PascalCase (e.g., post -> post)
ModuleName="$(tr '[:lower:]' '[:upper:]' <<< ${moduleName:0:1})${moduleName:1}"
# Convert ModuleName to uppercase (e.g., post -> post)
MODULE_NAME_UPPER=$(echo "$ModuleName" | tr '[:lower:]' '[:upper:]')

# Define paths
MODULE_PATH="src/modules/$moduleName"
MODELS_PATH="$MODULE_PATH/models"
SERVICES_PATH="$MODULE_PATH/services"
CONTROLLERS_PATH="$MODULE_PATH/controllers"
TYPES_PATH="$MODULE_PATH/types"
ROUTES_PATH="$MODULE_PATH/routes"
VALIDATORS_PATH="$MODULE_PATH/validators"

# Create directories
mkdir -p "$MODELS_PATH"
mkdir -p "$SERVICES_PATH"
mkdir -p "$CONTROLLERS_PATH"
mkdir -p "$TYPES_PATH"
mkdir -p "$ROUTES_PATH"
mkdir -p "$VALIDATORS_PATH"

## Add waiting time so folders are created before files are created
sleep 1

echo "Creating models..."
cat <<EOF > "$MODELS_PATH/$moduleName.model.ts"
import { Document, Model, PopulateOptions, Schema, model, Types } from 'mongoose';

import { ADMIN_PUBLIC_FIELDS_SELECT } from '../../admin/models/admin.model';

// Define the interface for the document
export interface ${ModuleName}Document extends Document {
  _id: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define the interface for the model
interface ${ModuleName}Model extends Model<${ModuleName}Document> {
  populateCreatedBy: () => PopulateOptions;
  populateUpdatedBy: () => PopulateOptions;
}

// Define the schema
const ${moduleName}Schema = new Schema<${ModuleName}Document, ${ModuleName}Model>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

// Indexes (Add specific indexes as needed)
${moduleName}Schema.index({ isDeleted: 1, createdAt: -1 });

// Pre/Post hooks (Add hooks as needed)
// ${moduleName}Schema.pre('save', async function (next) {
//   // Your hook logic here
//   next();
// });

// Static methods
${moduleName}Schema.statics = {
  populateCreatedBy: function (): PopulateOptions {
    return {
      path: 'createdBy',
      select: ADMIN_PUBLIC_FIELDS_SELECT,
    };
  },
  populateUpdatedBy: function (): PopulateOptions {
    return {
      path: 'updatedBy',
      select: ADMIN_PUBLIC_FIELDS_SELECT,
    };
  },
};

// Model
export const ${ModuleName} = model<${ModuleName}Document, ${ModuleName}Model>('${ModuleName}', ${moduleName}Schema);

// Define commonly used field selections
const MINI_FIELDS = [
  '_id',
  'createdAt',
  'updatedAt',
] as const;

const DETAIL_FIELDS_ADMIN = [
  ...MINI_FIELDS,
  'createdBy',
  'updatedBy',
  'isDeleted',
  'deletedAt',
  'deletedBy',
] as const;

const DETAIL_FIELDS_USER = [
  ...MINI_FIELDS,
] as const;


export const ${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT = MINI_FIELDS.join(' ');
export const ${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_ADMIN = DETAIL_FIELDS_ADMIN.join(' ');
export const ${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_USER = DETAIL_FIELDS_USER.join(' ');

EOF

echo "Creating services..."
# Initially empty, can be expanded later if common service patterns emerge
touch "$SERVICES_PATH/$moduleName.service.ts"

echo "Creating controllers..."
# Admin Controller
echo "Debug: Creating Admin Controller at $CONTROLLERS_PATH/admin.controller.ts"
cat <<EOF > "$CONTROLLERS_PATH/admin.controller.ts"
import { Request, Response } from 'express';
import { pick } from 'lodash';

import { ApiResponseHandler } from '../../../types/apiResponse';
import { ApiErrors } from '../../../types/errors';
import { ValidatedRequest, InferBodyType, InferParamsType } from '../../../types/validator';
import { findWithPagination } from '../../../utils/db';
import { PaginationOrder } from '../../../types/pagination';

import {
  ${ModuleName},
  ${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT,
  ${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_ADMIN,
} from '../models/${moduleName}.model';
import {
  getAll${ModuleName}sSchema,
  ${moduleName}IdSchema,
  // create${ModuleName}Schema, // Uncomment when validator is created
  // update${ModuleName}Schema, // Uncomment when validator is created
} from '../validators/${moduleName}.validator';

/**
 * Controller for ${moduleName} operations (Admin)
 */
export const ${moduleName}AdminController = {
  /**
   * Get all ${moduleName}s (Admin)
   */
  getAll: async (req: ValidatedRequest<typeof getAll${ModuleName}sSchema>, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = PaginationOrder.DESC } = req.query;
    const query: Record<string, unknown> = { isDeleted: false };

    // Add search criteria if needed - example assumes a 'title' field
    // if (search) {
    //   query['title'] = { $regex: search, $options: 'i' };
    // }

    const paginationParams = { page, limit, sortBy, order };
    const { data, pagination } = await findWithPagination(${ModuleName}, query, paginationParams, (q) =>
      q.select(${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT),
    );

    ApiResponseHandler.paginatedSuccess(res, data, pagination);
  },

  /**
   * Get a single ${moduleName} by ID (Admin)
   */
  getById: async (req: ValidatedRequest<typeof ${moduleName}IdSchema>, res: Response): Promise<void> => {
    const { id } = req.params;
    const ${moduleName}Doc = await ${ModuleName}.findById(id)
      .populate(${ModuleName}.populateCreatedBy())
      .populate(${ModuleName}.populateUpdatedBy())
      // Add other populates if needed
      .select(${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_ADMIN)
      .lean(); // Use lean for performance if no model methods are needed after fetch

    if (!${moduleName}Doc || ${moduleName}Doc.isDeleted) {
      throw ApiErrors.notFound('${ModuleName} not found');
    }

    ApiResponseHandler.success(res, ${moduleName}Doc, '${ModuleName} retrieved successfully');
  },

  /**
   * Create a new ${moduleName} (Admin) - Placeholder
   */
  // create: async (req: ValidatedRequest<typeof create${ModuleName}Schema>, res: Response): Promise<void> => {
  //   const body = req.body;
  //   const userId = req.user._id; // Assuming admin user context is available

  //   const new${ModuleName} = await ${ModuleName}.create({
  //     ...body,
  //     createdBy: userId,
  //     updatedBy: userId,
  //   });

  //   const response = pick(new${ModuleName}, ${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT.split(' '));
  //   ApiResponseHandler.success(res, response, '${ModuleName} created successfully', 201);
  // },

  /**
   * Update an existing ${moduleName} (Admin) - Placeholder
   */
  // update: async (req: ValidatedRequest<typeof update${ModuleName}Schema>, res: Response): Promise<void> => {
  //   const { id } = req.params;
  //   const body = req.body;
  //   const userId = req.user._id; // Assuming admin user context

  //   const ${moduleName}Doc = await ${ModuleName}.findOne({ _id: id, isDeleted: false });

  //   if (!${moduleName}Doc) {
  //     throw ApiErrors.notFound('${ModuleName} not found');
  //   }

  //   // Update fields - example: ${moduleName}Doc.title = body.title ?? ${moduleName}Doc.title;
  //   ${moduleName}Doc.set(body); // Use set for partial updates defined in validator
  //   ${moduleName}Doc.updatedBy = userId;

  //   const updated${ModuleName} = await ${moduleName}Doc.save();

  //   const response = pick(updated${ModuleName}, ${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT.split(' '));
  //   ApiResponseHandler.success(res, response, '${ModuleName} updated successfully');
  // },

  /**
   * Delete a ${moduleName} (Admin) - Soft delete
   */
  delete: async (req: ValidatedRequest<typeof ${moduleName}IdSchema>, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user._id; // Assuming admin user context

    const ${moduleName}Doc = await ${ModuleName}.findOne({ _id: id, isDeleted: false });

    if (!${moduleName}Doc) {
      throw ApiErrors.notFound('${ModuleName} not found');
    }

    ${moduleName}Doc.isDeleted = true;
    ${moduleName}Doc.deletedAt = new Date();
    ${moduleName}Doc.deletedBy = userId;
    await ${moduleName}Doc.save();

    ApiResponseHandler.success(res, true, '${ModuleName} deleted successfully');
  },
};
EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $CONTROLLERS_PATH/admin.controller.ts"
fi

# User Controller
echo "Debug: Creating User Controller at $CONTROLLERS_PATH/user.controller.ts"
cat <<EOF > "$CONTROLLERS_PATH/user.controller.ts"
import { Request, Response } from 'express';

import { ApiResponseHandler } from '../../../types/apiResponse';
import { ApiErrors } from '../../../types/errors';
import { ValidatedRequest, InferParamsType } from '../../../types/validator';
import { findWithPagination } from '../../../utils/db';
import { PaginationOrder } from '../../../types/pagination';

import {
  ${ModuleName},
  ${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT, // Consider creating a USER specific select
  ${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_USER,
} from '../models/${moduleName}.model';
import {
  getAll${ModuleName}sSchema, // Consider user-specific validation/filtering
  ${moduleName}IdSchema,
} from '../validators/${moduleName}.validator';

/**
 * Controller for ${moduleName} operations (User)
 */
export const ${moduleName}UserController = {
  /**
   * Get all ${moduleName}s (User) - Make sure filtering is appropriate for users
   */
  getAll: async (req: ValidatedRequest<typeof getAll${ModuleName}sSchema>, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = PaginationOrder.DESC } = req.query;
    const query: Record<string, unknown> = {
      isDeleted: false,
      // Add user-specific filters, e.g., status: 'active'
    };

    // Add search criteria if needed - example assumes a 'title' field
    // if (search) {
    //   query['title'] = { $regex: search, $options: 'i' };
    // }

    const paginationParams = { page, limit, sortBy, order };
    const { data, pagination } = await findWithPagination(${ModuleName}, query, paginationParams, (q) =>
      q.select(${MODULE_NAME_UPPER}_MINI_FIELDS_SELECT), // Use user-specific select if available
    );

    ApiResponseHandler.paginatedSuccess(res, data, pagination);
  },

  /**
   * Get a single ${moduleName} by ID (User)
   */
  getById: async (req: ValidatedRequest<typeof ${moduleName}IdSchema>, res: Response): Promise<void> => {
    const { id } = req.params;
    const ${moduleName}Doc = await ${ModuleName}.findOne({
        _id: id,
        isDeleted: false,
        // Add user-specific filters, e.g., status: 'active'
      })
      // Add user-specific populates if needed
      .select(${MODULE_NAME_UPPER}_DETAIL_FIELDS_SELECT_USER)
      .lean();

    if (!${moduleName}Doc) {
      throw ApiErrors.notFound('${ModuleName} not found');
    }

    ApiResponseHandler.success(res, ${moduleName}Doc, '${ModuleName} retrieved successfully');
  },
};
EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $CONTROLLERS_PATH/user.controller.ts"
fi

echo "Creating types..."
# Initially empty, often populated with enums or specific type interfaces for the module
touch "$TYPES_PATH/$moduleName.type.ts"
cat <<EOF > "$TYPES_PATH/enum.ts"
// Add module-specific enums here if needed
// export enum ${ModuleName}Status {
//   ACTIVE = 'active',
//   INACTIVE = 'inactive',
// }

// export enum ${ModuleName}SortFields {
//   CREATED_AT = 'createdAt',
//   UPDATED_AT = 'updatedAt',
//   // Add other sortable fields
// }
EOF


echo "Creating routes..."
# Index Route
echo "Debug: Creating Index Route at $ROUTES_PATH/index.route.ts"
cat <<EOF > "$ROUTES_PATH/index.route.ts"
// Export all ${moduleName} routes from a single point
import admin${ModuleName}Routes from './admin.route';
import user${ModuleName}Routes from './user.route';

// Admin routes
export const adminRouter = admin${ModuleName}Routes;

// User routes
export const userRouter = user${ModuleName}Routes;
EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $ROUTES_PATH/index.route.ts"
fi

# Admin Route
echo "Debug: Creating Admin Route at $ROUTES_PATH/admin.route.ts"
cat <<EOF > "$ROUTES_PATH/admin.route.ts"
import { Router } from 'express';

import { authenticateAdmin } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validate.middleware';

import { ${moduleName}AdminController } from '../controllers/admin.controller';
import {
  getAll${ModuleName}sSchema,
  ${moduleName}IdSchema,
  // create${ModuleName}Schema, // Uncomment when validator is created
  // update${ModuleName}Schema, // Uncomment when validator is created
} from '../validators/${moduleName}.validator';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// GET / - Get all ${moduleName}s
router.get('/', validateRequest(getAll${ModuleName}sSchema), ${moduleName}AdminController.getAll);

// GET /:id - Get a single ${moduleName} by ID
router.get('/:id', validateRequest(${moduleName}IdSchema), ${moduleName}AdminController.getById);

// POST / - Create a new ${moduleName} (Placeholder)
// router.post('/', validateRequest(create${ModuleName}Schema), ${moduleName}AdminController.create);

// PUT /:id - Update an existing ${moduleName} (Placeholder)
// router.put('/:id', validateRequest(update${ModuleName}Schema), ${moduleName}AdminController.update);

// DELETE /:id - Delete a ${moduleName}
router.delete('/:id', validateRequest(${moduleName}IdSchema), ${moduleName}AdminController.delete);

export default router;
EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $ROUTES_PATH/admin.route.ts"
fi

# User Route
echo "Debug: Creating User Route at $ROUTES_PATH/user.route.ts"
cat <<EOF > "$ROUTES_PATH/user.route.ts"
import { Router } from 'express';

import { authenticateUser } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validate.middleware';

import { ${moduleName}UserController } from '../controllers/user.controller';
import {
  getAll${ModuleName}sSchema, // Consider user-specific validation
  ${moduleName}IdSchema,
} from '../validators/${moduleName}.validator';

const router = Router();

// All routes require user authentication
router.use(authenticateUser);

// GET / - Get all ${moduleName}s (for users)
router.get('/', validateRequest(getAll${ModuleName}sSchema), ${moduleName}UserController.getAll);

// GET /:id - Get a single ${moduleName} by ID (for users)
router.get('/:id', validateRequest(${moduleName}IdSchema), ${moduleName}UserController.getById);

export default router;
EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $ROUTES_PATH/user.route.ts"
fi

echo "Creating validators..."
# Generic Validator File
echo "Debug: Creating Validator File at $VALIDATORS_PATH/${moduleName}.validator.ts"
cat <<EOF > "$VALIDATORS_PATH/${moduleName}.validator.ts"
import { z } from 'zod';

import {
  createOrderParamsSchema,
  paginationParamsSchema,
  ZodObjectIdSchema,
} from '../../../types/validator';
// Import module-specific enums if created, e.g.:
// import { ${ModuleName}SortFields } from '../types/enum';

// Schema for validating ObjectId in route params
export const ${moduleName}IdSchema = {
  params: z.object({
    id: ZodObjectIdSchema,
  }),
};

// Schema for validating query params for fetching multiple items
export const getAll${ModuleName}sSchema = {
  query: z.object({
    ...paginationParamsSchema, // Includes page, limit
    search: z.string().optional(),
    // Define order parameters based on sortable fields
    // ...createOrderParamsSchema(Object.values(${ModuleName}SortFields)), // Uncomment and adapt when enums exist
    // Add other specific filter fields here if needed
  }),
};

// Placeholder for Create Schema - requires defining body structure
// const create${ModuleName}BodySchema = z.object({
//   title: z.string().min(1, 'Title is required'),
//   // Add other fields for creation
// });
// export const create${ModuleName}Schema = {
//  body: create${ModuleName}BodySchema,
// };


// Placeholder for Update Schema - allows partial updates
// const update${ModuleName}BodySchema = create${ModuleName}BodySchema.partial();
// export const update${ModuleName}Schema = {
//  params: z.object({ id: ZodObjectIdSchema }),
//  body: update${ModuleName}BodySchema,
// };

EOF
if [ $? -ne 0 ]; then
    echo "Error: Failed to create $VALIDATORS_PATH/${moduleName}.validator.ts"
fi

# Rename validator files to match convention (remove admin/user specifics for now)
# These files were created by the previous version, remove them if they exist
rm -f "$VALIDATORS_PATH/admin.validator.ts"
rm -f "$VALIDATORS_PATH/user.validator.ts"

echo ""
echo "Module '$moduleName' initialized successfully."
echo "Remember to:"
echo "1. Define fields in '$MODELS_PATH/$moduleName.model.ts' schema and interface."
echo "2. Update field selections (MINI_FIELDS, etc.) in the model file."
echo "3. Implement Create/Update validation schemas in '$VALIDATORS_PATH/$moduleName.validator.ts'."
echo "4. Implement Create/Update logic in controllers ('$CONTROLLERS_PATH/admin.controller.ts')."
echo "5. Uncomment and adjust Create/Update routes in '$ROUTES_PATH/admin.route.ts'."
echo "6. Define necessary enums or types in '$TYPES_PATH/enum.ts' or '$TYPES_PATH/$moduleName.type.ts'."
echo "7. Register the new module routes in 'src/route.ts'."

