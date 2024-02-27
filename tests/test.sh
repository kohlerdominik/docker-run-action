#!/bin/bash

pass() {
  echo "test passed"
  exit 0
}

fail() {
  echo "test failed"
  exit 1
}

case $1 in
  "equal")
    [ "${2}" == "${3}" ] && pass || fail
    ;;
  "contains") # check whether first string contains second one
    [[ "${2}" == *"${3}"* ]] && pass || fail
    ;;
  "empty")
    [ -z "${2}" ] && pass || fail
    ;;
  "not-empty")
    [ ! -z "$2" ] && pass || fail
    ;;
  *)
    echo "unkown test"
    exit 1
    ;;
esac
