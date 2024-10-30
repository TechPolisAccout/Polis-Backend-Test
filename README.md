# Polis Real Estate Platform - Backend

## Installation

To get the project running locally, follow these steps:

1. Clone the repository:

```bash
  git clone https://github.com/your-username/real-estate-frontend.git

```

2. Navigate into the project directory:

```bash
    cd real-estate-frontend
```

2. Install the dependencies using Yarn:

```bash
    yarn install
```

4. Create a .env.local file in the root directory and add the following environment variables:

```bash
    NODE_ENV=                   # Environment (development or production)
    port=                       # Port number for the server
    MONGO_URI=                  # MongoDB connection string
    JWT_SECRET=                 # Secret key for JWT
    DEV_URL=                    # Development URL for the frontend
    PROD_URL=                   # Production URL for the frontend
    BACKBLAZE_APPLICATION_KEYID= # Backblaze API Key ID
    BACKBLAZE_APPLICATION_KEY=   # Backblaze API Key
    BACKBLAZE_BUCKECTID=         # Backblaze Bucket ID
    POSTMARK_APIKEY=             # Postmark API key for email services
    CLIENT_API_KEY=              # API key for the client
    PAYSTACK_KEY=                # Paystack public key for payments
    GOOGLE_ID=                   # Google OAuth client ID

```

5. Start the development server:

```bash
    yarn dev

    Open http://localhost:5000/graphql to view the app in the browser.

```

## Usage

### Once the backend is running, it will expose a GraphQL API at the /graphql endpoint. You can use this API to perform queries and mutations related to users, properties, and bookings.

#### Sample Queries

# Fetch all properties

```bash
{
properties {
        id
        title
        description
        price
    }
}
```

# Fetch a single property by ID

```bash
{
property(id: "property-id") {
        id
        title
        description
        price
    }
}
```

#### Sample Mutations

# Add a new property

```bash
mutation {
  addProperty(input: {
    title: "New Property"
    description: "Beautiful property in the city"
    price: 500000
  }) {
    id
    title
  }
}
```

# Register a new user

```bash
mutation {
  registerUser(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    token
  }
}

```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
