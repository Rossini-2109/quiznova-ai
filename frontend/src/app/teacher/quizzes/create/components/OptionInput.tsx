import React from "react";

type Option = { id: string; text: string; imageUrl: string };

type OptionInputProps = {
  label: string;
  option: Option;
  onChange: (fields: Partial<Option>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function OptionInput({
  label,
  option,
  onChange,
  onRemove,
  canRemove,
}: OptionInputProps) {
  const fileInputId = `file-option-${option.id}`;

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
    <div className="flex flex-col space-y-2 p-4 bg-white/30 backdrop-blur-sm rounded-lg shadow">
      <label className="block text-sm font-semibold mb-2">{label}. Option</label>
      <input
        type="text"
        value={option.text}
        onChange={e => onChange({ text: e.target.value })}
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
      <button
        type="button"
        className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
        onClick={() => document.getElementById(fileInputId)?.click()}
        title="Upload image"
      >
        📷
      </button>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 text-sm text-red-600 underline"
        >
          Remove Option
        </button>
      )}
    </div>
  );
}
