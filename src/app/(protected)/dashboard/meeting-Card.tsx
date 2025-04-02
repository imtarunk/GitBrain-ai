"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "~/lib/firebase";
import { Presentation, Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

const MeetingCard = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
          setIsComplete(false);
        }, 2000);
      }, 500);
    }
  }, [progress]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv"],
    },
    multiple: false,
    maxFiles: 50_000,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles) => {
      try {
        setIsUploading(true);
        console.log(acceptedFiles);
        const file = acceptedFiles[0];
        await uploadFile(file as File, setProgress);
      } catch (error) {
        console.error("Upload failed:", error);
        // Reset upload state on error
        setIsUploading(false);
        setProgress(0);
        // You might want to show an error message to the user here
      }
    },
  });

  return (
    <Card
      className={`fle col-span-2 flex-col items-center justify-center p-6 transition-all duration-300 ${isDragActive ? "border-2 border-blue-400 bg-blue-50" : ""} ${!isUploading ? "cursor-pointer hover:border-blue-200 hover:shadow-md" : ""} `}
      {...getRootProps()}
    >
      {!isUploading && (
        <div className="flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:transform">
          <Presentation className="mb-2 h-12 w-12 text-blue-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Create a new meeting
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            Analyze your meeting and get insights with GitBrain.
            <br />
            Powered by Google Gemini.
          </p>
          <Button
            disabled={isUploading}
            className="bg-blue-600 transition-colors hover:bg-blue-700"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Meeting
            <input {...getInputProps()} className="hidden" />
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="flex w-full flex-col items-center justify-center px-4">
          {isComplete ? (
            <div className="animate-fadeIn flex flex-col items-center">
              <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold text-green-600">
                Upload Complete!
              </h3>
            </div>
          ) : (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Uploading your meeting...
              </h3>
              <div className="mb-2 w-full">
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-sm text-gray-500">{progress}% complete</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
