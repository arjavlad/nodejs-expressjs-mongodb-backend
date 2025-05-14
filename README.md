# The Group Backend API

A robust Node.js TypeScript backend API service for The Group application

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** for API endpoints
- **Mongoose** for MongoDB data modeling
- **Winston** for logging
- **Zod** for validation
- **JWT** for authentication
- **Firebase** for notifications and chat
- **Multer** for file upload
- **AWS S3** for file storage
- **Jest** for testing
- **ESLint** for code linting
- **PM2** for process management

## Project Structure

```bash
├── src
│   ├── config                    # Configuration files
│   │   ├── express.ts            # Express configuration
│   │   ├── logger.ts             # Winston logger configuration
│   │   ├── mongoose.ts           # MongoDB connection
│   │   └── vars.ts               # Environment variables
│   ├── middlewares               # Express middlewares
│   ├── modules                   # Domain-based modules
│   │   ├── admin                 # Admin module
│   │   ├── auditLog              # Audit logging module
│   │   ├── dinner                # Dinner management module
│   │   └── user                  # User module
│   ├── services                  # Shared services
│   ├── types                     # Type definitions
│   ├── utils                     # Utility functions
│   ├── route.ts                  # API route configuration
│   └── index.ts                  # Entry point
├── test
│   ├── integration               # Integration tests
│   └── unit                      # Unit tests
├── dist                          # Compiled JavaScript code
├── logs                          # Application logs
├── uploads                       # File upload directory
├── ecosystem.config.js           # PM2 configuration
├── jest.config.js                # Jest testing configuration
├── tsconfig.json                 # TypeScript configuration
├── .eslintrc.json                # ESLint configuration
├── .env                          # Environment variables
├── .env.example                  # Example environment variables
```

Each module typically follows the same structure:

- `models/` - Contains module models
- `controllers/` - Contains controllers for routes
- `routes/` - Express route configurations
- `validators/` - Zod validation schemas

Each module has a `routes` folder with the following files:

- `index.route.ts` - Export all routes from a single point
- `admin.route.ts` - Admin routes
- `user.route.ts` - User routes

## Getting Started

### Prerequisites

- Node.js v22+
- MongoDB
- npm

### Installation

#### Clone the repository

```bash
git clone <repository-url>
cd the-group-backend
```

#### Install dependencies

```bash
npm install
```

#### Create a `.env` file in the root directory

```bash
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/the-group-db

# JWT
JWT_SECRET=your-secret-key
# JWT expiration in days
JWT_EXPIRATION=60

# Default Auth Token (for API access control)
DEFAULT_AUTH_TOKEN=your-default-auth-token

# URL
FRONTEND_URL=http://localhost:3000
MEDIA_URL=http://localhost:3000/media

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Firebase (Service Account Keys)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your-client-cert-url

# Logging
LOG_LEVEL=info
```

#### Create an `uploads` directory

```bash
mkdir uploads
```

### API Authentication

The API requires two levels of authentication:

1. **Default Authentication (Required for all endpoints)**

   - Every API request must include the `x-default-auth` header
   - This header should contain the value specified in your `DEFAULT_AUTH_TOKEN` environment variable
   - This provides a basic level of API access control and can be used to invalidate all requests by changing a single token

2. **JWT Authentication (Required for protected endpoints)**
   - Protected endpoints require a valid JWT token in the `Authorization` header
   - The token should be in the format: `Bearer <your-jwt-token>`
   - JWT tokens are obtained through the authentication endpoints

## Payment Setup

### Stripe Integration

This project uses Stripe for handling payments. To set up Stripe, you need to configure the following environment variables:

- `STRIPE_SECRET_KEY`: Your Stripe secret key for server-side operations.
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key for client-side operations.
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret for handling webhook events.

### Payment Flow

1. **Create Payment Intent**: The server creates a payment intent using the Stripe API.
2. **Client-Side Payment**: The client uses the payment intent to complete the payment.
3. **Webhook Handling**: The server handles webhook events from Stripe to process successful or failed payments.

For more information, refer to the [Stripe documentation](https://stripe.com/docs).

### Running the Application

#### Development

```bash
npm run dev
```

#### Production

```bash
npm run prod
```

To stop the production server:

```bash
npm run prod:stop
```

### Building the Application

```bash
npm run build
```

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run integration tests:

```bash
npm run test:integration
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

### Cleaning

Remove the `dist` directory:

```bash
npm run clean
```

### Adding a new module

```bash
npm run init:module
```

Enter the module name when prompted.

This will create the following files:

- `models/<module-name>.model.ts`
- `controllers/admin.controller.ts`
- `controllers/user.controller.ts`
- `routes/admin.route.ts`
- `routes/user.route.ts`
- `validators/<module-name>.validator.ts`

## License

This project is proprietary and confidential.
