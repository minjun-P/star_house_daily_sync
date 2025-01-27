#!/bin/bash

# TAG 값을 대화형으로 입력받음
read -p "Enter the TAG value (e.g., 1 or 2... or latest): " TAG

# TAG 입력이 비어 있으면 기본값 설정
if [[ -z "$TAG" ]]; then
  echo "No TAG provided. Exiting..."
  exit 1
fi

# 입력받은 TAG 값 출력 (디버깅용)
echo "Building Docker image with TAG: $TAG"

# gcloud 명령 실행
gcloud builds submit --tag asia-northeast3-docker.pkg.dev/star-house-nasdaq/job-images/market-sync:$TAG

# 완료 메시지
if [[ $? -eq 0 ]]; then
  echo "Docker image built and submitted successfully with TAG: $TAG"
else
  echo "Failed to build and submit the Docker image."
  exit 1
fi