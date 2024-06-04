package main

import (
	"fmt"
	"net/http"
	"web-server/internal/controller"

	"github.com/go-chi/chi"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	r := chi.NewRouter()

	c := controller.New()

	r.Get("/", c.SayHelloAsAnExampleFunction)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server is running on port 8080")
	http.ListenAndServe(":8080", r)
}
