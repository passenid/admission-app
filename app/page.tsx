'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Application } from '@/types/application';

type Tab = 'university' | 'percentile';

export default function Home() {
  const [tab, setTab] = useState<Tab>('university');

  // 대학 검색 상태
  const [universities, setUniversities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [results, setResults] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });

  // 백분위합 검색 상태
  const [percentileInput, setPercentileInput] = useState('');
  const [range, setRange] = useState(10);
  const [percentileResults, setPercentileResults] = useState<Application[]>([]);
  const [percentileLoading, setPercentileLoading] = useState(false);
  const [percentileStats, setPercentileStats] = useState({ total: 0, passed: 0, failed: 0 });

  useEffect(() => {
    const fetchUniversities = async () => {
      const { data } = await supabase.from('applications').select('대학').order('대학');
      if (data) {
        const unique = [...new Set((data as any[]).map((d) => d['대학'] as string))].filter((u) => u && u.trim() !== '').sort();
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
        passed: typed.filter((d) => d.합불 === 'O').length,
        failed: typed.filter((d) => d.합불 === 'X').length,
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

  const searchByPercentile = async () => {
    const val = Number(percentileInput);
    if (!percentileInput || isNaN(val)) return;
    setPercentileLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*')
      .gte('백분위합', val - range)
      .lte('백분위합', val + range)
      .order('백분위합', { ascending: false });
    if (data) {
      const typed = data as Application[];
      setPercentileResults(typed);
      setPercentileStats({
        total: typed.length,
        passed: typed.filter((d) => d.합불 === 'O').length,
        failed: typed.filter((d) => d.합불 === 'X').length,
      });
    }
    setPercentileLoading(false);
  };

  const columns = (showUniversity = false) => (
    <tr className="bg-gray-50 border-b border-gray-200">
      {showUniversity && <th className="px-3 py-2 text-left font-medium text-gray-600">대학</th>}
      <th className="px-3 py-2 text-left font-medium text-gray-600">군</th>
      <th className="px-3 py-2 text-left font-medium text-gray-600">학과</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">내신</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">백분위합</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">표준점수합</th>
      <th className="px-3 py-2 text-right font-medium text-gray-600">영어등급</th>
    </tr>
  );

  const renderRows = (rows: Application[], filter: string, hoverColor: string, showUniversity = false) => {
    const filtered = rows.filter((r) => r.합불 === filter);
    const colSpan = showUniversity ? 7 : 6;
    if (filtered.length === 0)
      return <tr><td colSpan={colSpan} className="px-3 py-6 text-center text-gray-400">사례 없음</td></tr>;
    return filtered.map((row) => (
      <tr key={row.id} className={`border-b border-gray-100 ${hoverColor}`}>
        {showUniversity && <td className="px-3 py-2 text-gray-700">{row.대학}</td>}
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

        {/* 탭 */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          <button
            onClick={() => setTab('university')}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === 'university'
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            대학별 검색
          </button>
          <button
            onClick={() => setTab('percentile')}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === 'percentile'
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            백분위합으로 검색
          </button>
        </div>

        {/* ── 대학별 검색 탭 ── */}
        {tab === 'university' && (
          <>
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

            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
            ) : results.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-white border border-blue-200 rounded-lg overflow-x-auto">
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 font-semibold text-blue-700 text-sm">
                    합격 사례 ({stats.passed}건)
                  </div>
                  <table className="min-w-full text-sm">
                    <thead>{columns()}</thead>
                    <tbody>{renderRows(results, 'O', 'hover:bg-blue-50')}</tbody>
                  </table>
                </div>
                <div className="flex-1 bg-white border border-red-200 rounded-lg overflow-x-auto">
                  <div className="px-4 py-2 bg-red-50 border-b border-red-200 font-semibold text-red-700 text-sm">
                    불합격 사례 ({stats.failed}건)
                  </div>
                  <table className="min-w-full text-sm">
                    <thead>{columns()}</thead>
                    <tbody>{renderRows(results, 'X', 'hover:bg-red-50')}</tbody>
                  </table>
                </div>
              </div>
            ) : selectedUniversity ? (
              <div className="text-center py-16 text-gray-400 text-sm">검색 결과가 없습니다.</div>
            ) : (
              <div className="text-center py-16 text-gray-400 text-sm">대학을 선택하면 결과가 표시됩니다.</div>
            )}
          </>
        )}

        {/* ── 백분위합 검색 탭 ── */}
        {tab === 'percentile' && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">백분위합</label>
                <input
                  type="number"
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 285"
                  value={percentileInput}
                  onChange={(e) => setPercentileInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchByPercentile()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">범위 (±)</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={range}
                  onChange={(e) => setRange(Number(e.target.value))}
                >
                  {[5, 10, 15, 20].map((v) => <option key={v} value={v}>±{v}</option>)}
                </select>
              </div>
              <button
                onClick={searchByPercentile}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>

            {percentileInput && !percentileLoading && percentileResults.length > 0 && (
              <div className="flex gap-3 mb-4">
                <div className="bg-white border border-gray-200 rounded px-4 py-2 text-sm">
                  <span className="text-gray-500">전체</span>
                  <span className="ml-2 font-bold text-gray-900">{percentileStats.total}건</span>
                </div>
                <div className="bg-white border border-blue-200 rounded px-4 py-2 text-sm">
                  <span className="text-blue-600">합격</span>
                  <span className="ml-2 font-bold text-blue-700">{percentileStats.passed}건</span>
                </div>
                <div className="bg-white border border-red-200 rounded px-4 py-2 text-sm">
                  <span className="text-red-500">불합격</span>
                  <span className="ml-2 font-bold text-red-600">{percentileStats.failed}건</span>
                </div>
                <div className="bg-white border border-gray-200 rounded px-4 py-2 text-sm text-gray-500">
                  조회 범위: {Number(percentileInput) - range} ~ {Number(percentileInput) + range}
                </div>
              </div>
            )}

            {percentileLoading ? (
              <div className="text-center py-16 text-gray-400 text-sm">불러오는 중...</div>
            ) : percentileResults.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-white border border-blue-200 rounded-lg overflow-x-auto">
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 font-semibold text-blue-700 text-sm">
                    합격 사례 ({percentileStats.passed}건)
                  </div>
                  <table className="min-w-full text-sm">
                    <thead>{columns(true)}</thead>
                    <tbody>{renderRows(percentileResults, 'O', 'hover:bg-blue-50', true)}</tbody>
                  </table>
                </div>
                <div className="flex-1 bg-white border border-red-200 rounded-lg overflow-x-auto">
                  <div className="px-4 py-2 bg-red-50 border-b border-red-200 font-semibold text-red-700 text-sm">
                    불합격 사례 ({stats.failed}건)
                  </div>
                  <table className="min-w-full text-sm">
                    <thead>{columns(true)}</thead>
                    <tbody>{renderRows(percentileResults, 'X', 'hover:bg-red-50', true)}</tbody>
                  </table>
                </div>
              </div>
            ) : percentileInput ? (
              <div className="text-center py-16 text-gray-400 text-sm">해당 범위의 사례가 없습니다.</div>
            ) : (
              <div className="text-center py-16 text-gray-400 text-sm">백분위합을 입력하면 유사한 사례가 표시됩니다.</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
