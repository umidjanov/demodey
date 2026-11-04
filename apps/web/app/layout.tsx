import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { LanguageProvider } from "@/src/context/LanguageContext";

export const metadata: Metadata = {
  title: "QUIZORA — AI-Powered Learning, Quiz & Gamification SaaS",
  description:
    "Learn, practice, test yourself, compete on live leaderboards, and master your discipline with QUIZORA's AI-powered active recall ecosystem.",
  keywords: ["Quiz", "EdTech", "AI Learning", "Multiplayer Quiz", "Gamification", "IELTS", "Programming", "Math"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F7F9FC] text-[#182536] min-h-screen antialiased">
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
