-- Allow private image uploads for the server-side OCR path.

update storage.buckets
set allowed_mime_types = array[
  'application/json',
  'application/msword',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/markdown',
  'text/plain'
]::text[]
where id = 'documents';
