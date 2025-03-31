"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";

const AskQuestionCard = () => {
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image
                src="/gitbrainLogo.png"
                alt="gitbrain"
                width={40}
                height={40}
              />
              Ask Gitbrain!
            </DialogTitle>
          </DialogHeader>
          <p>Your question: {question}</p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              onChange={(e) => setQuestion(e.target.value)}
              value={question}
            />
            <div className="h-4"></div>
            <Button type="submit">Ask Gitbrain!</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
