const TextInput = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  id,
  name,
  autoComplete,
  className = '',
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        className={`
          w-full px-4 py-3.5 rounded-full text-base
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
        autoComplete={autoComplete}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default TextInput;