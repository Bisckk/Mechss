                                                            -- Migration: 00009_storage_images_bucket
                                                            -- Description: Creates a public storage bucket for workshop images (products, landing, etc.)
                                                            -- All images are converted to WebP client-side before upload for optimal performance.

                                                            -- Create the bucket
                                                            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
                                                            VALUES (
                                                                'workshop-images',
                                                                'workshop-images',
                                                                true,
                                                                5242880, -- 5MB max
                                                                ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
                                                            ) ON CONFLICT (id) DO NOTHING;

                                                            -- Public read access (anyone can view product/landing images)
                                                            CREATE POLICY "Public can view workshop images"
                                                            ON storage.objects FOR SELECT
                                                            USING (bucket_id = 'workshop-images');

                                                            -- Authenticated users can upload images
                                                            CREATE POLICY "Authenticated users can upload images"
                                                            ON storage.objects FOR INSERT
                                                            WITH CHECK (
                                                                bucket_id = 'workshop-images'
                                                                AND auth.role() = 'authenticated'
                                                            );

                                                            -- Authenticated users can update their own images
                                                            CREATE POLICY "Authenticated users can update images"
                                                            ON storage.objects FOR UPDATE
                                                            USING (
                                                                bucket_id = 'workshop-images'
                                                                AND auth.role() = 'authenticated'
                                                            );

                                                            -- Authenticated users can delete their own images
                                                            CREATE POLICY "Authenticated users can delete images"
                                                            ON storage.objects FOR DELETE
                                                            USING (
                                                                bucket_id = 'workshop-images'
                                                                AND auth.role() = 'authenticated'
                                                            );
