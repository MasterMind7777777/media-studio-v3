# Authentication & Security

## Obtaining API Keys

To use Creatomate's API, you need an API key. There are two types:
- **Public Token**: Used for client-side operations (e.g., Preview SDK)
- **Secret API Key**: Used for server-side operations (e.g., REST API)

You can find your API keys in the Creatomate dashboard under Project Settings.

## Storing API Keys

- **Public Token**: Safe to use in frontend code, but do not expose more permissions than necessary.
- **Secret API Key**: Must only be used in backend code or secure serverless functions. Never expose this key in frontend code or public repositories.

### Example: Environment Variables

Create a `.env` file in your project root:

```
VITE_CREATOMATE_TOKEN=your_public_token_here
CREATOMATE_API_KEY=your_secret_api_key_here
```

- Use `VITE_` prefix for variables needed in the frontend (Vite projects).
- Do not commit your `.env` file to version control.

## Security Best Practices

- Never expose your secret API key in frontend code.
- Rotate your API keys regularly.
- Restrict API key permissions in the Creatomate dashboard if possible.
- Use environment variables to manage secrets securely.

## References
- [Creatomate API Authentication Docs](https://creatomate.com/docs/api/authentication)
- [API Introduction](https://creatomate.com/docs/api/introduction) 