# Quick Start Guide
## Start the Database

1. **Using Docker (Recommended)**:
   ```bash
   docker-compose up -d
   ```
   
   This will start PostgreSQL and Redis. Then update your `.env` file with:
   ```
   DATABASE_URL=postgresql://voyage:voyage@localhost:5432/voyage?schema=public
   ```

2. **Run Migrations**:
   ```bash
   npx prisma migrate dev
   ```

3. **Start the Backend**:
   ```bash
   npm run dev
   ```

If you already have PostgreSQL installed and running locally, update your `.env` file with your own database credentials instead.

