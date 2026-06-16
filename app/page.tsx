'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Application } from '@/types/application';

export default function Home() {
  const [universities, setUniversities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [results, setResults] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });

  // 마운트 시 대학 목록 로드
  useEffect(() => {
  const fetchUniversities = async () => {
    const { data } = await supabase
      .from('applications')
      .select('대학')
      .order('대학');
    if (data) {
      // ✅ (data as any[])로 캐스팅 후 브라켓 표기법 사용
      const unique = [...new Set((data as any[]).map((d) => d['대학'] as string))].sort();
      setUniversities(unique);
    }
  };
  fetchUniversities();
}, []);


  // 검색 함수 (대학 필수 / 학과 선택)
  const search = useCallback(async (university: string, department: string) => {
  if (!university) return;

  setLoading(true);

  // ✅ 재할당 없이 삼항연산자로 분기 → 타입 에러 없음
  const { data } = await (
    department
      ? supabase
          .from('applications')
          .select('*')
          .eq('대학', university)
          .eq('학과', department)
          .order('백분위합', { ascending: false })
      : supabase
          .from('applications')
          .select('*')
          .eq('대학', university)
          .order('백분위합', { ascending: false })
  );

  if (data) {
    const typed = data as Application[];
    setResults(typed);
    setStats({
      total: typed.length,
      passed: typed.filter((d) => d.합불 === '합격').length,
      failed: typed.filter((d) => d.합불 === '불합격').length,
    });
  }
  setLoading(false);
}, []);


  // 대학 선택 핸들러
  const handleUniversityChange = async (university: string) => {
    setSelectedUniversity(university);
    setSelectedDepartment('');
    setDepartments([]);

    if (!university) {
      setResults([]);
      setStats({ total: 0, passed: 0, failed: 0 });
      return;
    }

    // 학과 목록 로드
    const { data } = await supabase
  .from('applications')
  .select('학과')
  .eq('대학', university)
  .order('학과');

if (data) {
  // ✅ 동일하게 캐스팅
  const unique = [...new Set((data as any[]).map((d) => d['학과'] as string))].sort();
  setDepartments(unique);
}


    // ✅ 대학만 선택해도 즉시 전체 학과 조회
    await search(university, '');
  };

  // 학과 선택 핸들러
  const handleDepartmentChange = async (department: string) => {
    setSelectedDepartment(department);
    await search(selectedUniversity, department);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          대입 정시지원 상담
        </h1>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-4">
          {/* 대학 선택 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대학
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedUniversity}
              onChange={(e) => handleUniversityChange(e.target.value)}
            >
              <option value="">대학 선택</option>
              {universities.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 학과 선택 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학과{' '}
              <span className="font-normal text-gray-400">
                (선택 안 하면 전체 학과 조회)
              </span>
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={!selectedUniversity}
            >
              <option value="">전체 학과</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 통계 카드 */}
        {selectedUniversity && !loading && (
          <div className="flex gap-3 mb-4">
            <div className="bg-white border border-gray-200 rounded px-4 py-2 text-sm">
              <span className="text-gray-500">전체</span>
              <span className="ml-2 font-bold text-gray-900">{stats.total}건</span>
            </div>
            <div className="bg-white border border-blue-200 rounded px-4 py-2 text-sm">
              <span className="text-blue-600">합격</span>
              <span className="ml-2 font-bold text-blue-700">{stats.passed}건</span>
            </div>
            <div className="bg-white border border-red-200 rounded px-4 py-2 text-sm">
              <span className="text-red-500">불합격</span>
              <span className="ml-2 font-bold text-red-600">{stats.failed}건</span>
            </div>
          </div>
        )}

        {/* 결과 테이블 */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : results.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* 기본 정보 */}
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">연도</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">군</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">대학</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">학과</th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-600 whitespace-nowrap">합불</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600 whitespace-nowrap">내신</th>
                  {/* ✅ 국어 상세 */}
                  <th className="px-3 py-2.5 text-center font-medium text-blue-600 whitespace-nowrap border-l border-gray-200">국어선택</th>
                  <th className="px-3 py-2.5 text-right font-medium text-blue-600 whitespace-nowrap">국어백분위</th>
                  {/* ✅ 수학 상세 */}
                  <th className="px-3 py-2.5 text-center font-medium text-blue-600 whitespace-nowrap border-l border-gray-200">수학선택</th>
                  <th className="px-3 py-2.5 text-right font-medium text-blue-600 whitespace-nowrap">수학백분위</th>
                  {/* ✅ 탐구 상세 */}
                  <th className="px-3 py-2.5 text-center font-medium text-blue-600 whitespace-nowrap border-l border-gray-200">탐구1과목</th>
                  <th className="px-3 py-2.5 text-right font-medium text-blue-600 whitespace-nowrap">탐구1백분위</th>
                  <th className="px-3 py-2.5 text-center font-medium text-blue-600 whitespace-nowrap">탐구2과목</th>
                  <th className="px-3 py-2.5 text-right font-medium text-blue-600 whitespace-nowrap">탐구2백분위</th>
                  {/* 기타 */}
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600 whitespace-nowrap border-l border-gray-200">영어등급</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600 whitespace-nowrap">한국사등급</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600 whitespace-nowrap">백분위합</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600 whitespace-nowrap">표준점수합</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.연도}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.군}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{row.대학}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.학과}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          row.합불 === '합격'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {row.합불}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.내신 ?? '-'}</td>
                    {/* 국어 */}
                    <td className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-100">{row.국어선택 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.국어백분위 ?? '-'}</td>
                    {/* 수학 */}
                    <td className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-100">{row.수학선택 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.수학백분위 ?? '-'}</td>
                    {/* 탐구 */}
                    <td className="px-3 py-2 text-center whitespace-nowrap border-l border-gray-100">{row.탐구1과목 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.탐구1백분위 ?? '-'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{row.탐구2과목 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.탐구2백분위 ?? '-'}</td>
                    {/* 기타 */}
                    <td className="px-3 py-2 text-right whitespace-nowrap border-l border-gray-100">{row.영어등급 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{row.한국사등급 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">{row.백분위합 ?? '-'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">{row.표준점수합 ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedUniversity ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">
            대학을 선택하면 결과가 표시됩니다.
          </div>
        )}
      </div>
    </main>
  );
}
