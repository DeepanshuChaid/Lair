package oauth

import (
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var redirecturl = os.Getenv("CALLBACK_URL") + "/auth/google/callback"

var GoogleOAuthConfig = &oauth2.Config{
  RedirectURL:  redirecturl,
  ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
  ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
  Scopes: []string{
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  },
  Endpoint: google.Endpoint,
}