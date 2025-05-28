A monolithic Node.js backend for the 999Plus crime reporting platform designed to combat systematic corruption.

## 🚀 Features

- **AI-Powered Case Classification** - Automatic categorization using OpenAI
- **Blockchain Integration** - Document hashing and ETH tier system
- **PDF Form Generation** - Automated legal form filling (N240, N1, etc.)
- **User Tier System** - Access control based on ETH wallet balance
- **Document Verification** - QR code generation for document integrity
- **Comprehensive API** - RESTful endpoints for all functionality

## 🛠️ Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Caching:** Redis (optional)
- **AI:** OpenAI GPT-4
- **Blockchain:** Ethers.js
- **Authentication:** JWT
- **File Processing:** PDF-lib, Multer
- **Testing:** Jest
- **Logging:** Winston

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis (optional)
- OpenAI API key
- Ethereum node access (Infura/Alchemy)

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**

   ```bash
   npm run migrate
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Visit:** http://localhost:3000/health

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Cases

- `POST /api/cases` - Submit new case
- `GET /api/cases` - List user cases
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case

### AI Classification

- `POST /api/ai/classify` - Classify case text
- `GET /api/ai/history` - Classification history

### Blockchain

- `POST /api/blockchain/tier` - Check/update user tier
- `POST /api/blockchain/hash` - Hash document
- `GET /api/blockchain/verify/:hash` - Verify document

### Documents

- `POST /api/documents/generate` - Generate legal forms
- `GET /api/documents/:id` - Download document
- `GET /api/documents/:id/qr` - Get QR code

## 🏗️ Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Data models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── config/          # Configuration
├── types/           # TypeScript types
├── database/        # Database setup
└── storage/         # File storage
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.
