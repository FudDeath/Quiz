# MCQ Quiz Application

This is a simple MCQ (Multiple Choice Question) quiz application with a secret key feature, backed by a minimal Node.js server.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

### Local Development

1. Create a `.env` file in the root directory of the project
2. Add the following line to the `.env` file:
   ```
   SECRET_KEY=your_secret_key
   ```
   Replace `your_secret_key` with a strong, randomly generated key.

### Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to the "Environment Variables" section
3. Add a new environment variable:
   - Name: `SECRET_KEY`
   - Value: Your secret key (use a different key than your local development one)

## Running the Application

### Local Development

1. Start the server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:8000`

### Vercel Deployment

1. Push your changes to your connected Git repository
2. Vercel will automatically deploy your application

## Admin Panel Access

The admin panel can be accessed at `/admin`. Use the following credentials:
- Username: admin
- Password: password

Note: For security reasons, change these credentials before deploying to production.

## Security Note

The `.env` file is included in `.gitignore` to prevent sensitive information from being committed to the repository. Make sure not to commit or share your actual secret keys.
