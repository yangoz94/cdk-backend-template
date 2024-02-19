package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi"
)

func main() {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Health check successful")
		//return 200
		w.WriteHeader(http.StatusOK)
	})

	fmt.Println("Server is running on port 8080")
	http.ListenAndServe(":8080", r)
}
