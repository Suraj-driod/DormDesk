import { theme } from '../../../theme';

const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  fullWidth = false,
  loading = false,
  className = '',
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    px-6 py-3.5 rounded-xl text-base font-semibold
    cursor-pointer transition-all duration-200
    outline-none min-h-[44px]
    focus-visible:outline-2 focus-visible:outline-[#00E5FF] focus-visible:outline-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: `${theme.blueGrad} text-white ${theme.glow} hover:${theme.glowStrong}`,
    secondary: `bg-transparent text-[#00E5FF] border-2 border-[#00E5FF] hover:bg-[#F0FEFF]`,
    ghost: `bg-transparent text-[#00E5FF] hover:bg-[#F0FEFF]`,
  };

  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'pointer-events-none' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
          </svg>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
