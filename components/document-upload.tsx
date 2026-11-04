'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useDocumentUpload } from '@/hooks/use-documents'
import { useApiToast } from '@/hooks/use-api-toast'
import type { DocumentUploadResponse } from '@/lib/api-types'
import { useLanguage } from '@/lib/language-context'

const U = {
  en: { title: 'Upload documents', drag: 'Drag files here, or choose them from your computer', formats: 'PDF, JPEG, PNG or DOCX · up to 50 MB each', select: 'Choose files',
        selected: (n: number) => `Selected files (${n})`, uploading: 'Uploading…', upload: (n: number) => `Upload ${n} file${n === 1 ? '' : 's'}`,
        ok: 'Upload complete', okText: (n: number) => `${n} file${n === 1 ? '' : 's'} uploaded` },
  zh: { title: '上传文件', drag: '将文件拖到此处，或从电脑中选择', formats: 'PDF、JPEG、PNG 或 DOCX · 每个不超过 50 MB', select: '选择文件',
        selected: (n: number) => `已选择 ${n} 个文件`, uploading: '正在上传…', upload: (n: number) => `上传 ${n} 个文件`,
        ok: '上传完成', okText: (n: number) => `已上传 ${n} 个文件` },
}

interface DocumentUploadProps {
  customerId: string
  onUploadComplete?: (results: DocumentUploadResponse[]) => void
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function DocumentUpload({
  customerId,
  onUploadComplete,
}: DocumentUploadProps) {
  const { language } = useLanguage()
  const u = U[language] ?? U.en
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadResults, setUploadResults] = useState<DocumentUploadResponse[]>(
    []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { upload, uploading } = useDocumentUpload(customerId)
  const { handleError, showSuccess } = useApiToast()

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Allowed types: PDF, JPEG, PNG, DOCX`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 50MB`
    }
    return null
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const errors: string[] = []
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      handleError(new Error(errors.join('\n')))
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      const results = await upload(selectedFiles)
      if (results) {
        setUploadResults(results)
        showSuccess(
          u.ok,
          u.okText(results.length)
        )
        setSelectedFiles([])
        if (onUploadComplete) {
          onUploadComplete(results)
        }
      }
    } catch (err) {
      handleError(err)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {u.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {u.drag}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {u.formats}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {u.select}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  {u.selected(selectedFiles.length)}
                </h4>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading
                    ? u.uploading
                    : u.upload(selectedFiles.length)}
                </Button>
              </div>

              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uploadResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Upload Results
              </h4>

              {uploadResults.map((result) => (
                <div
                  key={result.document_id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {result.filename}
                      </p>
                      <p className="text-xs text-green-700">
                        {formatFileSize(result.file_size_bytes)} • {result.status}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
