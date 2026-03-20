package cloudinary

import (
	"context"
	"io"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var cld *cloudinary.Cloudinary

func InitCloudinary(cloudName, apiKey, apiSecret string) error {
	var err error
	cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	return err
}

// ✅ ADD THIS
func Upload(ctx context.Context, file io.Reader, params uploader.UploadParams) (*uploader.UploadResult, error) {
	return cld.Upload.Upload(ctx, file, params)
}