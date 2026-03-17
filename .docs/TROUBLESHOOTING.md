# 트러블슈팅 이력

---

## 템플릿

```
### [날짜] 이슈 제목

**발생 상황 및 에러 로그 요약**
- 증상:
- 에러 메시지:

**원인 분석**
-

**해결 방법**
- 적용된 Docker 명령어 및 코드 변경 내역:
```

---

## Apple Silicon / Docker 관련 이슈

### [2026-03-17] 초기 Docker 환경 구축

**발생 상황**
Apple Silicon(ARM64) 환경에서 Docker 이미지 빌드 시 x86 바이너리 충돌 가능성.

**원인 분석**
macOS ARM64와 Linux x86_64 간 네이티브 바인딩 패키지 이진 호환성 문제.

**해결 방법**
- `Dockerfile`에 `FROM --platform=linux/arm64 node:22-alpine` 명시
- `docker-compose.yml`에 `platforms: linux/arm64` 명시
- `node_modules` 익명 볼륨으로 호스트-컨테이너 간 바이너리 충돌 방지
