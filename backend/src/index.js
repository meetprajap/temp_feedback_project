import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Load early
import connectDB from './db/index.js'; // Import connection
import app from './app.js'; 

// Validate required environment variables for JWT
const requiredEnvVars = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'ACCESS_TOKEN_EXPIRY', 'REFRESH_TOKEN_EXPIRY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('JWT authentication will fail. Please ensure these are set in your .env file');
}

// Connect to database
connectDB()
  .then(() => {
    console.log('DB Connected Successfully!!');
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 4000}`); 
    });
  })
  .catch((error) => {
    console.log('DB connection failed!!', error.message); 
    console.log('Note: Update MongoDB credentials in .env file');
    console.log('Server can still run for testing purposes');
    // Continue running the server anyway for testing
    app.listen(process.env.PORT || 4000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 4000} (without DB)`); 
    });
  });

// Optional: Error event listener
app.on('error', (error) => {
  console.log(error); 
});
