package authModel

type User struct {
  Id string `json:"id"`
  Name string `json:"name"`
  Email string `json:"email"`
  Profile_picture string `json:"picture"`
  Password string `json:"password"`
}