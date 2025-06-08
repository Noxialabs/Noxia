# 999Plus

A full-stack application built with Next.js frontend and Node.js backend.

## 🚀 Tech Stack

**Frontend:**
- Next.js
- React
- TypeScript

**Backend:**
- Node.js
- Express.js
- TypeScript

## 📁 Project Structure

```
project-root/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js backend application
└── README.md
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/usmanasghar/999plus
cd 999plus
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit the .env file with your configuration
# Add your database URL, API keys, etc.
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit the .env file with your configuration
# Add API URLs, keys, etc.
```

## 🚀 Running the Application

### Development Mode

You need to run both frontend and backend servers simultaneously.

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser
- **Backend API**: Available at [http://localhost:3001](http://localhost:3001) (or your configured port)

## 🔧 Environment Variables

### Backend (.env)
Create a `.env` file in the `backend` directory based on `.env.example`:

```env
# Database
DATABASE_URL=your_database_url

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret

# Add other backend-specific variables
```

### Frontend (.env)
Create a `.env` file in the `frontend` directory based on `.env.example`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Add other frontend-specific variables
```

## 📜 Available Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run test         # Run tests
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 🚀 Production Deployment

### Backend Deployment
```bash
cd backend
npm install --production
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm install --production
npm run build
npm start
```

## 📝 API Documentation

The backend API provides the following endpoints:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/users` - Get users
- Add your specific endpoints here

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Workflow

1. **Start both servers** in development mode
2. **Frontend** automatically proxies API requests to backend
3. **Hot reload** is enabled for both frontend and backend
4. **Make changes** and see them reflected immediately

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using the port
npx kill-port 3000  # for frontend
npx kill-port 3001  # for backend
```

**Dependencies issues:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Environment variables not loading:**
- Ensure `.env` files are in the correct directories
- Restart the development servers after changing `.env` files
- Check that variable names match between `.env.example` and `.env`

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy coding! 🎉**