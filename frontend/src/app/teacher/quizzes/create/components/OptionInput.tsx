import React from "react";

type Option = {
  id: string;
  text: string;
  imageUrl: string;
};

type OptionInputProps = {
  label: string; // A, B, C…
  option: Option;
  onChange: (fields: Partial<Option>) => void;
  onRemove?: () => void;
  canRemove?: boolean;
};

export default function OptionInput({
  label,
  option,
  onChange,
  onRemove,
  canRemove = false,
}: OptionInputProps) {
  const fileInputId = `file-${label}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = () => rej(reader.error);
        reader.readAsDataURL(file);
      });
      onChange({ imageUrl: base64 });
    }
  };

  return (
    <div className="flex flex-col space-y-2 card-glass p-4">
      <label className="block text-sm font-semibold">{`Option ${label}`}</label>
      <input
        type="text"
        value={option.text}
        onChange={(e) => onChange({ text: e.target.value })}
        className="w-full px-3 py-2 border rounded"
        placeholder={`Option ${label}`}
      />
      {option.imageUrl && (
        <div className="flex items-center space-x-2">
          <img
            src={option.imageUrl}
            alt={`Option ${label}`}
            className="w-12 h-12 object-contain rounded"
          />
          <button
            type="button"
            onClick={() => onChange({ imageUrl: "" })}
            className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        id={fileInputId}
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
          onClick={() => document.getElementById(fileInputId)?.click()}
          title="Upload image"
        >
          📷
        </button>
        {onRemove && canRemove && (
          <button
            type="button"
            className="text-white bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
            onClick={onRemove}
            title="Remove option"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
