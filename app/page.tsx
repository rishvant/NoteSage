"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, BookText } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import Footer from "@/components/Footer";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-primary">
            <BookText className="h-6 w-6" />
            <span className="text-lg font-bold tracking-wide">NoteSage</span>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button
              variant="default"
              size="sm"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 bg-gradient-to-b from-background via-muted/20 to-background">
        <section className="flex flex-col items-center justify-center px-6 text-center py-16 sm:py-24 lg:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl max-w-5xl leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-muted-foreground">
            Your thoughts, organized and summarized with AI
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl sm:leading-8">
            Take notes effortlessly and let AI help you extract key insights.
            Organize your ideas, collaborate with others, and never miss
            important details.
          </p>
          <div className="mt-8 space-x-4">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setAuthModalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Start Taking Notes
            </Button>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to NoteSage</DialogTitle>
          </DialogHeader>
          <AuthForm onSuccess={() => setAuthModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
