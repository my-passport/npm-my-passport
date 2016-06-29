#!/bin/sh
IMAGE="festivals-tech/festivals"
VERSION="$1"

docker build $2 -t ${IMAGE}:${VERSION} .
docker tag -f ${IMAGE}:${VERSION} ${IMAGE}:latest