import React from 'react';
import Card from './Card';
import Button from './Button';

interface SettingsFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export default function SettingsForm({
  title,
  description,
  children,
  onSubmit,
  submitLabel = '儲存設定',
  cancelLabel = '取消',
  onCancel,
  loading = false,
  className = ''
}: SettingsFormProps) {
  return (
    <Card
      title={title}
      subtitle={description}
      className={`settings-form ${className}`}
    >
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          {children}
        </div>
        
        <div className="flex justify-end mt-6 space-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
