package controller

import (
	"context"
	"net/http"
	"time"
	"web-server/internal/service"
	"web-server/internal/utils"
)

type Controller struct {
	exampleService *service.ExampleService
	awsClient      *utils.Client
}

func New() *Controller {
	awsClient := utils.NewClientDefault()

	exampleService := service.New(awsClient)

	return &Controller{
		awsClient:      &awsClient,
		exampleService: exampleService,
	}
}

func (c *Controller) SayHelloAsAnExampleFunction(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	w.Header().Set("Content-Type", "application/json")

	greetingResult, err := c.exampleService.SayHelloAsAnExampleFunction(ctx, "Ogi")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Something went wring with the greeting..."}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"data": "` + greetingResult + `"}`))

}
