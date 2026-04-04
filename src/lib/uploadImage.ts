'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Converts any image File to WebP format using the Canvas API.
 * Quality: 0.82 — optimal balance between size and visual fidelity.
 */
export async function convertToWebP(file: File, quality = 0.82): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            // Cap very large images to 1920px max dimension
            const MAX_DIM = 1920
            let width = img.width
            let height = img.height

            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round((height / width) * MAX_DIM)
                    width = MAX_DIM
                } else {
                    width = Math.round((width / height) * MAX_DIM)
                    height = MAX_DIM
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                URL.revokeObjectURL(url)
                reject(new Error('Canvas context not available'))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url)
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to convert to WebP'))
                    }
                },
                'image/webp',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load image'))
        }

        img.src = url
    })
}

/**
 * Uploads an image file to Supabase Storage, converting it to WebP first.
 * Returns the public URL of the uploaded image.
 * 
 * @param file - The image file to upload
 * @param folder - Storage folder path, e.g. 'products', 'landing', 'gallery'
 * @returns The public URL string
 */
export async function uploadImage(file: File, folder: string = 'general'): Promise<string> {
    const supabase = createClient()

    // 1. Convert to WebP
    const webpBlob = await convertToWebP(file)

    // 2. Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${folder}/${timestamp}_${randomId}.webp`

    // 3. Upload to Supabase Storage
    const { error } = await supabase.storage
        .from('workshop-images')
        .upload(fileName, webpBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year cache
            upsert: false
        })

    if (error) {
        throw new Error(`Upload failed: ${error.message}`)
    }

    // 4. Get public URL
    const { data: urlData } = supabase.storage
        .from('workshop-images')
        .getPublicUrl(fileName)

    return urlData.publicUrl
}

/**
 * Deletes an image from Supabase Storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
    const supabase = createClient()

    // Extract path from the public URL
    const bucketPart = '/workshop-images/'
    const idx = publicUrl.indexOf(bucketPart)
    if (idx === -1) return // Not a storage URL, skip

    const filePath = publicUrl.substring(idx + bucketPart.length)

    await supabase.storage
        .from('workshop-images')
        .remove([filePath])
}
