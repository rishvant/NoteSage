# 📝 NoteSage

NoteSage is a modern, minimal note-taking web application built using **Next.js**, **Tailwind CSS**, and **Supabase**. It allows users to create, manage, and organize notes with a focus on performance, simplicity, and scalability.

## 🚀 Features

- ✍️ Create, update, and delete notes
- 📚 Organize notes with a clean, responsive UI
- 🌐 Serverless backend with Supabase
- ⚡️ Fast and lightweight with Tailwind CSS
- 🔒 Secure architecture with removed external AI dependencies
- 🧼 Refactored to simplify authentication logic

## 📁 Project Structure
```plaintext
├── app/                    # Application pages and routes
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and Supabase client
├── supabase/              # Supabase configurations and migrations
├── middleware.ts          # Middleware logic
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
```


## 🧰 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Supabase](https://supabase.io/)
- **Language:** TypeScript

## 📦 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/rishvant/NoteSage.git
   cd NoteSage
   
2. **Install dependencies**
   ```bash
   npm i

3. **Set up Supabase**
   Create a Supabase project at supabase.io
   Copy your Supabase URL and anon/public key into an .env file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Run the app**
   ```bash
   npm run dev
