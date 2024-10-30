# Environment Variables Documentation

## Overview

This document provides details about the environment variables used in this project. These variables are essential for configuring the application's runtime environment, managing database connections, and handling authentication and other sensitive data.

## Environment Variables

### General Variables

- `NODE_ENV`

  - Description: Specifies the environment in which the application is running (`development`, `production`, etc.).
  - Example: `NODE_ENV=development`

- `port`
  - Description: Defines the port number on which the application server listens.
  - Example: `port=5000`

### Database Configuration

- `MONGO_URI`
  - Description: Connection string for MongoDB, used to connect to the database.
  - Example: `MONGO_URI=mongodb+srv://username:password@host/dbname?retryWrites=true&w=majority`
  - **Note:** Replace `username`, `password`, `host`, and `dbname` with your actual MongoDB credentials and database name.

### Authentication and Security

- `JWT_SECRET`
  - Description: Secret key used for signing and verifying JWT tokens for authentication.
  - Example: `JWT_SECRET=someRandomString123`
  - **Security Note:** Use a strong, unpredictable string as the secret key.

### External API Keys

- `ZEROBOUNCE_API_KEY`
  - Description: API key for ZeroBounce, used for email validation services.
  - Example: `ZEROBOUNCE_API_KEY=yourZeroBounceApiKey`

### Application URLs

- `DEV_URL`

  - Description: The base URL of the application in the development environment.
  - Example: `DEV_URL=http://localhost:3000`

- `PROD_URL`
  - Description: The base URL of the application in the production environment.
  - Example: `PROD_URL=https://yourproductionurl.com`

## Managing Environment Variables

- For local development, set these variables in a `.env` file located at the root of the project.
- In production, set these variables in the environment configuration of your deployment platform (e.g., Vercel).
- Never commit the `.env` file or any sensitive credentials to version control. Ensure `.env` is listed in `.gitignore`.

## Updating Environment Variables

- When adding new variables or modifying existing ones, update this document accordingly to keep the team informed.
- Regularly review and rotate sensitive information like `JWT_SECRET` and external API keys for security purposes.
