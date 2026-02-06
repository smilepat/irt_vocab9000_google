# 프로젝트 분리 계획서

## 현재 상황
- `irt_vocab9000_google` 폴더 안에 두 개의 독립적인 앱이 혼재
- `ontology-vocab-app`이 루트 프로젝트 내부에 중첩되어 있음

## 목표 구조

```
parent-directory/
├── irt-vocab9000/              # App 1: IRT 기반 적응형 퀴즈
│   ├── src/
│   ├── public/
│   │   └── master_vocabulary_table9000.csv
│   ├── package.json
│   └── vite.config.ts
│
└── vocab-graph-app/            # App 2: 온톨로지 기반 그래프 학습
    ├── apps/
    │   ├── api/                # Express + Neo4j backend
    │   └── web/                # Next.js frontend
    ├── packages/shared/
    ├── docker-compose.yml
    └── package.json
```

---

## 📋 단계별 분리 작업

### Phase 1: 준비 작업

#### 1. Git 상태 확인
```bash
cd c:\irt_vocab9000_google
git status
```

#### 2. 현재 변경사항 커밋
```bash
git add .
git commit -m "chore: Prepare for project separation"
```

### Phase 2: 새 디렉토리 구조 생성

#### 1. 부모 디렉토리 생성
```bash
cd c:\
mkdir vocab-projects
cd vocab-projects
```

#### 2. 두 프로젝트를 독립적으로 이동

**Option A: Git 히스토리 유지**
```bash
# IRT Vocab 9000 복사 (Git 히스토리 유지)
cd c:\vocab-projects
git clone c:\irt_vocab9000_google irt-vocab9000
cd irt-vocab9000
rm -rf ontology-vocab-app/  # 중첩된 앱 제거
git add .
git commit -m "chore: Remove nested ontology-vocab-app"

# Ontology Vocab App 독립 (새 Git 저장소)
cd c:\vocab-projects
mkdir vocab-graph-app
cd vocab-graph-app
git init
# ontology-vocab-app 내용 복사
cp -r c:\irt_vocab9000_google\ontology-vocab-app\* .
git add .
git commit -m "feat: Initialize vocab-graph-app as independent project"
```

**Option B: 깨끗한 분리 (히스토리 재시작)**
```bash
cd c:\vocab-projects

# IRT Vocab 9000
mkdir irt-vocab9000
# Root 프로젝트 파일만 복사 (ontology-vocab-app 제외)

# Ontology Vocab App
mkdir vocab-graph-app
# ontology-vocab-app 내용 복사
```

### Phase 3: 공유 리소스 처리

#### 1. CSV 마스터 데이터
- **위치**: `public/master_vocabulary_table9000.csv`
- **크기**: ~9010 unique words, ~50만 rows
- **전략**:
  ```bash
  # Option A: 양쪽 프로젝트에 복사
  cp irt-vocab9000/public/master_vocabulary_table9000.csv \
     vocab-graph-app/data/master_vocabulary_table9000.csv

  # Option B: 심볼릭 링크 사용 (같은 파일 공유)
  # Windows CMD:
  mklink /H vocab-graph-app\data\master_vocabulary_table9000.csv \
         irt-vocab9000\public\master_vocabulary_table9000.csv

  # Option C: 별도 공유 데이터 저장소
  mkdir shared-data
  mv irt-vocab9000/public/master_vocabulary_table9000.csv \
     shared-data/
  ```

#### 2. 공통 TypeScript 타입 (선택사항)
- 두 프로젝트에서 공유하는 타입이 있다면:
  ```bash
  # 공유 패키지 생성
  mkdir shared-types
  npm init -y
  ```

### Phase 4: 종속성 재설치

#### IRT Vocab 9000
```bash
cd c:\vocab-projects\irt-vocab9000
rm -rf node_modules package-lock.json
npm install
npm run dev  # 테스트
```

#### Vocab Graph App
```bash
cd c:\vocab-projects\vocab-graph-app
rm -rf node_modules package-lock.json
npm install
npm run dev  # 테스트
```

### Phase 5: 환경 설정 분리

#### IRT Vocab 9000
```bash
# .env.local (Gemini API)
VITE_GEMINI_API_KEY=your_key_here
```

#### Vocab Graph App
```bash
# apps/api/.env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
OPENAI_API_KEY=your_key_here
```

### Phase 6: Git 원격 저장소 설정

#### IRT Vocab 9000
```bash
cd c:\vocab-projects\irt-vocab9000
git remote set-url origin https://github.com/SmailePat/irt-vocab9000.git
# 또는 기존 저장소 유지
```

#### Vocab Graph App
```bash
cd c:\vocab-projects\vocab-graph-app
git remote add origin https://github.com/SmailePat/vocab-graph-app.git
git branch -M main
git push -u origin main
```

---

## ⚠️ 주의사항

### 1. 데이터 파일 처리
- `master_vocabulary_table9000.csv`는 **UTF-16 with BOM** 인코딩
- 두 프로젝트 모두 iconv-lite로 디코딩 필요
- 파일 크기: ~50MB (압축 권장)

### 2. 포트 충돌 방지
- **IRT Vocab 9000**: Vite dev server (default: 5173)
- **Vocab Graph App**:
  - API: 3001
  - Web: 3000
  - Neo4j: 7474 (UI), 7687 (Bolt)

### 3. Git 이력 관리
- **IRT Vocab 9000**: 기존 GitHub Pages 배포 유지
- **Vocab Graph App**: 새 저장소 또는 서브디렉토리 분리

### 4. 메모리 업데이트
- `~/.claude/projects/*/memory/MEMORY.md` 업데이트 필요
- 새 경로 반영

---

## 🧪 검증 체크리스트

### IRT Vocab 9000
- [ ] `npm run dev` 정상 실행
- [ ] CSV 파일 로드 확인
- [ ] Gemini API 연동 테스트
- [ ] GitHub Pages 배포 테스트

### Vocab Graph App
- [ ] Neo4j 컨테이너 실행 (`docker-compose up -d`)
- [ ] Backend API 정상 실행 (`cd apps/api && npm run dev`)
- [ ] Frontend 정상 실행 (`cd apps/web && npm run dev`)
- [ ] CSV import API 테스트 (`POST /import-csv`)
- [ ] 그래프 시각화 확인

---

## 🔧 추천 분리 전략

### ✅ 권장: Option A (Git 히스토리 유지)
- IRT Vocab 9000: 기존 저장소 유지, ontology-vocab-app 폴더만 제거
- Vocab Graph App: 새 Git 저장소로 초기화

### 이유
1. **IRT Vocab 9000**: 이미 GitHub Pages로 배포 중, 히스토리 유지 필수
2. **Vocab Graph App**: 아직 독립 배포 없음, 새로 시작해도 문제 없음
3. **데이터 공유**: CSV 파일은 IRT Vocab 9000에 보관, 심볼릭 링크로 연결

---

## 📝 실행 스크립트

### Windows (PowerShell)
```powershell
# 1. 백업 생성
cd c:\
Compress-Archive -Path irt_vocab9000_google -DestinationPath irt_vocab9000_backup.zip

# 2. 새 구조 생성
mkdir vocab-projects
cd vocab-projects

# 3. IRT Vocab 9000 복사
git clone c:\irt_vocab9000_google irt-vocab9000
cd irt-vocab9000
Remove-Item -Recurse -Force ontology-vocab-app
git add .
git commit -m "chore: Remove nested ontology-vocab-app"

# 4. Vocab Graph App 분리
cd c:\vocab-projects
mkdir vocab-graph-app
cd vocab-graph-app
git init
Copy-Item -Recurse c:\irt_vocab9000_google\ontology-vocab-app\* .
git add .
git commit -m "feat: Initialize independent project"

# 5. CSV 파일 링크 (선택)
# (관리자 권한 필요)
New-Item -ItemType HardLink `
  -Path ".\data\master_vocabulary_table9000.csv" `
  -Target "c:\vocab-projects\irt-vocab9000\public\master_vocabulary_table9000.csv"
```

---

## 🎯 다음 단계

1. ✅ 분리 전략 선택 (Option A 권장)
2. ✅ 백업 생성
3. ✅ 스크립트 실행
4. ✅ 각 프로젝트 테스트
5. ✅ 원격 저장소 설정
6. ✅ Claude 메모리 업데이트

---

## 📚 참고: 각 프로젝트 독립 실행 방법

### IRT Vocab 9000
```bash
cd c:\vocab-projects\irt-vocab9000
npm install
npm run dev
# http://localhost:5173
```

### Vocab Graph App
```bash
# Terminal 1: Neo4j
cd c:\vocab-projects\vocab-graph-app
docker-compose up -d

# Terminal 2: Backend
cd apps/api
npm install
npm run dev

# Terminal 3: Frontend
cd apps/web
npm install
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```
