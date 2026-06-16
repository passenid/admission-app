# 대입 정시지원 상담 웹앱 MVP

본교 졸업생의 정시 지원 사례를 Supabase `applications` 테이블에서 검색하는 Next.js MVP입니다.

## 사용 기술

- Next.js
- TypeScript
- Tailwind CSS
- Supabase

## Supabase 테이블 예시

현재 코드는 `applications` 테이블에 아래 컬럼이 있다고 가정합니다.

| 컬럼명 | 설명 |
| --- | --- |
| `id` | 고유 번호 |
| `university_name` | 대학명 |
| `department_name` | 학과명 |
| `result` | 합격 여부. 예: `합격`, `불합격` |
| `year` | 지원 연도. 선택 |
| `score` | 점수. 선택 |
| `note` | 비고. 선택 |

컬럼명이 다르면 `app/page.tsx`의 검색 필터와 화면 표시 부분에서 컬럼명을 바꾸면 됩니다.

## 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 입력합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=Supabase Project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=Supabase Publishable key
```

Supabase 값은 Supabase 대시보드의 프로젝트 설정에서 확인할 수 있습니다.

## 실행 방법

의존성을 설치합니다.

```bash
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 검색 동작

- 대학명 또는 학과명 중 하나 이상을 입력하고 검색합니다.
- 입력한 단어가 대학명 또는 학과명에 부분 일치하면 결과에 표시됩니다.
- 결과 영역에는 지원 건수, 합격 건수, 불합격 건수와 각각의 사례 목록이 표시됩니다.
