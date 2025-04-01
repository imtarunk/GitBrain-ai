"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import MDEditor from "@uiw/react-md-editor";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";

type FileReference = {
  fileName: string;
  sourceCode: string;
  summary: string;
};

type Props = {
  fileRef: FileReference[];
};

const CodeReference = ({ fileRef }: Props) => {
  // Initialize with the first file's name if available, otherwise empty string
  const [tab, setTab] = React.useState(fileRef[0]?.fileName ?? "");

  return (
    <div className="max-w-[75vw]">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex gap-2 overflow-scroll rounded-md bg-gray-200 p-1">
          {fileRef.map((file) => (
            <button
              onClick={() => setTab(file.fileName)}
              key={file.fileName}
              value={file.fileName}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                {
                  "bg-primary text-primary-foreground": tab === file.fileName,
                },
              )}
            >
              {file.fileName}
            </button>
          ))}
        </div>

        {fileRef.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="bg-card max-h-[40vh] max-w-7xl overflow-scroll rounded-md border"
          >
            <SyntaxHighlighter language="typescript" style={lucario}>
              {file.sourceCode}
            </SyntaxHighlighter>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReference;
