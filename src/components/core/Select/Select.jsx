const Select = ({
  label,
  placeholder = 'Select an option',
  options = [],
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  id,
  name,
  className = '',
}) => {
  const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          name={name}
          className={`
            w-full px-4 py-3.5 pr-10 rounded-xl text-base appearance-none
            bg-gray-50 border-2 border-transparent cursor-pointer
            outline-none transition-all duration-200
            focus:border-[#00E5FF] focus:bg-white focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${!value ? 'text-gray-400' : 'text-gray-900'}
            ${error ? 'border-red-500' : ''}
          `}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </span>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Select;
