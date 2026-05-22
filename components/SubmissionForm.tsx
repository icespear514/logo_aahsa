'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSubmission } from '@/app/actions'
import { Button } from '@/components/ui/Button'

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export function SubmissionForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleFile(selected: File) {
    setError(null)
    if (!ACCEPTED_MIME_TYPES.includes(selected.type)) {
      setError('Please upload a PNG, JPG, WebP, GIF, or SVG file.')
      return
    }
    if (selected.size > MAX_BYTES) {
      setError('File must be 5MB or smaller.')
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const selected = e.dataTransfer.files?.[0]
    if (selected) handleFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !file) {
      setError('Please provide your email and a logo file.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const submission_id = crypto.randomUUID()
      const ext = file.name.split('.').pop()
      const safeFilename = `${submission_id}.${ext}`
      const storagePath = `logos/${submission_id}/${safeFilename}`

      // Direct client-side upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(storagePath, file, { contentType: file.type, upsert: false })

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(storagePath)

      // Server Action: insert DB row + send email
      const result = await createSubmission({
        submission_id,
        email,
        filename: file.name,
        storage_path: storagePath,
        public_url: publicUrl,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      router.push('/success')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-aahsa-navy mb-1"
        >
          Your email address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-aahsa-warmGray bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-semibold text-aahsa-navy mb-1">
          Logo file <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? 'border-aahsa-ochre bg-aahsa-ochre/5'
              : 'border-aahsa-warmGray bg-white hover:border-aahsa-teal'
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Logo preview"
              className="max-h-40 max-w-full object-contain rounded"
            />
          ) : (
            <>
              <svg
                className="mb-3 h-10 w-10 text-aahsa-warmGray"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Drag &amp; drop or{' '}
                <span className="font-semibold text-aahsa-teal">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, WebP, GIF, SVG — max 5MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME_TYPES.join(',')}
            onChange={onInputChange}
            className="sr-only"
          />
        </div>
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={submitting}
        className="w-full py-3 text-base"
      >
        {submitting ? 'Uploading…' : 'Submit My Logo'}
      </Button>
    </form>
  )
}
