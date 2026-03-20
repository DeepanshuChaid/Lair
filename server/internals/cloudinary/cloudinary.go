package cloudinary

import (
	"context"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var cld *cloudinary.Cloudinary

func InitCloudinary(cloudName, apiKey, apiSecret string) error {
	var err error
	cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret,)
	if err != nil {
		panic(err)
	}
}