from cloudinary_storage.storage import MediaCloudinaryStorage


class ResumeCloudinaryStorage(MediaCloudinaryStorage):

    def _upload(self, name, content):
        options = self.get_options(name)
        options["resource_type"] = "raw"

        return self.cloudinary.uploader.upload(
            content,
            **options
        )