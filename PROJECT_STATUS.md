# PROJECT_STATUS

## 기본 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | **irt_vocab9000_google** |
| 한 줄 설명 | IRT 기반 적응형 영어 어휘 퀴즈 앱 (Gemini AI 연동) |
| 현재 상태 | 진행중 |
| 배포 URL | https://smilepat.github.io/irt_vocab9000_google/ |
| GitHub | https://github.com/smilepat/irt_vocab9000_google |
| 마지막 작업 | 프로젝트 분리 계획 및 스크립트 추가 (2026-02-07) |
| 다음 할 일 | ontology-vocab-app 별도 레포로 분리, Notion MCP 연동 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Vite + React 19 |
| 언어 | TypeScript |
| AI | Google Gemini (`@google/generative-ai`) |
| UI 아이콘 | Lucide React |
| 배포 | GitHub Pages (`gh-pages`) |
| 테스트 | Vitest |
| 데이터 | CSV (EUC-KR 인코딩, ~9,003 단어) |

---

## 주요 파일 구조

```
irt_vocab9000_google/
├── App.tsx                  # 메인 앱 컴포넌트
├── index.tsx                # 앱 진입점
├── types.ts                 # 타입 정의
├── geminiService.ts         # Gemini AI API 연동
├── vocabService.ts          # 어휘 데이터 서비스
├── vite.config.ts           # Vite 빌드 설정
├── vitest.config.ts         # 테스트 설정
├── components/
│   ├── DataUploadModal.tsx  # 데이터 업로드 모달
│   ├── lexile-chart.tsx     # Lexile 차트 컴포넌트
│   └── ui/                  # 공통 UI 컴포넌트 (button, card, input, ...)
├── lib/
│   ├── scoring.ts           # IRT 기반 채점 로직
│   ├── storage.ts           # 로컬 스토리지 관리
│   └── utils.ts             # 유틸리티 함수
├── data/
│   ├── chart-data.ts        # 차트 데이터
│   ├── passages-en.ts       # 영어 지문
│   └── passages-ko.ts       # 한국어 지문
├── utils/
│   └── csvParser.ts         # CSV 파싱 (EUC-KR 지원)
├── app/                     # Next.js 페이지 (레거시/실험용)
│   ├── page.tsx
│   └── lexile-test/
├── __tests__/
│   └── scoring.test.ts      # 채점 로직 테스트
├── public/
│   └── master_vocabulary_table9000.csv  # 마스터 어휘 데이터 (9,003단어)
└── ontology-vocab-app/      # (분리 예정) 온톨로지 기반 그래프 DB 앱
```

---

## 최근 작업 로그

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-02-07 | `8341338` | 프로젝트 분리 계획 및 스크립트 추가 |
| 2026-02-05 | `794e3a2` | 마스터 어휘 테이블 및 Claude AI 로컬 권한 설정 |
| 2026-02-03 | `abc05b5` | 기본 DB 로딩 구현 및 InputField 수정 |
| 2026-02-02 | `490d36e` | 모든 퀴즈 유형의 프롬프트 표준화 |
| 2026-02-02 | `ff422f3` | 목표 어휘 메뉴 구현 |
| 2026-02-02 | `6db091f` | Vercel 배포용 base path 수정 |
| 2026-02-01 | `190748a` | GitHub Pages 배포 설정 |
| 2026-02-01 | `c223166` | 리모트 초기 커밋 머지 |

---

## TODO 체크리스트

- [ ] `ontology-vocab-app/` 을 별도 레포(`vocab-graph-app`)로 분리
- [ ] Notion MCP 서버 연동 (작업 기록 자동 저장)
- [ ] Lexile 테스트 기능 완성
- [ ] 퀴즈 결과 분석 대시보드 개선
- [ ] 모바일 반응형 UI 최적화
- [ ] CSV 데이터 로딩 성능 개선

---

## 알려진 이슈

- CSV 파일(`master_vocabulary_table9000.csv`)이 EUC-KR 인코딩이므로 반드시 `iconv-lite`로 디코딩 필요
- CSV 헤더에 줄바꿈이 포함되어 있어 커스텀 `parseCSV` 함수 사용 필수
- `ontology-vocab-app/` 폴더가 현재 이 레포에 포함되어 있으나 별도 분리 예정
- `app/` 디렉토리는 Next.js 레거시 코드로 Vite 빌드에는 미포함

---

## 아이디어 메모

- Graph DB 기반 어휘 관계망 시각화를 IRT 퀴즈와 결합
- 학습자 능력치(theta) 변화 추이를 시계열 그래프로 표시
- Gemini AI를 활용한 맞춤형 예문 생성
- CEFR 레벨별 적응형 난이도 조절 고도화
- 오답 패턴 분석 및 취약 영역 자동 추천

---

## 관련 링크

- [GitHub Pages 배포](https://smilepat.github.io/irt_vocab9000_google/)
- [GitHub 레포](https://github.com/smilepat/irt_vocab9000_google)
- [AI Studio 앱](https://ai.studio/apps/drive/1S8zQ9QvtwwEzXTyC4-vbTBqOe0Wghb4S)
- [Notion 작업 페이지](https://www.notion.so/VS-Code-2ff16c78f9c781098d27dd9a3336cc60)

---

## Claude Code 재시작용 컨텍스트

> 새 세션에서 이 프로젝트를 이어서 작업하려면 아래 핵심 정보를 참고하세요.

1. **프로젝트 성격**: 클라이언트 전용(서버 없음) IRT 적응형 어휘 퀴즈 앱. Vite로 빌드, GitHub Pages에 배포.
2. **AI 연동**: `geminiService.ts`에서 Google Gemini API 호출. API 키는 `.env.local`의 `GEMINI_API_KEY`.
3. **데이터**: `public/master_vocabulary_table9000.csv` (EUC-KR 인코딩, ~9,003 단어). `csvParser.ts`로 파싱.
4. **IRT 채점**: `lib/scoring.ts` - Item Response Theory 기반 능력치(theta) 추정 로직.
5. **주의사항**:
   - CSV 인코딩은 EUC-KR → `iconv-lite` 필수
   - CSV 헤더에 줄바꿈 포함 → 커스텀 파서 사용
   - `ontology-vocab-app/` 폴더는 별도 프로젝트(분리 예정)이므로 이 앱과 혼동하지 말 것
6. **빌드/배포**: `npm run build` → `npm run deploy` (gh-pages)
7. **메모리 파일**: `C:\Users\user\.claude\projects\c--irt-vocab9000-google\memory\MEMORY.md` 참조
