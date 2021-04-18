<p align="center">
  <a href="https://github.com/kohlerdominik/docker-run-action/actions"><img alt="" src="https://github.com/kohlerdominik/docker-run-action/actions/workflows/test.yml/badge.svg?branch=main"></a>
</p>

# About
Run a step in a (private) container.

* Use any public or private image, or one that you just built.
* Highly customizable with descriptive inputs.
* Copies native step behavior 1:1

# Examples

### Simple step wrapped in a container
```yaml
- uses: kohlerdominik/docker-run-action@v1
  with:
    image: alpine:latest
    run: |
      echo "hello world"
      uname -a
```

### Run a step in a private image
```yaml
- uses: docker/login-action@v1
  with:
    registry: ghcr.io
    username: ${{ secrets.MY_USERNAME }}
    password: ${{ secrets.MY_PASSWORD }}
- uses: kohlerdominik/docker-run-action@v1
  with:
    image: ghcr.io/${{ github.repository }}/private-image:latest
    volumes: ${{ github.workspace }}:/workspace
    run: |
      echo "Running tests in target environment..."
      ./run-platform-tests.sh
```
See also [Docker Login Action](https://github.com/marketplace/actions/docker-login)

### Run an image built by a previous step:
```yaml
- uses: docker/build-push-action@v2
  with:
    tags: application:latest
    push: false
- uses: kohlerdominik/docker-run-action@v1
  with:
    image: application:latest
    run: ./verify-data.sh
```
See alo [Docker Push Action](https://github.com/marketplace/actions/build-and-push-docker-images)

### Customize the action
```yaml
- uses: kohlerdominik/docker-run-action@v1
  with:
   # public, private or local image
    image: ubuntu:latest
   # change shell (default: sh)
    shell: /bin/bash
   # change workdir (default directory for the shell)
    workdir: /workspace
   # pass or create environment variables
    env: |
      GITHUB_REF
      PREVIOUS_RESULT=${{ steps.step-id.outputs.result }}
      DB_USER=root
   # mount folders and files or create a reusable volumes
    volumes: |
      ${{ github.workspace }}/dist:/var/www
      ${{ github.workspace }}/conf/ip.conf:/etc/ip.conf
      db:/var/www/database
   # use other docker run options
    options: |
      --name=webserver
      --network test-network
   # and run a couple of instruction
    run: |
      apt-get update
      apt-get install curl
      curl icanhazip.com > /etc/ip.conf
```
Multiline is available for `env`, `volumes`, `options` and `run` inputs, but it's optional. If you have to pass only one argument, or want to chain all arguments on one line, it will work, too.

# Contributions
Contributions are very welcome. All functionality is covered with a test, so if you add functionality, please also add a test.

### First steps
* Fork and clone this repository.
* Have or install a reasonably modern version of `node`.
* Install the dependencies:
  ```bash
  npm install
  ```
* Make some changes.
* Build the Typescript:
  ```bash
  npm run build && npm run package
  # run prettier:
  npm run format
  # run lint
  npm run lint
  # or do all at once
  npm run all
  ```
* Push your changes.
* If you're ready, create a Pull Request.