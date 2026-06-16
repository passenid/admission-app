"use client";

import { useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import type { Application } from "@/types/application";

function isAccepted(app: Application) {
  const v = app.합불?.trim() ?? "";
  return v === "O" || v === "o" || v === "합격";
}

function isRejected(app: Application) {
  const v = app.합불?.trim() ?? "";
  return v === "X" || v === "x" || v === "불합격";
}

function ApplicationList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Application[];
}) {
  return (
    <section className="rounded border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-3 py-2 text-left font-medium border border-slate-200">군</th>
                <th className="px-3 py-2 text-left font-medium border border-slate-200">대학</th>
                <th className="px-3 py-2 text-left font-medium border border-slate-200">학과</th>
                <th className="px-3 py-2 text-center font-medium border border-slate-200">합불</th>
                <th className="px-3 py-2 text-right font-medium border border-slate-200">내신</th>
                <th className="px-3 py-2 text-right font-medium border border-slate-200">백분위합</th>
                <th className="px-3 py-2 text-right font-medium border border-slate-200">표준점수합</th>
                <th className="px-3 py-2 text-center font-medium border border-slate-200">영어등급</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 border border-slate-200 text-slate-700">{item.군 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 font-medium text-slate-900">{item.대학 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 text-slate-700">{item.학과 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 text-center font-bold">
                    <span className={isAccepted(item) ? "text-emerald-600" : "text-rose-600"}>
                      {item.합불 ?? "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 border border-slate-200 text-right text-slate-700">{item.내신 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 text-right text-slate-700">{item.백분위합 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 text-right text-slate-700">{item.표준점수합 ?? "-"}</td>
                  <td className="px-3 py-2 border border-slate-200 text-center text-slate-700">{item.영어등급 ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [universities, setUniversities] = useState<string[]>([]);
  const [selectedUniv, setSelectedUniv] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("대학을 선택해 주세요.");

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) return;
    supabase
      .from("applications")
      .select("대학")
      .then(({ data }) => {
        if (!data) return;
        const list = [...new Set(data.map((r: Application) => r.대학).filter(Boolean))] as string[];
        setUniversities(list.sort());
      });
  }, []);

  useEffect(() => {
    setSelectedDept("");
    setDepartments([]);
    setApplications([]);
    if (!selectedUniv || !supabase) return;
    supabase
      .from("applications")
      .select("학과")
      .eq("대학", selectedUniv)
      .then(({ data }) => {
        if (!data) return;
        const list = [...new Set(data.map((r: Application) => r.학과).filter(Boolean))] as string[];
        setDepartments(list.sort());
        setMessage("학과를 선택해 주세요.");
      });
  }, [selectedUniv]);

  useEffect(() => {
    if (!selectedUniv || !selectedDept || !supabase) return;
    setIsLoading(true);
    setMessage("검색 중입니다.");
    supabase
      .from("applications")
      .select("*")
      .eq("대학", selectedUniv)
      .eq("학과", selectedDept)
      .order("id", { ascending: false })
      .then(({ data, error }) => {
        setIsLoading(false);
        if (error) {
          setMessage(`오류: ${error.message}`);
          return;
        }
        const list = (data ?? []) as Application[];
        setApplications(list);
        setMessage(list.length > 0 ? "검색 결과를 확인해 주세요." : "검색 결과가 없습니다.");
      });
  }, [selectedDept]);

  const acceptedApplications = useMemo(() => applications.filter(isAccepted), [applications]);
  const rejectedApplications = useMemo(() => applications.filter(isRejected), [applications]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">대입 정시지원 상담 웹앱</h1>
          <p className="mt-2 text-slate-600">본교 졸업생의 정시 지원 사례를 대학명과 학과명으로 검색합니다.</p>
        </header>

        <div className="rounded border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">대학명</span>
              <select
                value={selectedUniv}
                onChange={(e) => setSelectedUniv(e.target.value)}
                className="mt-2 h-11 w-full rounded border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="">대학을 선택하세요</option>
                {universities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">학과명</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={departments.length === 0}
                className="mt-2 h-11 w-full rounded border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100"
              >
                <option value="">학과를 선택하세요</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">{isLoading ? "검색 중..." : message}</p>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">지원 건수</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{applications.length}</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">합격 건수</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{acceptedApplications.length}</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">불합격 건수</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">{rejectedApplications.length}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ApplicationList title="합격 사례 목록" emptyText="합격 사례가 없습니다." items={acceptedApplications} />
          <ApplicationList title="불합격 사례 목록" emptyText="불합격 사례가 없습니다." items={rejectedApplications} />
        </div>
      </div>
    </main>
  );
}