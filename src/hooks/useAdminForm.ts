import { useState, useCallback, useEffect } from 'react';
import type { AdminFormReturn } from '../types/admin';

export function useAdminForm<T extends object>(
  initialData: T,
  onSave: (data: T) => void | Promise<void>
): AdminFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 언어 전환 시 initialData가 바뀌면 formData도 갱신
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const updateField = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }) as T);
  }, []);

  const saveForm = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Form save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    isSaved: showSuccess,
    updateField,
    saveForm,
    setFormData,
    resetForm,
    isSaving,
    showSuccess,
  };
}
