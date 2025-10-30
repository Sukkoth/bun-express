import { SQL } from 'bun';

// Initialize the database connection
// Bun will automatically use DATABASE_URL environment variable
export const db = new SQL();
