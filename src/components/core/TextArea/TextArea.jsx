const TextArea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  id,
  name,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
}) => {
  const textAreaId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  const charCount = value?.length || 0;

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={textAreaId} className="text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={textAreaId}
        name={name}
        className={`
          w-full px-4 py-3.5 rounded-xl text-base min-h-[120px] resize-y
          bg-gray-50 border-2 border-transparent
          placeholder:text-gray-400
          outline-none transition-all duration-200
          focus:border-[#00E5FF] focus:bg-white focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
        `}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center">
        {error && <span className="text-xs text-red-500">{error}</span>}
        {showCharCount && maxLength && (
          <span className="text-xs text-gray-400 ml-auto">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
