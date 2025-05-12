
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/959db1ed-a28c-48d7-a39a-7253bfac5b70

## Creatomate setup

This project uses Creatomate for interactive video previews and editing. To set up the integration:

1. **Get your Creatomate API token**:
   - Sign up or login to [Creatomate](https://creatomate.com)
   - Go to Project Settings in your Creatomate dashboard
   - Copy your public token (it's safe to use in the frontend)

2. **Create a template or use an existing one**:
   - Create a new template in the Creatomate dashboard
   - After saving, copy the template ID from the URL or project details

3. **Set up environment variables**:
   - Create a `.env` file in the project root (based on `.env.example`)
   - Add your Creatomate token: `VITE_CREATOMATE_TOKEN=your_token_here`
   - Add your template ID: `VITE_CREATOMATE_TEMPLATE_ID=your_template_id_here`
   - Restart the development server

If configured correctly, the interactive preview will load and allow drag-and-drop editing in the `/create/:id/customize` page.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/959db1ed-a28c-48d7-a39a-7253bfac5b70) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/959db1ed-a28c-48d7-a39a-7253bfac5b70) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
