"use client";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import useProject from "~/hooks/use-project";
import { askQuestion } from "./action";
import { readStreamableValue } from "ai/rsc";
import { useDebounce } from "~/hooks/use-debounce";
import { useLocalStorage } from "~/hooks/use-local-storage";
import CodeReference from "./code-ref";
import gitbrainLogo from "../../../../public/gitbrainLogo.png";
import { toast } from "sonner";
import { api } from "~/trpc/react";

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

type FileReference = {
  fileName: string;
  sourceCode: string;
  summary: string;
};

type QuestionHistory = {
  question: string;
  answer: string;
  fileReferences: FileReference[];
  timestamp: number;
};

const AskQuestionCard = () => {
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);
  const { project } = useProject();
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [streamSubscription, setStreamSubscription] =
    useState<AbortController | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const questionRef = useRef(question);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [questionHistory, setQuestionHistory] = useLocalStorage<
    QuestionHistory[]
  >("question-history", []);
  const saveAnswers = api.project.saveAnswers.useMutation();

  // Debounce question changes
  const debouncedQuestion = useDebounce(question, 300);

  // Update ref when question changes
  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamSubscription) {
      streamSubscription.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStreamSubscription(null);
    setLoading(false);
    setIsSubmitting(false);
    setRetryCount(0);
  }, [streamSubscription]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Define the submit handler type
  type SubmitHandler = (e: React.FormEvent) => Promise<void>;

  // Define the retry handler type
  type RetryHandler = () => Promise<void>;

  // Create refs for the handlers to break circular dependency
  const submitHandlerRef = useRef<SubmitHandler | null>(null);
  const retryHandlerRef = useRef<RetryHandler | null>(null);

  // Initialize the handlers
  useEffect(() => {
    submitHandlerRef.current = async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent multiple submissions
      if (isSubmitting) {
        return;
      }

      // Validate project ID
      if (!project?.id || typeof project.id !== "string") {
        setError("Invalid project selected");
        return;
      }

      // Validate question
      const trimmedQuestion = questionRef.current.trim();
      if (!trimmedQuestion) {
        setError("Please enter a question");
        return;
      }

      // Sanitize question (basic example)
      if (trimmedQuestion.length > 1000) {
        setError("Question is too long. Please keep it under 1000 characters.");
        return;
      }

      setIsSubmitting(true);
      setLoading(true);
      setOpen(true);
      setError("");
      setAnswer("");

      // Create new abort controller for this request
      const controller = new AbortController();
      setStreamSubscription(controller);

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        controller.abort();
        setError("Request timed out. Please try again.");
        cleanup();
      }, REQUEST_TIMEOUT);

      try {
        const { output, fileReference } = await askQuestion(
          trimmedQuestion,
          project.id,
        );

        if (!output) {
          throw new Error("No response from the AI service");
        }

        setFileReferences(fileReference || []);

        let fullAnswer = "";
        for await (const delta of readStreamableValue(output)) {
          if (delta) {
            fullAnswer += delta;
            setAnswer(fullAnswer);
          }
        }

        // Save to history
        const newHistory: QuestionHistory = {
          question: trimmedQuestion,
          answer: fullAnswer,
          fileReferences: fileReference || [],
          timestamp: Date.now(),
        };
        setQuestionHistory((prev: QuestionHistory[]) =>
          [newHistory, ...prev].slice(0, 10),
        );
      } catch (err) {
        console.error("Question error:", err);
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("Request was cancelled");
          } else if (err.message.includes("network")) {
            setError("Network error. Please check your connection.");
            retryHandlerRef.current?.();
          } else {
            setError(err.message || "Failed to get answer");
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        cleanup();
      }
    };

    retryHandlerRef.current = async () => {
      if (retryCount >= MAX_RETRIES) {
        setError("Maximum retry attempts reached. Please try again later.");
        return;
      }

      setRetryCount((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

      // Create a synthetic form event
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;

      submitHandlerRef.current?.(syntheticEvent);
    };
  }, [isSubmitting, project?.id, cleanup, retryCount]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    submitHandlerRef.current?.(e);
  }, []);

  const handleRetry = useCallback(() => {
    retryHandlerRef.current?.();
  }, []);

  const handleClose = () => {
    cleanup();
    setOpen(false);
    setError("");
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuestion(value);
    setError(""); // Clear error when user starts typing
  };

  // Memoize file references rendering
  const fileReferencesList = useMemo(
    () =>
      fileReferences.length > 0 && (
        <>
          <h2 className="mt-4 text-lg font-semibold">Related Files</h2>
          <div className="space-y-2" role="list" aria-label="Related files">
            {fileReferences.map((file) => (
              <div
                key={file.fileName}
                className="rounded-md border bg-gray-50 p-3"
                role="listitem"
              >
                <h3 className="font-mono text-sm">{file.fileName}</h3>
                {file.summary && (
                  <p className="mt-1 text-sm text-gray-600">{file.summary}</p>
                )}
              </div>
            ))}
          </div>
        </>
      ),
    [fileReferences],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image src={gitbrainLogo} alt="logo" className="h-10 w-10" />
              </DialogTitle>
              <Button
                disabled={saveAnswers.isPending}
                variant="outline"
                onClick={() => {
                  if (!project?.id) {
                    toast.error("No project selected");
                    return;
                  }
                  saveAnswers.mutate(
                    {
                      question,
                      answer,
                      fileReferences: fileReferences,
                      projectId: project.id,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved successfully");
                      },
                      onError: (error) => {
                        console.error("Error saving answer:", error);
                        toast.error("Failed to save answer");
                      },
                    },
                  );
                }}
              >
                {saveAnswers.isPending ? "Saving..." : "Save answer"}
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {answer && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Answer</h3>
                <div className="prose prose-sm max-w-none">
                  <MDEditor.Markdown
                    source={answer}
                    className="!h-full max-h-[40vh] max-w-[70vw] overflow-scroll"
                  />
                </div>
              </div>
            )}
            {fileReferences.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Related Files</h3>
                <CodeReference fileRef={fileReferences} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={handleQuestionChange}
              className="min-h-[120px]"
              disabled={loading || isSubmitting}
              aria-label="Question input"
              aria-describedby={error ? "error-message" : undefined}
              maxLength={1000}
            />

            {error && (
              <div
                id="error-message"
                className="mt-2 text-sm text-red-500"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex items-center gap-2"
                aria-label={loading ? "Processing question" : "Ask Gitbrain"}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </>
                ) : (
                  "Ask Gitbrain!"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
