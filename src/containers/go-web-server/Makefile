# Name of the Docker image
IMAGE_NAME = $(shell basename `pwd`)

# Dockerfile location
DOCKERFILE = Dockerfile.$(IMAGE_NAME)

# Container name
CONTAINER_NAME = $(IMAGE_NAME)-container

# Port mapping
PORT = 8080

build:
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE) .
	make run

run:
	docker run --name $(CONTAINER_NAME) -p $(PORT):$(PORT) $(IMAGE_NAME)

stop:
	docker stop $(CONTAINER_NAME)
	docker rm $(CONTAINER_NAME)

clean: stop
	docker rm $(CONTAINER_NAME)

rebuild: clean build run
