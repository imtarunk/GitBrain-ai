"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";
import AskQuestionCard from "../dashboard/ask-questionCard";
import React from "react";
import MDEditor from "@uiw/react-md-editor";
import CodeReference from "../dashboard/code-ref";
import { Calendar, Clock, Search } from "lucide-react";

const QAPage = () => {
  const { projectId } = useProject();
  const { data: questions } = api.project.getQuestions.useQuery({
    projectId: projectId!,
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const question = questions?.[questionIndex];

  const filteredQuestions = questions?.filter(
    (q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AskQuestionCard />
      </motion.div>

      <div className="h-6"></div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h1 className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
          Saved Questions
        </h1>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-full border border-gray-300 py-2 pr-4 pl-10 transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </motion.div>

      <div className="h-4"></div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filteredQuestions?.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <SheetTrigger
                  asChild
                  onClick={() => {
                    setQuestionIndex(
                      questions?.findIndex((q) => q.id === question.id) || 0,
                    );
                    setIsSheetOpen(true);
                  }}
                >
                  <motion.div
                    className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-lg border bg-white p-4 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <img
                        src={
                          question.user.imageURl ?? "/placeholder-avatar.png"
                        }
                        alt=""
                        className="rounded-full border-2 border-white object-cover transition-all duration-200 group-hover:border-indigo-300"
                        width={40}
                        height={40}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                        whileHover={{ scale: 1.1 }}
                      />
                    </div>

                    <div className="flex flex-grow flex-col text-left">
                      <div className="flex items-center justify-between">
                        <p className="line-clamp-1 text-lg font-semibold text-gray-800 transition-colors duration-200 group-hover:text-indigo-700">
                          {question.question}
                        </p>

                        <div className="flex items-center gap-1 text-sm whitespace-nowrap text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className="transition-colors duration-200 group-hover:text-indigo-600">
                            {question.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="mt-1 line-clamp-1 text-sm text-gray-500 transition-colors duration-200 group-hover:text-gray-700">
                        {question.answer}
                      </p>
                    </div>
                  </motion.div>
                </SheetTrigger>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredQuestions?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="p-8 text-center text-gray-500"
            >
              No questions found matching your search.
            </motion.div>
          )}
        </div>

        {question && (
          <SheetContent className="overflow-y-auto sm:max-w-[80vw]">
            <SheetHeader>
              <SheetTitle className="mb-2 text-2xl font-bold text-indigo-700">
                {question.question}
              </SheetTitle>

              <div className="mb-4 flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{question.createdAt.toLocaleString()}</span>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div
                  data-color-mode="light"
                  className="transition-all duration-300 hover:shadow-md"
                >
                  <MDEditor.Markdown source={question.answer} />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-700">
                  Referenced Files
                </h3>
                <div className="rounded-lg bg-gray-50 p-2">
                  <CodeReference fileRef={question.fileRef ?? ([] as any)} />
                </div>
              </div>
            </SheetHeader>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
};

export default QAPage;
