package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Init(redisURL string) error {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return err
	}

	Client = redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = Client.Ping(ctx).Result()
	return err
}

func Close() error {
	return Client.Close()
}
