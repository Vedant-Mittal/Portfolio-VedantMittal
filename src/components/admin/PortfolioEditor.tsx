import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Trash2, ImageIcon, Images, Upload, Pencil, GripVertical, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type EditableGalleryItem = {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  images: string[];
};

export type EditableWebsiteItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  screenshot: string;
  stack: string[];
};

type PortfolioContent = {
  designs: EditableGalleryItem[];
  websites: EditableWebsiteItem[];
  ai_designs?: EditableGalleryItem[];
};

const DEFAULT_CONTENT: PortfolioContent = {
  designs: [],
  websites: [],
  ai_designs: [],
};

async function getSection(section: string) {
  return await supabase
    .from('content_sections')
    .select('*')
    .eq('page_path', 'portfolio')
    .eq('section_identifier', section)
    .limit(1)
    .maybeSingle();
}

// Image upload helper function (disabled)
async function uploadImageToSupabase(_file: File, _folder: string = 'designs'): Promise<string> {
  throw new Error('Image uploads are disabled. Store images under public/media and paste a site-relative path like /media/portfolio/...');
}

async function upsertSection(section: string, name: string, content: Record<string, any>) {
  // First disable RLS temporarily for this operation
  try {
    console.log('🔧 Attempting to save with RLS bypass...');
    
    const { data: existing } = await getSection(section);
    if (existing) {
      // Use the service role or admin bypass if available
      const result = await supabase
        .from('content_sections')
        .update({ content: content as any, name, is_active: true })
        .eq('id', existing.id);
      console.log('Update result:', result);
      return result;
    }
    
    const result = await supabase
      .from('content_sections')
      .insert({ page_path: 'portfolio', section_identifier: section, name, is_active: true, content: content as any });
    console.log('Insert result:', result);
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}

export const PortfolioEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designs, setDesigns] = useState<EditableGalleryItem[]>([]);
  const [websites, setWebsites] = useState<EditableWebsiteItem[]>([]);
  const [aiDesigns, setAiDesigns] = useState<EditableGalleryItem[]>([]);
  // Local object-URL previews for newly uploaded (not-yet-deployed) files
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [dbMessage, setDbMessage] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [storageMessage, setStorageMessage] = useState<string>('');
  const websiteInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [bulkUploading, setBulkUploading] = useState<{ designs: boolean; ai: boolean }>({ designs: false, ai: false });
  const designsBulkInputRef = useRef<HTMLInputElement>(null);
  const aiBulkInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<{ target: 'designs' | 'ai'; designId: string; imageIndex: number } | null>(null);
  const [editingSingleId, setEditingSingleId] = useState<string | null>(null);
  const [editingAISingleId, setEditingAISingleId] = useState<string | null>(null);

  // Media manifest and picker state
  type MediaPickTarget =
    | { kind: 'design-image'; designId: string; imageIndex: number }
    | { kind: 'design-add'; designId: string }
    | { kind: 'ai-image'; designId: string; imageIndex: number }
    | { kind: 'ai-add'; designId: string }
    | { kind: 'ai-create' }
    | { kind: 'website-screenshot'; websiteId: string };
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaPickTarget | null>(null);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [mediaQuery, setMediaQuery] = useState('');
  const filteredMedia = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase();
    if (!q) return mediaFiles;
    return mediaFiles.filter((p) => p.toLowerCase().includes(q));
  }, [mediaQuery, mediaFiles]);

  const openMediaPicker = async (target: MediaPickTarget) => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
    try {
      if (mediaFiles.length === 0) {
        const res = await fetch('/media-manifest.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load media manifest');
        const data = await res.json();
        const files = Array.isArray(data?.files) ? (data.files as string[]) : [];
        setMediaFiles(files);
      }
    } catch (e: any) {
      toast({ title: 'Failed to load media list', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const applyPickedMedia = (path: string) => {
    if (!mediaPickerTarget) return;
    const t = mediaPickerTarget;
    if (t.kind === 'design-image') {
      updateImageInDesign(t.designId, t.imageIndex, path);
    } else if (t.kind === 'design-add') {
      addImageToDesign(t.designId, path);
    } else if (t.kind === 'ai-image') {
      setAiDesigns(prev => prev.map(d => d.id === t.designId ? { ...d, images: d.images.map((img, idx) => idx === t.imageIndex ? path : img) } : d));
    } else if (t.kind === 'ai-add') {
      setAiDesigns(prev => prev.map(d => d.id === t.designId ? { ...d, images: [...d.images, path] } : d));
    } else if (t.kind === 'ai-create') {
      setAiDesigns(prev => [{ id: crypto.randomUUID(), type: 'single', title: 'Untitled', images: [path] }, ...prev]);
    } else if (t.kind === 'website-screenshot') {
      updateWebsite(t.websiteId, { screenshot: path });
    }
    setMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  // Migration function to convert old data format to new format
  const migrateOldDesignData = (oldItem: any): EditableGalleryItem => {
    return {
      id: oldItem.id || crypto.randomUUID(),
      type: 'single',
      title: oldItem.alt || oldItem.title || `${oldItem.category} Design`,
      images: [oldItem.src || ''],
    };
  };

  // Image helpers: normalize in-site paths and Git upload
  const normalizeSitePath = (url: string): string => {
    if (!url) return url;
    const u = url.trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/')) return u;
    if (u.startsWith('public/')) return `/${u.replace(/^public\//, '')}`;
    if (u.startsWith('media/')) return `/${u}`;
    return u;
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadToGit = async (file: File, folder: string): Promise<string> => {
    const contentBase64 = await fileToDataUrl(file);
    const resp = await fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentBase64, name: file.name, folder })
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(t || 'Upload failed');
    }
    const json = await resp.json();
    return json.sitePath as string;
  };

  // Preview helper component (prefers local object URL while deploy catches up)
  function SmartPreview({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const normalized = ((): string => {
      if (!src) return '/placeholder.svg';
      const u = src.trim();
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith('/')) return u;
      if (u.startsWith('public/')) return `/${u.replace(/^public\//, '')}`;
      if (u.startsWith('media/')) return `/${u}`;
      return u;
    })();

    const preferred = localPreviews[normalized] || normalized;
    return (
      <img
        src={preferred}
        alt={alt}
        className={className}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src !== normalized) {
            img.src = normalized; // fall back from object URL to site path
          } else if (img.src !== '/placeholder.svg') {
            img.src = '/placeholder.svg';
          }
        }}
      />
    );
  }

  const load = async () => {
    setDbStatus('checking');
    setDbMessage('');
    try {
      const [{ data: dSec, error: dErr }, { data: wSec, error: wErr }, { data: aiSec, error: aiErr }] = await Promise.all([
        getSection('designs'),
        getSection('websites'),
        getSection('ai_designs'),
      ]);
      if (dErr) throw dErr;
      if (wErr) throw wErr;
      if (aiErr) throw aiErr;
      
      const dContent = (dSec?.content as any)?.items as any[] | undefined;
      const wContent = (wSec?.content as any)?.items as EditableWebsiteItem[] | undefined;
      const aiContent = (aiSec?.content as any)?.items as any[] | undefined;
      
      // Handle design data migration
      let dItems: EditableGalleryItem[] = [];
      if (Array.isArray(dContent) && dContent.length > 0) {
        const firstItem = dContent[0];
        if (firstItem.src && !firstItem.type) {
          // Old format detected - migrate to new format
          console.log('🔄 Migrating old design data format to new format...');
          dItems = dContent.map(migrateOldDesignData);
          setDbMessage('Migrated old data format to new format');
        } else {
          // New format already
          dItems = dContent as EditableGalleryItem[];
        }
      }
      
      const wItems = Array.isArray(wContent) ? wContent : [];
      let aiItems: EditableGalleryItem[] = [];
      if (Array.isArray(aiContent) && aiContent.length > 0) {
        const firstItem = aiContent[0];
        if (firstItem.src && !firstItem.type) {
          aiItems = aiContent.map(migrateOldDesignData);
        } else {
          aiItems = aiContent as EditableGalleryItem[];
        }
      }
      setDesigns(dItems);
      setWebsites(wItems);
      setAiDesigns(aiItems);
      setDbStatus('ok');
      setDbMessage(`Loaded ${dItems.length} designs, ${wItems.length} websites, ${aiItems.length} AI designs`);
    } catch (e: any) {
      console.error('Error loading portfolio content', e);
      setDbStatus('error');
      setDbMessage(e?.message || 'Unknown error');
      toast({ title: 'Failed to load portfolio content', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkStorageBucket = async () => {
    setStorageStatus('error');
    setStorageMessage('Supabase Storage uploads are disabled. Store images in the repo under public/media and paste site-relative paths (e.g., /media/portfolio/designs/...).');
  };

  useEffect(() => { 
    load(); 
    checkStorageBucket();
  }, []);

  const addDesign = () => {
    setDesigns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'single', title: '', images: [''] },
    ]);
  };

  const removeDesign = (id: string) => setDesigns((prev) => prev.filter((d) => d.id !== id));

  const updateDesign = (id: string, patch: Partial<EditableGalleryItem>) =>
    setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const addWebsite = () => {
    setWebsites((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: '', description: '', url: '', screenshot: '', stack: [] },
    ]);
  };

  const removeWebsite = (id: string) => setWebsites((prev) => prev.filter((w) => w.id !== id));

  const updateWebsite = (id: string, patch: Partial<EditableWebsiteItem>) =>
    setWebsites((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const addStackTag = (id: string, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setWebsites((prev) => prev.map((w) => (w.id === id ? { ...w, stack: [...new Set([...(w.stack || []), t])] } : w)));
  };

  const removeStackTag = (id: string, tag: string) =>
    setWebsites((prev) => prev.map((w) => (w.id === id ? { ...w, stack: (w.stack || []).filter((s) => s !== tag) } : w)));

  const handleSave = async () => {
    setSaving(true);
    try {
      const designsPayload = { items: designs };
      const websitesPayload = { items: websites };
      const aiPayload = { items: aiDesigns };
      const [dRes, wRes, aiRes] = await Promise.all([
        upsertSection('designs', 'Portfolio Designs Gallery', designsPayload),
        upsertSection('websites', 'Portfolio Websites', websitesPayload),
        upsertSection('ai_designs', 'AI Designs', aiPayload),
      ]);
      if (dRes.error) throw dRes.error;
      if (wRes.error) throw wRes.error;
      if (aiRes.error) throw aiRes.error;
      toast({ title: 'Saved', description: 'Portfolio content saved successfully.' });
      setDbStatus('ok');
      setDbMessage('Saved changes to Supabase');
    } catch (e: any) {
      console.error('Save error', e);
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
      setDbStatus('error');
      setDbMessage(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = useMemo(() => designs.length === 0 && websites.length === 0, [designs.length, websites.length]);

  // Helper functions for image management
  const addImageToDesign = (designId: string, imageUrl: string) => {
    if (!imageUrl.trim()) return;
    setDesigns(prev => prev.map(d => 
      d.id === designId 
        ? { ...d, images: [...d.images, imageUrl] }
        : d
    ));
  };

  // Generic reorder helper
  function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  // Bulk upload helpers
  const uploadManyImages = async (files: File[], folder: string) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      throw new Error('No valid image files selected.');
    }
    const uploads = await Promise.all(imageFiles.map(async (file) => {
      const url = await uploadImageToSupabase(file, folder);
      return { file, url };
    }));
    return uploads;
  };

  const handleBulkAddDesigns = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBulkUploading(prev => ({ ...prev, designs: true }));
    try {
      const files = Array.from(fileList);
      const uploads = await uploadManyImages(files, 'designs');
      const newItems: EditableGalleryItem[] = uploads.map(({ file, url }) => ({
        id: crypto.randomUUID(),
        type: 'single',
        title: file.name.replace(/\.[^.]+$/, ''),
        images: [url],
      }));
      setDesigns(prev => [...newItems, ...prev]);
      toast({ title: 'Bulk upload complete', description: `${newItems.length} designs added.` });
    } catch (e: any) {
      toast({ title: 'Bulk upload failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBulkUploading(prev => ({ ...prev, designs: false }));
      if (designsBulkInputRef.current) designsBulkInputRef.current.value = '';
    }
  };

  const handleBulkAddAIDesigns = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBulkUploading(prev => ({ ...prev, ai: true }));
    try {
      const files = Array.from(fileList);
      const uploads = await uploadManyImages(files, 'ai-designs');
      const newItems: EditableGalleryItem[] = uploads.map(({ file, url }) => ({
        id: crypto.randomUUID(),
        type: 'single',
        title: file.name.replace(/\.[^.]+$/, ''),
        images: [url],
      }));
      setAiDesigns(prev => [...newItems, ...prev]);
      toast({ title: 'Bulk upload complete', description: `${newItems.length} AI designs added.` });
    } catch (e: any) {
      toast({ title: 'Bulk upload failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBulkUploading(prev => ({ ...prev, ai: false }));
      if (aiBulkInputRef.current) aiBulkInputRef.current.value = '';
    }
  };

  // Replace a single image within a design by uploading a new one
  const handleReplaceImage = async (
    target: 'designs' | 'ai',
    designId: string,
    imageIndex: number,
    file: File
  ) => {
    try {
      if (!file.type.startsWith('image/')) throw new Error('Only image files allowed.');
      const folder = target === 'ai' ? 'ai-designs' : 'designs';
      const url = await uploadImageToSupabase(file, folder);
      if (target === 'ai') {
        setAiDesigns(prev => prev.map(d => d.id === designId ? { ...d, images: d.images.map((img, idx) => idx === imageIndex ? url : img) } : d));
      } else {
        updateImageInDesign(designId, imageIndex, url);
      }
      toast({ title: 'Image replaced' });
    } catch (e: any) {
      toast({ title: 'Replace failed', description: e.message, variant: 'destructive' });
    }
  };

  // Upload many images into an existing carousel
  const handleUploadToCarousel = async (
    target: 'designs' | 'ai',
    designId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    try {
      const folder = target === 'ai' ? 'ai-designs' : 'designs';
      const uploads = await uploadManyImages(Array.from(files), folder);
      const urls = uploads.map(u => u.url);
      if (target === 'ai') {
        setAiDesigns(prev => prev.map(d => d.id === designId ? { ...d, images: [...d.images, ...urls] } : d));
      } else {
        setDesigns(prev => prev.map(d => d.id === designId ? { ...d, images: [...d.images, ...urls] } : d));
      }
      toast({ title: 'Images uploaded', description: `${urls.length} added.` });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  // Reorder images inside a specific carousel
  const handleReorderCarouselImages = (
    target: 'designs' | 'ai',
    designId: string,
    from: number,
    to: number
  ) => {
    if (from === to) return;
    const apply = (arr: EditableGalleryItem[]) => arr.map(d => {
      if (d.id !== designId) return d;
      const newImages = reorderArray(d.images, from, to);
      return { ...d, images: newImages };
    });
    if (target === 'ai') setAiDesigns(prev => apply(prev)); else setDesigns(prev => apply(prev));
  };

  // Reorder carousel blocks themselves
  const handleReorderCarousels = (
    target: 'designs' | 'ai',
    from: number,
    to: number
  ) => {
    const apply = (arr: EditableGalleryItem[]) => {
      const singles = arr.filter(d => d.type === 'single');
      const carousels = arr.filter(d => d.type === 'carousel');
      const newCarousels = reorderArray(carousels, from, to);
      return [...singles, ...newCarousels];
    };
    if (target === 'ai') setAiDesigns(prev => apply(prev)); else setDesigns(prev => apply(prev));
  };

  // Reorder single posts
  const handleReorderSingles = (
    target: 'designs' | 'ai',
    from: number,
    to: number
  ) => {
    const apply = (arr: EditableGalleryItem[]) => {
      const singles = arr.filter(d => d.type === 'single');
      const carousels = arr.filter(d => d.type === 'carousel');
      const newSingles = reorderArray(singles, from, to);
      return [...newSingles, ...carousels];
    };
    if (target === 'ai') setAiDesigns(prev => apply(prev)); else setDesigns(prev => apply(prev));
  };

  const updateImageInDesign = (designId: string, imageIndex: number, newUrl: string) => {
    setDesigns(prev => prev.map(d => 
      d.id === designId 
        ? { ...d, images: d.images.map((img, idx) => idx === imageIndex ? newUrl : img) }
        : d
    ));
  };

  const removeImageFromDesign = (designId: string, imageIndex: number) => {
    setDesigns(prev => prev.map(d => 
      d.id === designId 
        ? { ...d, images: d.images.filter((_, idx) => idx !== imageIndex) }
        : d
    ));
  };

  // DesignEditor Component
  interface DesignEditorProps {
    design: EditableGalleryItem;
    onUpdate: (id: string, patch: Partial<EditableGalleryItem>) => void;
    onRemove: (id: string) => void;
    onAddImage: (designId: string, imageUrl: string) => void;
    onUpdateImage: (designId: string, imageIndex: number, newUrl: string) => void;
    onRemoveImage: (designId: string, imageIndex: number) => void;
  }

  function DesignEditor({ design, onUpdate, onRemove, onAddImage, onUpdateImage, onRemoveImage }: DesignEditorProps) {
    const [newImageUrl, setNewImageUrl] = useState('');
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [uploadingNew, setUploadingNew] = useState(false);
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const newImageInputRef = useRef<HTMLInputElement>(null);

    const handleAddImage = () => {
      if (newImageUrl.trim()) {
        onAddImage(design.id, newImageUrl.trim());
        setNewImageUrl('');
      }
    };

  const handleFileUpload = async (file: File, imageIndex?: number) => {
      if (imageIndex !== undefined) {
        setUploadingIndex(imageIndex);
      } else {
        setUploadingNew(true);
      }

      try {
        // Validate file type - allow images for all design types
        const isImage = file.type.startsWith('image/');
        
        if (!isImage) {
          throw new Error('Only image files are allowed.');
        }
        
        // Upload to GitHub via /api/upload-media
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        const resp = await fetch('/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentBase64, name: file.name, folder: 'designs' })
        });
        if (!resp.ok) throw new Error('Upload failed');
        const json = await resp.json();
        const uploadedUrl = json.sitePath as string;
        // Set temporary preview using object URL until deploy serves the file
        const tempUrl = URL.createObjectURL(file);
        setLocalPreviews((prev) => ({ ...prev, [uploadedUrl]: tempUrl, [uploadedUrl.replace(/^\//, '')]: tempUrl }));
        
        if (imageIndex !== undefined) {
          // Replace existing image
          onUpdateImage(design.id, imageIndex, uploadedUrl);
        } else {
          // Add new image
          onAddImage(design.id, uploadedUrl);
        }
        
        toast({ title: 'Image uploaded successfully!', description: 'Your image has been uploaded and added to the design.' });
        
        // Clear the file input value to allow re-selecting the same file
        if (imageIndex !== undefined) {
          const inputRef = fileInputRefs.current[`${design.id}-${imageIndex}`];
          if (inputRef) inputRef.value = '';
        } else {
          if (newImageInputRef.current) newImageInputRef.current.value = '';
        }
      } catch (error: any) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      } finally {
        setUploadingIndex(null);
        setUploadingNew(false);
      }
    };

    const handleMultipleNewFiles = async (files: File[]) => {
      if (!files.length) return;
      setUploadingNew(true);
      try {
        for (const file of files) {
          const isImage = file.type.startsWith('image/');
          if (!isImage) continue;
          const contentBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          const resp = await fetch('/api/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentBase64, name: file.name, folder: 'designs' })
          });
          if (!resp.ok) throw new Error('Upload failed');
          const json = await resp.json();
          const uploadedUrl = json.sitePath as string;
          const tempUrl = URL.createObjectURL(file);
          setLocalPreviews((prev) => ({ ...prev, [uploadedUrl]: tempUrl, [uploadedUrl.replace(/^\//, '')]: tempUrl }));
          onAddImage(design.id, uploadedUrl);
        }
        toast({ title: 'Images uploaded', description: `${files.length} image(s) added to this design.` });
      } catch (error: any) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      } finally {
        setUploadingNew(false);
        if (newImageInputRef.current) newImageInputRef.current.value = '';
      }
    };

    const hasValidImages = design.images.some(img => img.trim() !== '');
    const isCarousel = design.type === 'carousel';

    return (
      <div className="p-4 glass-card rounded-md">
        <div className="grid grid-cols-1 gap-3">
          {/* Type Selection */}
          <div>
            <Label>Design Type</Label>
            <div className="flex gap-2">
              <Button variant={design.type === 'single' ? 'default' : 'outline'} className={design.type === 'single' ? 'bg-primary text-primary-foreground' : 'glass-card'} onClick={() => onUpdate(design.id, { type: 'single' })}>
                <ImageIcon className="h-4 w-4 mr-1" /> Single
              </Button>
              <Button variant={design.type === 'carousel' ? 'default' : 'outline'} className={design.type === 'carousel' ? 'bg-primary text-primary-foreground' : 'glass-card'} onClick={() => onUpdate(design.id, { type: 'carousel' })}>
                <Images className="h-4 w-4 mr-1" /> Carousel
              </Button>
            </div>
          </div>

          {/* Images Management */}
          <div>
            <Label>
              {isCarousel ? 'Images (Multiple supported for carousel)' : 'Image'}
            </Label>
            
            {/* Existing Images */}
            <div className="space-y-3 mt-2">
              {design.images.map((imageUrl, index) => (
                <div key={index} className="grid grid-cols-1 gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => onUpdateImage(design.id, index, e.target.value)}
                      className="glass-card flex-1"
                      placeholder="Image URL (https://imgur.com/... recommended)"
                    />
                  <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="glass-card"
                        onClick={() => openMediaPicker({ kind: 'design-image', designId: design.id, imageIndex: index })}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      {(design.images.length > 1 || !isCarousel) && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="glass-card hover:bg-destructive/20"
                          onClick={() => onRemoveImage(design.id, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Google Drive Warning */}
                  {imageUrl && imageUrl.includes('drive.google.com') && (
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">
                        ⚠️ Google Drive links may not display reliably. Consider using Imgur, GitHub, or another direct image hosting service.
                      </span>
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  {imageUrl && (
                    <div className="w-full h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img 
                        src={imageUrl.includes('drive.google.com') ? 
                          imageUrl.replace('/file/d/', '/uc?export=view&id=').replace('/view?usp=sharing', '') :
                          imageUrl
                        }
                        alt={design.title || `Image ${index + 1}`} 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.error-message')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error-message text-red-500 text-sm text-center p-4';
                            errorDiv.textContent = '❌ Image failed to load. Check URL or try a different hosting service.';
                            parent.appendChild(errorDiv);
                          }
                        }}
                        onLoad={(e) => {
                          const parent = e.currentTarget.parentElement;
                          const errorMsg = parent?.querySelector('.error-message');
                          if (errorMsg) errorMsg.remove();
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Image (for carousel) */}
            {isCarousel && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="glass-card flex-1"
                    placeholder="Add another image URL"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="glass-card"
                    onClick={handleAddImage}
                    disabled={!newImageUrl.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add URL
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="glass-card"
                      onClick={() => openMediaPicker({ kind: 'design-add', designId: design.id })}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" /> Pick from Repo
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden" ref={newImageInputRef}
                      onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) { handleMultipleNewFiles(files); } }} />
                    <Button type="button" variant="outline" className="glass-card" onClick={() => newImageInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {isCarousel ? `${design.images.filter(img => img.trim()).length} images` : hasValidImages ? '1 image' : 'No images'}
            </div>
            <Button 
              variant="outline" 
              className="glass-card hover:bg-destructive/20" 
              onClick={() => onRemove(design.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Design
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Portfolio Content Editor</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={load}
            className="glass-card"
            disabled={loading}
          >
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={saving} className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">📷 Image Source</h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>Use site-relative paths from the repo:</strong> place images under <code>/public/media</code> and paste paths like <code>/media/portfolio/designs/your-image.webp</code>.</p>
          <p>External hosts still work if they serve direct image URLs.</p>
          <p className="text-yellow-700 dark:text-yellow-300"><strong>Note:</strong> Supabase Storage uploads are disabled to reduce egress.</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {dbStatus === 'checking' && (
          <div className="text-sm text-muted-foreground">Checking Supabase connection…</div>
        )}
        {dbStatus === 'ok' && (
          <div className="text-sm text-emerald-600">✓ Database: {dbMessage}</div>
        )}
        {dbStatus === 'error' && (
          <div className="text-sm text-destructive">✗ Database error: {dbMessage}</div>
        )}
        
        {storageStatus === 'error' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm text-destructive font-medium">✗ Storage Error</div>
            <div className="text-sm text-destructive/80 mt-1">{storageMessage}</div>
            <div className="text-sm text-muted-foreground mt-2">Paste site-relative paths from /public/media.</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="designs">
        <TabsList className="mb-4">
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="ai">AI Designs</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
        </TabsList>

        <TabsContent value="designs">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Designs Gallery</h2>
          </div>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Post</TabsTrigger>
              <TabsTrigger value="carousel">Carousel</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={designsBulkInputRef}
                    onChange={(e) => handleBulkAddDesigns(e.target.files)}
                    data-testid="bulk-input-designs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="glass-card"
                    onClick={() => designsBulkInputRef.current?.click()}
                    disabled={bulkUploading.designs}
                  >
                    {bulkUploading.designs ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Upload Images
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {designs.filter(d => d.type === 'single').map((d, idx, arr) => (
                    <div
                      key={d.id}
                      className="relative group rounded-md border border-border/50 overflow-hidden bg-muted"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                        if (!Number.isNaN(from) && from >= 0) handleReorderSingles('designs', from, idx);
                      }}
                    >
                      <SmartPreview src={normalizeSitePath(d.images[0] || '/placeholder.svg')} alt={d.title || 'Design'} className="w-full h-36 object-cover" />
                      <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-black/40 text-white">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => setEditingSingleId(d.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-6 w-6 hover:bg-destructive/20" onClick={() => removeDesign(d.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-2">
                        {editingSingleId === d.id ? (
                          <Input
                            autoFocus
                            defaultValue={d.title}
                            className="h-8"
                            onBlur={(e) => { updateDesign(d.id, { title: e.target.value }); setEditingSingleId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { updateDesign(d.id, { title: (e.target as HTMLInputElement).value }); setEditingSingleId(null); }}}
                          />
                        ) : (
                          <div className="text-xs text-foreground truncate">{d.title || 'Untitled'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {designs.filter(d => d.type === 'single').length === 0 && (
                    <div className="text-sm text-muted-foreground">No single posts yet. Upload images to create posts.</div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="carousel">
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="glass-card"
                  onClick={() => setDesigns(prev => {
                    const singles = prev.filter(x => x.type === 'single');
                    const carousels = prev.filter(x => x.type === 'carousel');
                    const newCarousel: EditableGalleryItem = { id: crypto.randomUUID(), type: 'carousel', title: 'Untitled Carousel', images: [] };
                    return [...singles, ...carousels, newCarousel];
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add New Carousel
                </Button>
              </div>
              {designs.filter(d => d.type === 'carousel').length === 0 ? (
                <div className="text-sm text-muted-foreground">No carousels yet. Create one to start adding images.</div>
              ) : (
                <div className="space-y-3">
                  {designs.filter(d => d.type === 'carousel').map((d, idx) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-md border border-border/60 bg-background/40"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                        if (!Number.isNaN(from) && from >= 0) handleReorderCarousels('designs', from, idx);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Input
                            defaultValue={d.title}
                            className="h-8 w-56"
                            onBlur={(e) => updateDesign(d.id, { title: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') updateDesign(d.id, { title: (e.target as HTMLInputElement).value }); }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="glass-card" onClick={() => openMediaPicker({ kind: 'design-add', designId: d.id })}>
                    <ImageIcon className="h-4 w-4 mr-1" /> Add from Repo
                  </Button>
                  <Button size="sm" variant="outline" className="glass-card" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async (e: any) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      try {
                        const uploaded: string[] = [];
                        for (const file of files) {
                          const contentBase64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve((reader.result as string));
                            reader.onerror = () => reject(reader.error);
                            reader.readAsDataURL(file);
                          });
                          const resp = await fetch('/api/upload-media', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contentBase64, name: file.name, folder: 'designs' })
                          });
                          if (resp.ok) {
                            const j = await resp.json();
                            uploaded.push(j.sitePath);
                          }
                        }
                        if (uploaded.length) {
                          setDesigns(prev => prev.map(x => x.id === d.id ? { ...x, images: [...x.images, ...uploaded] } : x));
                          toast({ title: 'Uploaded', description: `${uploaded.length} image(s) added.` });
                        }
                      } catch (err: any) {
                        toast({ title: 'Upload failed', description: err?.message || 'Unknown error', variant: 'destructive' });
                      }
                    };
                    input.click();
                  }}>
                    <Upload className="h-4 w-4 mr-1" /> Upload
                  </Button>
                          <Button size="icon" variant="outline" className="glass-card hover:bg-destructive/20" onClick={() => removeDesign(d.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {d.images.map((url, imageIdx) => (
                          <div
                            key={`${d.id}-${imageIdx}`}
                            className="relative rounded-md overflow-hidden border border-border/50 bg-muted"
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(imageIdx))}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                              if (!Number.isNaN(from) && from >= 0) handleReorderCarouselImages('designs', d.id, from, imageIdx);
                            }}
                          >
                            <SmartPreview src={normalizeSitePath(url)} alt={d.title || 'Carousel image'} className="w-full h-24 object-cover" />
                            <div className="absolute top-1 left-1 text-white bg-black/40 rounded h-6 w-6 flex items-center justify-center">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                              <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => openMediaPicker({ kind: 'design-image', designId: d.id, imageIndex: imageIdx })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="secondary" className="h-6 w-6 hover:bg-destructive/20" onClick={() => onRemoveImage(d.id, imageIdx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {d.images.length === 0 && (
                          <div className="text-xs text-muted-foreground col-span-full">No images yet. Upload to add.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          {/* File replace input removed in favor of repo picker */}
        </Card>
        </TabsContent>

        <TabsContent value="ai">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">AI Designs</h2>
          </div>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Post</TabsTrigger>
              <TabsTrigger value="carousel">Carousel</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="glass-card" onClick={() => openMediaPicker({ kind: 'ai-create' })}>
                      <ImageIcon className="mr-2 h-4 w-4" /> Pick from Repo
                    </Button>
                    <Button type="button" variant="outline" className="glass-card" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = false; input.onchange = async (e: any) => { const file = (e.target.files || [])[0]; if (!file) return; const contentBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve((reader.result as string)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); const resp = await fetch('/api/upload-media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentBase64, name: file.name, folder: 'ai-designs' }) }); if (resp.ok) { const j = await resp.json(); const path = j.sitePath as string; const tempUrl = URL.createObjectURL(file); setLocalPreviews((prev) => ({ ...prev, [path]: tempUrl, [path.replace(/^\//, '')]: tempUrl })); setAiDesigns(prev => [{ id: crypto.randomUUID(), type: 'single', title: file.name.replace(/\.[^.]+$/, ''), images: [path] }, ...prev]); toast({ title: 'AI image uploaded' }); } }; input.click(); }}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Image
                    </Button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {aiDesigns.filter(d => d.type === 'single').map((d, idx) => (
                    <div
                      key={d.id}
                      className="relative group rounded-md border border-border/50 overflow-hidden bg-muted"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                        if (!Number.isNaN(from) && from >= 0) handleReorderSingles('ai', from, idx);
                      }}
                    >
                      <SmartPreview src={normalizeSitePath(d.images[0] || '/placeholder.svg')} alt={d.title || 'AI Design'} className="w-full h-36 object-cover" />
                      <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-black/40 text-white">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => setEditingAISingleId(d.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-6 w-6 hover:bg-destructive/20" onClick={() => setAiDesigns(prev => prev.filter(x => x.id !== d.id))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-2">
                        {editingAISingleId === d.id ? (
                          <Input
                            autoFocus
                            defaultValue={d.title}
                            className="h-8"
                            onBlur={(e) => { setAiDesigns(prev => prev.map(x => x.id === d.id ? { ...x, title: e.target.value } : x)); setEditingAISingleId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { setAiDesigns(prev => prev.map(x => x.id === d.id ? { ...x, title: (e.target as HTMLInputElement).value } : x)); setEditingAISingleId(null); }}}
                          />
                        ) : (
                          <div className="text-xs text-foreground truncate">{d.title || 'Untitled'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {aiDesigns.filter(d => d.type === 'single').length === 0 && (
                    <div className="text-sm text-muted-foreground">No single posts yet. Upload images to create posts.</div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="carousel">
              <div className="flex items-center justify-between mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="glass-card"
                  onClick={() => setAiDesigns(prev => {
                    const singles = prev.filter(x => x.type === 'single');
                    const carousels = prev.filter(x => x.type === 'carousel');
                    const newCarousel: EditableGalleryItem = { id: crypto.randomUUID(), type: 'carousel', title: 'Untitled Carousel', images: [] };
                    return [...singles, ...carousels, newCarousel];
                  })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add New Carousel
                </Button>
              </div>
              {aiDesigns.filter(d => d.type === 'carousel').length === 0 ? (
                <div className="text-sm text-muted-foreground">No carousels yet. Create one to start adding images.</div>
              ) : (
                <div className="space-y-3">
                  {aiDesigns.filter(d => d.type === 'carousel').map((d, idx) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-md border border-border/60 bg-background/40"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                        if (!Number.isNaN(from) && from >= 0) handleReorderCarousels('ai', from, idx);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Input
                            defaultValue={d.title}
                            className="h-8 w-56"
                            onBlur={(e) => setAiDesigns(prev => prev.map(x => x.id === d.id ? { ...x, title: e.target.value } : x))}
                            onKeyDown={(e) => { if (e.key === 'Enter') setAiDesigns(prev => prev.map(x => x.id === d.id ? { ...x, title: (e.target as HTMLInputElement).value } : x)); }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="glass-card" onClick={() => openMediaPicker({ kind: 'ai-add', designId: d.id })}>
                            <ImageIcon className="h-4 w-4 mr-1" /> Add from Repo
                          </Button>
                          <Button size="icon" variant="outline" className="glass-card hover:bg-destructive/20" onClick={() => setAiDesigns(prev => prev.filter(x => x.id !== d.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {d.images.map((url, imageIdx) => (
                          <div
                            key={`${d.id}-${imageIdx}`}
                            className="relative rounded-md overflow-hidden border border-border/50 bg-muted"
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(imageIdx))}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10);
                              if (!Number.isNaN(from) && from >= 0) handleReorderCarouselImages('ai', d.id, from, imageIdx);
                            }}
                          >
                            <SmartPreview src={normalizeSitePath(url)} alt={d.title || 'Carousel image'} className="w-full h-24 object-cover" />
                            <div className="absolute top-1 left-1 text-white bg-black/40 rounded h-6 w-6 flex items-center justify-center">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                              <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => openMediaPicker({ kind: 'ai-image', designId: d.id, imageIndex: imageIdx })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="secondary" className="h-6 w-6 hover:bg-destructive/20" onClick={() => setAiDesigns(prev => prev.map(x => x.id === d.id ? { ...x, images: x.images.filter((_, idx) => idx !== imageIdx) } : x))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {d.images.length === 0 && (
                          <div className="text-xs text-muted-foreground col-span-full">No images yet. Upload to add.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          {/* File replace input removed in favor of repo picker */}
        </Card>
        </TabsContent>

        <TabsContent value="websites">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Websites</h2>
            <Button variant="outline" onClick={addWebsite} className="glass-card">
              <Plus className="mr-2 h-4 w-4" /> Add Website
            </Button>
          </div>
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {websites.map((w) => (
                <div key={w.id} className="p-4 glass-card rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={w.title} onChange={(e) => updateWebsite(w.id, { title: e.target.value })} className="glass-card" placeholder="Website title" />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input value={w.url} onChange={(e) => updateWebsite(w.id, { url: e.target.value })} className="glass-card" placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={w.description} onChange={(e) => updateWebsite(w.id, { description: e.target.value })} className="glass-card min-h-[90px]" placeholder="Short description" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Screenshot</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            value={w.screenshot} 
                            onChange={(e) => updateWebsite(w.id, { screenshot: e.target.value })} 
                            className="glass-card flex-1" 
                            placeholder="https://imgur.com/... (recommended) or direct image URL" 
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="glass-card"
                            onClick={() => openMediaPicker({ kind: 'website-screenshot', websiteId: w.id })}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        {w.screenshot && w.screenshot.includes('drive.google.com') && (
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm">
                            <span className="text-yellow-700 dark:text-yellow-300">
                              ⚠️ Google Drive links may not display reliably. Consider using Imgur, GitHub, or another direct image hosting service.
                            </span>
                          </div>
                        )}
                        {/* Screenshot Preview */}
                        {w.screenshot && (
                          <div className="w-full h-40 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            <SmartPreview src={normalizeSitePath(w.screenshot.includes('drive.google.com') ? w.screenshot.replace('/file/d/', '/uc?export=view&id=').replace('/view?usp=sharing', '') : w.screenshot)} alt={w.title || 'Website screenshot'} className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Tech Stack</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a technology (Enter)"
                          className="glass-card flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value;
                              addStackTag(w.id, value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button type="button" variant="outline" className="glass-card" onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          if (input && input.value) {
                            addStackTag(w.id, input.value);
                            input.value = '';
                          }
                        }}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(w.stack || []).map((t) => (
                          <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeStackTag(w.id, t)}>
                            {t} ×
                          </Badge>
                        ))}
                        {(!w.stack || w.stack.length === 0) && (
                          <span className="text-sm text-muted-foreground">No stack tags yet.</span>
                        )}
                      </div>
                    </div>
                    {/* Website screenshot preview */}
                    {w.screenshot && (
                      <div className="md:col-span-2">
                        <Label>Screenshot Preview</Label>
                        <div className="mt-2 w-full h-48 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <SmartPreview src={normalizeSitePath(w.screenshot)} alt={w.title || 'Website screenshot preview'} className="max-w-full max-h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" className="glass-card hover:bg-destructive/20" onClick={() => removeWebsite(w.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {websites.length === 0 && (
                <div className="text-sm text-muted-foreground">No websites yet. Click "Add Website" to start.</div>
              )}
            </div>
          )}
        </Card>
        </TabsContent>
      </Tabs>

      {/* Media Picker */}
      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pick from Repo (public/media)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search by name or folder..." value={mediaQuery} onChange={(e) => setMediaQuery(e.target.value)} />
            <div className="max-h-[60vh] overflow-auto border rounded-md">
              {filteredMedia.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No files found.</div>
              ) : (
                <ul className="divide-y">
                  {filteredMedia.map((p) => (
                    <li key={p} className="p-2 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p} alt={p} className="h-10 w-14 object-cover rounded border" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <div className="text-xs truncate">{p}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => applyPickedMedia(p)}>Use</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PortfolioEditor;


