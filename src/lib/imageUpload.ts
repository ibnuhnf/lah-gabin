'use client';

import { useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from '@/types';

export interface UploadResult {
  url: string;
  storage: 'supabase' | 'base64';
}

const STORAGE_BUCKET = 'products';

/**
 * Try to upload file to Supabase Storage.
 * On any failure, fall back to base64 data URI so the UI never breaks.
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  // Base64 fallback (always works)
  const base64 = await fileToDataURI(file);

  if (!isSupabaseConfigured()) {
    return { url: base64, storage: 'base64' };
  }

  try {
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-');
    const fileName = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase upload failed, using base64:', error.message);
      return { url: base64, storage: 'base64' };
    }

    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return { url: pub.publicUrl, storage: 'supabase' };
  } catch (err) {
    console.warn('Upload exception, using base64:', err);
    return { url: base64, storage: 'base64' };
  }
}

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Hook for managing product image upload state with preview.
 */
export function useProductImageUpload(initial?: string) {
  const [preview, setPreview] = useState<string>(initial || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    // Immediate local preview
    const tempUri = URL.createObjectURL(file);
    setPreview(tempUri);

    try {
      const result = await uploadProductImage(file);
      setPreview(result.url);
      URL.revokeObjectURL(tempUri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return { preview, setPreview, uploading, error, inputRef, handleFileChange, clear };
}

export function getProductImage(p: Product | { image_urls?: string[] | null }): string {
  const urls = (p as any).image_urls;
  if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
    return urls[0];
  }
  return '';
}
