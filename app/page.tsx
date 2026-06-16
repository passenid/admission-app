'use client';
export const dynamic = 'force-dynamic';

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

  useEffect(() => {
    const fetchUniversities = async () => {
      const { data } = await supabase.from('applications').select('대학').order('대학');
      if (data) {
        const unique = [...new Set((data as any[]).map((d) => d['대학'] as string))].sort();
        setUniversities(unique);
      }
    };
    fetchUniversities();
  }, []);

  const search = useCallback(async (university: string, department: string) => {
    if (!university) return;
    setLoading(true);
    const { data } = await (
      department
        ? supabase.from('applications').select('*').eq('대학', university).eq('학과', department).order('백분위합', { ascending: false })
        : supabase.from('applications').select('*').eq('대학', university).order('백분위합', { ascending: false })
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

  const handleUniversityChange = async (university: string) => {
    setSelectedUniversity(university);
    setSelectedDepartment('');
    setDepartments([]);
    if (!university) {
      setResults([]);
      setStats({ total: 0, passed: 0, failed: 0 });
      return;
    }
    const { data } = await supabase.from('applications').select('학과').eq('대학', university).order('학과');
    if (data) {
      const unique = [...new Set((data as any[]).map((d) => d['학과'] as string))].sort();
      setDepartments(unique);
    }
    await search(university, '');
  };

  const handleDepartmentChange = async (department: string) => {
    setSelectedDepartment(department);
    await search(selectedUniversity, department);
  };

  const columns = (
    <tr className="bg-gray-50 border-b border-gray-200">
      <th className="px-3 py-2 text-left font-medium text-gray-600">군</th>
      <th className="px-3 py-2 text-left font-medium text-gray-600">학과</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">내신</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">백분위합</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">표준점수합</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">영어등급</th>
    </tr>
  );

  const renderRows = (filter: string, hoverColor: string) => {
    const filtered = results.filter((r) => r.합불 === filter);
    if (filtered.length === 0)
      return <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">사례 없음</td></tr>;
    return filtered.map((row) => (
      <tr key={row.id} className={`border-b border-gray-100 ${hoverColor}`}>
        <td className="px-3 py-2">{row.군}</td>
        <td className="px-3 py-2">{row.학과}</td>
        <td className="px-3 py-2 text-right">{row.내신 ?? '-'}</td>
        <td className="px-3 py-2 text-right font-semibold">{row.백분위합 ?? '-'}</td>
        <td className="px-3 py-2 text-right font-semibold">{row.표준점수합 ?? '-'}</td>
        <td className="px-3 py-2 text-right">{row.영어등급 ?? '-'}</td>
      </tr>
    ));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">대입 정시지원 상담</h1>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">대학</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedUniversity}
              onChange={(e) => handleUniversityChange(e.target.value)}
            >
              <option value="">대학 선택</option>
              {universities.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학과 <span className="font-normal text-gray-400">(선택 안 하면 전체 학과 조회)</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={!selectedUniversity}
            >
              <option value="">전체 학과</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
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
          <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
        ) : results.length > 0 ? (
          <div className="flex gap-4">
            {/* 합격 */}
            <div className="flex-1 bg-white border border-blue-200 rounded-lg overflow-x-auto">
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 font-semibold text-blue-700 text-sm">
                합격 사례 ({stats.passed}건)
              </div>
              <table className="min-w-full text-sm">
                <thead>{columns}</thead>
                <tbody>{renderRows('합격', 'hover:bg-blue-50')}</tbody>
              </table>
            </div>
            {/* 불합격 */}
            <div className="flex-1 bg-white border border-red-200 rounded-lg overflow-x-auto">
              <div className="px-4 py-2 bg-red-50 border-b border-red-200 font-semibold text-red-700 text-sm">
                불합격 사례 ({stats.failed}건)
              </div>
              <table className="min-w-full text-sm">
                <thead>{columns}</thead>
                <tbody>{renderRows('불합격', 'hover:bg-red-50')}</tbody>
              </table>
            </div>
          </div>
        ) : selectedUniversity ? (
          <div className="text-center py-16 text-gray-400 text-sm">검색 결과가 없습니다.</div>
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">대학을 선택하면 결과가 표시됩니다.</div>
        )}
      </div>
    </main>
  );
}