"use client";
import { useParams } from "next/navigation";
import LessonPlayer from "@/components/lesson/LessonPlayer";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  return <LessonPlayer mode="lesson" lessonId={Number(id)} />;
}