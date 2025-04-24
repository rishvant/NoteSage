"use client"

export default function Footer() {
    return (
      <footer className="border-t py-1 sm:py-0 text-center text-sm text-muted-foreground px-5">
        <div className="container flex flex-col items-center justify-between gap-1 sm:gap-4 md:h-14 md:flex-row">
          <p>
            Built with <span className="font-medium">Next.js</span>,{" "}
            <span className="font-medium">Tailwind CSS</span>, and{" "}
            <span className="font-medium">Supabase</span>.
          </p>
          <p>
            &copy; {new Date().getFullYear()} NoteSage. All rights reserved.
          </p>
        </div>
      </footer>
    );
}