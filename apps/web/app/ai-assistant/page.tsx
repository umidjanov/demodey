"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggested_followups?: string[];
}

function AIAssistantContent() {
  const searchParams = useSearchParams();
  const topicContext = searchParams.get("topic");
  const { t, language } = useLanguage();

  const getInitialMessage = (): Message => {
    if (language === "uz") {
      return {
        role: "assistant",
        content: topicContext
          ? `Assalomu alaykum! Men sizning **QUIZORA AI Ta'lim Yordamchingizman**. Siz **${topicContext}** mavzusidagi testni ko'rib chiqyapsiz. Biror murakkab savolni tushunish, qoidalarni tahlil qilish yoki mashq bajarishni xohlaysizmi?`
          : "Assalomu alaykum! Men **QUIZORA AI Ta'limiy Yordamchisi**man 🧠.\n\nMen sizga testlarda yo'l qo'yilgan xatolarni tushuntirish, qoidalar, grammatika yoki matematika masalalarini o'rgatishda yordam beraman. Bugun qaysi mavzuni o'rganamiz?",
        suggested_followups: topicContext
          ? [
              `${topicContext} bo'yicha eng ko'p uchraydigan xatolarni tushuntir`,
              `${topicContext} mavzusida 3 ta qiziqarli savol ber`,
              "Ushbu mavzuni oddiy misollar bilan tushuntir",
            ]
          : [
              "Ona tili: Asosiy imlo qoidalari va unlilar",
              "Matematika: Arifmetika va foiz hisoblash usullari",
              "Amir Temur davlati va saltanat tarixi",
            ],
      };
    } else if (language === "ru") {
      return {
        role: "assistant",
        content: topicContext
          ? `Здравствуйте! Я ваш **QUIZORA AI-Ассистент**. Вы изучаете **${topicContext}**. Хотите разобрать сложные вопросы или потренироваться?`
          : "Здравствуйте! Я **QUIZORA AI Обучающий Ассистент** 🧠.\n\nЯ помогу разобрать допущенные ошибки, объяснить сложные правила и провести тренировку. О чем хотите узнать?",
        suggested_followups: topicContext
          ? [
              `Объясни ключевые концепции темы ${topicContext}`,
              `Дай 3 тренировочных вопроса по теме ${topicContext}`,
              "Объясни эту тему простыми словами",
            ]
          : [
              "Разбери типичные ошибки в тестах",
              "Как устроена система Рейтинговых Монет?",
              "Объясни сложные математические формулы",
            ],
      };
    } else {
      return {
        role: "assistant",
        content: topicContext
          ? `Hello! I'm your **QUIZORA Socratic AI Assistant**. I noticed you were exploring **${topicContext}**. Would you like me to break down any tricky questions, explain core principles, or run a fast practice drill?`
          : "Hello! I am your **QUIZORA AI Learning Assistant** 🧠.\n\nI can help you understand why an answer was incorrect, explain intricate algorithms and grammar rules, or generate custom follow-up drills. What would you like to explore today?",
        suggested_followups: topicContext
          ? [
              `Explain the most common traps in ${topicContext}`,
              `Give me a 3-question drill on ${topicContext}`,
              "Explain this topic in simple terms",
            ]
          : [
              "Explain Python AsyncIO event loops vs threading",
              "Why is 100% required for Ranking Coins?",
              "How do I master grammatical inversion?",
            ],
      };
    }
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset or update greeting when language changes
  useEffect(() => {
    setMessages([getInitialMessage()]);
  }, [language, topicContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chatAssistant({
        message: textToSend,
        context: topicContext ? { topic_name: topicContext } : undefined,
      });

      const assistantMsg: Message = {
        role: "assistant",
        content: res.response,
        suggested_followups: res.suggested_followups,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "uz"
              ? "Hozirda oflayn ta'lim rejimida ishlamoqdaman. Esda tuting: muntazam mashq va takrorlash bilimlarni mustahkamlashning eng yaxshi yo'lidir!"
              : language === "ru"
              ? "В данный момент работаем в образовательном режиме. Помните: интервальное повторение закрепляет знания наилучшим образом!"
              : "I'm currently operating in offline educational mode. Remember: active recall and spaced repetition are the most effective ways to solidify concepts!",
          suggested_followups: [
            language === "uz" ? "Yana bitta savol ber" : "Give me another question",
            language === "uz" ? "Asosiy qoidalarni tushuntir" : "Explain the basics",
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.nav.aiAssistant}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
            {language === "uz" ? "AI Repetitor va Xatolar Tahlili" : language === "ru" ? "AI Репетитор и Разбор Ошибок" : "AI Tutor & Mistake Analyzer"}
          </h1>
          <p className="text-xs text-[#7B8794]">
            {language === "uz"
              ? "Savollar bering, testdagi xatolaringiz sababini bilib oling va tushuntirishlarni o'rganing."
              : language === "ru"
              ? "Задавайте вопросы, анализируйте ошибки и получайте персональные объяснения."
              : "Ask questions, analyze quiz post-mortems, and receive personalized conceptual explanations."}
          </p>
        </div>
      </div>

      {/* Chat Stream Window */}
      <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs flex flex-col h-[600px] overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m, idx) => {
            const isAssistant = m.role === "assistant";

            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isAssistant ? "items-start" : "items-start ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isAssistant
                      ? "bg-gradient-to-tr from-purple-600 to-[#07858B] text-white"
                      : "bg-[#07858B] text-white"
                  }`}
                >
                  {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                <div className="space-y-3">
                  <div
                    className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-[#F7F9FC] border border-[#E8EDF2] text-[#182536]"
                        : "bg-[#07858B] text-white shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>

                  {/* Suggested follow-ups */}
                  {isAssistant && m.suggested_followups && m.suggested_followups.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.suggested_followups.map((followup, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSend(followup)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#E7F5F5] hover:bg-teal-100 text-[#07858B] border border-[#07858B]/20 transition-colors text-left"
                        >
                          💡 {followup}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-[#07858B] text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#07858B] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#07858B] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#07858B] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-[#E8EDF2] bg-[#F7F9FC]/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "uz" ? "Mavzu bo'yicha savol bering yoki mashq so'rang..." : language === "ru" ? "Задайте вопрос или попросите тренировочное задание..." : "Ask about a concept, quiz mistake, or request a drill..."}
              className="flex-1 bg-white border border-[#E8EDF2] rounded-2xl px-5 py-3 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] transition-colors shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-[#07858B] hover:bg-[#066D73] disabled:opacity-40 text-white rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-[#7B8794]">Yuklanmoqda...</div>}>
        <AIAssistantContent />
      </Suspense>
    </DashboardLayout>
  );
}
