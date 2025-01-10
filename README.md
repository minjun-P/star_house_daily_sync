## Start House Daily Sync 프로젝트

나스닥 데이터를, 매일 최신 버전으로 싱크하기 위한 프로젝트입니다.

### 실행 방법

아래 커맨드를 사용하여 도커를 실행시키면 로컬 디비가 띄워지고, 그곳과 연결이 이미 설정된 함수가 디비와 소통할 수 있게 됩니다.

```shell
docker-compose up --build
```

1.  docker-compose 내부에서는, 일단 Postgrres DB를 먼저 init 하고
2.  그 다음 `src/index.ts`를 시작점으로 하는 프로그램을 동작 시킵니다.

- `src/index.ts`에서는 디비(TypeORM 기반으로 postgres)와 소통하는 프로그램이 작동됩니다.
