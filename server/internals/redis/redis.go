package cache

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Init(redisURL string) error {
	opt, err := redis.ParseURL(redisURL)
	log.Println("redis url",  opt)
	if err != nil {
		return err
	}

	Client = redis.NewClient(opt)


	ctx, cancel := context.WithTimeout(context.Background(), 56*time.Second)
	defer cancel()

	_, err = Client.Ping(ctx).Result()
	return err
}

func Close() error {
	return Client.Close()
}

// SET - store a value
func Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return Client.Set(ctx, key, value, expiration).Err()
}

// GET - retrieve a value
func Get(ctx context.Context, key string) (string, error) {
	return Client.Get(ctx, key).Result()
}

// DELETE - remove a key
func Delete(ctx context.Context, key string) error {
	return Client.Del(ctx, key).Err()
}

// EXISTS - check if key exists
func Exists(ctx context.Context, key string) (bool, error) {
	val, err := Client.Exists(ctx, key).Result()
	return val > 0, err
}
