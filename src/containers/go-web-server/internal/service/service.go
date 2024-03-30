package service

import (
	"context"
	"fmt"
	"web-server/internal/utils"
)

type ExampleService struct {
	awsClient utils.Client
}

func New(awsClient utils.Client) *ExampleService {
	return &ExampleService{
		awsClient: awsClient,
	}
}

func (s *ExampleService) SayHelloAsAnExampleFunction(ctx context.Context, name string) (string, error) {
	return fmt.Sprintf("Hello, %s", name), nil
}
