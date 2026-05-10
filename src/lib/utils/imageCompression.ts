// Client-side image compression + WebP conversion using Canvas API (zero dependencies)

interface CompressOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number   // 0-1
    maxSizeKB?: number
}

export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<{ blob: Blob; dataUrl: string; sizeKB: number }> {
    const {
        maxWidth = 1200,
        maxHeight = 900,
        quality = 0.82,
        maxSizeKB = 300,
    } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)

            const canvas = document.createElement('canvas')
            let { width, height } = img

            // Scale down maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height)
                width = Math.round(width * ratio)
                height = Math.round(height * ratio)
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas context unavailable'))

            ctx.drawImage(img, 0, 0, width, height)

            // Try progressively lower quality until under maxSizeKB
            let q = quality
            const attempt = () => {
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Compression failed'))
                    const sizeKB = blob.size / 1024

                    if (sizeKB <= maxSizeKB || q <= 0.3) {
                        const fr = new FileReader()
                        fr.onload = (ev) => resolve({
                            blob,
                            dataUrl: ev.target?.result as string,
                            sizeKB: Math.round(sizeKB),
                        })
                        fr.readAsDataURL(blob)
                    } else {
                        q -= 0.1
                        attempt()
                    }
                }, 'image/webp', q)
            }

            attempt()
        }

        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
        img.src = objectUrl
    })
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
