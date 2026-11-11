# knol-mat-net

정육면체·직육면체 전개도의 **접힘 기하와 시점별 숨은 모서리 표현을 정확하게 처리하기 위한 새 구현**입니다.

## 핵심 원칙

- 0% 전개도: 접는 선은 점선, 외곽선은 실선
- 접기 시작 후: 현재 카메라 시점에서 실제로 보이는 모서리 구간은 실선
- 다른 면에 가려지는 모서리 구간은 점선
- 하나의 모서리 안에서도 부분 가림을 허용
- 회전·접힘 각도가 바뀔 때 visibility를 다시 계산
- 완전히 접히면 edge match를 기준으로 19개의 종이 선을 12개의 물리 모서리로 정리

## 구조

- `src/core/topology`: 전개도 생성, hinge/cut edge topology
- `src/core/geometry`: 단일 Matrix4 기반 접힘 자세와 world edge 계산
- `src/core/visibility`: camera → edge point ray/triangle 가림 판정
- `src/core/validation`: topology 및 100% closure 검증
- `src/render`: React Three Fiber 렌더러

## 검증 기준

정육면체 11개 전개도에 대해:

1. 6 faces
2. 5 hinges
3. 14 cut edges
4. 7 edge-match pairs
5. 100% 접힘에서 모든 matched edge가 일치
6. 100% 접힘에서 최종 물리 모서리 12개

직육면체도 서로 다른 길이 조합에 대해 동일한 closure 검증을 수행합니다.

## 개발

```bash
npm install
npm test
npm run build
npm run dev
```

GitHub Actions에서 test/build 검증을 수행하도록 CI가 포함되어 있습니다.
