# Name of the Docker image
IMAGE_NAME = $(shell basename `pwd`)

# Container name
CONTAINER_NAME = $(IMAGE_NAME)-container

# Dockerfile location
DOCKERFILE = Dockerfile.$(IMAGE_NAME)

# Port mapping
PORT = 8080

# .env file
ENV_FILE =.env

# Runs the tests in the code from the root directory
test:
	go test -v ./...

# Simply runs go run cmd/main.go without any Docker
run:
	@go run cmd/main.go

# Deletes the bin directory(if exists) and builds the binary executable of the code
build:
	@rm -rf bin
	@go build -o bin/main cmd/main.go

# Builds a Docker image of the code 
docker.build:
	@docker build -t $(IMAGE_NAME) -f $(DOCKERFILE) .

# Runs the Docker image in a container
docker.run:
	@if [ -f $(ENV_FILE) ]; then \
		docker run -it --rm --name $(CONTAINER_NAME) -p $(PORT):$(PORT) --env-file $(ENV_FILE) $(IMAGE_NAME); \
	else \
		docker run -it --rm --name $(CONTAINER_NAME) -p $(PORT):$(PORT) $(IMAGE_NAME); \
	fi