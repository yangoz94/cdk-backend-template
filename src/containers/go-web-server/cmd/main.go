package main

import (
	"fmt"
	"net/http"
	"os"
	"web-server/internal/controller"

	"github.com/go-chi/chi"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	CONTAINER_HTTP_PORT := os.Getenv("CONTAINER_HTTP_PORT")

	r := chi.NewRouter()

	c := controller.New()

	r.Get("/", c.SayHelloAsAnExampleFunction)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	fmt.Println("Server is running on port:", CONTAINER_HTTP_PORT)
	http.ListenAndServe(":"+CONTAINER_HTTP_PORT, r)
}
