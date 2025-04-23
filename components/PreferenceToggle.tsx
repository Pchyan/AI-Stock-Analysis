import React from 'react';

interface PreferenceToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = ''
}: PreferenceToggleProps) {
  return (
    <div className={`form-control ${className}`}>
      <label className="label cursor-pointer justify-start">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="toggle toggle-primary mr-4"
        />
        <div>
          <span className="label-text font-medium">{label}</span>
          {description && (
            <p className="text-xs text-base-content/70 mt-1">{description}</p>
          )}
        </div>
      </label>
    </div>
  );
}
