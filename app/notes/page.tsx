"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Note } from "@/lib/utils";
import { Pencil, Trash2, Sparkles, Eye } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Groq from "groq-sdk";
import Navbar from "@/components/Navbar";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentSummary, setCurrentSummary] = useState("");
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [summaryNote, setSummaryNote] = useState<Note | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
    dangerouslyAllowBrowser: true,
  });

  // Fetch user session to get the logged-in user's ID
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setUserId(session.user?.id || null); // Set the user ID from the session
      }
    };

    checkUser();
  }, [router, supabase.auth]);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("userId", user.id)
          .single();

        if (error) throw error;
        setName(data?.name || "");
      } catch (error) {
        console.error("Error fetching name:", error);
      }
    };

    fetchName();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User fetch error:", userError?.message || "No user");
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("id, title, content, createdAt, updatedAt, userId")
        .eq("userId", user.id);

      if (error) {
        console.error("Error fetching notes:", error.message);
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };

    fetchNotes();
  }, []);

  useEffect(() => {
    if (currentSummary) {
      let index = 0;
      const timer = setInterval(() => {
        setDisplayedSummary(currentSummary.slice(0, index));
        index++;
        if (index > currentSummary.length) {
          clearInterval(timer);
        }
      }, 20); // Adjust speed as needed

      return () => clearInterval(timer);
    }
  }, [currentSummary]);

  const handleSave = async () => {
    if (!title && !content) {
      setIsExpanded(false);
      return;
    }

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User is not authenticated",
      });
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId, // Add userId to associate the note with the user
    };

    if (editingId) {
      // Update the existing note
      await supabase
        .from("notes")
        .update({
          title,
          content,
          updatedAt: new Date(),
        })
        .eq("id", editingId)
        .eq("userId", userId); // Ensure the user_id is still the same

      setNotes(
        notes.map((note) =>
          note.id === editingId
            ? { ...note, title, content, updatedAt: new Date() }
            : note
        )
      );
      setEditingId(null);
    } else {
      // Insert a new note
      const response = await supabase.from("notes").insert([newNote]);
      console.log(response);

      setNotes([newNote, ...notes]);
    }

    setTitle("");
    setContent("");
    setIsExpanded(false);
    toast({
      title: "Success",
      description: editingId ? "Note updated" : "Note created",
    });
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsExpanded(true);
  };

  const handleDelete = async (id: string) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User is not authenticated",
      });
      return;
    }

    await supabase.from("notes").delete().eq("id", id).eq("userId", userId); // Ensure the user can only delete their own notes

    setNotes(notes.filter((note) => note.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setTitle("");
      setContent("");
      setIsExpanded(false);
    }
    toast({
      title: "Success",
      description: "Note deleted",
    });
  };

  async function handleSummarize(note: Note) {
    if (!note.content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Note content is empty",
      });
      return;
    }

    try {
      setSummarizing(note.id);
      setSummaryNote(note);
      setShowSummaryModal(true);
      setCurrentSummary("");
      setDisplayedSummary("");

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that creates concise summaries of text. Keep summaries brief and focused on key points.",
          },
          {
            role: "user",
            content: `Please summarize the following note in a concise way:\n\n${note.content}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 150,
      });

      const summary = completion.choices[0]?.message?.content;

      if (!summary) {
        throw new Error("No summary generated");
      }

      setCurrentSummary(summary);
      setNotes(notes.map((n) => (n.id === note.id ? { ...n, summary } : n)));
    } catch (error: any) {
      console.error(
        "Summarization error (full):",
        JSON.stringify(error, null, 2)
      );

      toast({
        variant: "destructive",
        title: "API Error",
        description: error?.message || "Failed to summarize note",
      });
      setShowSummaryModal(false);
    } finally {
      setSummarizing(null);
    }
  }

  // Function to open the modal with the selected note
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setSelectedNote(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6 mt-5 px-5 sm:px-0">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6 text-primary">
            {name ? `${name}'s Notes` : "Your Notes"}
          </h1>
          <Card className="group relative bg-card shadow-md dark:shadow-lg rounded-2xl transition-all mb-8">
            <CardContent className="pt-6">
              {!isExpanded ? (
                <div
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background cursor-pointer"
                  onClick={() => setIsExpanded(true)}
                >
                  Take a note...
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring bg-muted text-foreground"
                  />
                  <Textarea
                    placeholder="Take a note..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring bg-muted text-foreground"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsExpanded(false);
                        setTitle("");
                        setContent("");
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="transition-colors duration-200 hover:bg-primary/80"
                    >
                      {editingId ? "Save" : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm mt-6">
              No notes yet. Start by creating one!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className="group relative bg-card shadow-md dark:shadow-lg rounded-2xl transition-all"
                >
                  <CardContent className="p-4">
                    {note.title && (
                      <div className="pr-24">
                        <h3 className="font-medium mb-2 truncate">
                          {note.title}
                        </h3>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap overflow-hidden text-ellipsis max-h-36">
                      {note.content}
                    </p>
                    {note.summary && (
                      <div className="mt-4 rounded-lg bg-secondary p-3">
                        <p className="text-xs font-medium text-secondary-foreground">
                          Summary:
                        </p>
                        <p className="mt-1 text-xs text-secondary-foreground">
                          {note.summary}
                        </p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleNoteClick(note)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />{" "}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSummarize(note)}
                          disabled={summarizing === note.id}
                          className="h-8 w-8"
                        >
                          <Sparkles
                            className={`h-4 w-4 ${
                              summarizing === note.id ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(note)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(note.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>
                        Created: {format(new Date(note.createdAt), "PPP p")}
                      </p>
                      <p>
                        Updated: {format(new Date(note.updatedAt), "PPP p")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal for displaying the full note */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5 sm:px-0">
          <div className="bg-white dark:bg-gray-800 dark:bg-dark-card rounded-lg p-6 max-w-lg w-full overflow-hidden shadow-lg dark:shadow-xl">
            <h2 className="text-2xl max-h-28 overflow-y-auto whitespace-normal break-words font-bold mb-4 text-primary dark:text-primary-dark">
              {selectedNote.title}
            </h2>
            <div className="text-sm mb-4 max-h-96 overflow-y-auto whitespace-normal break-words text-foreground dark:text-foreground-dark">
              {selectedNote.content}
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
              Created: {format(new Date(selectedNote.createdAt), "PPP p")}
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark mb-4">
              Updated: {format(new Date(selectedNote.updatedAt), "PPP p")}
            </p>
            <div className="flex justify-end">
              <Button onClick={handleCloseModal}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && summaryNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full overflow-hidden shadow-lg dark:shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-primary dark:text-primary-dark">
              Summary: {summaryNote.title}
            </h2>
            <div className="text-sm mb-4 min-h-[100px] whitespace-pre-wrap text-foreground dark:text-foreground-dark">
              {summarizing === summaryNote.id ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Generating summary...</span>
                </div>
              ) : (
                <div className="font-mono">{displayedSummary}</div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setShowSummaryModal(false);
                  setCurrentSummary("");
                  setDisplayedSummary("");
                  setSummaryNote(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
