'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, X } from 'lucide-react'

interface ResumeUploadProps {
  onUpload: (file: File) => void
  onRemove?: () => void
  uploadedFile?: { name: string; size: number } | null
}

export function ResumeUpload({ onUpload, onRemove, uploadedFile }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('')

    if (acceptedFiles.length === 0) {
      setError('Please upload a PDF file')
      return
    }

    const file = acceptedFiles[0]

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploading(true)

    try {
      onUpload(file)
    } catch (err) {
      setError('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: !!uploadedFile || uploading,
  })

  if (uploadedFile) {
    return (
      <div className="w-full max-w-md p-6 card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{uploadedFile.name}</p>
              <p className="text-sm text-navy-400">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-navy-400 hover:text-red-400 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : uploading
              ? 'border-navy-600 bg-navy-800/50 cursor-wait'
              : 'border-navy-600 bg-navy-800/30 hover:border-blue-500 hover:bg-navy-800/50'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-navy-300">Uploading...</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="w-16 h-16 text-blue-500" />
              <p className="text-white">Drop your resume here</p>
            </>
          ) : (
            <>
              <FileText className="w-16 h-16 text-navy-400" />
              <div>
                <p className="text-white mb-2">
                  Drag & drop your resume here
                </p>
                <p className="text-sm text-navy-400">or click to browse</p>
              </div>
              <p className="text-xs text-navy-500">PDF only, max 10MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
